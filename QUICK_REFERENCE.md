# ⚡ Guía de Referencia Rápida

## 🚀 Iniciar el Sistema

```bash
cd /home/gordon/Escritorio/rufin
npm run dev
```

Abre: `http://localhost:3000`

---

## 🔐 Credenciales Quick Access

### Admin Dashboard
```
URL: http://localhost:3000/dashboard
Email: superadmin@example.com
Pass: password123
```

### Portal Cliente
```
URL: http://localhost:3000/portal
Code: CLIENT001
```

---

## 📍 URLs Principales

| Página | URL | Descripción |
|--------|-----|-------------|
| Dashboard | `/dashboard` | Inicio |
| Proyectos | `/dashboard/projects` | Lista de proyectos con incidencias |
| Incidencias | `/dashboard/incidents` | Todas las incidencias |
| Incidencias (proyecto) | `/dashboard/incidents?projectId=X` | Incidencias de un proyecto |
| Nueva Incidencia | `/dashboard/incidents/new` | Crear incidencia |
| Nueva Incidencia (proyecto) | `/dashboard/incidents/new?projectId=X` | Crear desde proyecto |
| Detalles Incidencia | `/dashboard/incidents/[id]` | Ver detalles |
| Contratos | `/dashboard/contracts` | Gestión de contratos |
| Portal | `/portal` | Acceso de clientes |

---

## 🎯 Operaciones Comunes

### Ver Proyectos con Incidencias
```
1. Dashboard → Proyectos
2. Cada tarjeta muestra incidencias inline
3. Ver primeras 5 + contador
```

### Crear Incidencia desde Proyecto
```
1. Dashboard → Proyectos
2. Click "Nueva Incidencia" en proyecto
3. Formulario abre con proyecto pre-seleccionado
4. Completar: título, tipo, prioridad, costo
5. Submit
```

### Buscar Incidencias por Prioridad
```
1. Dashboard → Incidencias
2. Selector "Prioridad" → seleccionar
3. Resultados se filtran automáticamente
```

### Cambiar Estado de Incidencia
```
1. Dashboard → Incidencias
2. Click en incidencia
3. Selector "Cambiar estado a:"
4. Submit
```

### Ver Incidencias de Proyecto Específico
```
1. Dashboard → Proyectos
2. Click "Ver Incidencias" en proyecto
3. O acceder directamente: /dashboard/incidents?projectId=X
```

---

## 🎨 Color Reference

### Prioridades
| Color | Prioridad | CSS |
|-------|-----------|-----|
| 🔴 | Crítica | `bg-red-100 text-red-800` |
| 🟠 | Alta | `bg-orange-100 text-orange-800` |
| 🟡 | Media | `bg-yellow-100 text-yellow-800` |
| 🟢 | Baja | `bg-green-100 text-green-800` |

### Estados
| Color | Estado | CSS |
|-------|--------|-----|
| 🟡 | Pendiente | `bg-yellow-100 text-yellow-800` |
| 🟢 | Aprobada | `bg-green-100 text-green-800` |
| 🔴 | Rechazada | `bg-red-100 text-red-800` |
| 🔵 | En Progreso | `bg-blue-100 text-blue-800` |
| 🟣 | Completada | `bg-purple-100 text-purple-800` |

---

## 📋 Tipos de Incidencia

```
change_order       → Orden de Cambio
extra_work         → Trabajo Extra
damage             → Daño
material_shortage  → Falta de Material
special ✨         → Especial / Excepcional
other              → Otro
```

---

## 🔄 Estados de Incidencia

```
pending       → Pendiente
approved      → Aprobada
rejected      → Rechazada
in_progress   → En Progreso
completed     → Completada
```

---

## 💾 Base de Datos

### Conexión
```
Host: localhost
Port: 5433
Database: rufin_db
User: postgres
Password: postgres
```

### Resync Schema
```bash
npx prisma db push
```

### Reseed Data
```bash
node prisma/seed-contracts.js
```

---

## 🐛 Problemas Comunes

| Problema | Solución |
|----------|----------|
| Puerto 3000 ocupado | `npm run dev -- --port 3001` |
| No aparecen datos | `node prisma/seed-contracts.js` |
| Token expirado | Loguearse nuevamente |
| Conexión DB | Verificar PostgreSQL en puerto 5433 |
| Errores build | `npm run build` |

---

## 📊 Tipos de Datos

### Prioridades (enum)
```
"critical" | "high" | "medium" | "low"
```

### Estados de Incidencia (enum)
```
"pending" | "approved" | "rejected" | "in_progress" | "completed"
```

### Tipos de Incidencia (enum)
```
"change_order" | "extra_work" | "damage" | "material_shortage" | "special" | "other"
```

---

## 🔗 API Endpoints

### Incidencias
```
GET    /api/incidents
POST   /api/incidents
GET    /api/incidents?projectId=X
PATCH  /api/incidents/:id
```

### Proyectos
```
GET    /api/projects
GET    /api/projects/:id
```

### Autenticación
```
POST   /api/login
POST   /api/portal/login
```

---

## 📱 Interfaces Principales

### Proyecto Card
- Nombre
- Factura
- Cliente
- Costo Total
- Fechas
- Lista de incidencias (primeras 5)
- 3 botones: Detalles, Nueva, Ver

### Incidencia Card
- Título
- Número
- Prioridad (color)
- Estado (color)
- Link a detalles

### Modal Proyecto
- Info completa
- Lista completa de incidencias
- Contador total

---

## ⌨️ Atajos Útiles

| Atajo | Acción |
|-------|--------|
| ESC | Cerrar modal |
| Ctrl+B | Ir a Dashboard (desde cualquier parte) |
| Enter | Submit formulario |

---

## 🎓 Casos de Uso Principales

1. **Ver Proyectos**: `/dashboard/projects`
2. **Crear Incidencia desde Proyecto**: Proyecto → Nueva Incidencia
3. **Buscar Incidencia**: `/dashboard/incidents` + filtros
4. **Ver Detalles**: Click en incidencia
5. **Cambiar Estado**: Detalles → selector estado
6. **Portal Cliente**: `/portal` + código

---

## 📞 Contacto de Referencia

Para dudas sobre:
- **Desarrollo**: Contactar equipo tech
- **Datos**: Revisar `SYSTEM_DOCUMENTATION.md`
- **Casos de Uso**: Revisar `USE_CASES.md`
- **API**: Revisar `app/api/`

---

**Última actualización**: 2024
**Versión**: 1.0.0

