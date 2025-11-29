import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/middleware';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Generar número de cotización único
function generateQuoteNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `QUOTE-${timestamp}-${random}`;
}

// Generar token temporal único
function generateQuoteToken() {
  return uuidv4().replace(/-/g, '').substring(0, 20).toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Solo vendedores pueden crear cotizaciones' },
        { status: 403 }
      );
    }

    const {
      clientName,
      clientEmail,
      clientPhone,
      description,
      items,
      downPayment,
      notes,
      expiresAt // Opcional: fecha de expiración del link
    } = await req.json();

    // Validaciones
    if (!clientName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cliente y productos son requeridos' },
        { status: 400 }
      );
    }

    // Calcular costo total
    const totalCost = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Crear cotización
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        vendorId: user.id,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        totalCost,
        description,
        status: 'draft', // Inicia en borrador
        quoteToken: generateQuoteToken(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        downPayment: downPayment || null,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
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

    // Crear notificación para el vendedor
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'quote_created',
        title: '📋 Cotización Creada',
        message: `Cotización ${quote.quoteNumber} para ${clientName} creada exitosamente`,
        data: JSON.stringify({
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          clientName,
          totalCost,
          status: 'draft'
        }),
        isRead: false
      }
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get('status');
    const isPublic = searchParams.get('public') === 'true';

    // Panel público - ver todas las cotizaciones publicadas
    if (isPublic) {
      const quotes = await prisma.quote.findMany({
        where: {
          status: 'published',
          expiresAt: {
            gt: new Date() // Que no hayan expirado
          }
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
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        quotes,
        total: quotes.length
      });
    }

    // Panel privado - solo las cotizaciones del vendedor
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const whereClause: any = {
      vendorId: user.id
    };

    if (filterStatus) {
      whereClause.status = filterStatus;
    }

    const quotes = await prisma.quote.findMany({
      where: whereClause,
      include: {
        items: true,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      quotes,
      total: quotes.length
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}
