const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Sembrando datos de cotizaciones...\n');

    // Obtener o crear vendedores
    const vendedores = [
      { username: 'jhayco', name: 'Juan Hayco' },
      { username: 'vendor2', name: 'Carlos López' },
      { username: 'vendor3', name: 'María García' },
    ];

    const vendorUsers = [];
    for (const v of vendedores) {
      let vendor = await prisma.user.findUnique({
        where: { username: v.username }
      });
      
      if (!vendor) {
        vendor = await prisma.user.create({
          data: {
            username: v.username,
            password: 'hashed_password', // En producción usar bcrypt
            name: v.name,
            email: `${v.username}@rufin.com`,
            role: 'vendor'
          }
        });
      }
      vendorUsers.push(vendor);
      console.log(`✅ Vendedor: ${vendor.name} (ID: ${vendor.id})`);
    }

    // Obtener productos
    const products = await prisma.product.findMany({
      take: 10
    });

    if (products.length === 0) {
      console.log('⚠️  No hay productos en la BD. Creando algunos...');
      
      // Crear categoría
      const category = await prisma.category.create({
        data: {
          name: 'General',
          description: 'Productos generales'
        }
      });

      // Crear algunos productos
      const newProducts = await Promise.all([
        prisma.product.create({
          data: {
            name: 'Instalación básica',
            categoryId: category.id,
            unitPrice: 500,
            unitType: 'servicio',
            usage: 'Instalación estándar'
          }
        }),
        prisma.product.create({
          data: {
            name: 'Instalación premium',
            categoryId: category.id,
            unitPrice: 1000,
            unitType: 'servicio',
            usage: 'Instalación con acabados premium'
          }
        }),
        prisma.product.create({
          data: {
            name: 'Tuberías PVC',
            categoryId: category.id,
            unitPrice: 50,
            unitType: 'metro',
            usage: 'Material de construcción'
          }
        }),
        prisma.product.create({
          data: {
            name: 'Accesorios de instalación',
            categoryId: category.id,
            unitPrice: 25,
            unitType: 'unidad',
            usage: 'Accesorios varios'
          }
        })
      ]);
      products.push(...newProducts);
    }

    console.log(`\n✅ ${products.length} productos disponibles\n`);

    // Crear cotizaciones para cada vendedor
    const quoteStates = ['draft', 'published', 'accepted'];
    let quoteNumber = 1;

    for (const vendor of vendorUsers) {
      // Crear 2-3 cotizaciones por vendedor
      const numQuotes = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numQuotes; i++) {
        const status = quoteStates[Math.floor(Math.random() * quoteStates.length)];
        const quoteNum = String(quoteNumber++).padStart(4, '0');
        const quoteToken = crypto.randomBytes(16).toString('hex');
        
        // Seleccionar 2-4 productos al azar
        const numItems = Math.floor(Math.random() * 3) + 2;
        const selectedProducts = products
          .sort(() => Math.random() - 0.5)
          .slice(0, numItems);

        let totalCost = 0;
        const items = selectedProducts.map(product => {
          const quantity = Math.floor(Math.random() * 5) + 1;
          const unitPrice = product.unitPrice;
          totalCost += quantity * unitPrice;
          return {
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice
          };
        });

        const quote = await prisma.quote.create({
          data: {
            quoteNumber: `COT-${quoteNum}`,
            vendorId: vendor.id,
            clientName: `Cliente ${vendor.id}-${i + 1}`,
            clientEmail: `cliente${vendor.id}-${i + 1}@example.com`,
            clientPhone: `+58 ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
            totalCost,
            status,
            quoteToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            description: `Cotización de ${selectedProducts.map(p => p.name).join(', ')}`,
            notes: `Cotización creada el ${new Date().toLocaleDateString()}`,
            ...(status === 'accepted' && {
              acceptedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Aceptada hace 1 día
            })
          }
        });

        // Crear items de la cotización
        for (const item of items) {
          await prisma.quoteItem.create({
            data: {
              quoteId: quote.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }
          });
        }

        console.log(`✅ Cotización: ${quote.quoteNumber} - ${vendor.name} - Estado: ${status} - Total: $${totalCost.toFixed(2)}`);
      }
    }

    console.log('\n✅ Datos de cotizaciones creados exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
