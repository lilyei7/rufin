import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = parseInt(id);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { 
        items: true, 
        history: true,
        createdByUser: true,
        approvedByUser: true,
        assignedUser: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...project,
      history: project.history || []
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Error fetching project' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = parseInt(id);
    const body = await req.json();
    const { items, totalCost } = body;

    // Obtener proyecto actual
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { items: true, history: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo el creador puede editar proyectos pendientes de aprobación
    if (project.status === 'pending_approval' && project.createdById !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este proyecto' },
        { status: 403 }
      );
    }

    // Detectar cambios en items (para notificaciones)
    const itemsChanged = items && Array.isArray(items) && items.length > 0;
    const oldItems = project.items || [];
    const quantityChanges: any[] = [];

    if (itemsChanged) {
      // Comparar cantidades antiguas con nuevas
      items.forEach((newItem: any) => {
        const oldItem = oldItems.find(o => o.productId === newItem.productId);
        if (oldItem && oldItem.quantity !== newItem.quantity) {
          quantityChanges.push({
            productId: newItem.productId,
            oldQuantity: oldItem.quantity,
            newQuantity: newItem.quantity,
            unitPrice: newItem.unitPrice,
            oldTotal: oldItem.quantity * newItem.unitPrice,
            newTotal: newItem.quantity * newItem.unitPrice
          });
        }
      });
    }

    // Obtener nombres de productos para los cambios
    let productsMap: any = {};
    if (quantityChanges.length > 0) {
      const productIds = quantityChanges.map(c => c.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      });
      productsMap = Object.fromEntries(products.map(p => [p.id, p.name]));
    }

    // Enriquecer cambios con nombres de productos
    const enrichedChanges = quantityChanges.map(change => ({
      ...change,
      productName: productsMap[change.productId] || `Producto ${change.productId}`
    }));

    // Si se proporcionan items, eliminar los antiguos y crear los nuevos
    if (items && Array.isArray(items)) {
      await prisma.projectItem.deleteMany({
        where: { projectId }
      });

      // Enriquecer items con productName antes de guardar
      const enrichedItems = await Promise.all(
        items.map(async (item: any) => {
          let productName = item.productName;
          
          // Si no viene productName, intentar obtenerlo de la base de datos
          if (!productName) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              select: { name: true }
            });
            productName = product?.name || `Producto ${item.productId}`;
          }
          
          return {
            projectId,
            productId: item.productId,
            productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          };
        })
      );

      await Promise.all(
        enrichedItems.map(item =>
          prisma.projectItem.create({ data: item })
        )
      );
    }

    // Actualizar el proyecto
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        totalCost: totalCost || project.totalCost,
        lastModified: new Date(),
        lastModifiedBy: user.name,
        history: {
          create: {
            timestamp: new Date(),
            status: project.status,
            comment: `Proyecto editado por ${user.name}`,
            user: user.name
          }
        }
      },
      include: {
        items: true,
        history: true
      }
    });

    // Crear notificación para admins si un vendedor editó cantidades
    if (user.role === 'vendor' && enrichedChanges.length > 0) {
      // Obtener todos los admins
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: ['admin', 'super_admin']
          }
        }
      });

      // Crear notificación para cada admin
      const oldTotal = project.totalCost || 0;
      const newTotal = totalCost || oldTotal;
      const totalCostChange = newTotal - oldTotal;

      // Crear resumen de cambios
      const changesDetail = enrichedChanges.map(change => 
        `${change.productName}: ${change.oldQuantity} → ${change.newQuantity} unidades (Total: $${change.oldTotal.toFixed(2)} → $${change.newTotal.toFixed(2)})`
      ).join('\n');

      // Crear mensaje con detalles de cambios
      const detailedMessage = `${user.name} editó el proyecto ${project.invoiceNumber}\n\n📋 CAMBIOS:\n${changesDetail}\n\n💰 COSTO TOTAL: $${oldTotal.toFixed(2)} → $${newTotal.toFixed(2)} (${totalCostChange >= 0 ? '+' : ''}$${totalCostChange.toFixed(2)})`;

      await Promise.all(
        admins.map(admin =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'project_quantity_changed',
              title: '📊 Cantidades de Proyecto Editadas',
              message: detailedMessage,
              data: JSON.stringify({
                projectId: project.id,
                projectName: project.projectName,
                invoiceNumber: project.invoiceNumber,
                vendorName: user.name,
                vendorId: user.id,
                oldTotalCost: oldTotal,
                newTotalCost: newTotal,
                quantityChanges: enrichedChanges,
                editedAt: new Date().toISOString()
              }),
              isRead: false
            }
          })
        )
      );
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Error updating project' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = parseInt(id);

    // Obtener proyecto actual
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
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo admin, super_admin, o el creador del proyecto pueden eliminarlo
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isCreator = project.createdById === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este proyecto' },
        { status: 403 }
      );
    }

    // No permitir eliminar proyectos en estado advanced (en construcción, completado, etc)
    const restrictedStatuses = ['in_progress', 'completed', 'paused', 'cancelled'];
    if (restrictedStatuses.includes(project.status)) {
      return NextResponse.json(
        { error: `No se puede eliminar un proyecto en estado "${project.status}". Solo se pueden eliminar proyectos pendientes de aprobación, aprobados o asignados.` },
        { status: 400 }
      );
    }

    // Crear historial antes de eliminar
    await prisma.projectHistory.create({
      data: {
        projectId,
        timestamp: new Date(),
        status: 'deleted',
        comment: `Proyecto eliminado por ${user.name}`,
        user: user.name,
        action: 'Proyecto eliminado'
      }
    });

    // Eliminar el proyecto (Prisma eliminará items, history, etc por cascada)
    const deletedProject = await prisma.project.delete({
      where: { id: projectId }
    });

    // Crear notificación para todos los admins
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'super_admin']
        }
      }
    });

    await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'project_deleted',
            title: '🗑️ Proyecto Eliminado',
            message: `El proyecto ${project.invoiceNumber} (${project.projectName}) ha sido eliminado por ${user.name}.`,
            data: JSON.stringify({
              projectId: project.id,
              projectName: project.projectName,
              invoiceNumber: project.invoiceNumber,
              deletedBy: user.name,
              deletedById: user.id,
              previousStatus: project.status,
              deletedAt: new Date().toISOString()
            }),
            isRead: false
          }
        })
      )
    );

    // Notificar al creador si no fue él quien lo eliminó
    if (project.createdById && project.createdById !== user.id) {
      await prisma.notification.create({
        data: {
          userId: project.createdById,
          type: 'project_deleted',
          title: '🗑️ Tu Proyecto Fue Eliminado',
          message: `Tu proyecto ${project.invoiceNumber} (${project.projectName}) ha sido eliminado por ${user.name}.`,
          data: JSON.stringify({
            projectId: project.id,
            projectName: project.projectName,
            invoiceNumber: project.invoiceNumber,
            deletedBy: user.name,
            deletedAt: new Date().toISOString()
          }),
          isRead: false
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Proyecto eliminado exitosamente',
        deletedProject: {
          id: deletedProject.id,
          projectName: deletedProject.projectName,
          invoiceNumber: deletedProject.invoiceNumber,
          status: deletedProject.status
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Error deleting project' },
      { status: 500 }
    );
  }
}