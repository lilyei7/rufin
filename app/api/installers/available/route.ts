import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener TODOS los instaladores activos
    // Los instaladores se activan automáticamente al registrarse
    // No hay necesidad de activación manual
    const installers = await prisma.user.findMany({
      where: {
        role: 'installer',
        active: true  // Automáticamente true al registrarse
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ 
      installers,
      total: installers.length,
      message: 'Instaladores disponibles para asignar (automáticamente activos al registrarse)'
    });
  } catch (error) {
    console.error('Error fetching installers:', error);
    return NextResponse.json(
      { error: 'Error al obtener instaladores' },
      { status: 500 }
    );
  }
}
