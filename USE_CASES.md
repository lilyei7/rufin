# 🎯 Casos de Uso - Sistema de Proyectos e Incidencias

## Caso de Uso 1: Ver Proyectos con Resumen de Incidencias

### 🎬 Escena
Un gerente de proyectos quiere ver todos los proyectos activos y saber rápidamente cuántas incidencias tiene cada uno.

### 📍 Ubicación
```
http://localhost:3000/dashboard/projects
```

### 👁️ Lo que ve

Cada proyecto se muestra como una tarjeta con:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PROYECTO SOLAR RESIDENCIAL                                │
│  Factura: FAC-001-2024                                     │
│  Cliente: Cliente ABC Corp                                 │
│  Costo Total: $50,000.00                                   │
│  Inicio: 2024-01-15  |  Fin: 2024-03-30                   │
│  Creado por: superadmin@example.com                        │
│                                                             │
│  🚨 Incidencias: 2 en total                               │
│  ├─ Falta de Material (ALTA PRIORIDAD)   [Pendiente]      │
│  │  INV-002-2024                                          │
│  └─ Daño en Panel Solar (MEDIA PRIORIDAD) [Aprobada]      │
│     INV-003-2024                                          │
│                                                             │
│  ┌──────────────┐ ┌──────────────────┐ ┌────────────────┐ │
│  │ Ver Detalles │ │ Nueva Incidencia │ │ Ver Incidencias│ │
│  └──────────────┘ └──────────────────┘ └────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🎮 Acciones disponibles

#### 1. **Ver Detalles** (botón azul)
- Abre modal con información completa del proyecto
- Muestra lista completa de todas las incidencias
- Contador total de incidencias

#### 2. **Nueva Incidencia** (botón naranja)
- Abre formulario de crear incidencia
- El proyecto está pre-seleccionado automáticamente
- Solo debe completar: título, tipo, prioridad, descripción, costo

#### 3. **Ver Incidencias** (botón púrpura)
- Redirecciona a `/dashboard/incidents?projectId=X`
- Filtra lista completa para mostrar solo incidencias de este proyecto
- Puede aplicar filtros adicionales allí

---

## Caso de Uso 2: Crear Incidencia Directamente desde Proyecto

### 🎬 Escena
Surge un problema en un proyecto. El supervisor quiere crear inmediatamente una incidencia desde la lista de proyectos.

### 📍 Ubicación
```
http://localhost:3000/dashboard/projects
↓
Click "Nueva Incidencia" en tarjeta del proyecto
↓
http://localhost:3000/dashboard/incidents/new?projectId=X
```

### 👁️ Lo que sucede

1. **Antes de click**:
   ```
   Ver tarjeta del proyecto con botón "Nueva Incidencia" (naranja)
   ```

2. **Después de click**:
   ```
   Formulario se abre con:
   - ✅ Proyecto: "FAC-001-2024 - PROYECTO SOLAR RESIDENCIAL" 
     (ya está seleccionado y deshabilitado para cambios)
   - ⬜ Título: [campo vacío]
   - ⬜ Descripción: [campo vacío]
   - ⬜ Tipo: [dropdown con 6 opciones]
     - Orden de Cambio
     - Trabajo Extra
     - Daño
     - Falta de Material
     - Especial ✨
     - Otro
   - ⬜ Prioridad: [dropdown con 4 opciones]
     - Baja
     - Media
     - Alta
     - Crítica
   - ⬜ Costo Adicional: [campo vacío]
   ```

3. **Usuario completa formulario**:
   ```
   Título: "Falta de paneles solares"
   Descripción: "El proveedor aún no envía los 10 paneles restantes"
   Tipo: "Falta de Material"
   Prioridad: "Alta"
   Costo: "0.00"
   ```

4. **Usuario hace submit**:
   ```
   ✅ Incidencia creada: INV-004-2024
   
   → Formulario se limpia
   → Mensaje de éxito aparece por 2 segundos
   → Redirecciona a: /dashboard/incidents
   ```

