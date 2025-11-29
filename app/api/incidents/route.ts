import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let incidents;

    if (user.role === 'vendor') {
      // Los vendedores solo ven incidencias de sus propios proyectos
      incidents = await prisma.incident.findMany({
        where: {
          project: {
            createdById: user.id
          }
        },
        include: {
          items: true,
          history: true,
          project: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (user.role === 'installer') {
      // Los instaladores solo ven incidencias de proyectos asignados a ellos
      incidents = await prisma.incident.findMany({
        where: {
          project: {
            assignedInstallerId: user.id
          }
        },
        include: {
          items: true,
          history: true,
          project: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Admin, super_admin ven todas las incidencias
      incidents = await prisma.incident.findMany({
        include: {
          items: true,
          history: true,
          project: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Error fetching incidents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      projectId,
      type,
      priority,
      title,
      description,
      items,
      totalCost,
    } = body;

    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos para crear incidencias
    if (user.role === 'vendor' && project.createdById !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear incidencias en este proyecto' },
        { status: 403 }
      );
    }

    // Calcular costo total
    let totalCostCalculated = totalCost || 0;
    if (items && items.length > 0) {
      totalCostCalculated = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
    }

    // Generar número de incidencia único
    const lastIncident = await prisma.incident.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = lastIncident ? lastIncident.id + 1 : 1;
    const incidentNumber = `INC-${String(nextId).padStart(5, '0')}`;

    // Crear la incidencia usando Prisma
    const newIncident = await prisma.incident.create({
      data: {
        id: nextId,
        projectId,
        incidentInvoiceNumber: incidentNumber,
        type,
        priority,
        title,
        description,
        totalCost: totalCostCalculated,
        status: 'pending',
        createdAt: new Date(),
        createdBy: user.name,
        createdById: user.id,
        history: {
          create: {
            timestamp: new Date(),
            status: 'created',
            comment: 'Incidencia creada',
            user: user.name
          }
        },
        items: {
          create: items?.map((item: any) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })) || []
        }
      },
      include: {
        items: true,
        history: true,
        project: true
      }
    });

    return NextResponse.json({ incident: newIncident }, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Error creating incident' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, status, comment } = body;

    // Obtener la incidencia actual con Prisma
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        project: true,
        history: true
      }
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incidencia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos según el rol del usuario
    if (user.role === 'vendor' && incident.project.createdById !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta incidencia' },
        { status: 403 }
      );
    }

    // Actualizar la incidencia
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        history: {
          create: {
            timestamp: new Date(),
            status,
            comment: comment || `Estado cambiado a: ${status}`,
            user: user.name
          }
        }
      },
      include: {
        items: true,
        history: true,
        project: true
      }
    });

    return NextResponse.json({ incident: updatedIncident });
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: 'Error updating incident' },
      { status: 500 }
    );
  }
}
