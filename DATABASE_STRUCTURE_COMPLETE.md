# 📊 ESTRUCTURA COMPLETA DE BASE DE DATOS

## 🗂️ TODAS LAS TABLAS Y SUS RELACIONES

### 👤 **USERS** (Usuarios)
```sql
- id (PK, autoincrement)
- username (unique)
- password (bcrypt)
- name
- email
- role (admin, super_admin, vendor, installer, purchasing)
- active (boolean)
- createdAt, updatedAt
```
**Relaciones:**
- ↔ Projects (createdProjects, approvedProjects, assignedProjects)
- ↔ Incidents (createdIncidents)
- ↔ Contracts (createdContracts, clientContracts, vendorContracts, installerContracts)
- ↔ Notifications
- ↔ Messages (sentMessages, receivedMessages)

---

### 📁 **CATEGORIES** (Categorías)
```sql
- id (PK)
- name (unique)
- description
- type (main, sub)
- parentCategoryId (FK → categories)
- createdAt, updatedAt
```
**Relaciones:**
- ← Products

---

### 📦 **PRODUCTS** (Productos)
```sql
- id (PK)
- name
- categoryId (FK → categories)
- unitPrice
- unitType (bundle, unit, ft, coil, box, roll, sheet, etc)
- usage
- notes
- active (boolean)
- createdAt, updatedAt
```
**Relaciones:**
- → Category
- ← ProjectItems
- ← IncidentItems

---

### 📋 **PROJECTS** (Proyectos/Cotizaciones)
```sql
- id (PK, autoincrement)
- projectName
- invoiceNumber (unique) - Ej: INV-001
- clientName
- status (draft, pending_approval, approved, assigned, rejected, completed)
- totalCost
- startDate, endDate
- notes
- rejectionReason
- createdBy, createdById (FK → users)
- approvedBy, approvedById (FK → users)
- assignedInstaller, assignedInstallerId (FK → users)
- installerPriceProposal
- installerPriceStatus (pending, accepted, rejected)
- scheduledInstallation
- approvedAt
- lastModified, lastModifiedBy
- createdAt, updatedAt
```
**Estados:** draft → pending_approval → approved → assigned → completed
**Relaciones:**
- → CreatedByUser, ApprovedByUser, AssignedUser
- ← ProjectItems
- ← ProjectHistory
- ← Incidents
- ← Contracts
- ← Messages

---

### 📝 **PROJECT_ITEMS** (Items en Proyectos)
```sql
- id (PK, autoincrement)
- projectId (FK → projects) ⚠️ Cascade
- productId (FK → products)
- productName
- quantity
- unitPrice
- createdAt
```
**Relaciones:**
- → Project, Product

---

### 📖 **PROJECT_HISTORY** (Historial de Proyectos)
```sql
- id (PK, autoincrement)
- projectId (FK → projects) ⚠️ Cascade
- timestamp
- status
- comment
- user
- action
- createdAt
```
Registra: cambios de estado, aprobaciones, asignaciones

---

### 🚨 **INCIDENTS** (Disputas/Incidentes)
```sql
- id (PK, autoincrement)
- projectId (FK → projects) ⚠️ Restrict
- incidentInvoiceNumber
- title
- description
- type (other, quality, damage, delay, billing, etc)
- priority (low, medium, high, critical)
- status (pending, investigating, resolved, closed)
- totalCost
- createdBy, createdById (FK → users)
- approvedBy, approvedById (FK → users)
- createdAt, updatedAt
```
**Relaciones:**
- → Project, CreatedByUser
- ← IncidentItems
- ← IncidentHistory
- ← Messages

---

### 📍 **INCIDENT_ITEMS** (Items en Incidentes)
```sql
- id (PK, autoincrement)
- incidentId (FK → incidents) ⚠️ Cascade
- productId (FK → products)
- quantity
- unitPrice
- createdAt
```
Productos/costos relacionados al incidente

---

### 📗 **INCIDENT_HISTORY** (Historial de Incidentes)
```sql
- id (PK, autoincrement)
- incidentId (FK → incidents) ⚠️ Cascade
- timestamp
- status
- comment
- user
- action
- createdAt
```

---

### 📄 **CONTRACTS** (Contratos Digitales)
```sql
- id (PK, autoincrement)
- contractNumber (unique) - Ej: CONT-001
- projectId (FK → projects)
- incidentId (FK → incidents)
- type (project, incident, service)
- status (draft, sent, signed, rejected, expired)
- title
- description
- content
- totalAmount, amount, finalPrice
- currency (USD, etc)
- startDate, endDate
- clientId (FK → users)
- vendorId (FK → users)
- installerId (FK → users)
- clientName
- signedAt
- isSigned (boolean)
- signatureToken (unique, temporal)
- signatureData (Base64)
- expiresAt
- createdBy, createdById (FK → users)
- communications (JSON)
- createdAt, updatedAt
```
**Relaciones:**
- → Project, CreatedByUser, Client, Vendor, Installer
- ← Messages

