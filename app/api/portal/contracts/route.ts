import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para verificar token del portal (simplificada para desarrollo)
function getClientFromToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    // Para desarrollo, asumimos que el token contiene el userId directamente
    // En producción esto debería decodificar un JWT real
    const clientData = { clientId: parseInt(token) };
    return clientData;
  } catch (error) {
    return null;
  }
}

// GET - Obtener contratos del cliente
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const whereClause: any = {};
    
    // Filtrar por cliente si se proporciona userId
    if (userId) {
      whereClause.clientId = parseInt(userId);
    }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: { id: true, name: true, email: true }
        },
        installer: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, invoiceNumber: true, projectName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching portal contracts:', error);
    return NextResponse.json(
      { error: 'Error al cargar contratos' },
      { status: 500 }
    );
  }
}
