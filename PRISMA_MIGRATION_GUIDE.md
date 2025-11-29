# 🗄️ MIGRACIÓN A BASE DE DATOS CON PRISMA

## ✅ Migración Completada

El sistema ha sido migrado exitosamente de `data.json` a una **base de datos PostgreSQL** usando **Prisma ORM**.

---

## 📊 Arquitectura Actual

### Stack Tecnológico:
- **ORM**: Prisma 5.22.0
- **Base de Datos**: PostgreSQL 16 (Docker)
- **Cliente**: @prisma/client
- **Hashing**: bcrypt
- **Auth**: JSON Web Tokens (JWT)

### Estructura de Base de Datos:

```
📦 Base de Datos: rufin (PostgreSQL)
├── 👥 users (Usuarios del sistema)
├── 📁 categories (Categorías de productos)
├── 📦 products (Catálogo de productos)
├── 📋 quotes (Cotizaciones)
├── 📄 quote_items (Items de cotizaciones)
├── 🏗️ projects (Proyectos)
├── 📦 project_items (Items de proyectos)
├── 📜 project_history (Historial de proyectos)
├── ⚠️ incidents (Incidencias)
├── 📦 incident_items (Items de incidencias)
├── 📜 incident_history (Historial de incidencias)
└── 🔔 notifications (Notificaciones)
```

---

## 🚀 Configuración

### 1. Base de Datos PostgreSQL (Docker)

```bash
# Iniciar PostgreSQL
docker run --name rufin-postgres \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=rufin \
  -p 5433:5432 \
  -d postgres:16-alpine

# Detener
docker stop rufin-postgres

# Reiniciar
docker start rufin-postgres

# Ver logs
docker logs rufin-postgres
```

### 2. Variables de Entorno (`.env`)

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5433/rufin"
JWT_SECRET="clc-secret-key-2025"
```

### 3. Comandos Prisma

```bash
# Generar cliente de Prisma
npm run prisma generate

# Sincronizar esquema con BD (desarrollo)
npx prisma db push

# Crear migración (producción)
npx prisma migrate dev --name nombre_migracion

# Ver datos en Prisma Studio
npx prisma studio

