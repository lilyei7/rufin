import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Generar token temporal para firma
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId is required' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Generar token si no existe
    // ⭐ LINKS PERMANENTES - SIN EXPIRACIÓN
    const signatureToken = contract.signatureToken || randomUUID();

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        signatureToken,
        expiresAt: null, // ⭐ Sin expiración - permanente
        status: 'sent'
      }
    });

    const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/contract/${signatureToken}`;

    return NextResponse.json({
      signatureToken,
      expiresAt: null, // Sin expiración
      publicUrl,
      contract: updatedContract
    });
  } catch (error) {
    console.error('Error generating signature token:', error);
    return NextResponse.json(
      { error: 'Error generating signature token' },
      { status: 500 }
    );
  }
}
