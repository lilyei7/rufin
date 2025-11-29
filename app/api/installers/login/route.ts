import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Usuario y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || user.role !== 'installer') {
      return NextResponse.json(
        { message: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return NextResponse.json(
        { message: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Obtener contrato del instalador
    const contract = await prisma.contract.findFirst({
      where: {
        installerId: user.id,
        type: 'installer_service'
      }
    });

    // Generar token de sesión
    const sessionToken = Buffer.from(`${user.id}:${user.username}`).toString('base64');

    return NextResponse.json({
      message: 'Login exitoso',
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username
      },
      contractToken: contract?.signatureToken
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Error al procesar login' },
      { status: 500 }
    );
  }
}