# Ejecutar seed (poblar datos iniciales)
npm run db:seed
```

---

## 📝 Modelos Principales

### User (Usuario)
```typescript
{
  id: number
  username: string (unique)
  password: string (hashed con bcrypt)
  name: string
  email: string (unique)
  role: 'super_admin' | 'admin' | 'purchasing' | 'vendor' | 'installer'
  active: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Project (Proyecto)
```typescript
{
  id: number
  projectName: string
  invoiceNumber: string (unique, formato: "INV-XXX - Cliente")
  clientName: string
  status: ProjectStatus
  totalCost: number
  startDate?: DateTime
  endDate?: DateTime
  notes?: string
  rejectionReason?: string
  createdBy: string
  createdByUserId: number
  approvedBy?: string
  approvedByUserId?: number
  quoteId?: number
  items: ProjectItem[]
  incidents: Incident[]
  history: ProjectHistory[]
}
```

### Incident (Incidencia)
```typescript
{
  id: number
  projectId: number
  projectName: string
  incidentInvoiceNumber: string (unique, formato: "INV-XXX-INC-YYY")
  title: string
  description?: string
  type: 'change_order' | 'extra_work' | 'damage' | 'material_shortage' | 'other'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  totalCost: number
  createdBy: string
  createdByUserId: number
  approvedBy?: string
  approvedByUserId?: number
  items: IncidentItem[]
  history: IncidentHistory[]
}
```

---

## 🔐 Credenciales de Acceso

Después de ejecutar el seed, puedes acceder con:

| Rol | Email | Password | Descripción |
|-----|-------|----------|-------------|
| **Super Admin** | `superadmin@example.com` | `superadmin123` | Control total del sistema |
| **Admin** | `admin@example.com` | `admin123` | Administración general |

**Nota:** La base de datos ha sido limpiada y solo contiene estos 2 usuarios reales. Todas las credenciales de demostración han sido eliminadas.

---

## 📊 Datos de Seed

El seed inicial crea:
- ✅ 2 usuarios reales (super_admin, admin)
- ✅ 5 categorías de productos
- ✅ 8 productos de ejemplo
- ✅ 2 proyectos con items
- ✅ 2 incidencias vinculadas a proyectos
- ✅ 3 notificaciones de ejemplo

---

## 🔄 Migraciones Futuras

### Agregar un nuevo campo:

1. **Editar el schema** (`prisma/schema.prisma`):
```prisma
model User {
  // ... campos existentes
  phone String? // nuevo campo
}
```

2. **Crear migración**:
```bash
npx prisma migrate dev --name add_user_phone
```

3. **Regenerar cliente**:
```bash
npx prisma generate
```

### Crear un nuevo modelo:

1. **Agregar al schema**:
```prisma
model Invoice {
  id        Int      @id @default(autoincrement())
  projectId Int
  amount    Float
  project   Project  @relation(fields: [projectId], references: [id])
  
  @@map("invoices")
}
```

2. **Actualizar relaciones**:
```prisma
model Project {
  // ... otros campos
  invoices Invoice[]
}
```

3. **Ejecutar migración**:
```bash
npx prisma migrate dev --name create_invoices
```

---

## 🛠️ Uso del Cliente Prisma

### En API Routes:

```typescript
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Obtener todos los usuarios
  const users = await prisma.user.findMany({
    where: { active: true },
    include: {
      createdProjects: true,
      notifications: true,
    },
  });

  // Crear proyecto
  const project = await prisma.project.create({
    data: {
      projectName: 'Mi Proyecto',
      invoiceNumber: 'INV-123',
      clientName: 'Cliente XYZ',
      totalCost: 1000,
      createdByUserId: userId,
      createdBy: username,
      items: {
        create: [
          { productId: 1, quantity: 10, unitPrice: 50 },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  // Actualizar proyecto
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'approved',
      approvedBy: adminUsername,
      approvedByUserId: adminId,
    },
  });

  return NextResponse.json({ users, project });
}
```

### Consultas Avanzadas:

```typescript
// Buscar con filtros múltiples
const projects = await prisma.project.findMany({
  where: {
    AND: [
      { status: 'approved' },
      { totalCost: { gte: 1000 } },
      {
        OR: [
          { clientName: { contains: 'ACME' } },
          { projectName: { contains: 'Oficina' } },
        ],
      },
    ],
  },
  include: {
    items: {
      include: {
        product: true,
      },
    },
    incidents: true,
    createdByUser: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
  skip: 0,
});

// Agregar con transacciones
const result = await prisma.$transaction(async (tx) => {
  const project = await tx.project.create({
    data: { /* ... */ },
  });

  await tx.notification.create({
    data: {
      userId: adminId,
      message: `Nuevo proyecto: ${project.projectName}`,
      type: 'info',
    },
  });

  return project;
});
```

---

## 🎯 Próximos Pasos

### APIs Pendientes de Migrar:

Ahora que la base de datos está configurada, necesitas actualizar los siguientes endpoints para usar Prisma:

1. **✅ `/api/login`** - Ya migrado
2. ⏳ `/api/products` - Migrar a Prisma
3. ⏳ `/api/categories` - Migrar a Prisma
4. ⏳ `/api/projects` - Migrar a Prisma
5. ⏳ `/api/incidents` - Migrar a Prisma
6. ⏳ `/api/users` - Migrar a Prisma
7. ⏳ `/api/quotes` - Migrar a Prisma (si existe)

### Patrón para Migrar un Endpoint:

**Antes (con data.json)**:
```typescript
const dataPath = path.join(process.cwd(), 'public', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const projects = data.projects;
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
```

**Después (con Prisma)**:
```typescript
import prisma from '@/lib/prisma';

// Leer
const projects = await prisma.project.findMany();

// Crear
const newProject = await prisma.project.create({
  data: { /* ... */ },
});

// Actualizar
await prisma.project.update({
  where: { id: projectId },
  data: { /* ... */ },
});

// Eliminar
await prisma.project.delete({
  where: { id: projectId },
});
```

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Reiniciar contenedor
docker restart rufin-postgres
```

### Error: "Schema is not in sync"
```bash
# Regenerar cliente
npx prisma generate

# Sincronizar esquema
npx prisma db push
```

### Ver datos en la BD:
```bash
# Abrir Prisma Studio (interfaz visual)
npx prisma studio
```

### Resetear base de datos:
```bash
# Eliminar todos los datos
npx prisma migrate reset

# Volver a ejecutar seed
npm run db:seed
```

---

## 📚 Recursos

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)

---

## ✨ Ventajas de usar Prisma

✅ **Type Safety** - TypeScript completo con autocompletado  
✅ **Migraciones** - Control de versiones del esquema  
✅ **Relaciones** - Manejo automático de foreign keys  
✅ **Transacciones** - Operaciones atómicas garantizadas  
✅ **Performance** - Consultas optimizadas automáticamente  
✅ **Developer Experience** - Prisma Studio para visualizar datos  
✅ **Escalabilidad** - Fácil migrar a producción (AWS RDS, Railway, etc.)

---

**Sistema migrado exitosamente a Prisma + PostgreSQL** 🎉
