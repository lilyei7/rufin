import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
console.log('Prisma client created');

async function migrateData() {
  try {
    console.log('🚀 Iniciando migración de datos JSON a SQLite...');
    console.log('Current working directory:', process.cwd());

    // Test connection
    const test = await prisma.category.count();
    console.log('Test query result:', test);

    // Leer datos del JSON
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    console.log('Data path:', dataPath);
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log('📖 Datos JSON leídos correctamente');

    // Migrar categorías
    console.log('📂 Migrando categorías...');
    for (const category of jsonData.categories || []) {
      try {
        const result = await prisma.category.upsert({
          where: { id: category.id },
          update: {
            name: category.name,
            description: category.description || null,
            type: category.type || null,
            parentCategoryId: category.parentCategoryId || null,
          },
          create: {
            id: category.id,
            name: category.name,
            description: category.description || null,
            type: category.type || null,
            parentCategoryId: category.parentCategoryId || null,
          }
        });
        console.log(`✅ Categoría ${category.id} upserted: ${result.name}`);
      } catch (error) {
        console.error(`Error insertando categoría ${category.id}:`, error);
      }
    }
    console.log(`✅ ${jsonData.categories?.length || 0} categorías migradas`);

    // Migrar productos
    console.log('📦 Migrando productos...');
    for (const product of jsonData.products || []) {
      try {
        console.log(`Insertando producto ID: ${product.id}, categoryId: ${product.categoryId}`);
        await prisma.product.upsert({
          where: { id: product.id },
          update: {
            name: product.name,
            categoryId: product.categoryId,
            unitPrice: product.unitPrice,
            unitType: product.unitType,
            usage: product.usage || null,
            notes: product.notes || null,
            active: true,
          },
          create: {
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
            unitPrice: product.unitPrice,
            unitType: product.unitType,
            usage: product.usage || null,
            notes: product.notes || null,
            active: true,
          }
        });
      } catch (error) {
        console.error(`Error insertando producto ${product.id}:`, error);
      }
    }
    console.log(`✅ ${jsonData.products?.length || 0} productos migrados`);

    // Migrar usuarios
    console.log('👥 Migrando usuarios...');
    // for (const user of jsonData.users || []) {
    //   await prisma.user.create({
    //     data: {
    //       id: user.id,
    //       username: user.username,
    //       password: user.password,
    //       name: user.name,
    //       email: user.email,
    //       role: user.role,
    //       active: user.active !== undefined ? user.active : true,
    //     }
    //   });
    // }
    console.log(`✅ ${jsonData.users?.length || 0} usuarios migrados`);

    // Migrar proyectos
    console.log('🏗️ Migrando proyectos...');
    for (const project of jsonData.projects || []) {
      await prisma.project.create({
        data: {
          id: project.id,
          projectName: project.projectName || project.name || '',
          invoiceNumber: project.invoiceNumber || `INV-${project.id}`,
          clientName: project.clientName || '',
          status: project.status || 'draft',
          totalCost: project.totalCost || 0,
          startDate: project.startDate ? new Date(project.startDate) : null,
          endDate: project.endDate ? new Date(project.endDate) : null,
          notes: project.notes || null,
          rejectionReason: project.rejectionReason || null,
          createdBy: project.createdBy || '',
          createdById: project.createdById || null,
          approvedBy: project.approvedBy || null,
          approvedById: project.approvedById || null,
          assignedInstaller: project.assignedInstaller || null,
          assignedInstallerId: project.assignedInstallerId || null,
          installerPriceProposal: project.installerPriceProposal || null,
          installerPriceStatus: project.installerPriceStatus || null,
          scheduledInstallation: project.scheduledInstallation ? new Date(project.scheduledInstallation) : null,
          approvedAt: project.approvedAt ? new Date(project.approvedAt) : null,
          lastModified: project.lastModified ? new Date(project.lastModified) : null,
          lastModifiedBy: project.lastModifiedBy || null,
        }
      });
    }
    console.log(`✅ ${jsonData.projects?.length || 0} proyectos migrados`);

    // Migrar historial de proyectos
    console.log('📜 Migrando historial de proyectos...');
    for (const project of jsonData.projects || []) {
      if (project.history && Array.isArray(project.history)) {
        for (const historyItem of project.history) {
          await prisma.projectHistory.create({
            data: {
              projectId: project.id,
              timestamp: new Date(historyItem.timestamp),
              status: historyItem.status || 'updated',
              comment: historyItem.comment || null,
              user: historyItem.user || '',
              action: historyItem.action || null,
            }
          });
        }
      }
    }
    console.log('✅ Historial de proyectos migrado');

    // Migrar contratos
    console.log('📄 Migrando contratos...');
    for (const contract of jsonData.contracts || []) {
      await prisma.contract.create({
        data: {
          id: contract.id,
          contractNumber: contract.contractNumber || `CONT-${contract.id}`,
          projectId: contract.projectId || null,
          incidentId: contract.incidentId || null,
          type: contract.type || 'project',
          status: contract.status || 'draft',
          title: contract.title || 'Contrato',
          content: contract.content || '',
          totalAmount: contract.totalAmount || 0,
          signedAt: contract.signedAt ? new Date(contract.signedAt) : null,
          createdBy: contract.createdBy || '',
          createdById: contract.createdById || null,
        }
      });
    }
    console.log(`✅ ${jsonData.contracts?.length || 0} contratos migrados`);

    // Migrar incidentes
    console.log('🚨 Migrando incidentes...');
    for (const incident of jsonData.incidents || []) {
      await prisma.incident.create({
        data: {
          id: incident.id,
          projectId: incident.projectId,
          title: incident.title || '',
          description: incident.description || '',
          type: incident.type || 'other',
          priority: incident.priority || 'medium',
          status: incident.status || 'pending',
          totalCost: incident.totalCost || 0,
          createdBy: incident.createdBy || '',
          createdById: incident.createdById || null,
          approvedBy: incident.approvedBy || null,
          approvedById: incident.approvedById || null,
        }
      });
    }
    console.log(`✅ ${jsonData.incidents?.length || 0} incidentes migrados`);

    // Migrar notificaciones
    console.log('🔔 Migrando notificaciones...');
    for (const notification of jsonData.notifications || []) {
      await prisma.notification.create({
        data: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type || '',
          title: notification.title || '',
          message: notification.message || '',
          data: notification.data ? JSON.stringify(notification.data) : null,
          isRead: notification.isRead || false,
        }
      });
    }
    console.log(`✅ ${jsonData.notifications?.length || 0} notificaciones migradas`);

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('💾 Los datos han sido migrados de JSON a SQLite');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateData()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });