# Sistema de Notificaciones Robusto - Plan de Implementación

## 🎯 **Visión General**

Implementar un sistema completo de notificaciones en tiempo real que permita a cada usuario recibir alertas específicas sobre:
- Cambios en proyectos asignados
- Aprobaciones/rechazos de presupuestos
- Nuevas asignaciones de trabajo
- Actualizaciones de estado
- Mensajes del sistema

## 📋 **Componentes del Sistema**

### **1. Estructura de Datos**

#### **Modelo de Notificación**
```typescript
interface Notification {
  id: string;
  userId: number;           // Usuario destinatario
  type: NotificationType;   // Tipo de notificación
  title: string;           // Título corto
  message: string;         // Mensaje detallado
  projectId?: number;      // Proyecto relacionado (opcional)
  data?: any;              // Datos adicionales (JSON)
  isRead: boolean;         // Leída o no
  createdAt: Date;         // Fecha de creación
  expiresAt?: Date;        // Fecha de expiración (opcional)
}

type NotificationType =
  | 'project_assigned'      // Proyecto asignado a instalador
  | 'project_approved'      // Proyecto aprobado
  | 'project_rejected'      // Proyecto rechazado
  | 'budget_proposed'       // Presupuesto propuesto por instalador
  | 'budget_accepted'       // Presupuesto aceptado
  | 'budget_rejected'       // Presupuesto rechazado
  | 'payment_processed'     // Pago procesado
  | 'deadline_approaching'  // Fecha límite cercana
  | 'system_message'        // Mensaje del sistema
  | 'quote_created'         // Cotización creada
  | 'installer_assigned';   // Instalador asignado
```

#### **Preferencias de Usuario**
```typescript
interface NotificationPreferences {
  userId: number;
  email: boolean;           // Recibir por email
  push: boolean;           // Notificaciones push
  types: {                 // Tipos específicos habilitados
    project_assigned: boolean;
    budget_proposed: boolean;
    payment_processed: boolean;
    // ... otros tipos
  };
}
```

### **2. API Endpoints**

#### **Endpoints Necesarios**
```
GET    /api/notifications           # Listar notificaciones del usuario
POST   /api/notifications           # Crear notificación
PATCH  /api/notifications/:id/read  # Marcar como leída
DELETE /api/notifications/:id       # Eliminar notificación
GET    /api/notifications/unread    # Contar no leídas
POST   /api/notifications/mark-all-read # Marcar todas como leídas
GET    /api/notification-preferences # Obtener preferencias
PATCH  /api/notification-preferences # Actualizar preferencias
```

### **3. Lógica de Negocio - Eventos que Generan Notificaciones**

#### **Flujo de Vendedor → Instalador**
1. **Vendedor crea cotización**
   - ✅ Notificación al vendedor: "Cotización creada exitosamente"
   - ✅ Notificación al instalador asignado: "Nuevo proyecto asignado: [Nombre Proyecto]"

2. **Vendedor asigna instalador a proyecto existente**
   - ✅ Notificación al instalador: "Proyecto asignado: [Nombre Proyecto] - Fecha: [Fecha]"

#### **Flujo de Instalador → Vendedor/Admin**
3. **Instalador propone presupuesto**
   - ✅ Notificación al vendedor: "Presupuesto propuesto para [Proyecto] - Monto: $[Monto]"
   - ✅ Notificación al admin: "Revisar presupuesto propuesto"

4. **Instalador acepta presupuesto**
   - ✅ Notificación al vendedor: "Instalador aceptó presupuesto para [Proyecto]"
   - ✅ Notificación al admin: "Presupuesto aceptado - Listo para aprobación final"

5. **Instalador rechaza presupuesto**
   - ✅ Notificación al vendedor: "Presupuesto rechazado - Revisar comentarios"
   - ✅ Notificación al admin: "Presupuesto rechazado - Requiere atención"

#### **Flujo de Admin → Todos**
6. **Admin aprueba presupuesto**
   - ✅ Notificación al instalador: "Presupuesto aprobado - Proceder con trabajo"
   - ✅ Notificación al vendedor: "Presupuesto aprobado para [Proyecto]"

7. **Admin rechaza presupuesto**
   - ✅ Notificación al instalador: "Presupuesto rechazado - Revisar comentarios del admin"
   - ✅ Notificación al vendedor: "Presupuesto rechazado - Ajustar según comentarios"

8. **Proyecto completado y pagado**
   - ✅ Notificación al instalador: "Pago procesado - $[Monto] acreditado"
   - ✅ Notificación al vendedor: "Proyecto completado - Pago realizado"

