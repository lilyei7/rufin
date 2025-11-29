# 🏗️ Diagrama de Arquitectura y Flujos

## 🗂️ Estructura de Directorios

```
rufin/
├── app/
│   ├── api/
│   │   ├── login/              # 🔐 Autenticación usuarios
│   │   ├── projects/           # 📊 CRUD Proyectos
│   │   ├── incidents/          # 🚨 CRUD Incidencias
│   │   ├── categories/         # 📂 Categorías de productos
│   │   ├── products/           # 📦 Productos
│   │   ├── contracts/          # 📄 Contratos
│   │   ├── portal/
│   │   │   ├── auth/           # 🔐 Login portal clientes
│   │   │   └── contracts/      # 📄 Ver contratos en portal
│   │   └── ...
│   │
│   ├── dashboard/
│   │   ├── layout.tsx          # Layout del dashboard
│   │   ├── page.tsx            # Página inicial
│   │   ├── projects/
│   │   │   └── page.tsx        # 📊 LISTA PROYECTOS CON INCIDENCIAS
│   │   ├── incidents/
│   │   │   ├── page.tsx        # 🚨 LISTA CON FILTRADO
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # ➕ CREAR INCIDENCIA
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 🔍 DETALLES INCIDENCIA
│   │   ├── contracts/          # 📄 Gestión contratos
│   │   ├── categories/         # 📂 Gestión categorías
│   │   └── ...
│   │
│   ├── portal/                 # 🔐 PORTAL DE CLIENTES
│   │   ├── page.tsx            # Login y dashb cliente
│   │   └── ...
│   │
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Layout raíz
│   └── page.tsx                # Página inicio
│
├── lib/
│   └── auth.ts                 # 🔐 Funciones autenticación
│
├── prisma/
│   ├── schema.prisma           # 📋 Modelos de datos (18 entidades)
│   └── seed-contracts.js       # 🌱 Seed datos
│
├── public/
│   └── data.json               # Datos estáticos
│
└── Archivos documentación:
    ├── SYSTEM_DOCUMENTATION.md # 📚 Documentación completa
    ├── USE_CASES.md            # 📖 10 Casos de uso
    ├── QUICK_REFERENCE.md      # ⚡ Guía rápida
    ├── COMPLETION_REPORT.md    # ✅ Reporte de finalización
    └── ARCHITECTURE.md         # 🏗️ Este archivo
```

---

## 📊 Diagrama de Flujos Principales

### Flujo 1: Dashboard Principal
```
┌──────────────────────┐
│  /dashboard          │
│  Dashboard Principal │
└──────┬───────────────┘
       │
       ├─→ [Proyectos]     ─→ /dashboard/projects
       ├─→ [Incidencias]   ─→ /dashboard/incidents
       ├─→ [Contratos]     ─→ /dashboard/contracts
       └─→ [Categorías]    ─→ /dashboard/categories
```

### Flujo 2: Proyectos e Incidencias
```
┌─────────────────────────────┐
│ /dashboard/projects         │
│ Lista de Proyectos          │
│ + Preview de Incidencias    │
└──────────┬──────────────────┘
           │
           ├─→ [Ver Detalles]
           │   └─→ Modal: Info proyecto + todas las incidencias
           │
           ├─→ [Nueva Incidencia] ✨
           │   └─→ /dashboard/incidents/new?projectId=X
           │       └─→ Proyecto PRE-SELECCIONADO
           │
           └─→ [Ver Incidencias] ✨
               └─→ /dashboard/incidents?projectId=X
                   └─→ Filtrada por proyecto automáticamente
```

### Flujo 3: Búsqueda y Filtrado de Incidencias
```
┌─────────────────────────────┐
│ /dashboard/incidents        │
│ Todas las Incidencias       │
│ O Filtradas por Proyecto    │
└──────────┬──────────────────┘
           │
    ┌──────┴──────────────────────────────────┐
    │ FILTROS DISPONIBLES (4 independientes)  │
    ├─ Búsqueda Texto (título/número/desc)   │
    ├─ Estado (pending|approved|...)         │
    ├─ Tipo (change_order|special|...)       │
    ├─ Prioridad (critical|high|...)         │
    └─ Botón "Limpiar filtros"               │
           │
           ├─→ Resultados filtrados
           │   └─→ Click incidencia
           │       └─→ /dashboard/incidents/[id]
           │           └─→ Detalles + Cambiar estado
           │
           └─→ Botón [Nueva Incidencia]
               └─→ /dashboard/incidents/new
                   └─→ Sin proyecto pre-seleccionado
```

---

## 🔄 Mapeo de URLs

