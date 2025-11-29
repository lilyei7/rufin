import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Buscar contrato por token
    const contract = await prisma.contract.findUnique({
      where: { signatureToken: token },
      include: {
        project: true,
        client: true
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya fue firmado
    if (contract.isSigned) {
      return NextResponse.json(
        { contract: {
          ...contract,
          isSigned: true
        }},
        { status: 200 }
      );
    }

    // Verificar si expiró
    const now = new Date();
    if (contract.expiresAt && new Date(contract.expiresAt) < now) {
      return NextResponse.json(
        { error: 'El link del contrato ha expirado' },
        { status: 410 }
      );
    }

    // Preparar datos del contrato para mostrar
    return NextResponse.json({
      contract: {
        id: contract.id,
        projectId: contract.projectId,
        projectName: contract.project?.projectName || 'Proyecto',
        clientName: contract.clientId ? contract.client?.name : contract.title,
        finalPrice: contract.finalPrice || contract.amount,
        amount: contract.amount,
        terms: contract.description || getDefaultTerms(),
        createdAt: contract.createdAt,
        expiresAt: contract.expiresAt,
        isExpired: false,
        isSigned: contract.isSigned,
        signedAt: contract.signedAt
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener el contrato' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { signature, clientName, clientEmail, clientPhone } = await request.json();

    if (!signature || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Buscar contrato
    const contract = await prisma.contract.findUnique({
      where: { signatureToken: token },
      include: {
        project: true
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya fue firmado
    if (contract.isSigned) {
      return NextResponse.json(
        { error: 'Este contrato ya fue firmado' },
        { status: 400 }
      );
    }

    // Verificar si expiró
    const now = new Date();
    if (contract.expiresAt && new Date(contract.expiresAt) < now) {
      return NextResponse.json(
        { error: 'El link del contrato ha expirado' },
        { status: 410 }
      );
    }

    // Actualizar contrato con firma
    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        isSigned: true,
        signedAt: new Date(),
        clientName: clientName,
        signatureData: signature, // Guardar en base64
        communications: JSON.stringify([
          ...JSON.parse(contract.communications || '[]'),
          {
            id: Date.now(),
            type: 'contract_signed',
            message: `Contrato firmado por ${clientName} (${clientEmail})`,
            signedAt: new Date().toISOString(),
            clientEmail: clientEmail
          }
        ])
      }
    });

    // TODO: Aquí se generaría el PDF y se enviaría por email
    // Por ahora solo devolvemos confirmación

    return NextResponse.json({
      success: true,
      contractId: updatedContract.id,
      message: 'Contrato firmado exitosamente'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al firmar el contrato' },
      { status: 500 }
    );
  }
}

function getDefaultTerms(): string {
  return `TÉRMINOS Y CONDICIONES DE SERVICIO

1. ALCANCE DEL SERVICIO
Los servicios descritos en este contrato serán ejecutados de acuerdo con las especificaciones acordadas entre las partes.

2. PRECIO Y PAGO
El cliente acepta pagar el precio especificado en este contrato. El pago debe realizarse dentro de 30 días de la facturación.

3. CONFIDENCIALIDAD
Ambas partes se comprometen a mantener confidenciales todos los datos y información proporcionados durante la ejecución del contrato.

4. RESPONSABILIDADES
El contratista se compromete a realizar el trabajo de manera profesional y puntual. El cliente se compromete a proporcionar la información necesaria de manera oportuna.

5. TERMINACIÓN
Este contrato puede ser terminado por escrito por cualquiera de las partes con 30 días de anticipación.

6. LIMITACIÓN DE RESPONSABILIDAD
En ningún caso la responsabilidad total de cualquiera de las partes será mayor al monto pagado bajo este contrato.

7. LEY APLICABLE
Este contrato estará regido por las leyes locales correspondientes.

8. FIRMA DIGITAL
Al firmar este contrato digitalmente, el cliente confirma su acuerdo con todos los términos y condiciones establecidos.`;
}
