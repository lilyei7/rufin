# 🧪 Tests y Validación - Sistema de Firma de Contratos

## Suite de Tests

Esta guía describe cómo probar manualmente el sistema de firma de contratos completo.

---

## ✅ Test 1: Admin Genera Link de Firma

### Precondiciones
- Admin autenticado (token JWT válido)
- Contrato existente en BD (id=1)

### Pasos

```bash
# 1. Obtener token de admin (asumir que ya existe)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Llamar endpoint para generar link
curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": 1
  }'
```

### Respuesta Esperada

```json
{
  "signatureToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2024-01-22T10:30:00.000Z",
  "publicUrl": "http://localhost:3001/contract/550e8400-e29b-41d4-a716-446655440000"
}
```

### Validaciones en BD

```sql
-- Verificar que el token fue guardado
SELECT id, contractNumber, signatureToken, status, expiresAt 
FROM contracts 
WHERE id = 1;

-- Resultado esperado:
-- id=1, contractNumber=CTR-001, signatureToken=550e8400-e29b-41d4-a716-446655440000, status=sent
```

### Éxito ✅

- [ ] Status 200
- [ ] Token UUID válido (formato correcto)
- [ ] expiresAt es 7 días desde ahora
- [ ] BD contiene el token
- [ ] Estado del contrato cambió a "sent"

---

## ✅ Test 2: Cliente Accede al Link Público

### Precondiciones
- Link generado en Test 1
- Token no expirado

### Pasos

```bash
TOKEN="550e8400-e29b-41d4-a716-446655440000"

# Acceso a la página en navegador
open "http://localhost:3001/contract/${TOKEN}"

# O vía cURL
curl "http://localhost:3001/api/contracts/by-token?token=${TOKEN}"
```

### Respuesta Esperada

```json
{
  "id": 1,
  "contractNumber": "CTR-001",
  "title": "Contrato de Instalación Solar",
  "content": "Términos y condiciones...",
  "totalAmount": 5000.00,
  "status": "sent",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-01-22T10:30:00.000Z",
  "project": {
    "id": 1,
    "invoiceNumber": "INV-001",
    "name": "Proyecto Solar"
  }
}
```

### Validaciones

- [ ] Status 200
- [ ] Se retornan detalles del contrato
- [ ] NO se retornan datos sensibles (emails, IDs internos, etc.)
- [ ] expiresAt tiene valor futuro
- [ ] isSigned = false

### Éxito ✅

- Página carga exitosamente
- Muestra título, monto, términos
- Canvas está vacío
- Botones "Limpiar" y "Firmar Contrato" están activos

---

## ✅ Test 3: Cliente Dibuja y Envía Firma

### Precondiciones
- Página pública cargada (Test 2)
- Canvas listo para dibujar

### Pasos en Navegador

1. **En la página `/contract/[token]`**:
   - El canvas está visible (fondo blanco)
   - Mueve el ratón sobre el canvas y dibuja una firma
   - Verifica que se dibuja en negro
   - Haz clic en "Firmar Contrato"
   - Espera a que se procese

### Respuesta Esperada del Backend

```json
{
  "success": true,
  "contractId": 1,
  "signedAt": "2024-01-15T11:45:00.000Z"
}
```

### Validaciones en BD

```sql
-- Verificar que la firma se guardó
SELECT 
  id,
  isSigned,
  signedAt,
  status,
  signatureData 
FROM contracts 
WHERE id = 1;

-- Resultado esperado:
-- id=1, isSigned=true, signedAt=2024-01-15T11:45:00, status=signed, signatureData=data:image/png;base64,...
```

### Notificación Creada

```sql
-- Verificar que se creó notificación para admin
SELECT 
  id,
  userId,
  type,
  title,
  message,
  contractId,
  isRead 
FROM notifications 
WHERE contractId = 1 AND type = 'contract_signed';

-- Resultado esperado: fila con notificación
```

### Éxito ✅

