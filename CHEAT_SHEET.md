# ⚡ CHEAT SHEET - Firma de Contratos

> Referencia rápida para comandos, rutas y endpoints

---

## 🚀 INICIO RÁPIDO (Copy/Paste)

### 1. Admin Autentica
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

echo $TOKEN
```

### 2. Admin Genera Link
```bash
curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contractId":1}' | jq .
```

### 3. Cliente Accede
```bash
# En navegador:
# http://localhost:3001/contract/550e8400-e29b-41d4-a716-446655440000

# O en terminal:
curl "http://localhost:3001/api/contracts/by-token?token=550e8400-e29b-41d4-a716-446655440000" | jq .
```

### 4. Cliente Firma
```bash
curl -X POST http://localhost:3001/api/contracts/sign \
  -H "Content-Type: application/json" \
  -d '{
    "token":"550e8400-e29b-41d4-a716-446655440000",
    "signatureData":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }' | jq .
```

---

## 🗺️ RUTAS (URLs)

### Admin
```
Dashboard:     http://localhost:3001/app/dashboard/contracts/signature-links
Generar Link:  POST /api/contracts/generate-token
Obtener:       GET /api/contracts
```

### Cliente (Público)
```
Página Firma:  http://localhost:3001/contract/[TOKEN]
API GetToken:  GET /api/contracts/by-token?token=TOKEN
API Sign:      POST /api/contracts/sign
```

---

## 📊 ENDPOINTS

| Método | Ruta | Auth | Entrada | Salida |
|--------|------|------|---------|--------|
| POST | /api/contracts/generate-token | JWT | contractId | token, expiresAt |
| GET | /api/contracts/by-token | - | token | contrato |
| POST | /api/contracts/sign | - | token, signature | success |
| GET | /api/contracts | JWT | - | array |

---

## 🔐 ESTATUS HTTP

| Código | Significado | Causa |
|--------|------------|-------|
| 200 | OK | Éxito |
| 400 | Bad Request | Formato inválido, ya firmado |
| 401 | Unauthorized | Sin JWT o JWT inválido |
| 404 | Not Found | Contrato/token no existe |
| 410 | Gone | Token expirado |
| 500 | Server Error | Error interno |

---

## 💾 BASE DE DATOS

### Crear Contrato (Ejemplo)
```sql
INSERT INTO contracts (
  contractNumber, title, content, totalAmount, 
  clientId, vendorId, status
) VALUES (
  'CTR-001', 'Instalación Solar', 'Términos...', 5000.00,
  3, 2, 'draft'
);
```

### Ver Contrato
```sql
SELECT id, contractNumber, status, isSigned, 
       signatureToken, expiresAt, signedAt 
FROM contracts WHERE id = 1;
```

### Firma Guardada
```sql
SELECT contractNumber, isSigned, signedAt,
       LENGTH(signatureData) as signature_size_bytes
FROM contracts WHERE id = 1;
```

### Token Expirado?
```sql
SELECT id, signatureToken, expiresAt,
       IF(expiresAt < NOW(), 'EXPIRADO', 'VÁLIDO') as estado
FROM contracts WHERE signatureToken IS NOT NULL;
```

---

## 🎨 CANVAS SIGNATURE (JavaScript)

```javascript
// Obtener canvas
const canvas = document.getElementById('signature');
const ctx = canvas.getContext('2d');

// Dibujar línea
ctx.beginPath();
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();

// Convertir a Base64
const base64 = canvas.toDataURL('image/png');

// Enviar
fetch('/api/contracts/sign', {
  method: 'POST',
  body: JSON.stringify({
    token: 'uuid-token',
    signatureData: base64
  })
});
```

---

## 🧪 TESTS RÁPIDOS

### Test 1: Token Válido
```bash
SIGNATURE_TOKEN="550e8400-e29b-41d4-a716-446655440000"
curl http://localhost:3001/api/contracts/by-token?token=$SIGNATURE_TOKEN
# Esperar: 200 OK
```

### Test 2: Token Expirado
```bash
curl http://localhost:3001/api/contracts/by-token?token=fake-token
# Esperar: 404 Not Found
```

### Test 3: Token Inválido
```bash
curl http://localhost:3001/api/contracts/by-token?token=invalid
# Esperar: 404 Not Found
```

### Test 4: Sin JWT
```bash
curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Content-Type: application/json" \
  -d '{"contractId":1}'
# Esperar: 401 Unauthorized
```

---

## 🔧 CONFIGURACIÓN

### .env.local
```
JWT_SECRET=tu_secret_key_aqui
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Expiración Token
```typescript
// En route.ts
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7); // 7 días
```

