# 🚀 GUÍA DE INICIO RÁPIDO - SISTEMA RUFIN

## ⚡ Inicio Rápido (30 segundos)

### 1️⃣ Abrir el navegador
```
http://localhost:3000
```

### 2️⃣ Seleccionar un usuario
Elige uno de estos:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `superadmin@example.com` | `superadmin123` | 🔴 Super Admin |
| `admin@example.com` | `admin123` | 🔵 Admin |

**Nota:** La base de datos ha sido limpiada y solo contiene estos 2 usuarios reales.

### 3️⃣ ¡Listo!
Ya estás dentro del sistema con acceso a todas las funciones según tu rol.

---

## 📊 Datos Precargados

Sistema viene **100% poblado** con:

✅ **7 Usuarios** - Todos los roles disponibles  
✅ **5 Categorías** - Pisos, alfombras, vinilos, adhesivos, herramientas  
✅ **10 Productos** - Laminado, madera, alfombras, vinilos, accesorios  
✅ **5 Cotizaciones** - Mezcladas (aceptadas, rechazadas, pendientes)  
✅ **5 Proyectos** - En diferentes estados (en progreso, aprobados, completados, rechazados)  
✅ **5 Incidencias** - Daños, cambios, faltas de material, trabajo extra  
✅ **8 Notificaciones** - Algunas leídas, otras pendientes

---

## 🎯 Actividades por Rol

### 🟡 VENDEDOR (vendor1 / vendor2)
```
1. Ir a Cotizaciones
   ✓ Ver mis cotizaciones
   ✓ Crear nueva cotización
   ✓ Ver historial

2. Ir a Proyectos
   ✓ Ver mis proyectos
   ✓ Ver estado
   ✓ Crear incidencia si hay cambios de cliente

3. Ir a Calendario
   ✓ Ver cronograma de proyectos
   ✓ Planificación general
```

### 🟠 COMPRAS (purchasing1)
```
1. Ir a Proyectos
   ✓ Ver todos los proyectos pendientes
   ✓ Hacer clic en "Aprobar" o "Rechazar"
   ✓ Ver historial

2. Ir a Incidencias
   ✓ Revisar incidencias reportadas
   ✓ Aprobar reorden de materiales
   ✓ Autorizar costos adicionales

3. Ir a Productos
   ✓ Ver inventario
   ✓ Ver precios
```

### 🟢 INSTALADOR (installer1 / installer2)
```
1. Ir a Calendario
   ✓ Ver mis asignaciones
   ✓ Ver cronograma

2. Ir a Incidencias
   ✓ Reportar problemas encontrados
   ✓ Crear incidencias de daño o falta material
   ✓ Ver estado de mis reportes

3. Ir a Mi Panel (Installer Dashboard)
   ✓ Ver órdenes de trabajo
   ✓ Actualizar progreso
```

### 🔵 ADMIN (admin)
```
1. Ir a Proyectos
   ✓ Gestionar todos los proyectos
   ✓ Aprobar/Rechazar
   ✓ Cambiar estados

2. Ir a Incidencias
   ✓ Revisar todas las incidencias
   ✓ Aprobar incidencias reportadas
   ✓ Ver costos totales

3. Ir a Usuarios
   ✓ Ver todos los usuarios
   ✓ Ver roles asignados
   ✓ Crear nuevos usuarios

4. Ir a Administración
   ✓ Acceso a configuraciones del sistema
```

### 🔴 SUPER ADMIN (superadmin)
```
✅ Acceso TOTAL a todo el sistema
   • Ver/editar/eliminar cualquier dato
   • Gestionar otros admins
   • Control completo de roles
   • Acceso a todas las funciones
```

---

## 🗺️ Mapa del Sistema

```
📌 Dashboard (/)
   ├── 📋 Proyectos (/projects)
   │   ├── Ver lista
   │   ├── Crear nuevo
   │   ├── Ver detalles
   │   └── Aprobar/Rechazar
   │
   ├── 📄 Cotizaciones (/quotes)
   │   ├── Ver cotizaciones
   │   ├── Crear nueva
   │   └── Convertir a proyecto
   │
   ├── ⚠️ Incidencias (/incidents)
   │   ├── Ver todas
   │   ├── Crear incidencia
   │   ├── Aprobar/Rechazar
   │   └── Ver historial
   │
   ├── 📅 Calendario (/calendar)
   │   ├── Vista mensual
   │   ├── Vista semanal
   │   ├── Ver eventos
   │   └── Notifications
   │
   ├── 📦 Productos (/products)
   │   ├── Ver catálogo
   │   ├── Precios
   │   └── Categorías
   │
   ├── 👥 Usuarios (/users) [Solo Admin]
   │   ├── Listar usuarios
   │   ├── Crear usuario
   │   └── Ver roles
   │
   └── ⚙️ Administración (/admin) [Solo Admin]
       ├── Configuraciones
       ├── Reportes
       └── Logs
```

---

## 💡 Casos de Uso Reales

### Caso 1: Desde Cotización a Proyecto Completado

