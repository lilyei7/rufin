const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedContracts() {
  console.log('🌱 Seeding complete system data...');

  // 0. Crear Usuarios si no existen
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password: hashedPassword,
      name: 'Super Administrador',
      email: 'superadmin@rufin.com',
      role: 'super_admin',
      active: true
    }
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      email: 'admin@rufin.com',
      role: 'admin',
      active: true
    }
  });

  const vendor1 = await prisma.user.upsert({
    where: { username: 'vendor1' },
    update: {},
    create: {
      username: 'vendor1',
      password: hashedPassword,
      name: 'Juan Pérez',
      email: 'vendor1@rufin.com',
      role: 'vendor',
      active: true
    }
  });

  const purchasing1 = await prisma.user.upsert({
    where: { username: 'purchasing1' },
    update: {},
    create: {
      username: 'purchasing1',
      password: hashedPassword,
      name: 'María González',
      email: 'purchasing1@rufin.com',
      role: 'purchasing',
      active: true
    }
  });

  const installer1 = await prisma.user.upsert({
    where: { username: 'installer1' },
    update: {},
    create: {
      username: 'installer1',
      password: hashedPassword,
      name: 'Carlos López',
      email: 'installer1@rufin.com',
      role: 'installer',
      active: true
    }
  });

  console.log('✅ Created 5 users');

  // 1. Crear Categorías
  console.log('Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Paneles Solares' },
      update: {},
      create: { name: 'Paneles Solares' }
    }),
    prisma.category.upsert({
      where: { name: 'Inversores' },
      update: {},
      create: { name: 'Inversores' }
    }),
    prisma.category.upsert({
      where: { name: 'Estructura' },
      update: {},
      create: { name: 'Estructura' }
    }),
    prisma.category.upsert({
      where: { name: 'Accesorios' },
      update: {},
      create: { name: 'Accesorios' }
    }),
    prisma.category.upsert({
      where: { name: 'Baterías' },
      update: {},
      create: { name: 'Baterías' }
    })
  ]);
  console.log('✅ Created ' + categories.length + ' categories');

  // 2. Crear Productos
  console.log('Creating products...');
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: -1 },
      update: {},
      create: {
        name: 'Panel Solar 550W Tier 1',
        categoryId: categories[0].id,
        unitPrice: 3500,
        unitType: 'pieza',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -2 },
      update: {},
      create: {
        name: 'Inversor Híbrido 5kW',
        categoryId: categories[1].id,
        unitPrice: 25000,
        unitType: 'pieza',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -3 },
      update: {},
      create: {
        name: 'Estructura Aluminio 12 Paneles',
        categoryId: categories[2].id,
        unitPrice: 8500,
        unitType: 'kit',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -4 },
      update: {},
      create: {
        name: 'Cable Solar 6mm 100m',
        categoryId: categories[3].id,
        unitPrice: 4500,
        unitType: 'rollo',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -5 },
      update: {},
      create: {
        name: 'Batería LiFePO4 10kWh',
        categoryId: categories[4].id,
        unitPrice: 85000,
        unitType: 'pieza',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -6 },
      update: {},
      create: {
        name: 'Panel Solar 450W Policristalino',
        categoryId: categories[0].id,
        unitPrice: 2800,
        unitType: 'pieza',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -7 },
      update: {},
      create: {
        name: 'Inversor On-Grid 3kW',
        categoryId: categories[1].id,
        unitPrice: 15000,
        unitType: 'pieza',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -8 },
      update: {},
      create: {
        name: 'Protección DC 600V',
        categoryId: categories[3].id,
        unitPrice: 1200,
        unitType: 'pieza',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -9 },
      update: {},
      create: {
        name: 'Conectores MC4 (Par)',
        categoryId: categories[3].id,
        unitPrice: 150,
        unitType: 'par',
        active: true
      }
    }),
    prisma.product.upsert({
      where: { id: -10 },
      update: {},
      create: {
        name: 'Estructura Suelo 20 Paneles',
        categoryId: categories[2].id,
        unitPrice: 18000,
        unitType: 'kit',
        active: true
      }
    })
  ]);
  console.log('✅ Created ' + products.length + ' products');

  // 3. Crear Clientes
  console.log('Creating clients...');
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'cliente1@test.com' },
      update: {},
      create: {
        name: 'Juan García Pérez',
        email: 'cliente1@test.com',
        phone: '+52 55 1234 5678',
        company: 'Residencial Los Pinos',
        address: 'Av. Reforma 123, Col. Centro, CDMX',
        accessCode: 'ACC-001',
        active: true
      }
    }),
    prisma.client.upsert({
      where: { email: 'cliente2@test.com' },
      update: {},
      create: {
        name: 'María López González',
        email: 'cliente2@test.com',
        phone: '+52 55 8765 4321',
        company: 'Comercial del Sur SA',
        address: 'Blvd. Industrial 456, Guadalajara, JAL',
        accessCode: 'ACC-002',
        active: true
      }
    }),
    prisma.client.upsert({
      where: { email: 'cliente3@test.com' },
      update: {},
      create: {
        name: 'Carlos Ramírez Torres',
        email: 'cliente3@test.com',
        phone: '+52 81 9876 5432',
        company: null,
        address: 'Calle Morelos 789, Monterrey, NL',
        accessCode: 'ACC-003',
        active: true
      }
    })
  ]);
  console.log('✅ Created ' + clients.length + ' clients');

  // 2. Crear Templates
  console.log('Creating contract templates...');
  const templates = await Promise.all([
    prisma.contractTemplate.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Contrato de Proyecto con Cliente',
        type: 'project',
        content: 'CONTRATO DE PROYECTO\n\nSuministro e instalación de sistema fotovoltaico.',
        active: true
      }
    }),
    prisma.contractTemplate.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Contrato de Mantenimiento',
        type: 'maintenance',
        content: 'CONTRATO DE MANTENIMIENTO\n\nServicios de mantenimiento preventivo.',
        active: true
      }
    })
  ]);
  console.log('✅ Created ' + templates.length + ' templates');

  // 3. Crear Términos
  console.log('Creating terms...');
  const terms = await Promise.all([
    prisma.termsAndConditions.upsert({
      where: { version: '1.0' },
      update: {},
      create: {
        version: '1.0',
        title: 'Términos y Condiciones Generales',
        content: 'TERMINOS Y CONDICIONES\n\n1. ACEPTACION\n2. USO DEL SERVICIO\n3. PRIVACIDAD',
        active: true
      }
    })
  ]);
  console.log('✅ Created ' + terms.length + ' terms');

  // 4. Crear Cotizaciones (Quotes)
  console.log('Creating quotes...');
  const quote1 = await prisma.quote.upsert({
    where: { quoteNumber: 'QUOTE-00001' },
    update: {},
    create: {
      quoteNumber: 'QUOTE-00001',
      clientName: clients[0].name,
      clientEmail: clients[0].email,
      clientPhone: clients[0].phone,
      status: 'accepted',
      totalCost: 85000,
      validUntil: new Date('2026-01-15'),
      notes: 'Sistema residencial 5kW - 12 paneles',
      createdBy: 'SuperAdmin User',
      createdByUserId: superadmin.id
    }
  });

  const quote2 = await prisma.quote.upsert({
    where: { quoteNumber: 'QUOTE-00002' },
    update: {},
    create: {
      quoteNumber: 'QUOTE-00002',
      clientName: clients[1].name,
      clientEmail: clients[1].email,
      clientPhone: clients[1].phone,
      status: 'sent',
      totalCost: 250000,
      validUntil: new Date('2026-02-01'),
      notes: 'Sistema comercial 15kW - 30 paneles',
      createdBy: 'Vendor One',
      createdByUserId: vendor1.id
    }
  });

  // Items de cotización 1
  await Promise.all([
    prisma.quoteItem.create({
      data: {
        quoteId: quote1.id,
        productId: products[0].id,
        quantity: 12,
        unitPrice: products[0].unitPrice
      }
    }),
    prisma.quoteItem.create({
      data: {
        quoteId: quote1.id,
        productId: products[1].id,
        quantity: 1,
        unitPrice: products[1].unitPrice
      }
    }),
    prisma.quoteItem.create({
      data: {
        quoteId: quote1.id,
        productId: products[2].id,
        quantity: 1,
        unitPrice: products[2].unitPrice
      }
    })
  ]);

  console.log('✅ Created 2 quotes with items');

  // 5. Crear Proyectos
  console.log('Creating projects...');
  const project1 = await prisma.project.upsert({
    where: { invoiceNumber: 'INV-00001' },
    update: {},
    create: {
      projectName: 'Sistema Residencial 5kW - ' + clients[0].name,
      invoiceNumber: 'INV-00001',
      clientName: clients[0].name,
      status: 'in_progress',
      totalCost: 85000,
      startDate: new Date('2025-11-21'),
      endDate: new Date('2025-12-06'),
      notes: 'Instalación en proceso',
      createdBy: 'Vendor One',
      createdByUserId: vendor1.id,
      approvedBy: 'Purchasing One',
      approvedByUserId: purchasing1.id,
      quoteId: quote1.id
    }
  });

  const project2 = await prisma.project.upsert({
    where: { invoiceNumber: 'INV-00002' },
    update: {},
    create: {
      projectName: 'Sistema Comercial 15kW - ' + clients[1].name,
      invoiceNumber: 'INV-00002',
      clientName: clients[1].name,
      status: 'draft',
      totalCost: 250000,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-20'),
      notes: 'Pendiente de aprobación',
      createdBy: 'Vendor One',
      createdByUserId: vendor1.id,
      quoteId: quote2.id
    }
  });

  // Items de proyecto 1
  await Promise.all([
    prisma.projectItem.create({
      data: {
        projectId: project1.id,
        productId: products[0].id,
        quantity: 12,
        unitPrice: products[0].unitPrice
      }
    }),
    prisma.projectItem.create({
      data: {
        projectId: project1.id,
        productId: products[1].id,
        quantity: 1,
        unitPrice: products[1].unitPrice
      }
    })
  ]);

  // Historial de proyecto 1
  await prisma.projectHistory.create({
    data: {
      projectId: project1.id,
      action: 'created',
      comment: 'Proyecto creado por ' + vendor1.name,
      userId: vendor1.id,
      username: vendor1.name
    }
  });

  await prisma.projectHistory.create({
    data: {
      projectId: project1.id,
      action: 'approved',
      comment: 'Proyecto aprobado por ' + purchasing1.name,
      userId: purchasing1.id,
      username: purchasing1.name
    }
  });

  console.log('✅ Created 2 projects with items and history');

  // 6. Crear Incidentes
  console.log('Creating incidents...');
  const incident1 = await prisma.incident.upsert({
    where: { incidentInvoiceNumber: 'INC-00001' },
    update: {},
    create: {
      projectId: project1.id,
      projectName: project1.projectName,
      incidentInvoiceNumber: 'INC-00001',
      title: 'Falta de Material - Conectores MC4',
      description: 'Faltan 2 conectores MC4 para completar instalación',
      type: 'material_shortage',
      priority: 'high',
      status: 'completed',
      totalCost: 300,
      createdBy: 'Installer One',
      createdByUserId: installer1.id,
      approvedBy: 'Purchasing One',
      approvedByUserId: purchasing1.id,
      resolvedAt: new Date()
    }
  });

  const incident2 = await prisma.incident.upsert({
    where: { incidentInvoiceNumber: 'INC-00002' },
    update: {},
    create: {
      projectId: project1.id,
      projectName: project1.projectName,
      incidentInvoiceNumber: 'INC-00002',
      title: 'Problema de Instalación - Estructura',
      description: 'Ajuste en estructura por techo irregular',
      type: 'extra_work',
      priority: 'medium',
      status: 'pending',
      totalCost: 1500,
      createdBy: 'Installer One',
      createdByUserId: installer1.id
    }
  });

  // Items de incidente 1
  await prisma.incidentItem.create({
    data: {
      incidentId: incident1.id,
      productId: products[8].id,
      quantity: 2,
      unitPrice: products[8].unitPrice
    }
  });

  // Historial de incidente 1
  await prisma.incidentHistory.create({
    data: {
      incidentId: incident1.id,
      action: 'created',
      comment: 'Incidente reportado durante instalación',
      userId: installer1.id,
      username: installer1.name
    }
  });

  await prisma.incidentHistory.create({
    data: {
      incidentId: incident1.id,
      action: 'resolved',
      comment: 'Material entregado y problema resuelto',
      userId: purchasing1.id,
      username: purchasing1.name
    }
  });

  console.log('✅ Created 2 incidents with items and history');

  // 7. Crear Notificaciones
  console.log('Creating notifications...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: purchasing1.id,
        type: 'info',
        message: 'Nuevo proyecto pendiente: INV-00002 requiere aprobación',
        read: false
      }
    }),
    prisma.notification.create({
      data: {
        userId: purchasing1.id,
        type: 'warning',
        message: 'Incidente reportado: INC-00002 requiere revisión',
        read: false
      }
    }),
    prisma.notification.create({
      data: {
        userId: vendor1.id,
        type: 'success',
        message: 'Cotización aprobada: QUOTE-00001 ha sido aceptada',
        read: true
      }
    }),
    prisma.notification.create({
      data: {
        userId: installer1.id,
        type: 'info',
        message: 'Se te ha asignado INV-00001',
        read: true
      }
    })
  ]);
  console.log('✅ Created 4 notifications');

  // 8. Crear Contratos
  console.log('Creating contracts...');
  const contract1 = await prisma.contract.upsert({
    where: { contractNumber: 'CONT-00001' },
    update: {},
    create: {
      contractNumber: 'CONT-00001',
      type: 'project',
      status: 'signed',
      title: 'Sistema Residencial 5kW - Juan García',
      description: 'Sistema fotovoltaico residencial completo',
      content: 'CONTRATO DE VENTA E INSTALACION\n\nEntre ' + clients[0].name + ' y RUFIN ENERGY.\n\nOBJETO: Sistema de 5kW\nPRECIO: $85,000 MXN\nPLAZO: 15 días',
      clientId: clients[0].id,
      templateId: templates[0].id,
      amount: 85000,
      currency: 'MXN',
      startDate: new Date('2025-11-21'),
      endDate: new Date('2026-11-21'),
      paymentTerms: '50% anticipo, 50% contraentrega',
      deliveryTerms: 'Instalación en 15 días hábiles',
      createdByUserId: admin.id,
      signedAt: new Date(),
      activatedAt: new Date()
    }
  });

  const contract2 = await prisma.contract.upsert({
    where: { contractNumber: 'CONT-00002' },
    update: {},
    create: {
      contractNumber: 'CONT-00002',
      type: 'project',
      status: 'pending_signature',
      title: 'Sistema Comercial 15kW - María López',
      description: 'Sistema fotovoltaico comercial',
      content: 'CONTRATO DE VENTA E INSTALACION\n\nSistema comercial de 15kW para ' + clients[1].company,
      clientId: clients[1].id,
      templateId: templates[0].id,
      amount: 250000,
      currency: 'MXN',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2026-12-01'),
      paymentTerms: '40% anticipo, 30% avance, 30% final',
      createdByUserId: admin.id
    }
  });

  console.log('✅ Created 2 contracts');

  // 6. Firmas
  console.log('Creating signatures...');
  await prisma.contractSignature.create({
    data: {
      contractId: contract1.id,
      signerId: admin.id,
      signerName: admin.name,
      signerEmail: admin.email,
      signerRole: 'admin',
      status: 'signed',
      signatureData: 'signature_data_admin_' + Date.now(),
      signatureType: 'digital',
      ipAddress: '192.168.1.100',
      signedAt: new Date()
    }
  });
  console.log('✅ Created signatures');

  // 7. Comunicaciones
  console.log('Creating communications...');
  await Promise.all([
    prisma.communicationLog.create({
      data: {
        contractId: contract1.id,
        sentByUserId: admin.id,
        recipientName: clients[0].name,
        recipientEmail: clients[0].email,
        subject: 'Contrato firmado exitosamente',
        message: 'Su contrato ha sido firmado y está activo.',
        type: 'email',
        status: 'sent',
        sentAt: new Date()
      }
    }),
    prisma.communicationLog.create({
      data: {
        contractId: contract2.id,
        sentByUserId: admin.id,
        recipientName: clients[1].name,
        recipientEmail: clients[1].email,
        subject: 'Contrato pendiente de firma',
        message: 'Su contrato está listo para revisión y firma.',
        type: 'email',
        status: 'sent',
        sentAt: new Date()
      }
    })
  ]);
  console.log('✅ Created communications');

  console.log('\n✅ Contract seeding completed!');
  console.log('\nACCESO AL PORTAL DE CLIENTES:');
  console.log('- cliente1@test.com / ACC-001');
  console.log('- cliente2@test.com / ACC-002');
  console.log('- cliente3@test.com / ACC-003\n');
}

seedContracts()
  .catch((e) => {
    console.error('❌ Error seeding contracts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
