# 📋 Sistema de Incidencias - Guía Completa

## 🎯 Propósito

El sistema de incidencias permite gestionar imprevistos, trabajos adicionales, cambios de cliente y problemas que surgen durante la ejecución de proyectos. Cada incidencia genera una factura adicional vinculada al proyecto original.

---

## 📊 Estructura de Datos

### Campos de una Incidencia

```typescript
interface Incident {
  id: number;
  projectId: number;                    // Proyecto al que pertenece
  projectName: string;                  // Nombre del proyecto (auto-poblado)
  incidentInvoiceNumber: string;        // Formato: INV-XXX-INC-YYY
  title: string;                        // Título descriptivo
  description: string;                  // Descripción detallada
  type: IncidentType;                   // Tipo de incidencia
  priority: IncidentPriority;           // Prioridad
  status: IncidentStatus;               // Estado actual
  items: IncidentItem[];                // Materiales/servicios adicionales
  totalCost: number;                    // Costo total calculado
  createdBy: string;                    // Usuario que creó
  createdAt: string;                    // Fecha de creación
  approvedBy?: string;                  // Usuario que aprobó
  approvedAt?: string;                  // Fecha de aprobación
  resolvedAt?: string;                  // Fecha de resolución
  updatedBy?: string;                   // Último usuario que modificó
  updatedAt?: string;                   // Última fecha de modificación
  history: HistoryEntry[];              // Historial de cambios
}
```

---

## 🏷️ Tipos de Incidencias

### `type` (IncidentType)

| Valor | Descripción | Uso Común |
|-------|-------------|-----------|
| `change_order` | Orden de Cambio | Cliente solicita modificaciones al proyecto original |
| `extra_work` | Trabajo Extra | Trabajo adicional no contemplado en cotización |
| `damage` | Daño | Daños encontrados que requieren reparación |
| `material_shortage` | Falta de Material | Material insuficiente o faltante |
| `other` | Otro | Cualquier otro imprevisto |

### `priority` (IncidentPriority)

| Valor | Descripción | Color Visual |
|-------|-------------|--------------|
| `low` | Baja | 🟢 Verde |
| `medium` | Media | 🟡 Amarillo |
| `high` | Alta | 🟠 Naranja |
| `critical` | Crítica | 🔴 Rojo |

### `status` (IncidentStatus)

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `pending` | Pendiente de aprobación | Aprobar / Rechazar |
| `approved` | Aprobado | Iniciar Trabajo |
| `rejected` | Rechazado | - |
| `in_progress` | En Progreso | Marcar como Completado |
| `completed` | Completado | - |

---

## 🔄 Flujo de Trabajo

### 1. Creación de Incidencia

**Quién puede crear:** Instaladores, Vendedores, Admin, Purchasing

```
1. Navegar a proyecto específico
2. Clic en botón "Incidencias"
3. Clic en "Nueva Incidencia"
4. Llenar formulario:
   - Título
   - Tipo
   - Prioridad
   - Descripción
   - Agregar materiales/servicios
5. Sistema genera automáticamente:
   - incidentInvoiceNumber (ej: INV-001-INC-001)
   - totalCost (suma de items)
   - Estado: pending
```

### 2. Aprobación

**Quién puede aprobar:** Admin, Purchasing

```
Estados: pending → approved (o rejected)

Opciones:
- ✅ Aprobar: Permite que comience el trabajo
- ❌ Rechazar: Cierra la incidencia sin ejecutar

Historial registra:
- Usuario que aprobó/rechazó
- Fecha y hora
- Comentario opcional
```

### 3. Ejecución

**Quién puede ejecutar:** Admin, Installers

```
Estados: approved → in_progress → completed

1. approved: Clic en "Iniciar Trabajo"
2. in_progress: Se ejecuta el trabajo adicional
3. completed: Clic en "Marcar como Completado"
```

---

## 💰 Sistema de Facturación

### Numeración de Facturas

**Proyecto Original:**
```
INV-001 - Nombre del Cliente
```

**Incidencias del Proyecto:**
```
INV-001-INC-001 (Primera incidencia)
INV-001-INC-002 (Segunda incidencia)
INV-001-INC-003 (Tercera incidencia)
...
```

### Cálculo de Costos