### Canvas Size
```typescript
const canvas = document.createElement('canvas');
canvas.width = 400;   // ancho
canvas.height = 150;  // alto
```

---

## 🐛 DEBUGGING

### Ver logs
```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: Ver logs
tail -f ~/.next/logs/*.log
```

### Base de datos
```bash
# Conectar
sqlite3 dev.db

# Queries
SELECT * FROM contracts ORDER BY id DESC LIMIT 5;
SELECT COUNT(*) FROM contracts WHERE isSigned = true;
```

### Network
```
F12 → Network tab → Ejecutar acción → Ver request
```

---

## 📋 ERRORES COMUNES

| Error | Solución |
|-------|----------|
| 401 Unauthorized | Re-autenticar (obtener nuevo JWT) |
| 404 Not Found | Verificar que contractId existe |
| 410 Gone | Token > 7 días, generar nuevo |
| CORS error | Verificar endpoints URL |
| Canvas no dibuja | Usar navegador moderno |

---

## 🎯 FLUJO VISUAL

```
Admin                          Cliente
  │                              │
  ├─ 1. POST generate-token ───→│
  │ (genera UUID)                │
  │                              │
  ├─ 2. Envía link ─────────────→│
  │                              │
  │                    3. GET by-token
  │                   (valida token)
  │                              │
  │                    4. Dibuja firma
  │                       (canvas)
  │                              │
  │                    5. POST sign
  │                   (envia Base64)
  │                              │
  │← 6. Notificación ←──────────│
  │   "Contrato Firmado"        │
```

---

## 📱 TESTING MOBILE

### Simular en Desktop
```
F12 → Ctrl+Shift+M → Seleccionar dispositivo
```

### Probar con teléfono real
```
1. Obtener IP local: ifconfig | grep inet
2. Cambiar localhost:3001 por IP:3001
3. Acceder desde móvil
```

---

## 🚀 DEPLOYMENT

### Verificar antes de producción
```bash
# 1. Tests
npm run test

# 2. Build
npm run build

# 3. Lint
npm run lint

# 4. Check BD
sqlite3 dev.db ".tables"

# 5. Variables env
cat .env.local
```

### Producción
```bash
npm run start
# O
pm2 start npm -- run start
```

---

## 🔗 REFERENCIAS RÁPIDAS

### Documentación
```
QUICK_START → 5 min overview
VISUAL      → Diagramas
SYSTEM      → Referencia técnica
TESTS       → Testing
```

### Archivos
```
generate-token/route.ts  → Generar UUID
by-token/route.ts        → Obtener contrato
sign/route.ts            → Procesar firma
dashboard/signature-links → Panel admin
contract/[token]         → Página pública
```

---

## ✨ COMANDOS ÚTILES

### Node/npm
```bash
npm install                # Instalar deps
npm run dev               # Servidor dev
npm run build             # Build producción
npm run start             # Start producción
npm run lint              # Linter
```

### Git
```bash
git status                # Ver cambios
git add .                 # Agregar cambios
git commit -m "msg"       # Commit
git push                  # Push
```

### SQLite
```bash
sqlite3 dev.db            # Conectar
.tables                   # Ver tablas
.schema contracts         # Ver schema
SELECT * FROM contracts;  # Query
.exit                     # Salir
```

### Curl
```bash
curl http://localhost:3001        # GET
curl -X POST http://localhost:3001 -d '{...}'  # POST
-H "Header: value"                # Headers
-H "Authorization: Bearer TOKEN"  # JWT
| jq .                            # Pretty JSON
```

---

## ⏱️ TIMING

| Tarea | Tiempo |
|-------|--------|
| Generar link | <100ms |
| Obtener contrato | <100ms |
| Firmar | <500ms |
| Total flow | ~2 segundos |

---

## 📈 LÍMITES

| Parámetro | Valor |
|-----------|-------|
| Token size | 36 chars (UUID) |
| Signature max | 1MB (Base64 PNG) |
| Expiration | 7 días |
| Token único | ∞ (UUID v4) |

---

## 🎓 VARIABLES GLOBALES

```javascript
// Front-end
TOKEN = localStorage.getItem('token')
SIGNATURE_TOKEN = params.token

// Back-end
JWT_SECRET = process.env.JWT_SECRET
DATABASE_URL = process.env.DATABASE_URL
```

---

## 🔐 SEGURIDAD EN 3 PALABRAS

```
UUID  →  Imposible predecir
7days →  Válido por una semana
Once  →  Una firma por token
```

---

**Imprime este cheat sheet para referencia rápida** 🖨️

---

*Última actualización: 2024-01-15*