### 🔍 Validaciones

- ✅ Proyecto: **Requerido**
- ✅ Título: **Requerido** (máximo 255 caracteres)
- ✅ Descripción: Opcional
- ✅ Tipo: **Requerido** (6 opciones)
- ✅ Prioridad: Opcional (default: Media)
- ✅ Costo: Número decimal, default 0.00

---

## Caso de Uso 3: Ver Incidencias Filtradas por Proyecto

### 🎬 Escena
El supervisor quiere ver todas las incidencias de un proyecto específico para evaluar el progreso general del proyecto.

### 📍 Ubicación
```
http://localhost:3000/dashboard/projects
↓
Click "Ver Incidencias" en tarjeta del proyecto
↓
http://localhost:3000/dashboard/incidents?projectId=2
```

### 👁️ Lo que ve

**Header diferente**:
```
┌─────────────────────────────────────────┐
│ ← [atrás]  🚨 Incidencias del Proyecto │
│     ┌──────────────────────────────────┐│
│     │ Filtrado por Proyecto #2 [badge] ││
│     └──────────────────────────────────┘│
│ Gestiona imprevistos, cambios y trabajos│
│ adicionales                              │
└─────────────────────────────────────────┘
```

**Botón "atrás" funcional**:
- Click en ← o en botón rojo "Atrás" = vuelve a `/dashboard/projects`

**Estadísticas actualizadas**:
```
┌────────────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐
│ Total Incidencias│ │Pendientes│ │En Progreso │ │ Costo Total  │
│      2         │ │    1      │ │     1      │ │  $5,000.00   │
└────────────────┘ └────────────┘ └─────────────┘ └──────────────┘
```

Solo muestra incidencias del proyecto #2.

---

## Caso de Uso 4: Búsqueda y Filtrado Multi-Dimensional

### 🎬 Escena
Un supervisor necesita encontrar todas las incidencias de "Alta Prioridad" que aún están "Pendientes" en TODO el sistema.

### 📍 Ubicación
```
http://localhost:3000/dashboard/incidents
```

### 👁️ Panel de Búsqueda y Filtros

```
┌─────────────────────────────────────────────────────────────────┐
│ BUSCAR Y FILTRAR                                                │
│                                                                 │
│ ┌────────────────────────────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Buscar por título, número...   │ │ Estado   │ │  Tipo    │  │
│ └────────────────────────────────┘ └──────────┘ └──────────┘  │
│   (2 cols)                         (1 col)     (1 col)         │
│                                                                 │
│ ┌──────────────┐ ┌──────────────────────────────────────────┐  │
│ │ Prioridad    │ │ Limpiar filtros                         │  │
│ └──────────────┘ └──────────────────────────────────────────┘  │
│ (1 col)         (2 cols)                                       │
│                                                                 │
│ ✅ Resultados: 3 incidencias que coinciden con los filtros     │
└─────────────────────────────────────────────────────────────────┘
```

### 🎮 Filtrado Paso a Paso

**Estado inicial**: Todas las incidencias mostradas

**Paso 1**: Seleccionar "Pendiente" en filtro de Estado
```
Resultados: 5 incidencias con status="pending"
(El campo se vuelve amarillo para indicar filtro activo)
```

**Paso 2**: Seleccionar "Alta" en filtro de Prioridad
```
Resultados: 3 incidencias que tienen AMBAS condiciones:
- status = "pending" AND
- priority = "high"
```

**Paso 3**: Escribir "Material" en búsqueda de texto
```
Resultados: 1 incidencia que tiene:
- status = "pending" AND
- priority = "high" AND
- (title contiene "Material" O description contiene "Material")
```

**Paso 4**: Hacer click en "Limpiar filtros"
```
Todos los campos se resetean
Muestra todas las incidencias nuevamente
```

### 🔄 Filtros Independientes

Cada filtro funciona independientemente pero se aplican TODOS juntos:

