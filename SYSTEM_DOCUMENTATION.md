# 📋 Sistema Integral de Gestión de Contratos e Incidencias

## 🎯 Descripción General

Este sistema es una plataforma completa para la gestión de:
- **Contratos digitales** con firmas electrónicas
- **Incidencias** (órdenes de cambio, trabajo extra, daños, etc.)
- **Proyectos** con seguimiento completo
- **Portal para clientes** con acceso a contratos
- **Autenticación dual**: usuarios internos y clientes externos

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 16.0.3 con React 18 y TypeScript
- **Backend**: API REST integrada en Next.js
- **Base de Datos**: PostgreSQL 16 (puerto 5433)
- **ORM**: Prisma 5.22.0
- **UI**: Tailwind CSS + Lucide React icons
- **Autenticación**: JWT dual (usuarios 24h, clientes 7d)

### Estructura de Carpetas
```
app/
├── globals.css                 # Estilos globales
├── layout.tsx                  # Layout principal
├── page.tsx                    # Página de inicio
├── admin/                      # Panel administrativo
│   └── page.tsx
├── api/                        # Rutas API
│   ├── categories/
│   ├── login/
│   ├── projects/
│   ├── incidents/
│   ├── contracts/
│   └── ...
├── catalog/                    # Catálogo de productos
│   └── page.tsx
├── categories/                 # Gestión de categorías
│   └── page.tsx
├── dashboard/                  # Dashboard principal
│   ├── layout.tsx
│   ├── page.tsx
│   ├── projects/              # 📊 GESTIÓN DE PROYECTOS
│   ├── incidents/             # 🚨 GESTIÓN DE INCIDENCIAS
│   ├── contracts/             # 📄 GESTIÓN DE CONTRATOS
│   └── ...
└── portal/                     # 🔐 PORTAL DE CLIENTES
    ├── layout.tsx
    └── page.tsx

lib/
└── auth.ts                     # Funciones de autenticación

prisma/
├── schema.prisma               # Modelos de datos
└── seed-contracts.js           # Seed de datos

public/
└── data.json                   # Datos estáticos
```

---

## 📊 Modelos de Datos (Prisma Schema)

### 18 Entidades Principales

#### 1. **User** (5,000 creados en seed)
- Roles: `super_admin`, `admin`, `vendor`, `purchasing`, `installer`
- Autenticación interna con JWT (24h)

#### 2. **Category** (5 creadas)
- Categorías de productos (Paneles, Inversores, Estructura, Accesorios, Baterías)

#### 3. **Product** (10 creadas)
- Productos con unitPrice y unitType

#### 4. **Client** (3 creados)
- Clientes con accessCode para portal
- Autenticación externa con JWT (7d)

#### 5. **Quote** (2 creadas)
- Cotizaciones con items y historial
- Estados: `sent`, `accepted`, `rejected`, `draft`

#### 6. **Project** (2 creados)
- Proyectos con items y historial
- Estados: `draft`, `pending_approval`, `approved`, `in_progress`, `completed`, `rejected`
- Relación con Client
- Rastreo de costos y fechas

#### 7. **Incident** ⭐ (2 creados + capacidad de 6 tipos)
- **Tipos disponibles**: 
  - `change_order` - Orden de Cambio
  - `extra_work` - Trabajo Extra
  - `damage` - Daño
  - `material_shortage` - Falta de Material
  - `special` ✨ - Incidencias especiales o excepcionales (NUEVO)
  - `other` - Otro
- **Estados**: `pending`, `approved`, `rejected`, `in_progress`, `completed`
- **Prioridades**: `low`, `medium`, `high`, `critical`
- Vinculadas a Proyectos
- Items y historial de cambios

#### 8. **Contract** (2 creados)
- Contratos digitales con firma electrónica
- Estados: `draft`, `pending_signature`, `signed`, `executed`, `rejected`
- Campos de firma con metadata

#### 9-18. Entidades Complementarias
- `Template` - Plantillas de contrato
- `TermsAndConditions` - Términos y condiciones
- `ContractSignature` - Registro de firmas
- `Notification` - Notificaciones del sistema
- `CommunicationLog` - Registro de comunicaciones
- Y más...

---

## 🔑 Credenciales de Acceso (Seed Data)

### Usuarios Internos
```
Email: superadmin@example.com | Contraseña: password123
Email: admin@example.com      | Contraseña: password123
Email: vendor@example.com     | Contraseña: password123
Email: purchasing@example.com | Contraseña: password123
Email: installer@example.com  | Contraseña: password123
```

### Clientes Externos (Portal)
```
Access Code: CLIENT001 | Nombre: Cliente ABC Corp
Access Code: CLIENT002 | Nombre: Cliente XYZ Inc
Access Code: CLIENT003 | Nombre: Cliente 123 Ltd
```

---

## 🚀 Cómo Usar el Sistema

### 1️⃣ **Iniciar el Servidor**
```bash
cd /home/gordon/Escritorio/rufin
npm run dev
```
- Servidor inicia en `http://localhost:3000`
- Base de datos en `postgresql://localhost:5433`

