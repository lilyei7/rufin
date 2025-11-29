import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener todos los contratos con links generados
export async function GET(req: NextRequest) {
  try {
    const contracts = await prisma.contract.findMany({
      where: {
        signatureToken: {
          not: null
        }
      },
      select: {
        id: true,
        contractNumber: true,
        title: true,
        totalAmount: true,
        signatureToken: true,
        isSigned: true,
        createdAt: true,
        signedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mapear a incluir publicUrl
    const generatedLinks = contracts.map(contract => ({
      id: contract.id,
      contractNumber: contract.contractNumber,
      title: contract.title,
      totalAmount: contract.totalAmount,
      signatureToken: contract.signatureToken,
      publicUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/contract/${contract.signatureToken}`,
      isSigned: contract.isSigned,
      createdAt: contract.createdAt
    }));

    return NextResponse.json(generatedLinks);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los links' },
      { status: 500 }
    );
  }
}
