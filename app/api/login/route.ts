import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    console.log('Login attempt:', { username, password: password ? '[HIDDEN]' : null });

    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log('User not found:', username);
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Comparar contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log('Password mismatch for user:', username);
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token generated for user:', username);

    return NextResponse.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
