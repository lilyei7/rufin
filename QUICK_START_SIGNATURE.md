# 🚀 Guía Rápida - Sistema de Firma de Contratos

## ⚡ 5 Minutos para Empezar

### 1️⃣ Verificar que está todo listo

```bash
# Verificar que el servidor está corriendo
curl http://localhost:3001/

# Debe retornar: página de inicio de Next.js
```

### 2️⃣ Admin Autentica

```bash
# Login con credenciales de admin
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Guardar el token retornado
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3️⃣ Admin Genera Link

```bash
curl -X POST http://localhost:3001/api/contracts/generate-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contractId": 1}'

# Respuesta:
# {
#   "signatureToken": "550e8400-e29b-41d4-a716-446655440000",
#   "publicUrl": "http://localhost:3001/contract/550e8400-e29b-41d4-a716-446655440000"
# }

PUBLIC_URL="http://localhost:3001/contract/550e8400-e29b-41d4-a716-446655440000"
```

### 4️⃣ Cliente Accede

```bash
# Abrir en navegador (SIN LOGIN)
open "$PUBLIC_URL"

# O con curl para ver JSON
curl "$PUBLIC_URL/api/contracts/by-token?token=550e8400-e29b-41d4-a716-446655440000"
```

### 5️⃣ Cliente Firma

**En navegador**:
1. Ver página de firma
2. Dibujar firma en canvas
3. Clic en "Firmar Contrato"
4. ✅ Listo!

---

## 🎯 Rutas Principales

| Ruta | Acceso | Descripción |
|------|--------|------------|
| `/app/dashboard/contracts/signature-links` | Admin (JWT) | Generar links |
| `/contract/[token]` | Público | Página de firma |
| `POST /api/contracts/generate-token` | Admin (JWT) | Genera UUID |
| `GET /api/contracts/by-token` | Público | Obtiene contrato |
| `POST /api/contracts/sign` | Público | Procesa firma |

---

## 💾 Base de Datos - Campos de Firma

```sql
signatureToken    -- UUID único
expiresAt         -- 7 días desde generación
signatureData     -- Base64 PNG de la firma
isSigned          -- true/false
signedAt          -- Timestamp cuando se firmó
status            -- 'draft' | 'sent' | 'signed'
```

---

## 🔐 Seguridad

- ✅ Token único (UUID v4)
- ✅ Expiración 7 días
- ✅ Una sola firma por contrato
- ✅ Validación en servidor
- ✅ Sin requiere login para firmar

---

## 📚 Documentación Completa

- `CONTRACT_SIGNATURE_SYSTEM.md` - Guía completa (50+ secciones)
- `CONTRACT_SIGNATURE_TESTS.md` - Tests y validación
- `CONTRACT_SIGNATURE_VISUAL.md` - Diagramas y arquitectura

---

## ⚠️ Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Token no encontrado" | Verificar que contractId existe en BD |
| "Unauthorized" | Token JWT expirado, re-autenticar |
| "Link expirado" | Token tiene > 7 días, generar nuevo |
| "Ya firmado" | Contrato ya fue firmado, no se puede firmar 2x |
| Canvas no dibuja | Usar navegador moderno (Chrome, Firefox, Safari) |

---

## 🎬 Video Tutorial (Simulado)

```
0:00  - Admin ingresa a dashboard
0:15  - Navega a "Generar Links de Firma"
0:30  - Selecciona contrato
0:45  - Genera link (click)
1:00  - Copia link
1:15  - Comparte con cliente
1:30  - Cliente abre link (sin login!)
1:45  - Cliente dibuja firma
2:00  - Cliente envía
2:15  - Admin recibe notificación
2:30  - ✅ Contrato firmado
```

---

## 🔗 URLs de Prueba

```bash
# Admin - Generar links
http://localhost:3001/app/dashboard/contracts/signature-links

# Cliente - Página de firma (ejemplo)
http://localhost:3001/contract/550e8400-e29b-41d4-a716-446655440000
```

---

## 📊 Estado Actual

```
✅ Backend: 3 APIs funcionales
✅ Frontend: 2 páginas UI completas
✅ Seguridad: Tokens UUID + expiración
✅ BD: Schema + campos completos
✅ Tests: Guía completa
✅ Docs: 4 archivos de documentación
```

---

**¡Listo para producción!** 🚀
