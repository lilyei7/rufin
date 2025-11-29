import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const quoteId = parseInt(params.id);
    const user = getUserFromToken(req);

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
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
            status: true
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

    // Validar permisos: solo el vendedor que la creó o admin
    if (user && user.id !== quote.vendorId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
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

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = getUserFromToken(req);
    const quoteId = parseInt(params.id);

    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId }
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Validar que sea el dueño
    if (quote.vendorId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta cotización' },
        { status: 403 }
      );
    }

    const { status, expiresAt, description, notes } = await req.json();

    // Validar transiciones de estado
    const validStatusTransitions: { [key: string]: string[] } = {
      draft: ['published', 'deleted'],
      published: ['draft', 'deleted'],
      accepted: [],
      rejected: [],
      expired: []
    };

    if (status && !validStatusTransitions[quote.status]?.includes(status)) {
      return NextResponse.json(
        { error: `No puedes cambiar de ${quote.status} a ${status}` },
        { status: 400 }
      );
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        ...(status && { status }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes })
      },
      include: {
        items: true,
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Crear notificación sobre el cambio
    if (status) {
      const statusMessages: { [key: string]: string } = {
        published: '🚀 Cotización Publicada',
        draft: '✏️ Cotización Guardada como Borrador',
        deleted: '🗑️ Cotización Eliminada'
      };

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'quote_status_changed',
          title: statusMessages[status] || 'Cotización Actualizada',
          message: `La cotización ${quote.quoteNumber} ha sido actualizada a ${status}`,
          data: JSON.stringify({
            quoteId: quote.id,
            quoteNumber: quote.quoteNumber,
            status
          }),
          isRead: false
        }
      });
    }

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = getUserFromToken(req);
    const quoteId = parseInt(params.id);

    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId }
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Validar que sea el dueño
    if (quote.vendorId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta cotización' },
        { status: 403 }
      );
    }

    // No permitir eliminar si ya fue aceptada
    if (quote.status === 'accepted') {
      return NextResponse.json(
        { error: 'No puedes eliminar una cotización aceptada' },
        { status: 400 }
      );
    }

    await prisma.quote.delete({
      where: { id: quoteId }
    });

    return NextResponse.json(
      { message: 'Cotización eliminada' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    );
  }
}
