import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { getUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, finalPrice, terms, expiryHours = 72 } = await request.json();

    if (!projectId || !finalPrice) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Obtener proyecto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdByUser: true,
        approvedByUser: true,
        assignedUser: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Buscar contrato existente para este proyecto, o crear uno nuevo
    let contract = await prisma.contract.findFirst({
      where: { projectId: projectId }
    });

    if (!contract) {
      // Crear contrato si no existe
      contract = await prisma.contract.create({
        data: {
          contractNumber: `CON-${Date.now()}-${projectId}`,
          projectId: projectId,
          type: 'project',
          status: 'draft',
          title: `Contrato - ${project.projectName}`,
          description: terms || 'Términos estándar aplican.',
          totalAmount: project.totalCost || 0,
          amount: project.totalCost || 0,
          finalPrice: finalPrice,
          clientId: project.createdById, // Usar creador como cliente
          vendorId: project.approvedById, // Vendedor que aprobó
          installerId: project.assignedInstallerId, // Instalador asignado
          clientName: project.clientName,
          createdById: project.createdById
        }
      });
    } else {
      // Actualizar contrato existente
      contract = await prisma.contract.update({
        where: { id: contract.id },
        data: {
          finalPrice: finalPrice,
          description: terms || contract.description,
          status: 'pending_signature'
        }
      });
    }

    // Generar token único y seguro
    const signatureToken = randomBytes(32).toString('hex');
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    // Actualizar contrato con token y fecha de expiración
    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signatureToken,
        expiresAt,
        finalPrice,
        description: terms || contract.description,
        status: 'pending_signature'
      }
    });

    // Construir URL del contrato para firmar
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signatureLink = `${baseUrl}/contract/${signatureToken}`;

    // TODO: Aquí se enviaría email con nodemailer
    // Por ahora solo devolvemos el link
    console.log('📧 Email sería enviado a:', project.createdByUser?.email || project.approvedByUser?.email);
    console.log('🔗 Link temporal:', signatureLink);
    console.log('⏰ Expira en:', expiresAt.toISOString());

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      signatureLink,
      expiresAt,
      message: 'Contrato preparado para envío. Link temporal generado.'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al preparar el contrato' },
      { status: 500 }
    );
  }
}
