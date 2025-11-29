import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, username, password, signature } = body;

    // Validar campos requeridos
    if (!name || !email || !username || !password || !signature) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no exista
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar token de firma para el contrato
    const signatureToken = randomUUID();

    // Crear usuario instalador
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role: 'installer',
        active: true
      }
    });

    // Crear contrato de instalador
    const contract = await prisma.contract.create({
      data: {
        contractNumber: `CTR-INST-${user.id}-${Date.now()}`,
        type: 'installer_service',
        title: 'Contrato de Servicios de Instalación',
        content: 'Contrato de servicios de instalación RUFIN',
        totalAmount: 0,
        status: 'pending_signature',
        clientName: name,
        signatureToken,
        expiresAt: null, // Permanente
        isSigned: false,
        createdById: user.id,
        installerId: user.id,
        signatureData: signature // Guardar firma como Base64
      }
    });

    // Firmar automáticamente si el usuario proporcionó firma válida
    if (signature && signature.length > 100) {
      const signedContract = await prisma.contract.update({
        where: { id: contract.id },
        data: {
          isSigned: true,
          signatureData: signature,
          signedAt: new Date(),
          status: 'signed'
        }
      });
    }

    // Generar token JWT simple (en producción usar una librería como jsonwebtoken)
    const sessionToken = Buffer.from(`${user.id}:${user.username}`).toString('base64');

    return NextResponse.json(
      {
        message: 'Registro exitoso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role
        },
        sessionToken,
        contractToken: signatureToken
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Error al registrar' },
      { status: 500 }
    );
  }
}
