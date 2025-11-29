'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Bell,
  User,
  Clock,
  AlertCircle,
  Grid3x3,
  List,
  X,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Project {
  id: number;
  projectName: string;
  clientName: string;
  clientEmail?: string;
  systemId: number;
  systemName?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  items: any[];
  totalCost: number;
  history?: any[];
  rejectionReason?: string;
  notes?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  assignedInstaller?: string;
  invoiceNumber?: string;
}

interface UserToken {
  id: number;
  username: string;
  role: 'admin' | 'vendor' | 'purchasing' | 'installer';
  name: string;
}

interface Notification {
  id: string;
  type: 'project_due' | 'project_overdue' | 'new_assignment' | 'status_change';
  title: string;
  message: string;
  projectId?: number;
  read: boolean;
  createdAt: string;
}

type ViewType = 'month' | 'week';

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserToken | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        setUser(decoded);

        if (!['admin', 'purchasing', 'installer', 'vendor'].includes(decoded.role)) {
          router.push('/dashboard');
          return;
        }
      }
    } catch (error) {
      router.push('/');
    }

    fetchProjects();
  }, [router]);

  useEffect(() => {
    if (projects.length > 0 && user) {
      generateNotifications();
    }
  }, [projects, user]);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const { projects } = await res.json();

      let filteredProjects = projects;
      if (user?.role === 'installer') {
        filteredProjects = projects.filter((project: any) =>
          project.assignedInstaller === user.name &&
          project.status !== 'draft' &&
          project.status !== 'rejected'
        );
      } else if (user?.role === 'vendor') {
        filteredProjects = projects.filter((project: any) =>
          project.createdBy === user.username ||
          project.status === 'approved' ||
          project.status === 'in-progress'
        );
      }

      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = () => {
    const now = new Date();
    const notifications: Notification[] = [];

    projects.forEach(project => {
      if (project.scheduledEnd && (user?.role === 'admin' || user?.role === 'purchasing')) {
        const endDate = new Date(project.scheduledEnd);
        const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilEnd >= 0 && daysUntilEnd <= 3 && project.status !== 'completed') {
          notifications.push({
            id: `due-${project.id}`,
            type: 'project_due',
            title: 'Proyecto próximo a vencer',
            message: `El proyecto "${project.projectName}" vence en ${daysUntilEnd} día${daysUntilEnd !== 1 ? 's' : ''}`,
            projectId: project.id,
            read: false,
            createdAt: now.toISOString()
          });
        }
      }

      if (user?.role === 'installer' && project.assignedInstaller === user.name && project.status === 'approved') {
        notifications.push({
          id: `assignment-${project.id}`,
          type: 'new_assignment',
          title: 'Nueva asignación',
          message: `Se te ha asignado el proyecto "${project.projectName}" para el ${project.scheduledStart ? new Date(project.scheduledStart).toLocaleDateString('es-ES') : 'fecha por definir'}`,
          projectId: project.id,
          read: false,
          createdAt: now.toISOString()
        });
      }

      if (project.history && project.history.length > 0 && (user?.role === 'admin' || user?.role === 'purchasing')) {
        const lastChange = project.history[project.history.length - 1];
        const changeDate = new Date(lastChange.timestamp);
        const hoursSinceChange = (now.getTime() - changeDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceChange <= 24) {
          notifications.push({
            id: `status-${project.id}-${lastChange.timestamp}`,
            type: 'status_change',
            title: 'Cambio de estado',
            message: `El proyecto "${project.projectName}" cambió a "${lastChange.status}"`,
            projectId: project.id,
            read: false,
            createdAt: changeDate.toISOString()
          });
        }
      }
    });

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(notifications);
  };

  // Utilidades de calendario
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();
    
    for (let i = 0; i < 7; i++) {
      week.push(new Date(curr.setDate(first + i)));
    }
    return week;
  };

  const getProjectsForDate = (date: Date) => {
    return projects.filter(project => {
      if (!project.scheduledStart) return false;
      const projectDate = new Date(project.scheduledStart);
      return projectDate.toDateString() === date.toDateString();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-500 text-white';
      case 'approved':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-purple-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'in-progress': 'En Progreso',
      'approved': 'Aprobado',
      'completed': 'Completado',
      'pending': 'Pendiente',
      'rejected': 'Rechazado',
    };
    return labels[status] || status;
  };

  // Renderizar calendario por mes
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map(day => (
            <div key={day} className="p-3 text-center font-semibold">
              {day}
            </div>
          ))}
        </div>

        <div className="divide-y">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x border-t">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`min-h-28 p-2 cursor-pointer transition hover:bg-blue-50 ${
                    !day ? 'bg-gray-50' : ''
                  } ${
                    day && day.toDateString() === new Date().toDateString()
                      ? 'bg-blue-100'
                      : ''
                  }`}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded ${
                          day.toDateString() === new Date().toDateString()
                            ? 'bg-blue-500 text-white'
                            : 'text-[#121313]'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {getProjectsForDate(day).slice(0, 2).map(project => (
                          <div
                            key={project.id}
                            className={`text-xs rounded px-2 py-1 truncate cursor-pointer hover:opacity-80 transition ${getStatusColor(
                              project.status
                            )}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setShowProjectDetails(true);
                            }}
                            title={project.projectName}
                          >
                            {project.projectName}
                          </div>
                        ))}
                        {getProjectsForDate(day).length > 2 && (
                          <div className="text-xs text-gray-500 px-2 font-semibold">
                            +{getProjectsForDate(day).length - 2} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar calendario por semana
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid gap-0" style={{ gridTemplateColumns: '100px repeat(7, 1fr)' }}>
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white p-2 text-center font-semibold text-sm"></div>
          {weekDates.map((date, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white p-3 text-center font-semibold cursor-pointer transition hover:opacity-80 ${
                date.toDateString() === selectedDate?.toDateString() ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => setSelectedDate(new Date(date))}
            >
              <div className="text-sm">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'][date.getDay()]}</div>
              <div className="text-lg font-bold">{date.getDate()}</div>
            </div>
          ))}

          {/* Horas y eventos */}
          {hours.map(hour => (
            <div key={`hour-${hour}`}>
              <div className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-600 border-r border-t h-20">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDates.map((date, dateIndex) => {
                const dayProjects = getProjectsForDate(date);
                const projectsInHour = dayProjects.filter(p => {
                  const startHour = new Date(p.scheduledStart || '').getHours();
                  return startHour === hour;
                });

                return (
                  <div key={`${hour}-${dateIndex}`} className="border-r border-t border-gray-200 h-20 p-1 hover:bg-blue-50 transition">
                    {projectsInHour.map(project => (
                      <div
                        key={project.id}
                        className={`text-xs rounded px-2 py-1 mb-1 cursor-pointer hover:opacity-80 transition truncate ${getStatusColor(
                          project.status
                        )}`}
                        onClick={() => {
                          setSelectedProject(project);
                          setShowProjectDetails(true);
                        }}
                        title={project.projectName}
                      >
                        {project.projectName}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const monthName = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <CalendarIcon className="w-12 h-12 text-[#EAB839]" />
          </div>
          <p className="text-[#EAB839] font-semibold">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#121313]">Calendario de Proyectos</h1>
          <p className="text-gray-600 mt-2">Gestiona tus proyectos programados</p>
        </div>

        {/* Botones de vista y notificaciones */}
        <div className="flex items-center gap-4">
          {/* Selectores de vista */}
          <div className="flex bg-white rounded-lg shadow border">
            <button
              onClick={() => setViewType('month')}
              className={`p-2 transition ${
                viewType === 'month'
                  ? 'bg-[#EAB839] text-white'
                  : 'text-gray-600 hover:text-[#121313]'
              }`}
              title="Vista por mes"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`p-2 transition ${
                viewType === 'week'
                  ? 'bg-[#EAB839] text-white'
                  : 'text-gray-600 hover:text-[#121313]'
              }`}
              title="Vista por semana"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Campana de notificaciones */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-[#121313] text-white rounded-lg hover:bg-[#2a2a2a] transition shadow-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border z-50 max-h-[600px] overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white flex justify-between items-center">
                  <h3 className="font-bold text-lg">Notificaciones</h3>
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No hay notificaciones</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full flex-shrink-0 ${
                              notification.type === 'project_due'
                                ? 'bg-yellow-100 text-yellow-600'
                                : notification.type === 'new_assignment'
                                ? 'bg-green-100 text-green-600'
                                : notification.type === 'status_change'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {notification.type === 'project_due' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : notification.type === 'new_assignment' ? (
                              <User className="w-4 h-4" />
                            ) : notification.type === 'status_change' ? (
                              <Zap className="w-4 h-4" />
                            ) : (
                              <AlertCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-[#121313]">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 break-words">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-lg p-4">
        <button
          onClick={() => {
            const newDate = new Date(currentDate);
            if (viewType === 'month') {
              newDate.setMonth(newDate.getMonth() - 1);
            } else {
              newDate.setDate(newDate.getDate() - 7);
            }
            setCurrentDate(newDate);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5 text-[#121313]" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#121313] capitalize">{monthName}</h2>
          <p className="text-sm text-gray-500">
            {viewType === 'month' ? 'Vista mensual' : 'Vista semanal'}
          </p>
        </div>

        <button
          onClick={() => {
            const newDate = new Date(currentDate);
            if (viewType === 'month') {
              newDate.setMonth(newDate.getMonth() + 1);
            } else {
              newDate.setDate(newDate.getDate() + 7);
            }
            setCurrentDate(newDate);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5 text-[#121313]" />
        </button>

        <button
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDate(new Date());
          }}
          className="px-4 py-2 bg-[#EAB839] text-white rounded-lg hover:bg-[#d4a532] transition font-semibold"
        >
          Hoy
        </button>
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {viewType === 'month' ? renderMonthView() : renderWeekView()}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Proyectos de la fecha seleccionada */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-[#121313] mb-4">
              {selectedDate
                ? selectedDate.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Selecciona una fecha'}
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {!selectedDate ? (
                <p className="text-gray-500 text-center py-8">Selecciona una fecha para ver proyectos</p>
              ) : getProjectsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay proyectos programados</p>
                </div>
              ) : (
                getProjectsForDate(selectedDate).map(project => (
                  <div
                    key={project.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition hover:shadow-lg ${
                      selectedProject?.id === project.id
                        ? 'border-[#EAB839] bg-yellow-50'
                        : 'border-gray-200 hover:border-[#EAB839]'
                    }`}
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectDetails(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-[#121313]">{project.projectName}</h4>
                        <p className="text-sm text-gray-600">👤 {project.clientName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    {project.assignedInstaller && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4" />
                        <span>{project.assignedInstaller}</span>
                      </div>
                    )}

                    {project.scheduledStart && project.scheduledEnd && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(project.scheduledStart).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} - {new Date(project.scheduledEnd).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#EAB839]">
                        ${project.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-[#121313] mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-700 flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  Pendientes
                </span>
                <span className="font-bold text-[#121313]">
                  {projects.filter(p => p.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Aprobados
                </span>
                <span className="font-bold text-[#121313]">
                  {projects.filter(p => p.status === 'approved').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  En Progreso
                </span>
                <span className="font-bold text-[#121313]">
                  {projects.filter(p => p.status === 'in-progress').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700 flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  Completados
                </span>
                <span className="font-bold text-[#121313]">
                  {projects.filter(p => p.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles del proyecto */}
      {showProjectDetails && selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowProjectDetails(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white p-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedProject.projectName}</h2>
                <p className="text-gray-300 mt-1">Cliente: {selectedProject.clientName}</p>
              </div>
              <button
                onClick={() => setShowProjectDetails(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Estado */}
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-gray-600">Estado</span>
                <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(selectedProject.status)}`}>
                  {getStatusLabel(selectedProject.status)}
                </span>
              </div>

              {/* Información */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Número de Factura</p>
                  <p className="font-bold text-[#121313]">{selectedProject.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Costo Total</p>
                  <p className="font-bold text-[#EAB839]">${selectedProject.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Correo del Cliente</p>
                  <p className="font-bold text-[#121313]">{selectedProject.clientEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Creado por</p>
                  <p className="font-bold text-[#121313]">{selectedProject.createdBy}</p>
                </div>
              </div>

              {/* Fechas */}
              {(selectedProject.scheduledStart || selectedProject.scheduledEnd) && (
                <div className="pb-4 border-b">
                  <h3 className="font-bold text-[#121313] mb-3">Cronograma</h3>
                  <div className="space-y-2">
                    {selectedProject.scheduledStart && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#EAB839]" />
                        <div>
                          <p className="text-sm text-gray-500">Inicio</p>
                          <p className="font-semibold text-[#121313]">
                            {new Date(selectedProject.scheduledStart).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedProject.scheduledEnd && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm text-gray-500">Fin</p>
                          <p className="font-semibold text-[#121313]">
                            {new Date(selectedProject.scheduledEnd).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instalador */}
              {selectedProject.assignedInstaller && (
                <div className="pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#EAB839]" />
                    <div>
                      <p className="text-sm text-gray-500">Instalador Asignado</p>
                      <p className="font-semibold text-[#121313]">{selectedProject.assignedInstaller}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              {selectedProject.items && selectedProject.items.length > 0 && (
                <div className="pb-4 border-b">
                  <h3 className="font-bold text-[#121313] mb-3">Artículos</h3>
                  <div className="space-y-2">
                    {selectedProject.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">Producto #{item.productId}</span>
                        <span className="font-semibold text-[#121313]">
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => router.push(`/dashboard/projects`)}
                  className="flex-1 px-4 py-2 bg-[#EAB839] text-white rounded-lg hover:bg-[#d4a532] transition font-semibold"
                >
                  Ver Proyecto Completo
                </button>
                <button
                  onClick={() => setShowProjectDetails(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-[#121313] rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}