```
INICIO
  └─ http://localhost:3000/

LOGIN
  └─ http://localhost:3000/ (redirect si no autenticado)

DASHBOARD
  ├─ /dashboard                           # Principal
  │
  ├─ PROYECTOS
  │ ├─ /dashboard/projects                # Lista con incidencias
  │ └─ /dashboard/projects/[id]           # Detalles (modal)
  │
  ├─ INCIDENCIAS
  │ ├─ /dashboard/incidents               # Lista global
  │ ├─ /dashboard/incidents?projectId=X   # Filtrada por proyecto
  │ ├─ /dashboard/incidents/new           # Crear (sin proyecto)
  │ ├─ /dashboard/incidents/new?projectId=X  # Crear (con proyecto)
  │ └─ /dashboard/incidents/[id]          # Detalles
  │
  ├─ CONTRATOS
  │ ├─ /dashboard/contracts               # Lista
  │ ├─ /dashboard/contracts/new           # Crear
  │ └─ /dashboard/contracts/[id]          # Detalles
  │
  ├─ CATEGORÍAS
  │ └─ /dashboard/categories              # Gestión
  │
  └─ ADMIN
    └─ /admin                             # Panel admin

PORTAL CLIENTE
  ├─ /portal                              # Login cliente
  ├─ /portal/dashboard                    # Dashboard cliente
  ├─ /portal/contracts                    # Ver contratos
  └─ /portal/projects                     # Ver proyectos
```

---

## 📡 API Endpoints

### Autenticación
```
POST /api/login
  ├─ Body: { email, password }
  └─ Response: { token, user }

POST /api/portal/login
  ├─ Body: { accessCode }
  └─ Response: { token, client }
```

### Proyectos
```
GET  /api/projects                    # Obtener todos
POST /api/projects                    # Crear nuevo
GET  /api/projects/:id                # Detalles
PATCH /api/projects/:id               # Actualizar
```

### Incidencias
```
GET  /api/incidents                   # Obtener todas
GET  /api/incidents?projectId=X       # Filtrar por proyecto
POST /api/incidents                   # Crear nueva
GET  /api/incidents/:id               # Detalles
PATCH /api/incidents/:id              # Actualizar estado
```

### Contratos
```
GET  /api/contracts                   # Obtener todos
POST /api/contracts                   # Crear nuevo
GET  /api/contracts/:id               # Detalles
POST /api/contracts/:id/sign          # Firmar
```

---

## 🗄️ Base de Datos - Modelos Principales

```
18 MODELOS TOTALES:

CORE ENTITIES
├─ User (5,000 usuarios seed)
│  └─ Roles: super_admin, admin, vendor, purchasing, installer
│
├─ Project (2 proyectos seed)
│  ├─ Relación: Client
│  ├─ Items: ProductItem
│  └─ Historia: ProjectHistory
│
├─ Incident (2 incidencias seed, 6 tipos posibles) ✨
│  ├─ Tipos: change_order, extra_work, damage, material_shortage, special, other
│  ├─ Estados: pending, approved, rejected, in_progress, completed
│  ├─ Prioridades: low, medium, high, critical
│  ├─ Relación: Project
│  ├─ Items: IncidentItem
│  └─ Historia: IncidentHistory
│
└─ Contract (2 contratos seed)
   ├─ Estados: draft, pending_signature, signed, executed, rejected
   ├─ Firmas: ContractSignature
   └─ Historia: ContractHistory

SOPORTE
├─ Category (5 categorías seed)
├─ Product (10 productos seed)
├─ Client (3 clientes seed)
├─ Quote (2 quotes seed)
├─ Template
├─ TermsAndConditions
├─ Notification
└─ CommunicationLog
```

---

## 🎨 Componentes Principales

### Proyecto Card Component
```jsx
<ProjectCard>
  <Info: nombre, factura, cliente, costo>
  <IncidenceList: primeras 5 + contador>
  <Buttons: Ver Detalles, Nueva, Ver Incidencias>
</ProjectCard>
```

### Incident Card Component
```jsx
<IncidentCard>
  <Info: título, número>
  <Badges: prioridad (color), estado (color)>
  <Link: a detalles>
</IncidentCard>
```

### Filter Panel Component
```jsx
<FilterPanel>
  <SearchInput: busca en 3 campos>
  <SelectStatus: 5 opciones>
  <SelectType: 6 opciones>
  <SelectPriority: 4 opciones>
  <Button: Limpiar filtros>
  <ResultCounter>
</FilterPanel>
```

### Modal Component
```jsx
<Modal: Detalles Proyecto>
  <Info: completa del proyecto>
  <IncidenceList: todas las incidencias>
  <Buttons: Cerrar, Editar, Nueva>
</Modal>
```

---

## 🔐 Autenticación y Autorización

```
SISTEMA DUAL DE TOKENS JWT

USUARIOS INTERNOS
├─ Token válido: 24 horas
├─ Almacenamiento: localStorage
├─ Roles: super_admin, admin, vendor, purchasing, installer
├─ Acceso: Dashboard completo
└─ Rutas: /dashboard/*

CLIENTES EXTERNOS (Portal)
├─ Token válido: 7 días
├─ Almacenamiento: localStorage (en portal)
├─ Autenticación: AccessCode
├─ Acceso: Solo sus proyectos y contratos
└─ Rutas: /portal/*
```

