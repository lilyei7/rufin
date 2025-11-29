export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'project_created'        // Proyecto creado
  | 'project_assigned'       // Proyecto asignado a instalador
  | 'project_approved'       // Proyecto aprobado
  | 'project_rejected'       // Proyecto rechazado
  | 'project_pending_approval' // Proyecto pendiente de aprobación
  | 'project_started'        // Proyecto iniciado
  | 'project_completed'      // Proyecto completado
  | 'budget_request'         // Solicitud de presupuesto
  | 'budget_proposed'        // Presupuesto propuesto por instalador
  | 'budget_accepted'        // Presupuesto aceptado por instalador
  | 'budget_rejected'        // Presupuesto rechazado por instalador
  | 'budget_approved'        // Presupuesto aprobado por admin
  | 'budget_denied'          // Presupuesto denegado por admin
  | 'payment_approved'       // Pago aprobado
  | 'payment_processed'      // Pago procesado
  | 'deadline_approaching'   // Fecha límite cercana (24h)
  | 'deadline_passed'        // Fecha límite vencida
  | 'system_message'         // Mensaje del sistema
  | 'quote_created'          // Cotización creada
  | 'installer_assigned';    // Instalador asignado

export interface NotificationPreferences {
  userId: number;
  email: boolean;
  push: boolean;
  types: Record<NotificationType, boolean>;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  recipients: 'installer' | 'vendor' | 'admin' | 'all';
  priority: 'low' | 'medium' | 'high';
}