```javascript
// Cada item tiene:
{
  productId: number,
  productName: string,
  quantity: number,
  unitPrice: number
}

// Total de incidencia:
totalCost = sum(quantity × unitPrice) para cada item
```

### Ejemplo Real

**Proyecto: INV-001 - Cliente ABC**
- Costo Original: $5,000

**Incidencia 1: INV-001-INC-001**
- Tipo: damage (Daño estructural)
- Costo: $389
- Estado: completed

**Incidencia 2: INV-001-INC-002**
- Tipo: extra_work (Trabajo adicional)
- Costo: $150
- Estado: in_progress

**Costo Total del Proyecto:**
```
Original:     $5,000
INC-001:      $  389
INC-002:      $  150
─────────────────────
TOTAL:        $5,539
```

---

## 🔐 Permisos por Rol

### Admin (super_admin)
- ✅ Ver todas las incidencias
- ✅ Crear incidencias
- ✅ Aprobar/Rechazar
- ✅ Cambiar estado
- ✅ Eliminar incidencias

### Purchasing (purchasing)
- ✅ Ver incidencias de sus proyectos
- ✅ Crear incidencias
- ✅ Aprobar/Rechazar
- ✅ Cambiar estado
- ❌ Eliminar incidencias

### Installer (installer)
- ✅ Ver incidencias asignadas
- ✅ Crear incidencias
- ✅ Cambiar estado (in_progress → completed)
- ❌ Aprobar/Rechazar
- ❌ Eliminar incidencias

### Vendor (vendor)
- ✅ Ver incidencias de sus proyectos
- ✅ Crear incidencias
- ❌ Aprobar/Rechazar
- ❌ Eliminar incidencias

---

## 📡 API Endpoints

### GET `/api/incidents`

Obtener lista de incidencias (filtrado por rol)

**Query Parameters:**
- `projectId` (opcional): Filtrar por proyecto específico

**Respuesta:**
```json
{
  "incidents": [
    {
      "id": 1,
      "projectId": 1,
      "projectName": "INV-001 - Cliente ABC",
      "incidentInvoiceNumber": "INV-001-INC-001",
      "title": "Daño estructural encontrado",
      "type": "damage",
      "priority": "high",
      "status": "approved",
      "totalCost": 389,
      ...
    }
  ]
}
```

### POST `/api/incidents`

Crear nueva incidencia

**Body:**
```json
{
  "projectId": 1,
  "title": "Daño en pared",
  "description": "Se encontró daño estructural",
  "type": "damage",
  "priority": "high",
  "items": [
    {
      "productId": 5,
      "quantity": 2,
      "unitPrice": 100
    }
  ]
}
```

**Respuesta:**
```json
{
  "message": "Incidencia creada exitosamente",
  "incident": { ... }
}
```

### PATCH `/api/incidents`

Actualizar estado de incidencia

**Body:**
```json
{
  "id": 1,
  "status": "approved",
  "comment": "Aprobado para proceder"
}
```

### DELETE `/api/incidents`

Eliminar incidencia (solo admin)

**Query Parameters:**
- `id`: ID de la incidencia

---

## 🎨 Interfaz de Usuario

### Página Principal de Incidencias

**Ubicación:** `/dashboard/incidents`

**Estadísticas mostradas:**
- 📊 Total de Incidencias
- ⏰ Pendientes
- 🔄 En Progreso
- 💰 Costo Total

**Vista por Proyecto:** `/dashboard/incidents?projectId=1`

### Lista de Incidencias

Cada incidencia muestra:
- 🏷️ Título y descripción
- 🔢 Número de factura (INV-XXX-INC-YYY)
- 🎯 Tipo de incidencia (con icono)
- 🚦 Prioridad (con color)
- ✅ Estado actual
- 💵 Costo total
- 👤 Creador
- 📅 Fecha de creación

### Modal de Creación

**Campos:**
1. **Título*** (obligatorio)
2. **Tipo*** (select)
3. **Prioridad*** (select)
4. **Descripción** (textarea)
5. **Materiales/Servicios:**
   - Selector de producto (con precio automático)
   - Cantidad
   - Precio unitario (editable)
   - Botón para agregar/remover items

**Muestra:**
- Cálculo automático de costo total
- Vista previa de número de factura

### Modal de Detalles