- [ ] Status 200 en respuesta
- [ ] isSigned = true en BD
- [ ] signedAt tiene timestamp actual
- [ ] status cambió a "signed"
- [ ] signatureData contiene base64 válido
- [ ] Notificación creada para admin
- [ ] Página redirige a home después de 3 segundos

---

## ✅ Test 4: Token Expirado

### Precondiciones
- Crear contrato con token expirado (manualmente en BD)

```sql
-- Crear token que expiró hace 1 día
UPDATE contracts 
SET 
  signatureToken = 'expired-token-uuid',
  expiresAt = DATE_SUB(NOW(), INTERVAL 1 DAY),
  status = 'sent'
WHERE id = 2;
```

### Pasos

```bash
curl "http://localhost:3001/api/contracts/by-token?token=expired-token-uuid"
```

### Respuesta Esperada

```json
{
  "error": "El link de firma ha expirado"
}
```

### Validaciones

- [ ] Status 410 (Gone)
- [ ] Mensaje de error apropiado
- [ ] No retorna detalles del contrato

### Éxito ✅

- Cliente ve mensaje "Link expirado"
- No puede acceder al contrato

---

## ✅ Test 5: Contrato Ya Firmado

### Precondiciones
- Contrato ya firmado anteriormente

```sql
UPDATE contracts 
SET 
  isSigned = true,
  signedAt = NOW(),
  signatureData = 'data:image/png;base64,...',
  status = 'signed'
WHERE id = 3;
```

### Pasos

```bash
curl "http://localhost:3001/api/contracts/by-token?token=contrato-3-token"
```

### Respuesta Esperada

```json
{
  "error": "Este contrato ya ha sido firmado",
  "isSigned": true
}
```

### Validaciones

- [ ] Status 400
- [ ] Campo isSigned = true
- [ ] No se puede firmar nuevamente

### Éxito ✅

- Cliente ve mensaje "Contrato ya firmado"

---

## ✅ Test 6: Token No Existe

### Pasos

```bash
curl "http://localhost:3001/api/contracts/by-token?token=token-que-no-existe"
```

### Respuesta Esperada

```json
{
  "error": "Contrato no encontrado"
}
```

### Validaciones

- [ ] Status 404
- [ ] Mensaje de error genérico (sin exponer internals)

### Éxito ✅

- Cliente ve mensaje de error

---

## ✅ Test 7: Admin Sin Autenticación

### Pasos

```bash
# Sin header Authorization
curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Content-Type: application/json" \
  -d '{"contractId": 1}'
```

### Respuesta Esperada

```json
{
  "error": "Unauthorized"
}
```

### Validaciones

- [ ] Status 401
- [ ] No genera token

### Éxito ✅

- Solo admin autenticado puede generar links

---

## ✅ Test 8: Admin Sin Permisos (Token Inválido)

### Pasos

```bash
curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Authorization: Bearer token-invalido-xxx" \
  -H "Content-Type: application/json" \
  -d '{"contractId": 1}'
```

### Respuesta Esperada

```json
{
  "error": "Invalid token"
}
```

### Validaciones

- [ ] Status 401
- [ ] No genera token

### Éxito ✅

- Solo JWT válido puede generar

---

## ✅ Test 9: ContractId No Existe

### Pasos

```bash
TOKEN="valid-jwt-token"

curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contractId": 99999}'
```

### Respuesta Esperada

```json
{
  "error": "Contract not found"
}
```

### Validaciones

- [ ] Status 404

### Éxito ✅

- Valida que contrato exista

---

## 🔍 Test de Integración Completo (Escenario Real)

### Simulación de Flujo Completo

