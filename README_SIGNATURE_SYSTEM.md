# 📋 Sistema de Firma de Contratos - README

> **Generador de links permanentes para que clientes firmen contratos digitalmente sin requerir login**

---

## 🎯 ¿Qué es?

Un sistema completo que permite a administradores generar enlaces públicos y únicos que expiran en 7 días, mediante los cuales clientes pueden acceder a un formulario web para dibujar su firma digital en un contrato sin necesidad de autenticarse.

**Caso de Uso Real**:
1. Admin genera link desde dashboard
2. Comparte link vía email/WhatsApp con cliente
3. Cliente abre link (sin login) desde cualquier navegador/dispositivo
4. Cliente dibuja firma en canvas HTML5
5. Firma se guarda en BD como image/png base64
6. Admin recibe notificación

---

## 🏗️ Arquitectura

```
┌─────────┐         ┌──────────────┐         ┌────────┐
│ Admin   │ ────→  │  Generate    │ ────→  │ Cliente │
│         │ JWT    │  Token API   │ UUID   │        │
└─────────┘         └──────────────┘         └────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │ /contract/[id]  │
                                         │ Canvas Firma    │
                                         │ No Login        │
                                         └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │  Sign API       │
                                         │  Base64 PNG     │
                                         │  Notificación   │
                                         └─────────────────┘
```

---

## 📂 Estructura de Archivos

```
rufin/
├── app/
│   ├── api/contracts/
│   │   ├── generate-token/route.ts      # Genera UUID + link
│   │   ├── by-token/route.ts            # Obtiene contrato por token
│   │   └── sign/route.ts                # Procesa firma
│   ├── contract/[token]/page.tsx        # Página pública de firma
│   └── dashboard/contracts/signature-links/page.tsx  # Panel admin
│
├── CONTRACT_SIGNATURE_SYSTEM.md         # 📖 Documentación completa
├── CONTRACT_SIGNATURE_TESTS.md          # 🧪 Tests y validación
├── CONTRACT_SIGNATURE_VISUAL.md         # 📊 Diagramas
└── QUICK_START_SIGNATURE.md             # ⚡ Guía rápida
```

---

## 🔑 Características Clave

### ✅ Seguridad

| Característica | Implementación |
|---|---|
| **Tokens Únicos** | UUID v4 (crypto.randomUUID) |
| **Expiración** | 7 días automáticos |
| **Una Firma** | Contrato no puede firmarse 2 veces |
| **Validación** | Token, expiración, estado |
| **Acceso Público Seguro** | Sin exponer datos internos |

### ✅ Usabilidad

| Característica | Descripción |
|---|---|
| **Sin Login** | Cliente no requiere cuenta |
| **Mobile Friendly** | Responsive en todos los dispositivos |
| **Canvas HTML5** | Firma natural y fluida |
| **Copia Automática** | Admin copia link con 1 click |
| **Notificaciones** | Admin alertado cuando se firma |

### ✅ Integración

| Característica | Detalles |
|---|---|
| **BD SQLite** | Campos signatureToken, expiresAt, signatureData |
| **Next.js API** | 3 endpoints públicos/privados |
| **JWT Auth** | Admin debe estar autenticado para generar |
| **Prisma ORM** | Queries optimizadas |

---

## 🚀 Cómo Usar

### Para Admin (Generar Link)

```typescript
// 1. Navegar a: /app/dashboard/contracts/signature-links
// 2. Seleccionar contrato
// 3. Click en "Generar Link de Firma"
// 4. Copiar link
// 5. Compartir con cliente
```

### Para Cliente (Firmar)

```typescript
// 1. Abrir link recibido (sin login)
// 2. Ver detalles del contrato
// 3. Dibujar firma en canvas
// 4. Hacer click en "Firmar Contrato"
// 5. ✅ Listo! Firma guardada
```

---

## 📊 API Endpoints

### 1. Generar Token
```
POST /api/contracts/generate-token
Auth: JWT Admin Required
Body: { contractId: number }
Returns: { signatureToken, expiresAt, publicUrl }
```

### 2. Obtener Contrato
```
GET /api/contracts/by-token?token=UUID
Auth: Public
Returns: Detalles del contrato (público)
```

### 3. Firmar Contrato
```
POST /api/contracts/sign
Auth: Public
Body: { token, signatureData: "data:image/png;base64,..." }
Returns: { success, contractId, signedAt }
```

---

## 💾 Base de Datos

Nuevos campos en tabla `contracts`:

```sql
-- Firma Digital
signatureToken VARCHAR(36) UNIQUE              -- UUID del link
expiresAt DATETIME                             -- Válido 7 días
signatureData LONGTEXT                         -- Base64 PNG
isSigned BOOLEAN DEFAULT false                 -- ¿Fue firmado?
signedAt DATETIME                              -- Cuándo se firmó
status VARCHAR(50)  -- 'draft'|'sent'|'signed' -- Estado

-- Estados
draft  → Contrato nuevo
sent   → Link generado
signed → Firmado por cliente
```

---

## 🔐 Validaciones

- ✅ Token existe
- ✅ Token no expirado (< 7 días)
- ✅ Contrato no firmado (isSigned = false)
- ✅ Estado es "sent"
- ✅ Admin autenticado (para generar)