**Información mostrada:**
- Estado actual (con botones de acción)
- Prioridad y tipo
- Costo total
- Descripción completa
- Lista de materiales/servicios
- Historial completo de cambios

**Acciones según estado:**
- **pending:** Botones "Aprobar" y "Rechazar"
- **approved:** Botón "Iniciar Trabajo"
- **in_progress:** Botón "Marcar como Completado"
- **completed/rejected:** Sin acciones

---

## 🔍 Casos de Uso Comunes

### Caso 1: Cliente solicita cambio

```
1. Vendedor crea incidencia:
   - Tipo: change_order
   - Prioridad: medium
   - Descripción: "Cliente desea agregar ventana extra"
   
2. Purchasing aprueba:
   - Revisa costo adicional
   - Aprueba incidencia
   
3. Instalador ejecuta:
   - Inicia trabajo
   - Completa instalación
   - Marca como completado
   
4. Sistema genera:
   - Factura INV-XXX-INC-YYY
   - Historial completo
```

### Caso 2: Daño encontrado durante instalación

```
1. Instalador detecta daño:
   - Tipo: damage
   - Prioridad: critical
   - Agrega fotos en descripción
   
2. Admin revisa y aprueba:
   - Valida necesidad de reparación
   - Aprueba presupuesto adicional
   
3. Trabajo inmediato:
   - Estado: in_progress
   - Reparación completada
   
4. Cierre:
   - Marcado como completed
   - Cliente notificado del cargo adicional
```

### Caso 3: Falta de materiales

```
1. Instalador reporta:
   - Tipo: material_shortage
   - Prioridad: high
   - Lista materiales faltantes
   
2. Purchasing procesa:
   - Ordena materiales
   - Aprueba costo adicional
   
3. Continuación:
   - Materiales llegan
   - Trabajo continúa
   - Completado
```

---

## 📈 Reportes y Análisis

### Métricas Importantes

1. **Incidencias por Proyecto**
   - Identificar proyectos problemáticos
   - Patrón de imprevistos

2. **Costo de Incidencias**
   - Impacto en presupuesto original
   - Porcentaje de sobrecosto

3. **Tipos Más Comunes**
   - Áreas de mejora
   - Prevención futura

4. **Tiempo de Resolución**
   - Desde creación hasta completado
   - Eficiencia del equipo

---

## ⚠️ Buenas Prácticas

### Al Crear Incidencias

✅ **SÍ:**
- Ser específico en el título
- Describir claramente el problema
- Incluir todos los materiales necesarios
- Asignar prioridad correcta
- Agregar fotos/evidencia cuando sea posible

❌ **NO:**
- Crear incidencias duplicadas
- Omitir información importante
- Subestimar costos
- Ignorar prioridades

### Durante Aprobación

✅ **SÍ:**
- Revisar todos los detalles
- Verificar costos
- Agregar comentarios útiles
- Comunicar al cliente si es necesario

❌ **NO:**
- Aprobar sin revisar
- Rechazar sin justificación
- Demorar aprobaciones urgentes

### En Ejecución

✅ **SÍ:**
- Actualizar estado puntualmente
- Documentar cambios
- Mantener comunicación
- Completar cuando termine realmente

❌ **NO:**
- Dejar estados desactualizados
- Omitir historial
- Marcar como completado prematuramente

---

## 🔧 Troubleshooting

### Problema: No puedo crear incidencia

**Solución:**
- Verificar que estás en un proyecto específico
- Confirmar que tienes permisos
- Revisar que todos los campos obligatorios están llenos

### Problema: No aparecen productos

**Solución:**
- Verificar que existen productos en el catálogo
- Contactar a admin para agregar productos

### Problema: No puedo aprobar

**Solución:**
- Solo admin y purchasing pueden aprobar
- Verificar que tu rol tiene permisos

### Problema: Número de factura incorrecto

**Solución:**
- Sistema genera automáticamente
- Formato: INV-[proyecto]-INC-[secuencia]
- Si hay error, contactar a admin

---

## 📞 Soporte

Para más información o problemas:
- Contactar al administrador del sistema
- Revisar logs en `/api/incidents`
- Documentación técnica en código fuente

---

**Última actualización:** 2025-01-XX
**Versión del sistema:** 1.0.0