#### **Notificaciones del Sistema**
9. **Fechas límite**
   - ✅ 24h antes: "Proyecto [Nombre] vence mañana"
   - ✅ Al vencer: "Proyecto [Nombre] ha vencido"

10. **Recordatorios**
    - ✅ Proyecto sin actividad por 3 días: "Recordatorio: Proyecto [Nombre] pendiente"

### **4. Componentes de UI**

#### **Campanita de Notificaciones** (`NotificationBell.tsx`)
```tsx
- Icono con contador de no leídas
- Dropdown con lista de notificaciones recientes
- Marcas como "todas leídas"
- Enlace a página completa de notificaciones
```

#### **Centro de Notificaciones** (`/dashboard/notifications`)
```tsx
- Lista completa de notificaciones
- Filtros por tipo/fecha/leído
- Acciones masivas (marcar como leídas, eliminar)
- Paginación
```

#### **Preferencias** (`/dashboard/notification-settings`)
```tsx
- Toggle para email/push
- Configuración por tipo de notificación
- Horarios de notificación
```

### **5. Integración con Sistema Existente**

#### **Dónde Insertar Lógica de Notificaciones**

1. **API de Proyectos** (`/api/projects`)
   - Al crear proyecto → Notificar instalador
   - Al cambiar estado → Notificar interesados
   - Al actualizar presupuesto → Notificar admin/vendedor

2. **API de Usuarios** (`/api/users`)
   - Al asignar rol → Notificar usuario

3. **API de Pagos** (nueva)
   - Al procesar pago → Notificar instalador

### **6. Arquitectura Técnica**

#### **Servicio de Notificaciones** (`lib/notification-service.ts`)
```typescript
class NotificationService {
  static async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void>
  static async notifyProjectAssigned(projectId: number, installerId: number): Promise<void>
  static async notifyBudgetProposed(projectId: number, installerId: number, amount: number): Promise<void>
  // ... más métodos específicos
}
```

#### **WebSocket/Polling para Tiempo Real**
- Opción 1: WebSocket para actualizaciones en tiempo real
- Opción 2: Polling cada 30 segundos para simplicidad

#### **Almacenamiento**
- Tabla `notifications` en la base de datos
- Relación con tabla `users`
- Índices para performance

### **7. Plan de Implementación - Fases**

#### **Fase 1: Base de Datos y API** (2-3 días)
- [ ] Crear tabla `notifications`
- [ ] Crear tabla `notification_preferences`
- [ ] Implementar endpoints básicos
- [ ] Servicio de notificaciones básico

#### **Fase 2: Lógica de Negocio** (3-4 días)
- [ ] Integrar notificaciones en API de proyectos
- [ ] Crear métodos específicos para cada tipo
- [ ] Sistema de plantillas de mensajes
- [ ] Validaciones y filtros

#### **Fase 3: UI y UX** (2-3 días)
- [ ] Componente NotificationBell
- [ ] Página de notificaciones
- [ ] Página de preferencias
- [ ] Animaciones y transiciones

#### **Fase 4: Tiempo Real y Optimizaciones** (2-3 días)
- [ ] Sistema de polling/WebSocket
- [ ] Notificaciones push (opcional)
- [ ] Email notifications (opcional)
- [ ] Optimizaciones de performance

#### **Fase 5: Testing y Refinamiento** (1-2 días)
- [ ] Testing exhaustivo
- [ ] Ajustes de UX
- [ ] Documentación
- [ ] Training

### **8. Consideraciones Técnicas**

#### **Performance**
- Paginación en listados
- Índices en base de datos
- Cache para contadores
- Lazy loading

#### **Seguridad**
- Solo notificaciones del usuario logueado
- Validación de permisos
- Sanitización de datos

#### **Escalabilidad**
- Queue system para emails masivos
- Rate limiting
- Archivado de notificaciones viejas

### **9. Métricas de Éxito**

- ✅ 100% de eventos importantes generan notificaciones
- ✅ < 2 segundos de delay en notificaciones críticas
- ✅ > 95% de usuarios configuran preferencias
- ✅ < 5% de notificaciones no deseadas

### **10. Próximos Pasos Inmediatos**

1. **Diseñar esquema de base de datos**
2. **Crear endpoints básicos**
3. **Implementar NotificationService**
4. **Integrar en flujo de proyectos**
5. **Crear UI básica**

¿Quieres que comience con alguna fase específica o tienes preguntas sobre el plan?