### 2️⃣ **Ingresar al Dashboard Principal**
```
URL: http://localhost:3000/dashboard
Login: superadmin@example.com | password123
```

### 3️⃣ **Gestionar Proyectos** 📊

**Acceso**: `/dashboard/projects`

**Características**:
- ✅ Ver todos los proyectos con detalles
- ✅ Mostrar incidencias asociadas a cada proyecto
- ✅ Crear nueva incidencia desde proyecto (botón "Nueva Incidencia")
- ✅ Ver todas las incidencias del proyecto (botón "Ver Incidencias")
- ✅ Ver detalles completos en modal (botón "Ver Detalles")
- ✅ Filtrar por estado del proyecto
- ✅ Mostrar contador de incidencias por proyecto
- ✅ Color-coding por prioridad y estado de incidencias

**Flujo**:
1. Ve la lista de proyectos con resumen visual
2. Cada proyecto muestra:
   - Nombre, número de factura, cliente
   - Costo total, fechas, creador
   - Número total de incidencias
   - Primeras 5 incidencias con prioridad/estado color-coded
3. Botones de acción por proyecto:
   - **Ver Detalles** → Modal con info completa
   - **Nueva Incidencia** → Abre formulario pre-seleccionado
   - **Ver Incidencias** → Filtra la lista completa por proyecto

### 4️⃣ **Gestionar Incidencias** 🚨

#### 4a. Ver y Filtrar Incidencias
**Acceso**: `/dashboard/incidents`

**Filtros disponibles**:
- 🔍 **Búsqueda de texto** - Busca en título, número, descripción
- 📌 **Por Estado** - pending, approved, in_progress, completed, rejected
- 🏷️ **Por Tipo** - change_order, extra_work, damage, material_shortage, special, other
- ⚡ **Por Prioridad** - critical, high, medium, low

**Características**:
- ✅ 4 filtros independientes que trabajan juntos
- ✅ Resultados dinámicos en tiempo real
- ✅ Botón "Limpiar filtros" para resetear
- ✅ Contador de resultados
- ✅ Color-coding visual para prioridades y estados
- ✅ Links a detalles de cada incidencia

#### 4b. Filtrar por Proyecto
**Acceso**: `/dashboard/incidents?projectId=X`

Cuando se accede desde la página de proyectos con "Ver Incidencias":
- ✅ Muestra solo incidencias del proyecto
- ✅ Badge azul indicando filtrado por proyecto
- ✅ Botón "atrás" para volver a proyectos

#### 4c. Crear Nueva Incidencia
**Acceso**: `/dashboard/incidents/new` o desde proyecto

**Campos del formulario**:
- ✅ **Proyecto** (requerido) - Selector desplegable
- ✅ **Título** (requerido) - Nombre descriptivo
- ✅ **Descripción** - Detalles de la incidencia
- ✅ **Tipo** (requerido) - 6 opciones incluyendo "Especial"
- ✅ **Prioridad** - critical, high, medium, low
- ✅ **Costo Adicional** - Cantidad en MXN

**Tipos de incidencia disponibles**:
- `change_order` - Orden de Cambio
- `extra_work` - Trabajo Extra  
- `damage` - Daño
- `material_shortage` - Falta de Material
- `special` - Incidencias especiales o situaciones excepcionales ✨ NUEVO
- `other` - Otro

#### 4d. Ver Detalles de Incidencia
**Acceso**: `/dashboard/incidents/[id]`

**Muestra**:
- ✅ Información completa de la incidencia
- ✅ Tipo con icono y color
- ✅ Estado actual con color-coding
- ✅ Items asociados
- ✅ Costo total
- ✅ Historial de cambios
- ✅ Usuarios que realizaron cambios

**Acciones disponibles**:
- ✅ Cambiar estado (pending → approved/in_progress/completed/rejected)
- ✅ Agregar comentarios
- ✅ Ver historial completo

### 5️⃣ **Portal para Clientes** 🔐

**Acceso**: `http://localhost:3000/portal`

**Autenticación**:
- Ingresar código de acceso (ej: `CLIENT001`)
- Válido por 7 días

**Funcionalidades**:
- ✅ Ver contratos del cliente
- ✅ Firmar contratos digitalmente
- ✅ Ver estado de proyectos
- ✅ Descargar documentos
- ✅ Historial de comunicaciones

### 6️⃣ **Gestionar Contratos** 📄

**Acceso**: `/dashboard/contracts`

**Características**:
- ✅ Ver todos los contratos
- ✅ Estados: draft, pending_signature, signed, executed, rejected
- ✅ Firmas electrónicas con metadata
- ✅ Registro completo de quien firmó y cuándo

---

## 🎨 Color Coding del Sistema

