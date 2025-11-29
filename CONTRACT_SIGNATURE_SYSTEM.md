# 📋 Sistema de Firma de Contratos - Guía Completa

## Descripción General

Este sistema permite crear enlaces permanentes y públicos para que los clientes firmen contratos digitalmente. Los administradores generan links de una sola vez (válidos por 7 días), que se envían a los clientes sin requerir login.

---

## 🏗️ Arquitectura del Sistema

### Flujo General

```
Admin (Dashboard) → Genera Link → Token (7 días) 
    ↓
Cliente (Link Público) → Visualiza Contrato → Dibuja Firma → Envía
    ↓
Backend → Valida Token → Guarda Firma → Notifica Admin
```

### Componentes Principales

1. **Página Admin**: `/app/dashboard/contracts/signature-links/page.tsx`
   - Lista todos los contratos disponibles
   - Permite generar links de firma únicos
   - Muestra el link público para compartir
   - Copia automática al portapapeles

2. **Página Pública**: `/app/contract/[token]/page.tsx`
   - Acceso público sin autenticación
   - Valida el token y su expiración
   - Muestra detalles del contrato
   - Canvas para dibujar firma
   - Envía firma firmada al servidor

3. **API: Generate Token**: `/app/api/contracts/generate-token/route.ts`
   - POST endpoint (requiere autenticación JWT)
   - Entrada: `{ contractId: number }`
   - Salida: `{ signatureToken: UUID, expiresAt: Date, publicUrl: string }`
   - Genera UUID único válido por 7 días
   - Actualiza estado del contrato a "sent"

4. **API: By Token**: `/app/api/contracts/by-token/route.ts`
   - GET endpoint (acceso público)
   - Entrada: `token` (query param)
   - Validaciones: token existe, no expirado, no firmado
   - Salida: detalles del contrato (sin info sensible)

5. **API: Sign Contract**: `/app/api/contracts/sign/route.ts`
   - POST endpoint (acceso público)
   - Entrada: `{ token: string, signatureData: base64 }`
   - Salida: `{ success: true, contractId: number }`
   - Valida token, expiración, estado
   - Guarda firma en base64
   - Actualiza estado a "signed"
   - Crea notificación para admin

---

## 🔄 Flujo Detallado de Uso

### Paso 1: Admin Genera Link (Dashboard)

**Ruta**: `/app/dashboard/contracts/signature-links`

**Acciones del Admin**:
1. Navega a "Generar Links de Firma" desde el dashboard
2. Selecciona un contrato de la lista
3. Hace clic en "Generar Link de Firma"
4. Sistema genera UUID único
5. Admin copia el link públicamente compartible

**Ejemplo de Link**:
```
https://tuapp.com/contract/550e8400-e29b-41d4-a716-446655440000
```

**Base de Datos**:
```sql
UPDATE contracts 
SET 
  signatureToken = '550e8400-e29b-41d4-a716-446655440000',
  expiresAt = NOW() + INTERVAL 7 DAY,
  status = 'sent'
WHERE id = 123;
```

---

### Paso 2: Cliente Accede al Link (Página Pública)

**Ruta**: `/contract/[token]`

**Acciones del Cliente**:
1. Cliente recibe link por email/WhatsApp/etc (sin login requerido)
2. Hace clic en el link
3. Página valida el token:
   - ✅ Token existe
   - ✅ No ha expirado
   - ✅ Contrato no está ya firmado
4. Muestra detalles del contrato

**Información Visible**:
- Número de contrato
- Título y descripción
- Monto total
- Términos y condiciones
- Validez del link

---

### Paso 3: Cliente Dibuja Firma

**Componente**: Canvas HTML5

**Funcionalidades**:
- Dibujo libre con ratón/táctil
- Botón "Limpiar" para borrar firma
- Validación: firma debe ser diferente a lienzo vacío
- Canvas 400x150px

**Ejemplo Visual**:
```
┌─────────────────────────┐
│  ___________            │
│ /___________\___        │  ← Firma dibujada
│                         │
└─────────────────────────┘
[Limpiar] [Firmar Contrato]
```

---

### Paso 4: Cliente Envía Firma

**API Endpoint**: `POST /api/contracts/sign`

