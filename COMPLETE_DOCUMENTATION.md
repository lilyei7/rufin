# 📚 DOCUMENTACIÓN COMPLETA - ESTRUCTURA Y LÓGICA DEL SISTEMA

## 📑 TABLA DE CONTENIDOS
1. [Arquitectura General](#arquitectura-general)
2. [Flujos de Datos](#flujos-de-datos)
3. [Módulos Principales](#módulos-principales)
4. [Lógica de Negocio](#lógica-de-negocio)
5. [Casos de Uso](#casos-de-uso)

---

## 🏗️ ARQUITECTURA GENERAL

### Stack Tecnológico
```
Frontend: Next.js 16 + TypeScript + React + Tailwind CSS
Backend: Next.js API Routes
Base de Datos: SQLite (file: dev.db)
Autenticación: JWT (tokens sin estado)
Seguridad: bcrypt (contraseñas), Crypto (tokens)
```

### Estructura de Carpetas
```
/app
  /api
    /categories/route.ts         → CRUD categorías
    /products/route.ts           → CRUD productos
    /projects/route.ts           → CRUD proyectos
    /incidents/route.ts          → CRUD incidentes
    /contracts/route.ts          → CRUD contratos
    /messages/route.ts           → CRUD mensajes
    /notifications/route.ts      → CRUD notificaciones
    /login/route.ts              → Autenticación
  /dashboard                     → Paneles privados (requieren login)
  /catalog                       → Catálogo público
  /admin                         → Panel de administración

/lib
  /auth.ts                       → Funciones de autenticación JWT

/prisma
  /schema.prisma                 → Definición de modelos
  /seed-complete.ts              → Script de seeding

/public
  /data.json                     → Datos base de categorías y productos
```

---

## 🔄 FLUJOS DE DATOS

### 1. FLUJO DE AUTENTICACIÓN

```
Usuario → POST /api/login
  ↓
Verificar credenciales (bcrypt)
  ↓
Generar JWT token (72 horas)
  ↓
Guardar en localStorage (cliente)
  ↓
Token incluido en headers: Authorization: Bearer <token>
  ↓
Middleware valida token en cada request
  ↓
User info extraída y disponible en contexto
```

**Archivos clave:**
- `/lib/auth.ts` - `getUserFromToken()` extrae el usuario del JWT
- `/app/api/login/route.ts` - Genera el token

**Credenciales de prueba:**
```
Admin: admin / admin123
Super Admin: superadmin / superadmin123
Vendor: jhayco / jhayco123
```

---

### 2. FLUJO DE PROYECTO (Cotización)

```
┌─────────────────────────────────────────┐
│ VENDOR: Crear Proyecto                  │
└─────────────────────────────────────────┘
         ↓
    POST /api/projects
         ↓
    Validar usuario (debe ser vendor)
         ↓
    Generar invoiceNumber único (INV-001)
         ↓
    Crear en DB con status: "draft"
         ↓
┌─────────────────────────────────────────┐
│ VENDOR: Agregar Items (Productos)       │
└─────────────────────────────────────────┘
         ↓
    POST /api/projects
    (con items array)
         ↓
    Para cada item:
    - Obtener producto de DB
    - Guardar cantidad y precio
    - Calcular subtotal
         ↓
┌─────────────────────────────────────────┐
│ VENDOR: Enviar para Aprobación         │
└─────────────────────────────────────────┘
         ↓
    PATCH /api/projects
    status: "pending_approval"
         ↓
    Crear ProjectHistory (registro)
    ↓
    Crear Notifications
    - Para todos los admins
    - Tipo: "project_pending_approval"
         ↓
┌─────────────────────────────────────────┐
│ ADMIN: Revisar y Aprobar                │
└─────────────────────────────────────────┘
         ↓
    PATCH /api/projects
    status: "approved"
    approvedById: admin.id
         ↓
    Crear ProjectHistory
    ↓
    Crear Notifications (para vendor)
    ↓
    Ahora se puede:
    - Asignar instalador
    - Generar contrato
         ↓
┌─────────────────────────────────────────┐
│ ADMIN: Asignar Instalador               │
└─────────────────────────────────────────┘
         ↓
    PATCH /api/projects
    assignedInstallerId: installer.id
    status: "assigned"
         ↓
    Crear Notifications (para installer)
    ↓
    Instalador ve en dashboard
         ↓
┌─────────────────────────────────────────┐
│ INSTALLER: Completar Proyecto           │
└─────────────────────────────────────────┘
         ↓
    PATCH /api/projects
    status: "completed"
    endDate: now()
         ↓
    Fin del flujo
```

**Estados válidos:**
- `draft` → `pending_approval` → `approved` → `assigned` → `completed`
- Cualquier estado → `rejected` (con reason)

---

### 3. FLUJO DE INCIDENTES (Disputas)

```
┌─────────────────────────────────────────┐
│ VENDOR/ADMIN: Reportar Incidente        │
└─────────────────────────────────────────┘
         ↓
    POST /api/incidents
    - projectId: requerido (proyecto existente)
    - type: quality, damage, delay, billing
    - priority: low, medium, high, critical
    - title, description
         ↓
    Crear incidentInvoiceNumber único
    Crear con status: "pending"
         ↓
┌─────────────────────────────────────────┐
│ ADMIN: Investigar Incidente             │
└─────────────────────────────────────────┘
         ↓
    PATCH /api/incidents
    status: "investigating"
    ↓
    Comunicación vía Messages
    - Intercambiar detalles
    - Adjuntar fotos/docs
         ↓
┌─────────────────────────────────────────┐
│ ADMIN: Resolver Incidente               │
└─────────────────────────────────────────┘
         ↓
    PATCH /api/incidents
    status: "resolved"
    approvedById: admin.id
    totalCost: cantidad aprobada
         ↓
    Si hay costo adicional:
    - Generar Contract (tipo: "incident")
    - Incluir costo total
         ↓
    Si no hay costo:
    status: "closed"
```

**Estados:** pending → investigating → resolved → closed

---

### 4. FLUJO DE CONTRATOS (Firma Digital)

```
┌─────────────────────────────────────────┐
│ ADMIN: Generar Contrato                 │
└─────────────────────────────────────────┘
         ↓
    POST /api/contracts
    - projectId O incidentId
    - type: "project" O "incident"
    - title, content, totalAmount
         ↓
    Generar contractNumber único (CONT-001)
    Generar signatureToken (UUID)
    Calcular expiresAt (7 días)
    status: "draft"
         ↓
┌─────────────────────────────────────────┐
│ ADMIN: Enviar para Firma                │
└─────────────────────────────────────────┘
         ↓
    PATCH /api/contracts
    status: "sent"
         ↓
    Generar link público:
    https://ejemplo.com/contract/[signatureToken]
    ↓
    Enviar a cliente (vía email/mensaje)
    Crear Notification: "contract_sent_for_signature"
         ↓
┌─────────────────────────────────────────┐
│ CLIENTE: Firmar Contrato (página pública)
└─────────────────────────────────────────┘
         ↓
    GET /contract/[signatureToken]
    - No requiere login
    - Mostrar detalles del contrato
    - Canvas para capturar firma
    ↓
    POST /api/contracts/sign
    - token: signatureToken
    - signatureData: base64 del canvas
    ↓
    Validar:
    - Token existe
    - Token no expirado
    - Contrato aún en estado "sent"
    ↓
    Guardar:
    - signatureData (base64)
    - isSigned: true
    - signedAt: now()
    - status: "signed"
         ↓
┌─────────────────────────────────────────┐
│ ADMIN: Descargar Contrato Firmado (PDF) │
└─────────────────────────────────────────┘
         ↓
    GET /api/contracts/[id]/download-pdf
    - Generar PDF con firma
    - Incluir detalles, firma, fecha
    - Descargar archivo
    ↓
    Archivo guardado en sistema
```

**Estados:** draft → sent → signed → expired/rejected

---

### 5. FLUJO DE MENSAJES

```
┌─────────────────────────────────────────┐
│ USUARIO A: Enviar Mensaje               │
└─────────────────────────────────────────┘
         ↓
    POST /api/messages
    - senderId: user.id
    - recipientId: otro usuario
    - subject, content
    - projectId / incidentId / contractId (contexto)
    - attachments: [] (opcional)
         ↓
    Guardar en DB
    Crear Notification para recipiente
    Notificación: "new_message_received"
         ↓
┌─────────────────────────────────────────┐
│ USUARIO B: Recibir y Responder          │
└─────────────────────────────────────────┘
         ↓
    GET /api/messages?userId=[id]
    - Filtrar mensajes recibidos
    - Mostrar conversaciones
    ↓
    PATCH /api/messages/[id]
    isRead: true
    ↓
    POST /api/messages (respuesta)
    - Mismo contexto (projectId, etc)
    - Nueva entrada en DB
```

---

### 6. FLUJO DE NOTIFICACIONES

```
Sistema automático genera notificaciones cuando:

✓ Proyecto enviado para aprobación
  → Notificación a todos los admins
  → Tipo: "project_pending_approval"

✓ Proyecto aprobado
  → Notificación al vendor
  → Tipo: "project_approved"

✓ Contrato enviado para firma
  → Notificación al cliente
  → Tipo: "contract_sent_for_signature"

✓ Contrato firmado
  → Notificación al admin/vendor
  → Tipo: "contract_signed"

✓ Incidente creado
  → Notificación a admins
  → Tipo: "incident_created"

✓ Mensaje nuevo
  → Notificación al recipiente
  → Tipo: "new_message"
```

---

## 🔌 MÓDULOS PRINCIPALES

### User Management
**Archivo:** `/app/api/login/route.ts`

```typescript
POST /api/login
{
  username: string
  password: string
}

Response:
{
  token: JWT,
  user: {
    id: number
    username: string
    name: string
    role: string
    email: string
  }
}
```

**Roles disponibles:**
- `admin` - Control total del sistema
- `super_admin` - Control total + configuración
- `vendor` - Crear proyectos y cotizaciones
- `installer` - Ver proyectos asignados
- `purchasing` - Gestionar compras

---

### Projects Module
**Archivo:** `/app/api/projects/route.ts`

```typescript
// Crear proyecto
POST /api/projects
{
  projectName: string
  clientName: string
  clientEmail: string (optional)
  items: [
    {
      productId: number
      quantity: number
      unitPrice: number
    }
  ]
  totalCost: number
}

// Listar proyectos
GET /api/projects
// Vendor ve solo sus proyectos
// Admin ve todos

// Actualizar proyecto
PATCH /api/projects
{
  id: number
  status: string (nuevo)
  comment: string (optional)
  assignedInstaller: string (optional)
}

// Eliminar proyecto
DELETE /api/projects/[id]
```

---

### Contracts Module
**Archivo:** `/app/api/contracts/route.ts`

```typescript
// Crear contrato
POST /api/contracts
{
  projectId: number (optional)
  incidentId: number (optional)
  type: "project" | "incident" | "service"
  title: string
  content: string
  totalAmount: number
  clientId: number (optional)
}

// Firmar contrato (público)
POST /api/contracts/sign
{
  token: string (signatureToken)
  signatureData: string (base64)
}

// Descargar PDF
GET /api/contracts/[id]/download-pdf

// Listar contratos
GET /api/contracts

// Actualizar contrato
PATCH /api/contracts/[id]
{
  status: string
  ...
}
```

---

### Incidents Module
**Archivo:** `/app/api/incidents/route.ts`

```typescript
// Crear incidente
POST /api/incidents
{
  projectId: number (requerido)
  title: string
  description: string
  type: "quality" | "damage" | "delay" | "billing" | "other"
  priority: "low" | "medium" | "high" | "critical"
  totalCost: number (optional)
}

// Listar incidentes
GET /api/incidents
// Filtros por projectId, status, priority

// Actualizar incidente
PATCH /api/incidents/[id]
{
  status: string
  totalCost: number
  comment: string
}
```

---

### Messages Module
**Archivo:** `/app/api/messages/route.ts`

```typescript
// Enviar mensaje
POST /api/messages
{
  senderId: number
  recipientId: number
  subject: string
  content: string
  projectId: number (optional)
  incidentId: number (optional)
  contractId: number (optional)
  attachments: string[] (optional)
}

// Listar mensajes
GET /api/messages?userId=[id]

// Marcar como leído
PATCH /api/messages/[id]
{
  isRead: true
}
```

---

### Notifications Module
**Archivo:** `/app/api/notifications/route.ts`

```typescript
// Listar notificaciones
GET /api/notifications?userId=[id]

// Marcar como leída
PATCH /api/notifications/[id]
{
  isRead: true
}

// Tipos de notificaciones:
- project_pending_approval
- project_approved
- project_rejected
- contract_sent_for_signature
- contract_signed
- incident_created
- incident_resolved
- new_message
```

---

## 🎯 LÓGICA DE NEGOCIO

### 1. Generación de Números Únicos

**Proyectos:** `INV-001`, `INV-002`, etc.
```typescript
// Obtener último número
const lastProject = await prisma.project.findFirst({
  orderBy: { invoiceNumber: 'desc' }
});
const nextNumber = extractNumber(lastProject.invoiceNumber) + 1;
const newInvoiceNumber = `INV-${padZeros(nextNumber, 3)}`;
```

**Contratos:** `CONT-001`, `CONT-002`, etc.
```typescript
// Mismo patrón que proyectos
const contractNumber = `CONT-${padZeros(nextNumber, 3)}`;
```

**Incidentes:** `INC-001`, `INC-002`, etc.

---

### 2. Validaciones de Estado

**Proyecto puede cambiar a "approved" solo si:**
- Usuario es admin/super_admin
- Status actual es "pending_approval"

**Contrato puede ir a "signed" solo si:**
- Token no expirado
- Status actual es "sent"
- SignatureData es válido (base64)

**Incidente puede ir a "closed" solo si:**
- Status es "resolved" O "investigating"
- Admin lo aprobó

---

### 3. Tokens Temporales

```typescript
// Generar token de firma
const signatureToken = crypto.randomUUID();
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

// Al firmar, validar
if (contract.expiresAt < new Date()) {
  throw new Error('Contract signature expired');
}
```

---

### 4. Cascadas de Eliminación

```
Si se borra un Proyecto:
  → Se borran sus ProjectItems
  → Se borran sus ProjectHistory
  → Se borran sus Incidents (REST: error si existen)
  → Se borran sus Contracts
  → Se borran sus Messages

Si se borra un Incidente:
  → Se borran sus IncidentItems
  → Se borran sus IncidentHistory
  → Se borran sus Messages

Si se borra un Usuario:
  → Sus Notifications se borran
  → Sus Messages (enviados y recibidos) se borran
```

---

## 💼 CASOS DE USO

### Caso 1: Vendor crea una cotización

```
1. Vendor login → /dashboard/quotes
2. Click "Crear Cotización"
3. Llenar:
   - Nombre del proyecto
   - Nombre del cliente
   - Seleccionar productos
   - Cantidad de cada uno
   - Sistema calcula total
4. Click "Guardar Borrador"
   → POST /api/projects
   → Guardado con status: "draft"
5. Luego "Enviar para Aprobación"
   → PATCH /api/projects
   → status: "pending_approval"
   → Admin recibe notificación
```

---

### Caso 2: Admin aprueba proyecto y genera contrato

```
1. Admin login → /dashboard
2. Ve notificación: "Nuevo proyecto pendiente"
3. Click en notificación
4. Revisa detalles del proyecto
5. Click "Aprobar"
   → PATCH /api/projects
   → status: "approved"
   → Vendor notificado
6. Click "Generar Contrato"
   → POST /api/contracts
   → Se crea con status: "draft"
7. Revisa contenido del contrato
8. Click "Enviar para Firma"
   → PATCH /api/contracts
   → status: "sent"
   → Link generado: /contract/[token]
9. Copia link y envía a cliente
```

---

### Caso 3: Cliente firma contrato (sin login)

```
1. Cliente recibe link: https://ejemplo.com/contract/abc123def
2. Click en link
3. Página pública (sin login):
   - Muestra detalles del contrato
   - Botón "Firmar"
4. Click "Firmar"
5. Se abre canvas para dibujar firma
6. Cliente dibuja su firma
7. Click "Confirmar Firma"
   → POST /api/contracts/sign
   → {token: "abc123def", signatureData: "base64..."}
   → Guardado en DB
   → isSigned = true
8. Mensaje: "Contrato firmado exitosamente"
9. PDF generado automáticamente
10. Admin notificado: "Contrato firmado por cliente"
```

---

### Caso 4: Vendor reporta incidente

```
1. Vendor en proyecto aprobado
2. Durante instalación detecta problema
3. Click "Reportar Incidente"
4. Llenar:
   - Título: "Techo dañado por lluvia"
   - Descripción: "Se filtra agua en la esquina sureste"
   - Tipo: "damage"
   - Prioridad: "high"
   - Costo estimado: $500
5. Click "Reportar"
   → POST /api/incidents
   → Admin recibe notificación urgente
6. Admin revisa y abre investigación
7. Intercambian mensajes sobre el daño
8. Admin aprueba reembolso de $450
9. Se genera contrato adicional por ese monto
10. Cliente firma contrato adicional
11. Incidente marcado como "resuelto"
```

---

### Caso 5: Comunicación entre usuarios

```
1. Vendor tiene preguntas sobre su proyecto
2. Click en proyecto → "Enviar Mensaje"
3. Selecciona Admin como recipiente
4. Escribe mensaje: "¿Puedo cambiar los materiales?"
   → POST /api/messages
   → Admin recibe notificación
5. Admin abre dashboard
6. Ve mensaje sin leer
7. Click para leer
   → PATCH /api/messages (isRead: true)
8. Click "Responder"
9. Escribe: "Sí, pero el costo aumentará en $200"
10. Vendor recibe notificación
11. Se intercambian múltiples mensajes
12. Conversación completa disponible en historial del proyecto
```

---

## 🔐 VALIDACIONES CLAVE

| Acción | Validación |
|--------|-----------|
| Crear Proyecto | Usuario debe ser vendor |
| Aprobar Proyecto | Usuario debe ser admin/super_admin |
| Asignar Instalador | Proyecto debe estar aprobado |
| Firmar Contrato | Token no expirado + status = "sent" |
| Crear Incidente | Proyecto debe existir |
| Ver Proyecto | Vendor solo ve suyos; admin ve todos |
| Borrar Proyecto | No si tiene incidentes (RESTRICT) |
| Cambiar Status | Solo si transición válida |

---

## 📊 FLUJO VISUAL RESUMIDO

```
VENDOR                          ADMIN                    CLIENTE
  │                              │                          │
  ├─→ Crear Proyecto             │                          │
  │     (draft)                   │                          │
  │                               │                          │
  ├─→ Enviar para Aprobación      │                          │
  │     (pending_approval)  ──→   │                          │
  │                          ┌─→ Revisar                     │
  │                          │    Aprobar                     │
  │                          │    (approved)                  │
  │ ←───────────────────────┘     │                          │
  │ Notificación:                │                          │
  │ "Proyecto Aprobado"          │                          │
  │                               │                          │
  │                          ┌─→ Generar Contrato           │
  │                          │    (draft)                    │
  │                          │    Enviar para Firma          │
  │                          │    (sent)                     │
  │                               ├─→ Link: /contract/[token]
  │                               │    ──→ EMAIL A CLIENTE ──→
  │                                                          ├─→ Abre Link
  │                                                          │    (sin login)
  │                                                          │    Dibuja Firma
  │                                                          │    Confirma
  │                                                          │    (signed)
  │                                                          │
  │                          ←─── NOTIFICACIÓN: "Contrato ─┘
  │                          │    Firmado"
  │                          │
  │                          ├─→ Descargar PDF
  │                          │    Contrato firmado
  │                          │
  └─────────────────────────────────→ Fin del Flujo
```

---

## 🎓 RESUMEN

El sistema implementa un flujo completo de:
1. **Autenticación** con JWT
2. **Gestión de Proyectos** desde creación hasta completación
3. **Sistema de Incidentes** para disputas
4. **Contratos Digitales** con firma electrónica
5. **Mensajería** entre usuarios
6. **Notificaciones** automáticas

Todo está conectado en la **base de datos SQLite** con relaciones correctas y validaciones en cada paso.