```
1️⃣ VENDEDOR crea cotización
   └─ Ir a /dashboard/quotes
   └─ Click "Nueva Cotización"
   └─ Llenar datos del cliente
   └─ Seleccionar productos
   └─ Click "Crear"

2️⃣ CLIENTE acepta cotización
   └─ Estado cambia a "Aceptada"

3️⃣ VENDEDOR convierte a proyecto
   └─ Click "Convertir a Proyecto"
   └─ Sistema crea INV-001

4️⃣ COMPRAS aprueba proyecto
   └─ Ir a /dashboard/projects
   └─ Ver proyecto pendiente
   └─ Click "Aprobar"
   └─ Estado: "Aprobado"

5️⃣ ADMIN inicia trabajo
   └─ Click "Iniciar Trabajo"
   └─ Estado: "En Progreso"

6️⃣ INSTALADOR reporta problema
   └─ Ir a /dashboard/incidents
   └─ Click "Nueva Incidencia"
   └─ Tipo: "Daño"
   └─ Describir problema
   └─ Click "Crear"

7️⃣ ADMIN aprueba incidencia
   └─ Ir a notificaciones
   └─ Ver incidencia nueva
   └─ Click "Aprobar"
   └─ Costo adicional autorizado

8️⃣ INSTALADOR completa trabajo
   └─ Ir a calendario
   └─ Marcar como completado
   └─ Proyecto finalizado ✓

9️⃣ FACTURACIÓN
   └─ Costo Original: $5,847.80
   └─ Costo Adicional: $389.00 (incidencia)
   └─ TOTAL: $6,236.80
```

### Caso 2: Cambio Solicitado por Cliente

```
1️⃣ PROYECTO en estado "Aprobado"
   └─ Cliente solicita cambio de material

2️⃣ VENDEDOR crea incidencia
   └─ Tipo: "Orden de Cambio"
   └─ Describe el nuevo material
   └─ Costo adicional: $1,875

3️⃣ COMPRAS aprueba
   └─ Revisa el costo
   └─ Click "Aprobar"

4️⃣ INSTALADOR ejecuta
   └─ Recibe notificación
   └─ Cambia material
   └─ Marca como completada

5️⃣ FACTURA actualizada
   └─ Incluye costo adicional
```

---

## 📈 Estadísticas Precargadas

```
📊 RESUMEN DEL SISTEMA:

👥 USUARIOS:           7 activos
💰 PROYECTOS:          5 total
   ✓ En Progreso:      1
   ✓ Aprobados:        1
   ✓ Completados:      1
   ✓ Rechazados:       1
   ✓ Pendientes:       1

💵 FINANZAS:
   • Ingresos totales:     $47,197.80
   • Costos adicionales:    $2,854.00
   • Ingresos TOTALES:     $50,051.80

📋 COTIZACIONES:       5 total
   ✓ Aceptadas:        2
   ✓ Enviadas:         1
   ✓ Rechazadas:       1
   ✓ Draft:            1
   • Tasa de cierre:    40%

⚠️ INCIDENCIAS:        5 total
   ✓ Completadas:      2
   ✓ En Progreso:      1
   ✓ Aprobadas:        1
   ✓ Pendientes:       1

📦 INVENTARIO:
   • Productos activos: 10
   • Categorías:        5
   • Stock total:       2,800+ unidades
```

---

## 🔗 Enlaces Directos

### Navegación Rápida
- Home: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Proyectos: http://localhost:3000/dashboard/projects
- Incidencias: http://localhost:3000/dashboard/incidents
- Calendario: http://localhost:3000/dashboard/calendar
- Cotizaciones: http://localhost:3000/dashboard/quotes
- Productos: http://localhost:3000/dashboard/products

### Base de Datos
- Prisma Studio: `npx prisma studio`
- PostgreSQL: `localhost:5433`

---

## 🛠️ Comandos Útiles

```bash
# Iniciar servidor
npm run dev

# Ver base de datos gráficamente
npx prisma studio

# Regenerar seed
npx tsx prisma/seed.ts

# Ver logs de Prisma
npm run dev -- --debug

# Conectar a PostgreSQL
psql postgresql://postgres:admin123@localhost:5433/rufin

# Detener contenedor PostgreSQL
docker stop rufin-postgres

# Reiniciar contenedor
docker start rufin-postgres
```

---

## ✅ Verificación Rápida

```
✓ Servidor corriendo en puerto 3000
✓ PostgreSQL corriendo en puerto 5433
✓ 7 usuarios precargados
✓ 5 proyectos con datos reales
✓ 5 incidencias para demostración
✓ Calendario con eventos
✓ Notificaciones activas
✓ Sistema 100% funcional
```

---

## 🎓 Tutorial Interactivo

### 5 minutos de demostración:

```
1. Login como vendor1
   └─ Ver cotizaciones creadas
   └─ Ver proyectos en progreso

2. Logout y login como purchasing1
   └─ Ir a proyectos
   └─ Ver proyecto pendiente
   └─ Click "Aprobar"
   └─ Ver cambio de estado

3. Logout y login como installer1
   └─ Ir a incidencias
   └─ Ver incidencias asignadas
   └─ Ver calendario de trabajo

4. Logout y login como admin
   └─ Ir a dashboard
   └─ Ver resumen general
   └─ Acceso a todas secciones

5. Logout y login como superadmin
   └─ Control total del sistema
```

---

## 📞 Información de Contacto en Sistema

Todos los clientes y contactos están precargados:

| Cliente | Correo | Teléfono |
|---------|--------|----------|
| Roberto Martínez | roberto.martinez@email.com | +57 300-123-4567 |
| Empresas SA | contacto@empresas.com | +57 300-987-6543 |
| Plaza Mayor S.A. | admin@plazamayor.com | +57 310-555-8888 |
| Hotel La Sombra | reservas@hotelsoombra.com | +57 320-444-1111 |
| Residencial Nuevo | ventas@residencialnuevo.com | +57 315-999-2222 |

---

## 🎉 ¡Listo para Usar!

El sistema está **100% completo y funcional** con:

✅ Base de datos PostgreSQL corriendo  
✅ Datos reales precargados  
✅ Todos los roles configurados  
✅ Proyectos en diferentes estados  
✅ Incidencias para demostración  
✅ Calendario sincronizado  
✅ Notificaciones activas  
✅ Historial completo  

**Solo inicia sesión y ¡comienza a explorar!**

---

**Sistema Rufin - Gestión de Proyectos v1.0** 🚀
