'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Check, DollarSign, AlertCircle, ChevronRight, ChevronLeft, MessageSquare, Clock } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';
import { useConfirmModal } from '../../../components/ui/confirm-modal';

interface Project {
  id: number;
  projectName: string;
  invoiceNumber: string;
  clientName: string;
  status: string;
  totalCost: number;
  installerPriceProposal?: number;
  installerPriceStatus?: string;
  scheduledInstallation?: string;
  items?: any[];
  createdAt: string;
  assignedInstaller?: string;
  notes?: string;
}

export default function WorkOrderPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { confirm, ModalComponent } = useConfirmModal();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceAction, setPriceAction] = useState<'accept' | 'suggest' | null>(null);
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [customComment, setCustomComment] = useState('');
  
  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());

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

        if (decoded.role !== 'installer') {
          router.push('/dashboard/projects');
          return;
        }
      }
    } catch (error) {
      router.push('/');
      return;
    }

    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const allProjects = data.projects || [];
        setProjects(allProjects);
      } else {
        const error = await res.json();
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.error || 'No se pudieron cargar los proyectos',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      addNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Error al conectar con el servidor',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePriceAction = async (project: Project, action: 'accept' | 'suggest') => {
    if (action === 'suggest' && !proposedPrice) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ingresa un precio sugerido',
        duration: 3000
      });
      return;
    }

    const confirmed = await confirm({
      title: action === 'accept' ? 'Aceptar Precio' : 'Sugerir Precio',
      message: action === 'accept' 
        ? `¿Aceptas el precio de $${project.installerPriceProposal?.toFixed(2)} para este proyecto?`
        : `¿Enviar precio sugerido de $${proposedPrice}?`,
      confirmText: action === 'accept' ? 'Aceptar' : 'Enviar Sugerencia',
      cancelText: 'Cancelar',
      confirmButtonColor: 'green'
    });

    if (!confirmed) return;

    setSubmittingPrice(true);
    try {
      const response = await fetch(`/api/projects`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: project.id,
          installerPriceStatus: action === 'accept' ? 'accepted' : 'suggested',
          installerPriceProposal: action === 'suggest' ? parseFloat(proposedPrice) : project.installerPriceProposal,
          comment: customComment || (action === 'suggest' 
            ? `Precio sugerido por instalador: $${proposedPrice}`
            : `Precio aceptado por instalador`)
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Éxito',
          message: action === 'accept' 
            ? 'Precio aceptado correctamente'
            : 'Sugerencia de precio enviada',
          duration: 5000
        });
        setShowDetailsModal(false);
        setProposedPrice('');
        setCustomComment('');
        setPriceAction(null);
        fetchProjects();
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.error || 'No se pudo procesar la acción',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Error al procesar la acción',
        duration: 5000
      });
    } finally {
      setSubmittingPrice(false);
    }
  };

  const getPriceStatusColor = (status?: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'suggested':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getPriceStatusText = (status?: string) => {
    switch (status) {
      case 'accepted':
        return '✓ Aceptado';
      case 'suggested':
        return '💡 Sugerencia Enviada';
      case 'pending':
        return '⏳ Pendiente de Respuesta';
      default:
        return 'Sin Estado';
    }
  };

  // Get week days (Monday to Sunday)
  const getWeekDays = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(monday);
      newDate.setDate(newDate.getDate() + i);
      days.push(newDate);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  
  const getProjectsForDay = (date: Date) => {
    return projects.filter(p => {
      if (!p.scheduledInstallation) return false;
      const projectDate = new Date(p.scheduledInstallation);
      return (
        projectDate.getFullYear() === date.getFullYear() &&
        projectDate.getMonth() === date.getMonth() &&
        projectDate.getDate() === date.getDate()
      );
    });
  };

  const getHoursArray = () => {
    const hours = [];
    for (let i = 6; i <= 20; i++) {
      hours.push(i);
    }
    return hours;
  };

  const getProjectTopPosition = (project: Project) => {
    if (!project.scheduledInstallation) return 0;
    const date = new Date(project.scheduledInstallation);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const percentage = ((hour - 6) + (minutes / 60)) / 15 * 100;
    return Math.max(0, percentage);
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const today = new Date();
  const hours = getHoursArray();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ordenes de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Mis Ordenes de Trabajo</h1>
            </div>
            <div className="text-sm text-gray-600">
              Semana del {weekDays[0].toLocaleDateString('es-MX')} al {weekDays[6].toLocaleDateString('es-MX')}
            </div>
          </div>
          <p className="text-gray-600">Bienvenido, {user?.name} - Vista semanal de proyectos asignados</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={prevWeek}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
          >
            <ChevronLeft size={18} /> Semana Anterior
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Hoy
          </button>
          <button
            onClick={nextWeek}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
          >
            Semana Siguiente <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0 border-b">
              {weekDays.map((day, idx) => {
                const isToday = 
                  day.getFullYear() === today.getFullYear() &&
                  day.getMonth() === today.getMonth() &&
                  day.getDate() === today.getDate();
                
                return (
                  <div
                    key={idx}
                    className={`p-3 text-center border-r font-semibold ${
                      isToday ? 'bg-blue-100 text-blue-900' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wide">{day.toLocaleDateString('es-MX', { weekday: 'short' })}</div>
                    <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-blue-600' : ''}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <div className="grid grid-cols-7 gap-0">
                {weekDays.map((day, dayIdx) => (
                  <div key={dayIdx} className="border-r min-h-[800px] relative bg-white hover:bg-gray-50 transition">
                    {/* Hour markers */}
                    {hours.map((hour) => (
                      <div key={hour} className="h-16 border-t border-gray-200 relative">
                        {dayIdx === 0 && (
                          <div className="text-xs text-gray-500 absolute -left-12 top-0 w-10 text-right">
                            {hour}:00
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Projects */}
                    <div className="absolute inset-0 pointer-events-none">
                      {getProjectsForDay(day).map((project) => {
                        const topPos = getProjectTopPosition(project);
                        return (
                          <button
                            key={project.id}
                            onClick={() => {
                              setSelectedProject(project);
                              setShowDetailsModal(true);
                              setProposedPrice(project.installerPriceProposal?.toString() || '');
                              setCustomComment('');
                            }}
                            className="absolute left-1 right-1 bg-blue-500 text-white text-xs p-2 rounded border-2 border-blue-600 hover:bg-blue-600 hover:shadow-lg transition pointer-events-auto cursor-pointer overflow-hidden"
                            style={{
                              top: `${topPos}%`,
                              minHeight: '60px',
                              maxHeight: '80px'
                            }}
                            title={project.projectName}
                          >
                            <div className="font-semibold truncate">{project.projectName}</div>
                            <div className="text-xs opacity-90 truncate">{project.clientName}</div>
                            <div className="text-xs mt-1 opacity-75">
                              {new Date(project.scheduledInstallation!).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Proyectos de la Semana</h3>
            
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Sin proyectos asignados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setShowDetailsModal(true);
                      setProposedPrice(project.installerPriceProposal?.toString() || '');
                      setCustomComment('');
                    }}
                    className="w-full text-left p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg border-l-4 border-blue-500 transition hover:shadow-md"
                  >
                    <div className="font-semibold text-sm text-gray-900 mb-1">{project.projectName}</div>
                    <div className="text-xs text-gray-600 mb-2">{project.clientName}</div>
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <Clock size={12} className="text-gray-500" />
                      <span className="text-gray-700">
                        {project.scheduledInstallation 
                          ? new Date(project.scheduledInstallation).toLocaleDateString('es-MX') 
                          : 'Sin fecha'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getPriceStatusColor(project.installerPriceStatus)}`}>
                        {getPriceStatusText(project.installerPriceStatus)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.projectName}</h2>
                  <p className="text-gray-600 mt-1">{selectedProject.invoiceNumber} - {selectedProject.clientName}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-light"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Información del Proyecto */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-900 mb-3">📅 Información del Proyecto</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">Fecha Programada</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {selectedProject.scheduledInstallation 
                        ? new Date(selectedProject.scheduledInstallation).toLocaleDateString('es-MX')
                        : 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Hora Programada</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {selectedProject.scheduledInstallation 
                        ? new Date(selectedProject.scheduledInstallation).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                        : 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Estado</p>
                    <p className="text-lg font-semibold text-blue-600 capitalize mt-1">{selectedProject.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Factura</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedProject.invoiceNumber}</p>
                  </div>
                </div>
              </div>

              {/* Materiales (SIN PRECIOS) */}
              {selectedProject.items && selectedProject.items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h3 className="font-semibold text-gray-900 mb-3">📦 Materiales a Instalar</h3>
                  <div className="space-y-2">
                    {selectedProject.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500 mt-1">Referencia: {item.productId || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-green-600">{item.quantity}</p>
                          <p className="text-xs text-gray-500">{item.unit || 'unidades'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas del Proyecto */}
              {selectedProject.notes && (
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare size={18} />
                    Notas del Proyecto
                  </h3>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedProject.notes}</p>
                </div>
              )}

              {/* Gestión de Precio - SOLO PRECIO DE INSTALACIÓN */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-l-4 border-green-600">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" />
                  💰 Precio de Instalación
                </h3>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-gray-600 mb-2">Precio que el vendedor te ofrece por la instalación:</p>
                    <p className="text-3xl font-bold text-green-600">${selectedProject.installerPriceProposal?.toFixed(2)}</p>
                    <p className={`text-xs font-medium mt-2 px-3 py-1 rounded w-fit ${getPriceStatusColor(selectedProject.installerPriceStatus)}`}>
                      {getPriceStatusText(selectedProject.installerPriceStatus)}
                    </p>
                  </div>

                  {selectedProject.installerPriceStatus !== 'accepted' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 font-medium">¿Qué haces con este precio?</p>

                      <button
                        onClick={() => handlePriceAction(selectedProject, 'accept')}
                        disabled={submittingPrice}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Check size={20} />
                        {submittingPrice && priceAction === 'accept' ? 'Procesando...' : 'Aceptar este Precio'}
                      </button>

                      <div className="border-t border-gray-300 pt-3">
                        <p className="text-sm text-gray-700 font-medium mb-2">O sugiere un precio diferente:</p>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs text-gray-600 block mb-1">Nuevo precio:</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={proposedPrice}
                                onChange={(e) => setProposedPrice(e.target.value)}
                                placeholder="Ej: 500.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Comentario (¿Por qué este precio?):</label>
                            <textarea
                              value={customComment}
                              onChange={(e) => setCustomComment(e.target.value)}
                              placeholder="Ej: Demasiado caro, cuesta mas por los metros cuadrados, no vale la pena..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              rows={3}
                            />
                          </div>

                          <button
                            onClick={() => handlePriceAction(selectedProject, 'suggest')}
                            disabled={submittingPrice || !proposedPrice}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                          >
                            {submittingPrice && priceAction === 'suggest' ? 'Enviando...' : 'Enviar Sugerencia de Precio'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProject.installerPriceStatus === 'accepted' && (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                      <p className="text-green-800 font-medium text-sm">✓ Precio aceptado correctamente</p>
                      <p className="text-green-700 text-xs mt-1">El vendedor será notificado de tu aceptación.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalComponent />
    </div>
  );
}
