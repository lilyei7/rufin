import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { productId, newPrice } = await request.json();

    if (!productId || typeof newPrice !== 'number' || newPrice < 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Actualizar el precio
    await prisma.product.update({
      where: { id: productId },
      data: { unitPrice: newPrice }
    });

    return NextResponse.json({
      success: true,
      message: 'Precio actualizado correctamente'
    });

  } catch (error) {
    console.error('Error updating price:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}