---

### 💬 **MESSAGES** (Mensajes Personalizados)
```sql
- id (PK, autoincrement)
- projectId (FK → projects) - nullable
- incidentId (FK → incidents) - nullable
- contractId (FK → contracts) - nullable
- senderId (FK → users) ⚠️ Cascade
- recipientId (FK → users) ⚠️ Cascade
- subject
- content
- attachments (JSON array de rutas)
- isRead (boolean)
- createdAt, updatedAt
```
**Relaciones:**
- → Sender, Recipient
- → Project, Incident, Contract (contexto del mensaje)

Permite comunicación entre usuarios sobre proyectos, incidentes y contratos específicos.

---

### 🔔 **NOTIFICATIONS** (Notificaciones del Sistema)
```sql
- id (PK, autoincrement)
- userId (FK → users) ⚠️ Cascade
- type (project_pending, contract_sent, incident_created, etc)
- title
- message
- data (JSON con contexto)
- isRead (boolean)
- createdAt
```
Notificaciones automáticas del sistema

---

## 🔗 FLUJOS DE RELACIÓN

### Flujo de Proyecto
```
User (vendor)
  ↓
Project (estado: draft)
  ├→ ProjectItems (productos)
  ├→ ProjectHistory (cambios)
  └→ Messages (comunicación)
  
Project (estado: pending_approval)
  ↓
Admin approves
  ↓
Project (estado: approved)
  ├→ Contracts (generado)
  ├→ Messages (negociación)
  └→ Notifications (para firmar)
  
Project (estado: assigned)
  └→ Installer asignado
```

### Flujo de Incidente
```
Project (existing)
  ↓
User (vendor/admin) reporta incidente
  ↓
Incident (status: pending)
  ├→ IncidentItems (productos dañados)
  ├→ IncidentHistory (cambios)
  ├→ Messages (comunicación)
  └→ Notifications (alertas)
  
Incident (estado: investigating)
  ↓
Admin/Vendor aprueban o rechazan
  ↓
Incident (estado: resolved/closed)
  └→ Contract (si hay costo adicional)
```

### Flujo de Contrato
```
Project/Incident approved
  ↓
Contract created (status: draft)
  ├→ Notifications (creado)
  ├→ Messages (detalles)
  └→ Signature token generado
  
Contract sent
  ↓
Client firma (en página pública /contract/[token])
  ├→ signatureData guardado
  ├→ isSigned = true
  ├→ Notifications (firmado)
  └→ Messages (confirmación)
  
Contract signed ✓
  └→ PDF generado y guardado
```

---

## 📊 ESTADÍSTICAS ACTUALES

| Tabla | Registros | Notas |
|-------|-----------|-------|
| users | 3 | admin, superadmin, jhayco (vendor) |
| categories | 10 | Todas las categorías base |
| products | 44 | Todos los productos con precios |
| projects | 0 | Se crean cuando vendor hace cotización |
| project_items | 0 | Se generan con cada proyecto |
| project_history | 0 | Se llenan automáticamente con cambios |
| incidents | 0 | Se crean cuando hay disputas |
| incident_items | 0 | Productos asociados a incidentes |
| incident_history | 0 | Cambios en incidentes |
| contracts | 0 | Se generan desde proyectos aprobados |
| messages | 0 | Comunicación entre usuarios |
| notifications | 0 | Alertas del sistema |

---

## 🔐 INTEGRIDAD REFERENCIAL

```
✅ Cascade (DELETE): messages, project_items, incident_items, incident_history
✅ Restrict: incidents sobre projects (no puedes borrar proyecto con incidentes)
✅ SetNull: user referencias (si user se borra, FK = null)
```

---

## ✅ CHECKLIST

- [x] Estructura de proyectos completa (creación, aprobación, asignación)
- [x] Sistema de incidentes (disputas, prioridades, estados)
- [x] Contratos digitales con firma (tokens temporales, base64)
- [x] Mensajes personalizados (por proyecto, incidente, contrato)
- [x] Notificaciones del sistema
- [x] Historial de cambios (proyectos e incidentes)
- [x] Relaciones correctas con cascadas
- [x] 3 usuarios seeded (admin, superadmin, vendor)
- [x] 10 categorías + 44 productos
