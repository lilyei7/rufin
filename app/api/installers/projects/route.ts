import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    
    if (!user || user.role !== 'installer') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener proyectos asignados a este instalador
    const projects = await prisma.project.findMany({
      where: {
        assignedInstaller: user.name  // Buscar por nombre del instalador
      },
      select: {
        id: true,
        projectName: true,
        invoiceNumber: true,
        clientName: true,
        totalCost: true,
        status: true,
        scheduledInstallation: true,
        installerPriceProposal: true,
        installerPriceStatus: true,
        createdAt: true,
        notes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[API] Proyectos encontrados para ${user.name}:`, projects.length);

    return NextResponse.json({
      projects,
      total: projects.length,
      installer: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error fetching assigned projects:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}