1. **Búsqueda de texto**: Busca en 3 campos
   - `title` (título de la incidencia)
   - `incidentInvoiceNumber` (número de referencia)
   - `description` (descripción detallada)
   - **Búsqueda case-insensitive** (mayúsculas/minúsculas indiferente)

2. **Estado**: 5 opciones
   - Todos los estados (sin filtro)
   - Pendiente
   - Aprobada
   - En Progreso
   - Completada
   - Rechazada

3. **Tipo**: 6 opciones (NUEVO: incluye "Especial")
   - Todos los tipos (sin filtro)
   - Orden de Cambio
   - Trabajo Extra
   - Daño
   - Falta de Material
   - Especial ✨
   - Otro

4. **Prioridad**: 4 opciones
   - Todas las prioridades (sin filtro)
   - Crítica (roja)
   - Alta (naranja)
   - Media (amarilla)
   - Baja (verde)

---

## Caso de Uso 5: Tipo Especial de Incidencia

### 🎬 Escena
Sucede algo inesperado en un proyecto que no encaja en las categorías normales (cambio de cliente, cambio de regulación, etc.). El supervisor necesita registrar esto como una "Incidencia Especial".

### 📍 Ubicación
```
http://localhost:3000/dashboard/incidents/new?projectId=1
```

### 👁️ Lo que ve

**Dropdown de Tipo**:
```
Selecciona tipo de incidencia:
├─ Orden de Cambio
├─ Trabajo Extra
├─ Daño
├─ Falta de Material
├─ Especial ✨ ← NUEVO
└─ Otro
```

### 🎮 Crear Incidencia Especial

1. **Selecciona proyecto**: "FAC-001-2024"
2. **Ingresa título**: "Cambio de Norma de Seguridad Regional"
3. **Escribe descripción**: "Nueva norma emitida por autoridades regionales que requiere modificación en instalación"
4. **Selecciona tipo**: "Especial" ✨
5. **Selecciona prioridad**: "Alta"
6. **Costo**: "2500.00"
7. **Submit**

**Resultado**:
```
✅ Incidencia creada: INV-005-2024
- Proyecto: FAC-001-2024
- Tipo: Especial
- Estado: Pendiente (default)
- Prioridad: Alta
- Costo: $2,500.00
```

### 📊 Después de crear

**En lista de incidencias**:
- Aparece con etiqueta "Especial" en lugar de "Otro"
- Se puede filtrar por tipo "Especial"
- Muestra icono especial para diferenciar de otras

---

## Caso de Uso 6: Color-Coding Visual

### 🎬 Escena
Un supervisor escanea rápidamente la lista de incidencias para identificar visualmente cuáles son las más críticas.

### 👁️ Lo que ve

**Prioridades** (colores):
```
🔴 [Crítica]      ← Rojo brillante (urgencia máxima)
🟠 [Alta]         ← Naranja (urgencia alta)
🟡 [Media]        ← Amarillo (moderada)
🟢 [Baja]         ← Verde (baja urgencia)
```

**Estados** (colores):
```
🟡 Pendiente      ← Amarillo
🟢 Aprobada       ← Verde
🔴 Rechazada      ← Rojo
🔵 En Progreso    ← Azul
🟣 Completada     ← Púrpura
```

### 📍 Ubicación de colores

En cada tarjeta de incidencia en la lista:

```
┌──────────────────────────────────────────┐
│ Falta de Material                        │
│ INV-002-2024                             │
│                                          │
│ ┌─────────────┐  ┌──────────────┐       │
│ │ ALTA PRIORIDAD │ │ PENDIENTE  │       │
│ │  (naranja)   │  │ (amarillo)  │       │
│ └─────────────┘  └──────────────┘       │
│                                          │
└──────────────────────────────────────────┘
```

---

## Caso de Uso 7: Portal de Cliente - Ver Incidencias Vinculadas

