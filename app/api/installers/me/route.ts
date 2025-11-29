import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Obtener ID del instalador del header de autorización
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Decodificar token (formato: userId:username en base64)
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userIdStr] = decoded.split(':');
    const userId = parseInt(userIdStr);

    // Obtener usuario instalador
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'installer') {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener contrato del instalador
    const contract = await prisma.contract.findFirst({
      where: {
        installerId: userId,
        type: 'installer_service'
      }
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.email, // Podría no estar en User, ajustar según schema
      company: user.name,
      contractToken: contract?.signatureToken,
      contractSigned: contract?.isSigned || false
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
