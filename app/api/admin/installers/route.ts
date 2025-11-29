import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/middleware';

const prisma = new PrismaClient();

// NOTA: Este endpoint es principalmente informativo
// Los instaladores se activan AUTOMÁTICAMENTE al registrarse
// No debería ser necesario activarlos manualmente

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener TODOS los instaladores (activos e inactivos)
    // En operación normal, todos deberían estar activos
    const allInstallers = await prisma.user.findMany({
      where: {
        role: 'installer'
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

    const activeCount = allInstallers.filter(i => i.active).length;
    const inactiveCount = allInstallers.filter(i => !i.active).length;

    return NextResponse.json({ 
      installers: allInstallers,
      total: allInstallers.length,
      active: activeCount,
      inactive: inactiveCount,
      note: 'Los instaladores se activan automáticamente al registrarse. Si hay inactivos, probablemente fueron desactivados manualmente.'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener instaladores' },
      { status: 500 }
    );
  }
}

// POST para SOLO desactivar un instalador en caso de emergencia
// No debería usarse en operación normal
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { installerId, active } = body;

    if (!installerId) {
      return NextResponse.json(
        { error: 'installerId requerido' },
        { status: 400 }
      );
    }

    // Solo permite desactivar (para casos de emergencia)
    if (active === true) {
      return NextResponse.json(
        { error: 'Los instaladores se activan automáticamente. No es necesario activarlos manualmente.' },
        { status: 400 }
      );
    }

    // Actualizar estado del instalador
    const updatedInstaller = await prisma.user.update({
      where: { id: installerId },
      data: { active: active || false }
    });

    console.log(`⚠️ ADMIN: Instalador ${updatedInstaller.name} desactivado por emergencia`);

    return NextResponse.json({
      message: `⚠️ Instalador desactivado. Se recomienda reactivar después de resolver el problema.`,
      installer: {
        id: updatedInstaller.id,
        name: updatedInstaller.name,
        username: updatedInstaller.username,
        active: updatedInstaller.active
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar instalador' },
      { status: 500 }
    );
  }
}
