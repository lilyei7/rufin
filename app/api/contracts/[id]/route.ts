import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Eliminar link de firma de un contrato
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const contractId = parseInt(params.id);

    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Remover el token de firma
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        signatureToken: null,
        expiresAt: null,
        status: 'draft'
      }
    });

    return NextResponse.json({
      message: 'Link eliminado exitosamente',
      contract: updatedContract
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el link' },
      { status: 500 }
    );
  }
}
