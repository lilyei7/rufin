import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Listar contratos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const whereClause: any = {};

    // Filtrar por tipo de contrato
    if (type) {
      whereClause.type = type;
    }

    // Filtrar por estado
    if (status) {
      whereClause.status = status;
    }

    // Filtrar por usuario (para portal de cliente)
    if (userId) {
      whereClause.clientId = parseInt(userId);
    }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        vendor: {
          select: { id: true, name: true, email: true }
        },
        installer: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, invoiceNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Error fetching contracts' },
      { status: 500 }
    );
  }
}

// POST - Crear contrato
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      title,
      description,
      amount,
      currency,
      startDate,
      endDate,
      clientId,
      vendorId,
      installerId,
      projectId,
      templateId
    } = body;

    // Generar número de contrato
    const contractNumber = `CONT-${Date.now()}`;

    const newContract = await prisma.contract.create({
      data: {
        contractNumber,
        type: type || 'service_contract',
        title,
        description,
        status: 'pending_signature',
        amount,
        currency: currency || 'USD',
        startDate,
        endDate,
        clientId,
        vendorId,
        installerId,
        projectId: projectId || null,
        createdAt: new Date(),
        communications: JSON.stringify([])
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        vendor: {
          select: { id: true, name: true, email: true }
        },
        installer: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, invoiceNumber: true }
        }
      }
    });

    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Error creating contract' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar contrato (para firma)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, signature, signedAt } = body;

    // Obtener el contrato actual
    const contract = await prisma.contract.findUnique({
      where: { id }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Parsear comunicaciones existentes
    let communications = [];
    try {
      communications = JSON.parse(contract.communications || '[]');
    } catch {
      communications = [];
    }

    // Agregar nueva firma si existe
    if (signature) {
      communications.push(signature);
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: status || contract.status,
        signedAt: signedAt ? new Date(signedAt) : contract.signedAt,
        communications: JSON.stringify(communications),
        updatedAt: new Date()
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        vendor: {
          select: { id: true, name: true, email: true }
        },
        installer: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, invoiceNumber: true }
        }
      }
    });

    return NextResponse.json({ contract: updatedContract });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Error updating contract' },
      { status: 500 }
    );
  }
}
