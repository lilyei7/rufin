'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Check, X, DollarSign, AlertCircle, ChevronRight } from 'lucide-react';
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
}

export default function InstallerProjectsPage() {
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

        // Verificar que sea instalador
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
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      
      console.log('🔵 [fetchProjects] Token:', token ? 'exists' : 'missing');
      console.log('🔵 [fetchProjects] User data:', userData);
      
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔵 [fetchProjects] Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('🔵 [fetchProjects] Full response:', data);
        
        const allProjects = data.projects || [];
        
        console.log('🔵 [fetchProjects] Projects array length:', allProjects.length);
        console.log('🔵 [fetchProjects] Projects:', allProjects);
        
        // La API ya filtra por installer, así que directamente mostramos lo que devuelve
        setProjects(allProjects);
        console.log('🔵 [fetchProjects] Projects set in state:', allProjects.length);
      } else {
        console.error('🔴 [fetchProjects] API error:', res.status, res.statusText);
        const error = await res.json();
        console.error('🔴 [fetchProjects] Error details:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.error || 'No se pudieron cargar los proyectos',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('🔴 [fetchProjects] Exception:', error);
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
          comment: action === 'suggest' 
            ? `Precio sugerido por instalador: $${proposedPrice}`
            : `Precio aceptado por instalador`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos Asignados</h1>
          </div>
          <p className="text-gray-600">Bienvenido, {user?.name}. Aquí puedes ver tus proyectos y gestionar los precios.</p>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin proyectos asignados</h3>
            <p className="text-gray-600">No tienes proyectos asignados en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-blue-500">
                <div className="p-6">
                  {/* Encabezado */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.projectName}</h3>
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {project.invoiceNumber}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{project.clientName}</span></p>
                    </div>
                  </div>

                  {/* Información */}
                  <div className="space-y-2 mb-4 pb-4 border-b">
                    {project.scheduledInstallation && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          Programado: {new Date(project.scheduledInstallation).toLocaleDateString('es-MX')} a las {new Date(project.scheduledInstallation).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        Precio propuesto: <span className="font-semibold text-green-600">${project.installerPriceProposal?.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getPriceStatusColor(project.installerPriceStatus)}`}>
                        {getPriceStatusText(project.installerPriceStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Cantidad de items */}
                  {project.items && project.items.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-2">Materiales a Instalar:</p>
                      <div className="space-y-1">
                        {project.items.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600">
                            {item.productName}: <span className="font-semibold">{item.quantity} {item.unit || 'unidades'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowDetailsModal(true);
                        setProposedPrice(project.installerPriceProposal?.toString() || '');
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <ChevronRight size={16} /> Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles y Gestión de Precio */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.projectName}</h2>
                  <p className="text-gray-600 mt-1">{selectedProject.invoiceNumber} - {selectedProject.clientName}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información del Proyecto */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Información del Proyecto</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Costo Total del Proyecto</p>
                    <p className="text-lg font-semibold text-green-600">${selectedProject.totalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha Programada</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedProject.scheduledInstallation 
                        ? new Date(selectedProject.scheduledInstallation).toLocaleDateString('es-MX')
                        : 'No especificada'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Materiales */}
              {selectedProject.items && selectedProject.items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Materiales a Instalar</h3>
                  <div className="space-y-2">
                    {selectedProject.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500">${item.unitPrice?.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{item.quantity} {item.unit || 'unidades'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gestión de Precio */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign size={18} />
                  Gestión de Precio
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Precio Propuesto</p>
                    <p className="text-2xl font-bold text-green-600">${selectedProject.installerPriceProposal?.toFixed(2)}</p>
                    <p className={`text-xs font-medium mt-1 px-2 py-1 rounded w-fit ${getPriceStatusColor(selectedProject.installerPriceStatus)}`}>
                      {getPriceStatusText(selectedProject.installerPriceStatus)}
                    </p>
                  </div>

                  {selectedProject.installerPriceStatus !== 'accepted' && (
                    <div className="pt-3 border-t border-yellow-200">
                      <p className="text-sm text-gray-600 mb-2">Puedes aceptar el precio o sugerir uno diferente</p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePriceAction(selectedProject, 'accept')}
                          disabled={submittingPrice}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Check size={18} />
                          {submittingPrice && priceAction === 'accept' ? 'Procesando...' : 'Aceptar Precio'}
                        </button>
                      </div>

                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">O sugiere un precio diferente:</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={proposedPrice}
                            onChange={(e) => setProposedPrice(e.target.value)}
                            placeholder="Precio sugerido"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => handlePriceAction(selectedProject, 'suggest')}
                            disabled={submittingPrice || !proposedPrice}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition"
                          >
                            {submittingPrice && priceAction === 'suggest' ? 'Enviando...' : 'Enviar'}
                          </button>
                        </div>
                      </div>
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
