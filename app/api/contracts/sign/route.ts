import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, signatureData } = body;

    if (!token || !signatureData) {
      return NextResponse.json(
        { error: 'token and signatureData are required' },
        { status: 400 }
      );
    }

    // Buscar contrato por token
    const contract = await prisma.contract.findUnique({
      where: { signatureToken: token }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Validar que no esté expirado
    if (contract.expiresAt && contract.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Contract signature link has expired' },
        { status: 400 }
      );
    }

    // Validar que esté en estado "sent"
    if (contract.status !== 'sent') {
      return NextResponse.json(
        { error: 'Contract is not in a state that can be signed' },
        { status: 400 }
      );
    }

    // Guardar firma
    const signedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureData,
        isSigned: true,
        signedAt: new Date(),
        status: 'signed'
      }
    });

    // Crear notificación para admin/creador
    if (signedContract.createdById) {
      await prisma.notification.create({
        data: {
          userId: signedContract.createdById,
          type: 'contract_signed',
          title: '✍️ Contrato Firmado',
          message: `El contrato ${signedContract.contractNumber} ha sido firmado exitosamente.`,
          data: JSON.stringify({
            contractId: signedContract.id,
            contractNumber: signedContract.contractNumber
          })
        }
      });
    }

    return NextResponse.json({
      message: 'Contract signed successfully',
      contract: signedContract
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    return NextResponse.json(
      { error: 'Error signing contract' },
      { status: 500 }
    );
  }
}