---

## 🎯 Flujos de Datos

### Crear Incidencia desde Proyecto
```
1. Usuario en: /dashboard/projects
2. Click "Nueva Incidencia"
3. Navega a: /dashboard/incidents/new?projectId=X
4. Hook useSearchParams captura: projectId=X
5. Form pre-selecciona proyecto: projectId="X"
6. Usuario completa otros campos
7. Submit → POST /api/incidents
8. Incidencia creada con projectId asociado
9. Redirecciona a: /dashboard/incidents
```

### Filtrar Incidencias por Proyecto
```
1. Usuario en: /dashboard/projects
2. Click "Ver Incidencias"
3. Naveja a: /dashboard/incidents?projectId=X
4. Hook useSearchParams captura: projectId=X
5. Badge azul muestra: "Filtrado por Proyecto #X"
6. Fetch: /api/incidents?projectId=X
7. Solo muestra incidencias del proyecto
8. Puede aplicar filtros adicionales
9. Botón atrás vuelve a /dashboard/projects
```

### Búsqueda Multi-Dimensional
```
1. Usuario en: /dashboard/incidents
2. Ingresa texto en búsqueda
3. Selecciona Estado (opcional)
4. Selecciona Tipo (opcional)
5. Selecciona Prioridad (opcional)
6. Estado del componente actualizado:
   - searchQuery = "texto"
   - filterStatus = "pending"
   - filterType = "special"
   - filterPriority = "high"
7. filteredIncidents = incidents.filter(4 condiciones)
8. Resultados se muestran automáticamente
9. Contador actualizado
10. Click "Limpiar filtros" resetea todo
```

---

## 🌍 Ciclo de Vida de Una Incidencia

```
CREACIÓN
  │
  ├─ Usuario en /dashboard/projects O /dashboard/incidents/new
  ├─ Click "Nueva Incidencia" O formulario
  ├─ Completa formulario
  ├─ POST /api/incidents
  └─ Status: "pending" (default)

APROBACIÓN
  │
  ├─ Usuario ve incidencia en /dashboard/incidents
  ├─ Click en incidencia → /dashboard/incidents/[id]
  ├─ Cambiar estado a "approved"
  ├─ PATCH /api/incidents/[id]
  └─ Registra en historial + notificación

EN PROGRESO
  │
  ├─ Cambiar estado a "in_progress"
  ├─ PATCH /api/incidents/[id]
  └─ Indica que se está resolviendo

COMPLETADA
  │
  ├─ Cambiar estado a "completed"
  ├─ PATCH /api/incidents/[id]
  └─ Resolución finalizada

RECHAZADA (alternativa)
  │
  ├─ Cambiar estado a "rejected"
  ├─ PATCH /api/incidents/[id]
  └─ Se descarta la incidencia
```

---

## 📈 Performance y Escalabilidad

```
OPTIMIZACIONES IMPLEMENTADAS
├─ Componentes funcionales con Hooks
├─ Estado local en lugar de global (props)
├─ Fetch eficiente con token JWT
├─ Filtrado en cliente (no en BD)
├─ Color-coding en CSS (no computado)
├─ Lazy loading de imágenes
└─ Responsive design

CAPACIDAD DE ESCALADO
├─ PostgreSQL soporta millones de registros
├─ Prisma ORM optimizado
├─ Next.js con Turbopack acelera builds
├─ JWT stateless (sin sesiones)
├─ API REST sin dependencias pesadas
└─ BD indexada en campos comunes
```

---

## 🚀 Deployment

```
AMBIENTE LOCAL (Desarrollo)
├─ Node: v18+
├─ PostgreSQL: 16 (puerto 5433)
├─ Next.js: npm run dev (puerto 3000)
└─ Base de datos: rufin_db

AMBIENTE PRODUCCIÓN (Recomendado)
├─ Usar npm run build
├─ Usar npm run start
├─ Configurar variables de ambiente
├─ Usar BD PostgreSQL en servidor dedicado
├─ Habilitar HTTPS
└─ Configurar CORS apropiadamente
```

---

## 📚 Documentación Adicional

| Archivo | Contenido |
|---------|----------|
| `SYSTEM_DOCUMENTATION.md` | Documentación completa del sistema |
| `USE_CASES.md` | 10 casos de uso detallados con ejemplos |
| `QUICK_REFERENCE.md` | Guía rápida de referencia |
| `COMPLETION_REPORT.md` | Reporte de trabajo completado |
| `ARCHITECTURE.md` | Este archivo - Diagramas y flujos |

---

**Ultima actualización**: 2024
**Versión**: 1.0.0
**Estado**: ✅ Production Ready