### 🎬 Escena
Un cliente accede a su portal para ver qué incidencias se han reportado en sus proyectos.

### 📍 Ubicación
```
http://localhost:3000/portal
```

### 👁️ Flujo de Autenticación

1. **Página inicial del portal**:
   ```
   ┌────────────────────────────────┐
   │   ACCESO AL PORTAL             │
   │                                │
   │   Ingrese su código de acceso: │
   │   ┌──────────────────────────┐ │
   │   │ [campo de código]        │ │
   │   └──────────────────────────┘ │
   │                                │
   │   ┌──────────────────────────┐ │
   │   │    Acceder             │ │
   │   └──────────────────────────┘ │
   └────────────────────────────────┘
   ```

2. **Usuario ingresa código**:
   ```
   Código: CLIENT001
   ↓
   ✅ Autenticado
   ```

3. **Dashboard del cliente**:
   ```
   Bienvenido: Cliente ABC Corp
   Token válido por: 7 días
   
   Mis Proyectos:
   ├─ FAC-001-2024: PROYECTO SOLAR RESIDENCIAL
   │  Incidencias: 2
   │  └─ Falta de Material (Alta)
   │  └─ Daño (Media)
   └─ FAC-002-2024: EXPANSIÓN SISTEMA
      Incidencias: 0
   
   Mis Contratos:
   ├─ CONTRATO-001-2024 [Firmado]
   └─ CONTRATO-002-2024 [Pendiente Firma]
   ```

---

## Caso de Uso 8: Ver Detalles Completos de Proyecto

### 🎬 Escena
Un gerente quiere ver toda la información detallada de un proyecto incluyendo todas sus incidencias.

### 📍 Ubicación
```
http://localhost:3000/dashboard/projects
↓
Click "Ver Detalles" en tarjeta del proyecto
```

### 👁️ Modal de Detalles

```
╔═══════════════════════════════════════════════════════════════╗
║ DETALLES DEL PROYECTO                                       ║
║                                         [X] Cerrar          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                              ║
║ 📋 INFORMACIÓN GENERAL                                      ║
║ ├─ Nombre: PROYECTO SOLAR RESIDENCIAL                      ║
║ ├─ Factura: FAC-001-2024                                   ║
║ ├─ Cliente: Cliente ABC Corp                               ║
║ ├─ Estado: In Progress                                      ║
║ ├─ Costo Total: $50,000.00                                 ║
║ ├─ Inicio: 2024-01-15                                      ║
║ ├─ Fin: 2024-03-30                                         ║
║ └─ Creado por: superadmin@example.com                      ║
║                                                              ║
║ 🚨 INCIDENCIAS: 2 Total                                    ║
║ ├─ Falta de Material [Alta] [Pendiente]                   ║
║ │  INV-002-2024 | Costo: $500.00                          ║
║ │                                                          ║
║ └─ Daño en Panel [Media] [Aprobada]                        ║
║    INV-003-2024 | Costo: $1,200.00                        ║
║                                                              ║
║ 📝 NOTAS:                                                   ║
║ Proyecto en progreso. Esperando llegada de materiales.    ║
║ Cliente reportó cambio en requisitos de seguridad.        ║
║                                                              ║
╠═══════════════════════════════════════════════════════════════╣
║ [Cerrar]  [Editar]  [Nueva Incidencia]                     ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Caso de Uso 9: Navegar por Todas las Incidencias Globales

### 🎬 Escena
El administrador quiere ver TODAS las incidencias del sistema (todos los proyectos) y aplicar filtros diversos.

### 📍 Ubicación
```
http://localhost:3000/dashboard/incidents
(sin parámetro projectId en URL)
```

### 👁️ Lo que ve

**Header diferente al caso filtrado**:
```
┌───────────────────────────────────────┐
│ 🚨 Todas las Incidencias              │
│ Gestiona imprevistos, cambios y       │
│ trabajos adicionales                   │
│                                       │
│ [Nueva Incidencia] (botón visible)    │
└───────────────────────────────────────┘
```

**Botón "Nueva Incidencia"**:
- Redirige a `/dashboard/incidents/new`
- Sin proyecto pre-seleccionado
- Usuario debe seleccionar el proyecto

**Estadísticas globales**:
```
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│ Total 23     │ │Pendientes│ │En Progreso 8 │ │ Costo Total  │
│ Incidencias  │ │    5     │ │              │ │  $45,320.00  │
└──────────────┘ └──────────┘ └──────────────┘ └──────────────┘
```

---

## Caso de Uso 10: Cambiar Estado de una Incidencia

### 🎬 Escena
Una incidencia que estaba "Pendiente" ha sido revisada y aprobada. El supervisor quiere actualizar su estado.

### 📍 Ubicación
```
http://localhost:3000/dashboard/incidents/2
```

### 👁️ Página de Detalles

```
┌─────────────────────────────────────────────┐
│ Falta de Material                          │
│ INV-002-2024                               │
│                                             │
│ Estado actual: [Pendiente] ⏱️               │
│ ┌──────────────────────────────────────┐  │
│ │ Cambiar estado a:                    │  │
│ │ ┌────────────────────────────────┐  │  │
│ │ │ Pendiente    ✓ (actual)        │  │  │
│ │ │ Aprobada                       │  │  │
│ │ │ Rechazada                      │  │  │
│ │ │ En Progreso                    │  │  │
│ │ │ Completada                     │  │  │
│ │ └────────────────────────────────┘  │  │
│ │                                      │  │
│ │ Comentario (opcional):               │  │
│ │ ┌────────────────────────────────┐  │  │
│ │ │ [campo de texto multilinea]    │  │  │
│ │ └────────────────────────────────┘  │  │
│ │                                      │  │
│ │ [Actualizar] [Cancelar]             │  │
│ └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 🎮 Cambio de Estado