### Prioridades de Incidencia
- 🔴 **Crítica** - Rojo (#ff0000)
- 🟠 **Alta** - Naranja (#ff9000)
- 🟡 **Media** - Amarillo (#ffaa00)
- 🟢 **Baja** - Verde (#00aa00)

### Estados de Incidencia
- 🟡 **Pendiente** - Amarillo
- 🟢 **Aprobada** - Verde
- 🔴 **Rechazada** - Rojo
- 🔵 **En Progreso** - Azul
- 🟣 **Completada** - Púrpura

### Estados de Proyecto
- ⚪ **Draft** - Gris
- 🟡 **Pending Approval** - Amarillo
- 🟢 **Approved** - Verde
- 🔵 **In Progress** - Azul
- 🟣 **Completed** - Púrpura
- 🔴 **Rejected** - Rojo

---

## 📡 API Endpoints Principales

### Incidencias
```
GET    /api/incidents              # Obtener todas las incidencias
POST   /api/incidents              # Crear nueva incidencia
GET    /api/incidents?projectId=X  # Incidencias por proyecto
PATCH  /api/incidents/:id          # Actualizar incidencia
```

### Proyectos
```
GET    /api/projects               # Obtener todos los proyectos
POST   /api/projects               # Crear proyecto
GET    /api/projects/:id           # Detalles del proyecto
```

### Contratos
```
GET    /api/contracts              # Obtener contratos
POST   /api/contracts              # Crear contrato
POST   /api/contracts/:id/sign     # Firmar contrato
```

### Autenticación
```
POST   /api/login                  # Login usuarios internos
POST   /api/portal/login           # Login clientes (con accessCode)
```

---

## 🔄 Flujos de Trabajo Principales

### Flujo 1: Crear Incidencia desde Proyecto
```
1. Dashboard → Proyectos
2. Selecciona proyecto
3. Click "Nueva Incidencia"
4. Se abre formulario con proyecto pre-seleccionado
5. Completa: título, tipo, prioridad, descripción, costo
6. Submit → Se crea incidencia
7. Redirecciona a lista de incidencias
```

### Flujo 2: Ver Incidencias de un Proyecto
```
1. Dashboard → Proyectos
2. Selecciona proyecto
3. Click "Ver Incidencias"
4. Se filtra lista por projectId
5. Muestra solo incidencias del proyecto
6. Puede aplicar filtros adicionales (tipo, prioridad, estado)
```

### Flujo 3: Buscar Incidencia Específica
```
1. Dashboard → Incidencias
2. Ingresa texto en buscador
3. Selecciona estado (opcional)
4. Selecciona tipo (opcional)
5. Selecciona prioridad (opcional)
6. Resultados se actualizan en tiempo real
7. Click en incidencia → Ver detalles
```

### Flujo 4: Cambiar Estado de Incidencia
```
1. Dashboard → Incidencias
2. Click en una incidencia
3. Ver modal de detalles
4. Cambiar estado en selector
5. Agregar comentario (opcional)
6. Submit → Se actualiza historial
```

### Flujo 5: Cliente ve Contrato en Portal
```
1. Portal → Ingresar código (CLIENT001)
2. Se autentica
3. Ve contratos disponibles
4. Click contrato → Ver detalles
5. Option para firmar digitalmente
6. Vuelve a proyectos/incidencias del cliente
```

---

## 🐛 Troubleshooting

### "No se conecta a la base de datos"
```bash
# Verificar que PostgreSQL está corriendo
# Puerto: 5433
# Usuario: postgres | Contraseña: postgres
# Base de datos: rufin_db

# Reiniciar Prisma
npx prisma db push
```

### "No aparecen los datos seed"
```bash
# Ejecutar seed manualmente
node prisma/seed-contracts.js
```

### "Error 401 Unauthorized"
```bash
# Token JWT expirado
# Loguearse nuevamente
# Usuarios internos: 24 horas
# Clientes: 7 días
```

### "Puertos ocupados"
```bash
# Si el 3000 está ocupado, usar el 3001
npm run dev -- --port 3001
```

---

## 📈 Capacidades de Escalado

El sistema está diseñado para:
- ✅ Manejar múltiples proyectos simultáneamente
- ✅ Registrar hasta 6 tipos de incidencias
- ✅ Filtrar/buscar entre miles de registros
- ✅ Almacenar firmas electrónicas completas
- ✅ Mantener historial completo de cambios
- ✅ Soportar múltiples clientes con portal separado
- ✅ Escalar con PostgreSQL a nivel empresarial

---

## 🔐 Seguridad

- ✅ Autenticación JWT dual (usuarios e clientes)
- ✅ Contraseñas hasheadas en base de datos
- ✅ Access codes para clientes externos
- ✅ Historial de auditoría completo
- ✅ Roles y permisos (super_admin, admin, vendor, etc.)
- ✅ Datos sensibles protegidos
- ✅ CORS configurado

---

## 📞 Contacto y Soporte

Para reportar errores o sugerencias, contacta al equipo de desarrollo.

---

**Última actualización**: 2024
**Versión**: 1.0.0
**Estado**: ✅ Producción Ready