---

## 📱 Componentes UI

### Admin Dashboard
- Lista contratos con estado
- Botón "Generar Link"
- Muestra link público
- Copia al portapapeles
- Valida JWT

### Página Pública de Firma
- Sin requerimiento de login
- Canvas 400x150px
- Botones: Limpiar, Firmar
- Validaciones en cliente
- Redirige después de firmar

---

## 🧪 Testing

Archivo: `CONTRACT_SIGNATURE_TESTS.md`

Incluye:
- 9 test cases con cURL
- Validaciones de seguridad
- Manejo de errores
- Test de integración completo
- Matriz de tests

---

## 📚 Documentación

| Archivo | Contenido |
|---------|----------|
| `CONTRACT_SIGNATURE_SYSTEM.md` | Guía técnica completa (3000+ palabras) |
| `CONTRACT_SIGNATURE_TESTS.md` | Tests, validación y debugging |
| `CONTRACT_SIGNATURE_VISUAL.md` | Diagramas, arquitectura, matrices |
| `QUICK_START_SIGNATURE.md` | Guía en 5 minutos |

---

## 🎯 Casos de Uso

### Caso 1: Contrato de Instalación
```
1. Admin genera link para contrato solar
2. Envía WhatsApp al cliente
3. Cliente firma desde móvil (sin app!)
4. Firma se guarda automáticamente
5. Admin recibe notificación
```

### Caso 2: Mantenimiento
```
1. Múltiples contratos en BD
2. Admin genera links individuales
3. Cada link válido 7 días
4. Reutilizable si cliente rechaza primera vez
5. Historial de intentos en BD
```

### Caso 3: Vendedor
```
1. Admin genera para contrato del vendedor
2. Vendedor firma contrato
3. Notificación automática a admin
4. Contrato listo para próximo paso
```

---

## ⚙️ Configuración

### Parámetros
```typescript
// Expiración del token
EXPIRATION_DAYS = 7

// Tamaño canvas
CANVAS_WIDTH = 400
CANVAS_HEIGHT = 150

// Validaciones
MIN_SIGNATURE_POINTS = 5
MAX_RETRY = 3
```

### Variables de Entorno
```
JWT_SECRET = tu_secret_key
DATABASE_URL = file:./dev.db
```

---

## 🚦 Estados del Contrato

```
┌─────────┐  ┌──────────┐  ┌────────────┐
│ draft   │→│ sent     │→│ signed     │
└─────────┘  └──────────┘  └────────────┘
   (nuevo)   (link gen)    (firmado)
```

---

## 🔄 Flujo Temporal

```
T0:  Contrato creado (status=draft, signatureToken=NULL)
T1:  Admin genera link (status→sent, signatureToken=UUID)
T1+1min: Cliente accede (valida token, no expirado)
T1+2min: Cliente firma (POST /sign)
T1+3min: Firma guardada (status→signed, isSigned=true)
T1+7d:  Token expira (status 410 Gone)
```

---

## 🐛 Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | Token JWT inválido | Re-autenticar |
| 404 Not Found | Token no existe | Verificar UUID |
| 410 Gone | Token expirado | Generar nuevo link |
| 400 Bad Request | Contrato ya firmado | No se puede firmar 2 veces |

---

## ✨ Próximas Mejoras

- [ ] PDF con firma insertada
- [ ] Email automático
- [ ] Múltiples firmas
- [ ] E-firma certificada
- [ ] QR mobile
- [ ] Integración WhatsApp

---

## 📞 Soporte

Para problemas:
1. Ver `CONTRACT_SIGNATURE_TESTS.md` (debugging)
2. Ver `CONTRACT_SIGNATURE_SYSTEM.md` (referencia)
3. Ver logs en consola Next.js

---

## 📈 Métricas

```
Endpoints: 3 (Generate, GetByToken, Sign)
Componentes: 2 (Admin Dashboard, Public Page)
Validaciones: 5 (Token, Expiration, Status, Auth, etc)
Documentación: 4 archivos (10,000+ palabras)
Test Cases: 9 (Exitosos + Error Cases)
```

---

## ✅ Checklist de Implementación

- ✅ API: /api/contracts/generate-token
- ✅ API: /api/contracts/by-token
- ✅ API: /api/contracts/sign
- ✅ UI: Panel Admin (/dashboard/contracts/signature-links)
- ✅ UI: Página Pública (/contract/[token])
- ✅ BD: Schema con signatureToken, expiresAt, signatureData
- ✅ Seguridad: UUID + Expiración + Validaciones
- ✅ Canvas: HTML5 con dibujo libre
- ✅ Notificaciones: Admin alerta cuando se firma
- ✅ Documentación: 4 guías completas
- ✅ Tests: 9 casos de prueba

---

## 📄 Licencia

Parte del proyecto Rufín - Sistema de Gestión de Proyectos

---

## 👤 Autor

Desarrollado como extensión del sistema de Rufín

---

## 🎉 ¡Listo para Producción!

El sistema de firma de contratos está completo, seguro y documentado.

**Estado**: ✅ PRODUCCIÓN  
**Última Actualización**: 2024-01-15  
**Versión**: 1.0
