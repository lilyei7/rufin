import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 400 }
      );
    }

    // Buscar contrato por token
    const contract = await prisma.contract.findUnique({
      where: { signatureToken: token },
      include: {
        project: {
          select: { id: true, invoiceNumber: true, projectName: true }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Los links son permanentes - sin validación de expiración

    // Validar que ya no esté firmado
    if (contract.isSigned) {
      return NextResponse.json(
        { error: 'Este contrato ya ha sido firmado', isSigned: true },
        { status: 400 }
      );
    }

    // Retornar contrato sin información sensible
    return NextResponse.json({
      id: contract.id,
      contractNumber: contract.contractNumber,
      title: contract.title,
      content: contract.content,
      totalAmount: contract.totalAmount,
      status: contract.status,
      createdAt: contract.createdAt,
      expiresAt: contract.expiresAt,
      project: contract.project
    });
  } catch (error) {
    console.error('Error fetching contract by token:', error);
    return NextResponse.json(
      { error: 'Error al obtener el contrato' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