**Body Enviado**:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
}
```

**Validaciones del Servidor**:
1. Token no es nulo
2. Contrato existe con ese token
3. Token no ha expirado
4. Contrato no está ya firmado (isSigned = false)
5. Estado es "sent"

**Respuesta Exitosa**:
```json
{
  "success": true,
  "contractId": 123,
  "signedAt": "2024-01-15T10:30:00Z"
}
```

**Actualización en BD**:
```sql
UPDATE contracts 
SET 
  isSigned = true,
  signedAt = NOW(),
  signatureData = 'data:image/png;base64,...',
  status = 'signed'
WHERE signatureToken = '550e8400-e29b-41d4-a716-446655440000';

-- Crear notificación para admin
INSERT INTO notifications (
  userId, 
  type, 
  title, 
  message, 
  contractId
) VALUES (
  1, 
  'contract_signed', 
  'Contrato Firmado', 
  'El contrato #123 ha sido firmado', 
  123
);
```

---

## 🔐 Seguridad y Validaciones

### Token de Firma (`signatureToken`)

- **Formato**: UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Generación**: `crypto.randomUUID()`
- **Unicidad**: Stored as UNIQUE en BD
- **Expiración**: 7 días desde generación
- **Uso**: Una sola vez (se guarda en contrato)

### Protecciones Implementadas

1. **Validación de Expiración**:
   - Token válido solo por 7 días
   - Sistema rechaza tokens expirados con 410 Gone

2. **Validación de Estado**:
   - Solo contratos con estado "sent" pueden ser firmados
   - Contrato no puede firmarse dos veces

3. **Validación de Token**:
   - Token debe existir en BD
   - Token debe ser exacto (no parcial)
   - Sin autenticación requerida (pero token es único)

4. **Acceso Público Seguro**:
   - Firma no requiere login (usuario anónimo)
   - No se expone información sensible (IDs internos, emails, etc.)
   - Endpoint de lectura retorna solo info necesaria

---

## 📊 Base de Datos - Campos Relacionados

### Tabla `contracts`

```sql
CREATE TABLE contracts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractNumber VARCHAR(255) UNIQUE NOT NULL,
  
  -- Relaciones
  projectId INT FOREIGN KEY,
  incidentId INT FOREIGN KEY,
  clientId INT FOREIGN KEY,
  vendorId INT FOREIGN KEY,
  installerId INT FOREIGN KEY,
  createdById INT FOREIGN KEY,
  
  -- Contenido
  title VARCHAR(255),
  content LONGTEXT,
  totalAmount DECIMAL(10, 2),
  
  -- Estado
  status VARCHAR(50),           -- 'draft', 'sent', 'signed', 'rejected'
  isSigned BOOLEAN DEFAULT false,
  signedAt DATETIME,
  
  -- Firma Digital
  signatureToken VARCHAR(36) UNIQUE,  -- UUID
  expiresAt DATETIME,
  signatureData LONGTEXT,              -- Base64 PNG
  
  -- Auditoría
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Estados del Contrato

```
draft     → Contrato creado, no listo para firmar
   ↓
sent      → Link de firma generado y enviado
   ↓
signed    → Firmado por cliente
   ↓
rejected  → Rechazado por cliente (futuro)
```

---

## 🌐 Endpoints API Completos

### 1. Generar Token de Firma

```
POST /api/contracts/generate-token
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "contractId": 123
}

Response 200:
{
  "signatureToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2024-01-22T10:30:00Z",
  "publicUrl": "https://tuapp.com/contract/550e8400-e29b-41d4-a716-446655440000"
}

Response 401: Unauthorized
Response 404: Contract not found
```

### 2. Obtener Contrato por Token

```
GET /api/contracts/by-token?token=550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

Response 200:
{
  "id": 123,
  "contractNumber": "CTR-2024-001",
  "title": "Contrato de Instalación",
  "content": "Términos y condiciones...",
  "totalAmount": 5000.00,
  "status": "sent",
  "createdAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2024-01-22T10:30:00Z",
  "project": {
    "id": 5,
    "invoiceNumber": "INV-001",
    "name": "Proyecto Solar"
  }
}

Response 404: Contrato no encontrado
Response 410: El link ha expirado
```

### 3. Firmar Contrato

