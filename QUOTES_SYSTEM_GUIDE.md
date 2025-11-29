# 📊 Panel Público de Cotizaciones - Guía de Uso

## Descripción General
Se ha implementado un sistema completo de cotizaciones públicas donde:
- ✅ Todos pueden ver las cotizaciones **publicadas** de todos los vendedores
- ✅ Datos 100% desde base de datos (Prisma + SQLite)
- ✅ Panel CRUD completo para vendedores gestionar sus cotizaciones
- ✅ 12 cotizaciones de ejemplo de 3 vendedores diferentes

---

## 🎯 URLs Disponibles

### Panel Público (Sin autenticación)
- **URL:** `http://localhost:3000/quotes`
- **Descripción:** Ve todas las cotizaciones publicadas de todos los vendedores
- **Funcionalidades:**
  - 🔍 Búsqueda por número, cliente o descripción
  - 🏢 Filtro por vendedor
  - 📈 Ordenar por precio o fecha
  - 🔗 Ver detalles de cotización

### Panel de Cotizaciones (Con autenticación - Vendedor)
- **URL:** `http://localhost:3000/dashboard/quotes-manager`
- **Descripción:** Gestiona tus propias cotizaciones
- **Funcionalidades:**
  - 📋 Ver todas tus cotizaciones
  - ✏️ Cambiar estado (borrador → publicada → aceptada)
  - 🔗 Copiar link público de cotización
  - 🗑️ Eliminar cotizaciones
  - 📊 Ver estadísticas (total, borradores, publicadas, aceptadas)

### API de Cotizaciones Públicas
```
GET /api/quotes?public=true
```
**Retorna:** Todas las cotizaciones con estado "published" y sin expirar

**Ejemplo de respuesta:**
```json
{
  "quotes": [
    {
      "id": 1,
      "quoteNumber": "COT-0001",
      "clientName": "TechCorp #1",
      "totalCost": 4500,
      "status": "published",
      "vendor": {
        "id": 4,
        "name": "Juan Hayco",
        "email": "jhayco@rufin.com"
      },
      "items": [
        {
          "productName": "Instalación premium",
          "quantity": 2,
          "unitPrice": 1000
        }
      ]
    }
  ],
  "total": 11
}
```

---

## 📊 Datos de Ejemplo

### Vendedores Creados
| Usuario | Contraseña | Rol | Email |
|---------|-----------|-----|-------|
| jhayco | vendor123 | vendor | jhayco@rufin.com |
| vendor2 | vendor123 | vendor | vendor2@rufin.com |
| vendor3 | vendor123 | vendor | vendor3@rufin.com |

### Cotizaciones (12 total)
- **Juan Hayco:** 4 cotizaciones (estado: published)
- **Carlos López:** 4 cotizaciones (estado: published)
- **María García:** 3 publicadas + 1 borrador

### Productos Disponibles
- Instalación básica: $500
- Instalación premium: $1000
- Tuberías PVC: $50/metro
- Accesorios: $25/unidad

---

## 🔄 Operaciones CRUD

### 1. Crear Cotización (POST)
```
POST /api/quotes
Authorization: Bearer {token}

{
  "clientName": "Nuevo Cliente",
  "clientEmail": "cliente@example.com",
  "clientPhone": "+58-123-4567",
  "description": "Servicio de instalación",
  "items": [
    {
      "productId": 1,
      "productName": "Instalación básica",
      "quantity": 2,
      "unitPrice": 500
    }
  ],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

### 2. Obtener Cotizaciones (GET)
```
GET /api/quotes                    # Tus cotizaciones (requiere auth)
GET /api/quotes?public=true        # Todas las públicas (sin auth)
GET /api/quotes?status=published   # Filtrar por estado (requiere auth)
```

### 3. Cambiar Estado (PATCH)
```
PATCH /api/quotes/{id}
Authorization: Bearer {token}

{
  "status": "published"  // draft, published, accepted
}
```

### 4. Eliminar Cotización (DELETE)
```
DELETE /api/quotes/{id}
Authorization: Bearer {token}
```

---

## 🧪 Testing

### 1. Ver Panel Público
```bash
# Abrir en navegador
http://localhost:3000/quotes
```

### 2. Testear API Pública
```bash
curl "http://localhost:3000/api/quotes?public=true" | jq .
```

### 3. Login y Acceder a Panel Privado
```bash
# 1. Hacer login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jhayco","password":"vendor123"}'

# 2. Usar token en headers
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/quotes

# 3. Ir a panel en navegador
http://localhost:3000/dashboard/quotes-manager
```

---

## 🗄️ Base de Datos

### Tablas Relevantes
- `quotes` - Cotizaciones
- `quote_items` - Items de cotizaciones
- `users` - Vendedores
- `products` - Productos disponibles

### Consultas Útiles (SQLite)
```sql
-- Ver todas las cotizaciones publicadas
SELECT * FROM quotes WHERE status = 'published';

-- Ver cotizaciones por vendedor
SELECT * FROM quotes WHERE vendorId = 4;

-- Ver ingresos por vendedor
SELECT u.name, SUM(q.totalCost) 
FROM quotes q 
JOIN users u ON q.vendorId = u.id 
GROUP BY q.vendorId;
```

---

## 🔐 Seguridad

- ✅ Autenticación JWT (24h expiry)
- ✅ Solo vendedores pueden crear/editar sus cotizaciones
- ✅ Solo cotizaciones publicadas son visibles públicamente
- ✅ Links temporales con expiración configurable
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)

---

## 📝 Próximas Mejoras

- [ ] Formulario interactivo para crear cotizaciones desde UI
- [ ] Descarga de cotización en PDF
- [ ] Email automático cuando se publica una cotización
- [ ] Historial de cambios en cotizaciones
- [ ] Estadísticas avanzadas de ventas
- [ ] Sistema de descuentos por volumen

---

## 🚀 Repositorio GitHub
https://github.com/lilyei7/rufin

Commit actual: `feat: Add public quotes panel and quotes manager CRUD`
