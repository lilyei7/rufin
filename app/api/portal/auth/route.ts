import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST - Login de cliente con código de acceso
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, accessCode } = body;

    if (!email || !accessCode) {
      return NextResponse.json(
        { error: 'Email y código de acceso requeridos' },
        { status: 400 }
      );
    }

    // Autenticación simple para desarrollo - código fijo
    if (accessCode !== 'PORTAL2025') {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token para cliente
    const token = jwt.sign(
      {
        email,
        role: 'client',
        type: 'portal'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      token,
      client: {
        email,
        name: email.split('@')[0] // Nombre temporal
      }
    });
  } catch (error) {
    console.error('Error en login de portal:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