1. **Selector cambia de "Pendiente" a "Aprobada"**
2. **Agrega comentario** (opcional): "Aprobada por gerente - materiales confirman entrega para el 20/03"
3. **Click "Actualizar"**

**Resultado**:
```
✅ Incidencia actualizada

Estado: Pendiente → Aprobada ✓
Comentario registrado: "Aprobada por gerente..."
Registrado por: superadmin@example.com
Fecha: 2024-03-15 14:30:45

Historial actualizado:
├─ 2024-03-15 14:30:45: Cambio a Aprobada (superadmin) "Aprobada por gerente..."
└─ 2024-03-14 09:15:22: Creación (purchasing) "Falta de Material"
```

---

## 📊 Resumen de Integraciones

### Flujos de Navegación

```
PROYECTOS (projects page)
    ↓
    ├─ [Ver Detalles] → Modal con detalles + todas las incidencias
    ├─ [Nueva Incidencia] → /incidents/new?projectId=X
    └─ [Ver Incidencias] → /incidents?projectId=X

INCIDENCIAS (incidents page)
    ├─ Global (/incidents)
    │   ├─ Filtros: Buscar, Estado, Tipo, Prioridad
    │   ├─ [Nueva Incidencia] → /incidents/new
    │   └─ Cada incidencia → /incidents/[id]
    │
    └─ Filtrada por Proyecto (/incidents?projectId=X)
        ├─ Badge: "Filtrado por Proyecto #X"
        ├─ Botón atrás → volver a /projects
        ├─ [Nueva Incidencia] (modal inline)
        └─ Mismo filtrado y búsqueda

CREAR INCIDENCIA
    ├─ Desde proyecto: /incidents/new?projectId=X
    │   └─ Proyecto pre-seleccionado
    └─ Global: /incidents/new
        └─ Usuario selecciona proyecto

DETALLES INCIDENCIA
    ├─ Ver información completa
    ├─ Cambiar estado
    ├─ Ver historial
    └─ Agregar comentarios
```

---

**¡El sistema está completamente integrado y listo para usar!** ✨

