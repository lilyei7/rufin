import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🗑️  Limpiando base de datos...');
    
    // Limpiar en orden correcto (respetando FKs)
    await prisma.notification.deleteMany({});
    await prisma.contract.deleteMany({});
    await prisma.incidentHistory.deleteMany({});
    await prisma.incidentItem.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.projectHistory.deleteMany({});
    await prisma.projectItem.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    
    console.log('✅ Base de datos limpia');

    // Leer datos del JSON
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log('\n📂 Migrando categorías...');
    for (const category of jsonData.categories || []) {
      await prisma.category.create({
        data: {
          id: category.id,
          name: category.name,
          description: category.description || null,
          type: category.type || null,
          parentCategoryId: category.parentCategoryId || null,
        }
      });
    }
    console.log(`✅ ${jsonData.categories?.length || 0} categorías creadas`);

    console.log('\n📦 Migrando productos...');
    for (const product of jsonData.products || []) {
      await prisma.product.create({
        data: {
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
    }
    console.log(`✅ ${jsonData.products?.length || 0} productos creados`);

    // Crear usuarios
    console.log('\n👥 Creando usuarios...');
    
    // Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        name: 'Administrador',
        email: 'admin@example.com',
        role: 'admin',
        active: true,
      }
    });
    console.log(`✅ Admin creado (ID: ${admin.id})`);

    // Super Admin
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await prisma.user.create({
      data: {
        username: 'superadmin',
        password: superAdminPassword,
        name: 'Super Administrador',
        email: 'superadmin@example.com',
        role: 'super_admin',
        active: true,
      }
    });
    console.log(`✅ Super Admin creado (ID: ${superAdmin.id})`);

    // Vendor jhayco
    const vendorPassword = await bcrypt.hash('jhayco123', 10);
    const vendor = await prisma.user.create({
      data: {
        username: 'jhayco',
        password: vendorPassword,
        name: 'jhayco',
        email: 'jhayco@example.com',
        role: 'vendor',
        active: true,
      }
    });
    console.log(`✅ Vendor jhayco creado (ID: ${vendor.id})`);

    console.log('\n🎉 ¡Base de datos lista!');
    console.log('\n📋 Credenciales:');
    console.log('   Admin: admin / admin123');
    console.log('   Super Admin: superadmin / superadmin123');
    console.log('   Vendor: jhayco / jhayco123');
    console.log(`\n📊 Resumen:`);
    console.log(`   - ${jsonData.categories?.length || 0} categorías`);
    console.log(`   - ${jsonData.products?.length || 0} productos`);
    console.log(`   - 3 usuarios (admin, super_admin, vendor)`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
