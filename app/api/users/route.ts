import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { getUserFromToken } from '@/lib/middleware';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admins ven todos los usuarios
    if (user.role === 'admin' || user.role === 'super_admin') {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true
        }
      });
      return NextResponse.json({ users });
    }

    // Vendedores solo ven instaladores
    if (user.role === 'vendor') {
      const users = await prisma.user.findMany({
        where: { role: 'installer' },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true
        }
      });
      return NextResponse.json({ users });
    }

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { username, email, name, role, password } = body;

    // Validaciones
    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Usuario, nombre y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email || '',
        name,
        role: role || 'vendor',
        password: hashedPassword,
        active: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, role } = body;

    // Encontrar usuario
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el rol sea válido
    const validRoles = ['admin', 'vendor', 'purchasing', 'installer', 'super_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Reglas de permisos:
    // - Un admin NO puede modificar el rol de un super_admin
    // - Un admin NO puede promocionar a alguien a super_admin
    // - Un admin puede cambiar roles de usuarios normales
    if (user.role === 'admin') {
      if (existingUser.role === 'super_admin') {
        return NextResponse.json({ error: 'No tienes permiso para modificar a un super_admin' }, { status: 403 });
      }
      if (role === 'super_admin') {
        return NextResponse.json({ error: 'No puedes asignar el rol super_admin' }, { status: 403 });
      }
    }

    // Actualizar rol
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error updating user' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, password } = body;

    // Validar parámetros
    if (!id || !password) {
      return NextResponse.json(
        { error: 'ID de usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID de usuario inválido' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Reglas de permisos para cambiar contraseña:
    // - Un admin NO puede cambiar contraseña de otro admin ni de super_admin
    // - Un super_admin puede cambiar contraseña de cualquiera
    if (user.role === 'admin') {
      if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
        return NextResponse.json(
          { error: 'No tienes permiso para cambiar la contraseña de este usuario' },
          { status: 403 }
        );
      }
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar contraseña
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Error al cambiar la contraseña' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let id: number;
    try {
      const body = await req.json();
      id = parseInt(body.id);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'ID de usuario inválido' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Reglas de permisos para eliminar:
    // - Un admin NO puede eliminar a otro admin ni a un super_admin
    // - Un super_admin puede eliminar a cualquiera
    if (user.role === 'admin') {
      if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
        return NextResponse.json({ error: 'No tienes permiso para eliminar a este usuario' }, { status: 403 });
      }
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}
