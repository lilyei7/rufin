# 🔧 SOLUCIÓN - ASIGNAR INSTALADOR JORGE A PROYECTO

## ❌ El Problema
El vendedor Jhayco intenta asignar a Jorge (instalador) a un proyecto, pero **Jorge no aparece en la lista** de instaladores disponibles.

## ✅ La Solución

### Paso 1: Verificar que Jorge está Activo

**URL:** http://localhost:3000/dashboard/admin/installers

**Acciones:**
1. Abre la página de Gestión de Instaladores (solo admin)
2. Busca a "Jorge" en la lista
3. Si ves su nombre con botón "Desactivar" → Ya está ACTIVO ✅
4. Si ves su nombre con botón "Activar" → Está INACTIVO ❌

**Si está INACTIVO:**
- Haz clic en botón "Activar"
- Espera a que se actualice
- Jorge aparecerá con estado "ACTIVO" (verde)

### Paso 2: Verifica que Jhayco puede Verlo

**URL:** http://localhost:3000/dashboard/projects

**Para Jhayco (Vendedor):**
1. Ve a "Proyectos" en el dashboard
2. Abre o crea un proyecto
3. Busca el botón "Asignar Instalador" o similar
4. Haz clic en el dropdown de instaladores
5. **Jorge debería aparecer ahora** en la lista

---

## 🔑 Por Qué No Aparecía Jorge

Hay 3 razones posibles:

### Razón 1: Jorge está INACTIVO
```
Estado en BD: active = false
❌ No aparece en la lista de asignación
✅ Solución: Activarlo en /dashboard/admin/installers
```

### Razón 2: Jorge no tiene role "installer"
```
Verificar en BD: SELECT role FROM users WHERE name = 'Jorge'
Debe ser: role = 'installer'
```

### Razón 3: El API no devuelve a Jorge
```
Verificar: GET /api/installers/available
Debería devolver Jorge si:
  - role = 'installer' ✓
  - active = true ✓
```

---

## 🚀 Solución Rápida (Sin Ir al Admin)

Si no tienes acceso al admin, puedes **activar Jorge directamente con una petición**:

```bash
curl -X POST http://localhost:3000/api/admin/installers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "installerId": 2,
    "active": true
  }'
```

Reemplaza:
- `2` con el ID real de Jorge
- `{TOKEN}` con tu token de admin

---

## 📋 Checklist para Jhayco

- [ ] ¿Jorge está registrado como instalador? (ir a `/installer/register`)
- [ ] ¿Jorge completó la firma del contrato?
- [ ] ¿Jorge está ACTIVO en `/dashboard/admin/installers`?
- [ ] ¿El admin ya lo activó?
- [ ] Ahora intentar asignar a Jorge en un proyecto

---

## 🎯 Nuevas Características Agregadas

### 1. API `/api/installers/available`
**Devuelve:** Lista de instaladores ACTIVOS disponibles
```
GET /api/installers/available
Response: { 
  installers: [{ id, name, username, email, active }],
  total: X
}
```

### 2. API `/api/admin/installers`
**GET:** Obtiene TODOS los instaladores (activos e inactivos)
**POST:** Activa/Desactiva un instalador

```
POST /api/admin/installers
Body: { installerId: 2, active: true }
```

### 3. Página `/dashboard/admin/installers`
**Para Admin:** Gestionar instaladores (activar/desactivar)
- Ver lista de todos los instaladores
- Activar instaladores inactivos
- Ver estado actual
- Estadísticas (total, activos, inactivos)

---

## 🔐 Flujo Completo

```
JORGE SE REGISTRA
   ↓
/installer/register
   ↓
Crea usuario + Firma contrato
   ↓
EN BD: active = false (por defecto)
   ↓
❌ NO APARECE en lista de asignación
   ↓
ADMIN ACTIVA A JORGE
   ↓
/dashboard/admin/installers
   ↓
[Botón Activar para Jorge]
   ↓
EN BD: active = true
   ↓
✅ JORGE APARECE en lista de asignación
   ↓
JHAYCO PUEDE ASIGNARLO
   ↓
/dashboard/projects
   ↓
[Dropdown Instaladores]
   ↓
✓ Jorge disponible para asignar
```

---

## 💡 Tips

✅ **Jorge debe estar ACTIVO para aparecer**
✅ **Jhayco verá a Jorge cuando esté activo**
✅ **El admin puede activar/desactivar instaladores**
✅ **La página de admin muestra estado actual**

---

## 📞 Verificación Final

**Para verificar que Jorge está correctamente activo:**

1. Abre: http://localhost:3000/dashboard/admin/installers
2. Busca a "Jorge"
3. Verifica que tenga botón "Desactivar" (significa que está ACTIVO)
4. Si tiene botón "Activar", haz clic para activarlo
5. Listo, Jhayco ya puede asignarlo

---

**✅ RESUELTO**

Jorge ya debería aparecer en la lista de instaladores disponibles para Jhayco.

