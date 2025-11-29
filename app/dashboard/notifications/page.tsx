'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, X, Filter, Search, Calendar, User, DollarSign, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const { addNotification } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, filterType, filterRead]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las notificaciones'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Filtro por estado de lectura
    if (filterRead === 'read') {
      filtered = filtered.filter(n => n.isRead);
    } else if (filterRead === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        addNotification({
          type: 'success',
          title: 'Notificación marcada',
          message: 'La notificación se marcó como leída'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo marcar la notificación como leída'
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navegar según el tipo de notificación
    if (notification.data?.projectId) {
      router.push(`/dashboard/projects`);
    } else if (notification.type.includes('incident')) {
      router.push(`/dashboard/incidents`);
    } else {
      // Para otros tipos, ir al dashboard principal
      router.push('/dashboard');
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = filteredNotifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isRead: true })
          })
        )
      );

      setNotifications(prev =>
        prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: true } : n)
      );

      addNotification({
        type: 'success',
        title: 'Notificaciones marcadas',
        message: `${unreadIds.length} notificaciones marcadas como leídas`
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron marcar las notificaciones como leídas'
      });
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        addNotification({
          type: 'success',
          title: 'Notificación eliminada',
          message: 'La notificación se eliminó correctamente'
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar la notificación'
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_created':
      case 'project_approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'project_pending_approval':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'installer_assigned':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'budget_request':
      case 'budget_proposed':
      case 'budget_accepted':
      case 'budget_rejected':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'project_started':
        return <Check className="w-5 h-5 text-blue-500" />;
      case 'project_completed':
        return <CheckCheck className="w-5 h-5 text-purple-500" />;
      case 'payment_approved':
      case 'payment_received':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'project_created': 'Proyecto creado',
      'project_pending_approval': 'Pendiente de aprobación',
      'project_approved': 'Proyecto aprobado',
      'installer_assigned': 'Instalador asignado',
      'budget_request': 'Solicitud de presupuesto',
      'budget_proposed': 'Presupuesto propuesto',
      'budget_accepted': 'Presupuesto aceptado',
      'budget_rejected': 'Presupuesto rechazado',
      'project_started': 'Proyecto iniciado',
      'project_completed': 'Proyecto completado',
      'payment_approved': 'Pago aprobado',
      'payment_received': 'Pago recibido'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredUnreadCount = filteredNotifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-gray-500">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#121313]">Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? (
              <span className="text-[#EAB839] font-medium">
                Tienes {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
              </span>
            ) : (
              'Todas tus notificaciones están al día'
            )}
          </p>
        </div>

        {filteredUnreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-[#EAB839] text-[#121313] px-4 py-2 rounded-lg font-semibold hover:bg-[#EAB839]/90 transition-colors flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <div className="w-full md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="project_created">Proyecto creado</option>
              <option value="project_approved">Proyecto aprobado</option>
              <option value="installer_assigned">Instalador asignado</option>
              <option value="budget_proposed">Presupuesto propuesto</option>
              <option value="budget_accepted">Presupuesto aceptado</option>
              <option value="budget_rejected">Presupuesto rechazado</option>
              <option value="project_completed">Proyecto completado</option>
              <option value="payment_received">Pago recibido</option>
            </select>
          </div>

          {/* Filtro por estado */}
          <div className="w-full md:w-48">
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="unread">No leídas</option>
              <option value="read">Leídas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {notifications.length === 0 ? 'No tienes notificaciones' : 'No se encontraron notificaciones'}
            </h3>
            <p className="text-gray-600">
              {notifications.length === 0
                ? 'Las nuevas notificaciones aparecerán aquí'
                : 'Prueba cambiando los filtros de búsqueda'
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl cursor-pointer ${
                !notification.isRead
                  ? 'border-l-blue-500 bg-blue-50/30'
                  : 'border-l-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icono */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          !notification.isRead
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(notification.createdAt)}
                        </div>
                        {notification.data?.projectId && (
                          <span className="text-[#EAB839] font-medium">
                            Proyecto #{notification.data.projectId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Marcar como leída"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar notificación"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Estadísticas */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#EAB839]">{notifications.length}</div>
              <div className="text-sm text-gray-600">Total de notificaciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{unreadCount}</div>
              <div className="text-sm text-gray-600">No leídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{notifications.length - unreadCount}</div>
              <div className="text-sm text-gray-600">Leídas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}