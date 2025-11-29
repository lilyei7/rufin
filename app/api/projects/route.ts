import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    console.log('🔵 GET /api/projects - User:', user);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Usar Prisma para obtener proyectos filtrados
    let projects;

    if (user.role === 'vendor') {
      // Los vendedores solo ven sus propios proyectos
      console.log('🔵 Fetching vendor projects for user ID:', user.id, 'name:', user.name);
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { createdById: user.id },
            { createdBy: user.name } // Fallback para compatibilidad
          ]
        },
        include: {
          items: true,
          history: true,
          incidents: true,
          contracts: true,
          createdByUser: true,
          approvedByUser: true,
          assignedUser: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (user.role === 'installer') {
      // Los instaladores solo ven proyectos asignados a ellos
      console.log('🔵 Fetching installer projects for user ID:', user.id, 'name:', user.name);
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { assignedInstallerId: user.id },
            { assignedInstaller: user.name } // Fallback para compatibilidad
          ]
        },
        include: {
          items: true,
          history: true,
          incidents: true,
          contracts: true,
          createdByUser: true,
          approvedByUser: true,
          assignedUser: true
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log('🔵 Installer projects found:', projects.length);
    } else {
      // Admin, super_admin y purchasing ven todos los proyectos
      projects = await prisma.project.findMany({
        include: {
          items: true,
          history: true,
          incidents: true,
          contracts: true,
          createdByUser: true,
          approvedByUser: true,
          assignedUser: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Enriquecer items con nombres de productos (fallback a BD si no está guardado)
    const enrichedProjects = await Promise.all(
      projects.map(async (project: any) => {
        const enrichedItems = await Promise.all(
          (project.items || []).map(async (item: any) => {
            let productName = item.productName;
            
            // Si no está guardado el nombre, buscarlo en la BD
            if (!productName || productName === '') {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true }
              });
              productName = product?.name || `Producto ${item.productId}`;
            }
            
            return {
              ...item,
              productName
            };
          })
        );
        return {
          ...project,
          items: enrichedItems
        };
      })
    );

    return NextResponse.json({ projects: enrichedProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Error fetching projects' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      projectName,
      clientName,
      clientEmail,
      quoteId,
      items,
      totalCost,
      createdBy,
    } = body;

    // Generar número de proyecto único basado en el máximo existente (incluyendo eliminados)
    const allProjects = await prisma.project.findMany({
      select: { invoiceNumber: true },
      orderBy: { invoiceNumber: 'desc' },
      take: 1
    });

    let nextNumber = 1;
    if (allProjects.length > 0) {
      // Extraer el número del último invoiceNumber (formato: INV-XXX)
      const lastInvoice = allProjects[0].invoiceNumber;
      const match = lastInvoice.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const projectNumber = `INV-${String(nextNumber).padStart(3, '0')}`;

    // Crear el proyecto usando Prisma (sin usar el ID para generar el número)
    const newProject = await prisma.project.create({
      data: {
        projectName: projectName || `${projectNumber} - ${clientName}`,
        invoiceNumber: projectNumber,
        clientName,
        status: 'pending_approval',
        totalCost: totalCost || 0,
        createdBy: createdBy || user.name,
        createdById: user.id,
        lastModified: new Date(),
        lastModifiedBy: createdBy || user.name,
        history: {
          create: {
            timestamp: new Date(),
            status: 'created',
            comment: `Proyecto creado por ${createdBy || user.name}`,
            user: createdBy || user.name,
          }
        }
      },
      include: {
        items: true,
        history: true
      }
    });

    // Crear items del proyecto si existen
    if (items && Array.isArray(items)) {
      // Enriquecer items con productName si no la tienen
      const enrichedItems = await Promise.all(
        items.map(async (item: any) => {
          let productName = item.productName;
          
          // Si no viene productName, obtenerlo de la base de datos
          if (!productName) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              select: { name: true }
            });
            productName = product?.name || `Producto ${item.productId}`;
          }
          
          return {
            projectId: newProject.id,
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

    // Crear notificaciones para admins
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'super_admin']
        }
      }
    });

    // Notificar a admins que se creó un proyecto pendiente de aprobación
    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'project_pending_approval',
          title: '📋 Proyecto Pendiente de Aprobación',
          message: `${createdBy || user.name} ha enviado el proyecto "${newProject.projectName}" para aprobación. Total: $${totalCost?.toFixed(2) || '0.00'}`,
          data: JSON.stringify({
            projectId: newProject.id,
            projectName: newProject.projectName,
            clientName: clientName,
            createdBy: createdBy || user.name,
            totalCost: totalCost,
            status: 'pending_approval'
          }),
          isRead: false,
        }
      });
    }

    // Notificación al creador
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'project_submitted',
        title: '✅ Proyecto Enviado para Aprobación',
        message: `Has enviado exitosamente el proyecto "${newProject.projectName}" para aprobación. Total: $${totalCost?.toFixed(2) || '0.00'}`,
        data: JSON.stringify({
          projectId: newProject.id,
          projectName: newProject.projectName,
          clientName: clientName,
          totalCost: totalCost,
          status: 'pending_approval'
        }),
        isRead: false,
      }
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Error creating project' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, status, comment, assignedInstaller, installerPriceProposal, installerPriceStatus, scheduledInstallation, ...updateData } = body;

    console.log('\n=== PATCH /api/projects INICIO ===');
    console.log('Body recibido:', JSON.stringify(body, null, 2));
    console.log('installerPriceStatus:', installerPriceStatus);
    console.log('installerPriceProposal:', installerPriceProposal);
    console.log('comment:', comment);
    console.log('user:', user.name, 'role:', user.role);
    console.log('=== FIN DEBUG INICIAL ===\n');

    // Obtener proyecto actual con Prisma
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdByUser: true,
        assignedUser: true,
        history: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Restricciones para vendedores
    if (user.role === 'vendor') {
      // Los vendedores solo pueden editar sus propios proyectos
      if (project.createdById !== user.id) {
        return NextResponse.json(
          { error: 'No tienes permisos para editar este proyecto' },
          { status: 403 }
        );
      }

      // Los vendedores solo pueden editar proyectos en estado 'draft', 'pending', 'approved' o 'assigned'
      if (!['draft', 'pending', 'approved', 'assigned'].includes(project.status)) {
        return NextResponse.json(
          { error: 'Estado de proyecto no válido para edición' },
          { status: 403 }
        );
      }

      // Los vendedores no pueden cambiar el estado a 'approved' directamente
      if (status === 'approved') {
        return NextResponse.json(
          { error: 'Solo los administradores pueden aprobar proyectos' },
          { status: 403 }
        );
      }

      // Los vendedores solo pueden asignar instaladores a proyectos aprobados o que ya tengan instalador asignado
      if ((assignedInstaller || installerPriceProposal) && project.status !== 'approved' && project.status !== 'assigned') {
        return NextResponse.json(
          { error: 'Solo puedes asignar instaladores a proyectos aprobados' },
          { status: 403 }
        );
      }
    }

    // Buscar instalador por nombre si se proporciona
    let assignedInstallerId = updateData.assignedInstallerId;
    if (assignedInstaller && !assignedInstallerId) {
      const installerUser = await prisma.user.findFirst({
        where: { name: assignedInstaller }
      });
      if (!installerUser) {
        return NextResponse.json(
          { error: 'Instalador no encontrado' },
          { status: 404 }
        );
      }
      assignedInstallerId = installerUser.id;
    }

    // Determinar si el proyecto está siendo aprobado
    const isBeingApproved = status === 'approved' && project.status !== 'approved';

    // Determinar si el precio del instalador está siendo aceptado
    const isPriceBeingAccepted = installerPriceProposal && status === 'assigned';

    // Detectar cambio en estado del precio
    const isPriceStatusChanging = installerPriceStatus && installerPriceStatus !== project.installerPriceStatus;

    console.log('\n=== VERIFICACIÓN DE PRECIO ===');
    console.log('installerPriceStatus enviado:', installerPriceStatus, 'tipo:', typeof installerPriceStatus);
    console.log('project.installerPriceStatus actual:', project.installerPriceStatus, 'tipo:', typeof project.installerPriceStatus);
    console.log('Condición 1 - installerPriceStatus es truthy:', !!installerPriceStatus);
    console.log('Condición 2 - son diferentes:', installerPriceStatus !== project.installerPriceStatus);
    console.log('isPriceStatusChanging RESULTADO:', isPriceStatusChanging);
    console.log('=== FIN VERIFICACIÓN PRECIO ===\n');

    // Preparar datos de actualización
    const dataToUpdate: any = {
      ...updateData,
      status: status || project.status,
      assignedInstaller: assignedInstaller || project.assignedInstaller,
      assignedInstallerId: assignedInstallerId !== undefined ? assignedInstallerId : project.assignedInstallerId,
      installerPriceProposal: installerPriceProposal || project.installerPriceProposal,
      installerPriceStatus: installerPriceStatus || (installerPriceProposal ? 'pending' : project.installerPriceStatus),
      scheduledInstallation: scheduledInstallation ? new Date(scheduledInstallation) : project.scheduledInstallation,
      lastModified: new Date(),
      lastModifiedBy: user.name,
      ...(status === 'approved' && project.status !== 'approved' && {
        approvedAt: new Date(),
        approvedBy: user.name
      })
    };

    // Crear historia del cambio
    let historyComment = comment || `Proyecto actualizado por ${user.name}`;
    let historyAction = status ? `Cambio de estado: ${project.status} → ${status}` : 'Actualización';

    // Si hay cambio de precio, agregar información específica
    if (isPriceStatusChanging) {
      if (installerPriceStatus === 'accepted') {
        historyAction = 'price_accepted';
        historyComment = `Precio de instalación aceptado por ${user.name}. Precio: $${installerPriceProposal || project.installerPriceProposal}`;
      } else if (installerPriceStatus === 'suggested') {
        historyAction = 'price_suggested';
        historyComment = comment || `Precio sugerido por ${user.name}. Nuevo precio: $${installerPriceProposal || project.installerPriceProposal}`;
      } else if (installerPriceStatus === 'counter_offered') {
        historyAction = 'price_counter_offered';
        historyComment = comment || `Contra-oferta de ${user.name}. Nuevo precio: $${installerPriceProposal || project.installerPriceProposal}`;
      }
    }

    const historyEntry = {
      timestamp: new Date(),
      status: installerPriceStatus || status || 'updated',
      comment: historyComment,
      user: user.name,
      action: historyAction
    };

    // Actualizar proyecto con Prisma
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...dataToUpdate,
        history: {
          create: historyEntry
        }
      },
      include: {
        items: true,
        history: true,
        incidents: true,
        contracts: true
      }
    });

    // Crear contrato si el precio del instalador está siendo aceptado
    if (isPriceBeingAccepted && updatedProject.assignedInstallerId && updatedProject.installerPriceProposal && updatedProject.createdById) {
      const [installer, vendor] = await Promise.all([
        prisma.user.findUnique({ where: { id: updatedProject.assignedInstallerId } }),
        prisma.user.findUnique({ where: { id: updatedProject.createdById } })
      ]);

      if (installer && vendor) {
        await prisma.contract.create({
          data: {
            contractNumber: `CONT-${Date.now()}`,
            type: 'service_contract',
            title: `Contrato de Servicios - ${updatedProject.projectName}`,
            description: `Contrato de instalación para el proyecto ${updatedProject.projectName} con ${installer.name}`,
            status: 'pending_signature',
            amount: updatedProject.installerPriceProposal,
            currency: 'USD',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            clientId: vendor.id,
            vendorId: vendor.id,
            installerId: installer.id,
            projectId: updatedProject.id,
            createdAt: new Date(),
            communications: JSON.stringify([{
              id: Date.now(),
              type: 'contract_sent',
              message: `Se ha enviado el contrato para firma al cliente ${vendor.name}`,
              sentAt: new Date().toISOString(),
              recipientEmail: vendor.email
            }])
          }
        });

        // Crear notificación para el cliente sobre el contrato
        await prisma.notification.create({
          data: {
            userId: vendor.id,
            type: 'contract_ready',
            title: 'Contrato Listo para Firma',
            message: `El contrato para tu proyecto "${updatedProject.projectName}" está listo para tu firma. Revisa tu portal de cliente.`,
            data: JSON.stringify({
              contractId: Date.now(),
              contractNumber: `CONT-${Date.now()}`,
              projectId: updatedProject.id,
              projectName: updatedProject.projectName
            }),
            isRead: false
          }
        });
      }
    }

    // 🔔 NOTIFICACIÓN: Cuando instalador acepta o sugiere precio
    if (isPriceStatusChanging && updatedProject.createdById) {
      console.log('\n=== CREANDO NOTIFICACIÓN DE PRECIO ===');
      console.log('isPriceStatusChanging es TRUE');
      console.log('createdById:', updatedProject.createdById);
      
      const creator = await prisma.user.findUnique({
        where: { id: updatedProject.createdById }
      });

      console.log('Creator encontrado:', creator?.name, '(ID:', creator?.id, ')');

      if (creator) {
        let notificationTitle = '';
        let notificationMessage = '';
        let notificationType = '';
        let recipientId = creator.id;

        if (installerPriceStatus === 'accepted') {
          notificationType = 'price_accepted';
          notificationTitle = '✅ Precio de Instalación Aceptado';
          notificationMessage = `${user.name} (instalador) ha aceptado el precio de $${updatedProject.installerPriceProposal?.toFixed(2)} para el proyecto "${updatedProject.projectName}". ¡Listo para proceder!`;
        } else if (installerPriceStatus === 'suggested') {
          notificationType = 'price_suggested';
          notificationTitle = '💡 Sugerencia de Precio de Instalación';
          notificationMessage = `${user.name} (instalador) sugiere un nuevo precio de $${installerPriceProposal?.toFixed(2)} para "${updatedProject.projectName}". Revisa su comentario: "${comment}"`;
        } else if (installerPriceStatus === 'counter_offered') {
          notificationType = 'price_counter_offered';
          notificationTitle = '🔄 Contra-oferta de Precio';
          notificationMessage = `${user.name} (vendedor) ha enviado una contra-oferta de $${installerPriceProposal?.toFixed(2)} para "${updatedProject.projectName}". Mensaje: "${comment}"`;
          // Enviar al instalador, no al creador
          recipientId = updatedProject.assignedInstallerId || creator.id;
        }

        console.log('notificationType:', notificationType);
        console.log('notificationTitle:', notificationTitle);

        if (notificationType) {
          console.log('Creando notificación...');
          await prisma.notification.create({
            data: {
              userId: recipientId,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              data: JSON.stringify({
                projectId: updatedProject.id,
                projectName: updatedProject.projectName,
                installerName: user.name,
                priceProposal: updatedProject.installerPriceProposal,
                priceStatus: installerPriceStatus,
                comment: comment,
                originalPrice: project.installerPriceProposal,
                suggestedPrice: installerPriceProposal,
                timestamp: new Date(),
                action: installerPriceStatus === 'accepted' ? 'El instalador ACEPTÓ el precio' : 'El instalador SUGIRIÓ un precio diferente'
              }),
              isRead: false
            }
          });
          console.log('✅ Notificación creada exitosamente');
        }
      }
      console.log('=== FIN CREACIÓN NOTIFICACIÓN ===\n');
    } else {
      console.log('\n=== NO SE CREA NOTIFICACIÓN ===');
      console.log('isPriceStatusChanging:', isPriceStatusChanging);
      console.log('updatedProject.createdById:', updatedProject.createdById);
      console.log('=== FIN ===\n');
    }

    // Crear notificación si el proyecto está siendo aprobado
    if (isBeingApproved && project.createdById) {
      const creator = await prisma.user.findUnique({
        where: { id: project.createdById }
      });

      if (creator) {
        await prisma.notification.create({
          data: {
            userId: creator.id,
            type: 'project_approved',
            title: '✅ Proyecto Aprobado',
            message: `Tu proyecto "${updatedProject.projectName}" ha sido aprobado por ${user.name} con un costo de $${updatedProject.totalCost?.toFixed(2) || 0}. Se procederá a asignar un instalador.`,
            data: JSON.stringify({
              projectId: updatedProject.id,
              projectName: updatedProject.projectName,
              totalCost: updatedProject.totalCost,
              approvedBy: user.name,
              approvedAt: updatedProject.approvedAt,
              status: 'approved'
            }),
            isRead: false
          }
        });
      }
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating project';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
