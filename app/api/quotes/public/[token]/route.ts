import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;

    const quote = await prisma.quote.findUnique({
      where: { quoteToken: token },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unitPrice: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            projectName: true,
            status: true,
            invoiceNumber: true
          }
        }
      }
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Validar que la cotización sea accesible
    if (quote.status !== 'published' && quote.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Esta cotización no está disponible' },
        { status: 403 }
      );
    }

    // Verificar si ha expirado
    if (quote.expiresAt && new Date() > quote.expiresAt) {
      // Actualizar estado a expirado
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'expired' }
      });

      return NextResponse.json(
        { error: 'Esta cotización ha expirado' },
        { status: 403 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    );
  }
}

// Endpoint para aceptar una cotización (generar proyecto)
export async function POST(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;

    const quote = await prisma.quote.findUnique({
      where: { quoteToken: token },
      include: {
        items: true,
        vendor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Validar estado
    if (quote.status !== 'published') {
      return NextResponse.json(
        { error: 'Esta cotización no puede ser aceptada en su estado actual' },
        { status: 400 }
      );
    }

    // Validar expiración
    if (quote.expiresAt && new Date() > quote.expiresAt) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'expired' }
      });

      return NextResponse.json(
        { error: 'Esta cotización ha expirado' },
        { status: 403 }
      );
    }

    const { downPaymentStatus } = await req.json();

    // Crear proyecto automáticamente con status 'approved'
    const invoiceNumber = `INV-${Date.now()}`;

    const project = await prisma.project.create({
      data: {
        projectName: quote.description || `Proyecto - ${quote.clientName}`,
        invoiceNumber,
        clientName: quote.clientName,
        status: 'approved', // Automáticamente aprobado
        totalCost: quote.totalCost,
        createdBy: quote.vendor.name,
        createdById: quote.vendor.id,
        approvedBy: 'Sistema', // Sistema aprueba automáticamente
        quoteId: quote.id,
        downPaymentAmount: quote.downPayment,
        downPaymentStatus: downPaymentStatus || 'pending',
        notes: quote.notes,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        items: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Actualizar cotización como aceptada
    const updatedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        projectId: project.id
      }
    });

    // Crear notificación al vendedor
    await prisma.notification.create({
      data: {
        userId: quote.vendorId,
        type: 'quote_accepted',
        title: '✅ Cotización Aceptada',
        message: `${quote.clientName} ha aceptado tu cotización ${quote.quoteNumber}. Proyecto creado automáticamente.`,
        data: JSON.stringify({
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          projectId: project.id,
          projectName: project.projectName,
          clientName: quote.clientName,
          totalCost: quote.totalCost
        }),
        isRead: false
      }
    });

    // Crear notificación a admins
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'super_admin']
        }
      }
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'project_approved',
          title: '✅ Nuevo Proyecto Aprobado',
          message: `Nuevo proyecto "${project.projectName}" para ${quote.clientName} ha sido creado desde una cotización aceptada.`,
          data: JSON.stringify({
            projectId: project.id,
            projectName: project.projectName,
            clientName: quote.clientName,
            totalCost: project.totalCost,
            status: 'approved'
          }),
          isRead: false
        }
      });
    }

    return NextResponse.json(
      {
        quote: updatedQuote,
        project,
        message: 'Cotización aceptada. Proyecto creado automáticamente.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error accepting quote:', error);
    return NextResponse.json(
      { error: 'Error al aceptar cotización' },
      { status: 500 }
    );
  }
}