```bash
#!/bin/bash

# 1. Admin auténtica (obtener token)
echo "📋 Paso 1: Admin obtiene token"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token obtenido: $TOKEN"

# 2. Admin genera link
echo -e "\n🔗 Paso 2: Admin genera link de firma"
GENERATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": 1
  }')

SIGNATURE_TOKEN=$(echo $GENERATE_RESPONSE | jq -r '.signatureToken')
PUBLIC_URL=$(echo $GENERATE_RESPONSE | jq -r '.publicUrl')
echo "Link generado: $PUBLIC_URL"

# 3. Cliente accede al link
echo -e "\n👤 Paso 3: Cliente accede al link"
CONTRACT_INFO=$(curl -s "http://localhost:3001/api/contracts/by-token?token=$SIGNATURE_TOKEN")
echo "Contrato cargado:"
echo $CONTRACT_INFO | jq .

# 4. Cliente firma
echo -e "\n✍️ Paso 4: Cliente firma"
SIGN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/contracts/sign \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$SIGNATURE_TOKEN\",
    \"signatureData\": \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"
  }")

echo "Respuesta firma:"
echo $SIGN_RESPONSE | jq .

# 5. Verificar en BD
echo -e "\n🔍 Paso 5: Verificar en BD"
echo "SELECT id, isSigned, status FROM contracts WHERE id = 1;" | sqlite3 dev.db
```

### Resultado Esperado

```
📋 Paso 1: Admin obtiene token
Token obtenido: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔗 Paso 2: Admin genera link de firma
Link generado: http://localhost:3001/contract/550e8400-e29b-41d4-a716-446655440000

👤 Paso 3: Cliente accede al link
Contrato cargado:
{
  "id": 1,
  "contractNumber": "CTR-001",
  "title": "Contrato de Instalación",
  ...
}

✍️ Paso 4: Cliente firma
Respuesta firma:
{
  "success": true,
  "contractId": 1,
  "signedAt": "2024-01-15T11:45:00.000Z"
}

🔍 Paso 5: Verificar en BD
1|1|signed
```

---

## 📊 Matriz de Tests

| # | Test | Precondición | Entrada | Resultado | Status |
|---|------|---|---|---|---|
| 1 | Generar Link | Admin auth | contractId=1 | Token + Link | ✅ |
| 2 | Acceder Link | Token válido | token=xxx | Contrato | ✅ |
| 3 | Firmar | Canvas dibujado | signature + token | Firmado | ✅ |
| 4 | Token Expirado | 7+ días | token=expired | 410 Gone | ✅ |
| 5 | Ya Firmado | isSigned=true | token=xxx | 400 Error | ✅ |
| 6 | Token No Existe | - | token=fake | 404 | ✅ |
| 7 | Sin Auth | - | sin token JWT | 401 | ✅ |
| 8 | Token Inválido | - | jwt=invalid | 401 | ✅ |
| 9 | ContractId Fake | - | id=99999 | 404 | ✅ |

---

## 🐛 Debugging

### Verificar Logs

```bash
# Ver logs de Next.js
tail -f /home/gordon/Escritorio/rufin/.next/logs/*.log

# Verificar errores en BD
sqlite3 dev.db ".log"
```

### Base de Datos

```bash
# Conectar a SQLite
sqlite3 /home/gordon/Escritorio/rufin/dev.db

# Queries útiles
SELECT * FROM contracts ORDER BY id DESC LIMIT 5;
SELECT * FROM notifications ORDER BY id DESC LIMIT 5;
SELECT COUNT(*) FROM contracts WHERE isSigned = true;
SELECT * FROM contracts WHERE signatureToken IS NOT NULL;
```

### Network Inspector (Navegador)

1. Abrir DevTools (F12)
2. Ir a pestaña "Network"
3. Cargar `/contract/[token]`
4. Ver requests:
   - GET `/api/contracts/by-token?token=xxx` → 200
   - POST `/api/contracts/sign` → 200
5. Inspeccionar payloads

---

## ✨ Checklist Final

- [ ] Todos los tests pasan
- [ ] Sin errores en consola
- [ ] Sin errores en BD
- [ ] Links funcionan en navegadores Chrome, Firefox, Safari
- [ ] Firma se guarda en BD como base64 válido
- [ ] Notificaciones se crean correctamente
- [ ] Tokens expiran después de 7 días
- [ ] Admin puede ver el estado "Firmado" en dashboard
- [ ] Cliente no puede firmar dos veces
- [ ] Links no funcionan sin token

---

**Última actualización**: 2024-01-15
