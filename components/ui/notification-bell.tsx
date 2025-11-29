'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, X, CheckCircle, XCircle, DollarSign, CreditCard, Clock, Play, User, Wrench, Plus, Lightbulb, Eye } from 'lucide-react';
import { useNotifications as useToastNotifications } from './notifications';

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

interface NotificationBellProps {
  userId: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const { addNotification } = useToastNotifications();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    // Get user role from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUserRole(decoded.role);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const { notifications } = await res.json();
        // Filter notifications for current user
        const userNotifications = notifications.filter((n: Notification) => n.userId === userId);
        setNotifications(userNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: true })
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    await markAsRead(notification.id);
    
    // Navigate based on notification type and user role
    switch (notification.type) {
      case 'project_created':
      case 'project_approved':
        if (userRole === 'installer') {
          router.push('/dashboard/price-proposals');
        } else {
          router.push('/dashboard/projects');
        }
        break;
      
      case 'price_accepted':
      case 'price_suggested':
        // Para notificaciones de precio, ir al proyecto específico
        if (notification.data && typeof notification.data === 'string') {
          try {
            const data = JSON.parse(notification.data);
            router.push(`/dashboard/projects?projectId=${data.projectId}`);
          } catch (e) {
            router.push('/dashboard/projects');
          }
        } else if (notification.data && notification.data.projectId) {
          router.push(`/dashboard/projects?projectId=${notification.data.projectId}`);
        } else {
          router.push('/dashboard/projects');
        }
        break;
      
      case 'installer_assigned':
        if (userRole === 'installer') {
          router.push('/dashboard/price-proposals');
        } else {
          router.push('/dashboard/projects');
        }
        break;
      
      case 'project_started':
        if (userRole === 'installer') {
          router.push('/dashboard/work-order');
        } else {
          router.push('/dashboard/projects');
        }
        break;
      
      case 'project_completed':
        if (userRole === 'installer') {
          router.push('/dashboard/work-order');
        } else if (userRole === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/projects');
        }
        break;
      
      case 'payment_approved':
        if (userRole === 'installer') {
          router.push('/dashboard/work-order');
        } else if (userRole === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/projects');
        }
        break;
      
      case 'budget_request':
      case 'budget_proposed':
      case 'budget_accepted':
      case 'budget_rejected':
        if (userRole === 'installer') {
          router.push('/dashboard/price-proposals');
        } else if (userRole === 'admin' || userRole === 'purchasing') {
          router.push('/dashboard/projects');
        }
        break;
      
      default:
        // Default fallback
        router.push('/dashboard');
        break;
    }
    
    // Close the dropdown
    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

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

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      addNotification({
        type: 'success',
        title: 'Notificaciones marcadas',
        message: 'Todas las notificaciones han sido marcadas como leídas'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron marcar las notificaciones como leídas'
      });
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'project_approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'installer_assigned':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'price_accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'price_suggested':
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
      case 'budget_request':
        return <Wrench className="w-4 h-4 text-orange-600" />;
      case 'budget_proposed':
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      case 'budget_accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'budget_rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'project_started':
        return <Play className="w-4 h-4 text-purple-600" />;
      case 'project_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'payment_approved':
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'project_pending_approval':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-sm text-[#EAB839] hover:text-[#EAB839]/80 font-medium disabled:opacity-50"
                >
                  {loading ? 'Marcando...' : 'Marcar todas como leídas'}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        {/* Botón de acción para notificaciones de precio */}
                        {(notification.type === 'price_accepted' || notification.type === 'price_suggested') && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Eye size={12} /> Ver Detalles
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};