```
POST /api/contracts/sign
Content-Type: application/json

{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
}

Response 200:
{
  "success": true,
  "contractId": 123,
  "signedAt": "2024-01-15T11:45:00Z"
}

Response 400: Token requerido / Contrato ya firmado
Response 404: Contract not found
Response 410: Token expirado
```

---

## 📱 Componentes UI

### Admin Page (`/app/dashboard/contracts/signature-links/page.tsx`)

**Características**:
- Grid de 2 columnas (lista + detalles)
- búsqueda/filtrado de contratos
- Genera link único por contrato
- Copia automática al portapapeles
- Muestra link existente si ya fue generado
- Validación de autenticación JWT
- Manejo de errores

**Estados Visuales**:
- 🔄 Cargando contratos
- 📋 Seleccionar contrato
- 🔗 Generar link
- ✅ Link copiado
- ⚠️ Errores

### Public Page (`/app/contract/[token]/page.tsx`)

**Características**:
- Acceso completamente público
- Sin requerimiento de login
- Validación de token al cargar
- Muestra detalles del contrato
- Canvas para firma interactiva
- Dibuja en tiempo real
- Botón limpiar/reintentar
- Términos y condiciones
- Avisos legales

**Estados Visuales**:
- 🔄 Cargando contrato
- ✍️ Firmar contrato
- 🔄 Procesando firma
- ✅ Firmado exitosamente
- ⚠️ Link expirado / Errores

---

## 🧪 Ejemplos de Uso - cURL

### 1. Generar Link (Admin)

```bash
curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"contractId": 123}'
```

**Respuesta**:
```json
{
  "signatureToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2024-01-22T10:30:00.000Z",
  "publicUrl": "http://localhost:3001/contract/550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Obtener Contrato (Cliente/Público)

```bash
curl http://localhost:3001/api/contracts/by-token?token=550e8400-e29b-41d4-a716-446655440000
```

**Respuesta**:
```json
{
  "id": 123,
  "contractNumber": "CTR-2024-001",
  "title": "Contrato de Instalación",
  "content": "Términos completos...",
  "totalAmount": 5000.00,
  "status": "sent",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-01-22T10:30:00.000Z"
}
```

### 3. Firmar Contrato (Cliente/Público)

```bash
curl -X POST http://localhost:3001/api/contracts/sign \
  -H "Content-Type: application/json" \
  -d '{
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "signatureData": "data:image/png;base64,iVBORw0KGgo..."
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "contractId": 123,
  "signedAt": "2024-01-15T11:45:00.000Z"
}
```

---

## 🚀 Próximos Pasos (Futuras Mejoras)

1. **PDF con Firma**
   - Generar PDF con contrato + firma insertada
   - Email automático con PDF

2. **Notificaciones en Tiempo Real**
   - WebSocket para actualizar admin cuando se firma
   - Email al admin cuando se firme

3. **Múltiples Firmas**
   - Cliente + Vendedor + Instalador
   - Tracking de quién falta firmar

4. **Historial y Auditoría**
   - Tabla de auditoría con timestamps
   - IP del cliente que firmó
   - User-agent del navegador

5. **Rechazo de Contratos**
   - Cliente puede rechazar con comentario
   - Admin es notificado

6. **E-firma Avanzada**
   - Integración con certificados digitales
   - Cumplimiento normativo (LGPD, etc.)

---

## 🐛 Troubleshooting

### "Link no encontrado"
- Token expiró (7 días)
- Token es incorrecto
- Contrato fue eliminado

### "El contrato ya ha sido firmado"
- Cliente ya firmó una vez
- No se puede firmar dos veces

### "No autorizado" (Admin)
- JWT token no válido o expirado
- Usuario no tiene permisos

### Canvas no dibuja
- Navegador no soporta HTML5 Canvas
- Problema de permisos del ratón/táctil

---

## 📚 Referencias

- [Canvas API MDN](https://developer.mozilla.org/es/docs/Web/API/Canvas_API)
- [UUID RFC 4122](https://tools.ietf.org/html/rfc4122)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Client](https://www.prisma.io/docs/reference/prisma-client-reference)

---

**Última actualización**: 2024-01-15
**Versión**: 1.0
**Estado**: ✅ Producción Completa
