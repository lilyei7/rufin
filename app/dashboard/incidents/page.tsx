'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotifications } from '../../../components/ui/notifications';
import {
  AlertTriangle,
  Plus,
  X,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  DollarSign,
  FileText,
  User,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface Incident {
  id: number;
  projectId: number;
  projectName: string;
  incidentInvoiceNumber: string;
  title: string;
  description: string;
  type: 'change_order' | 'extra_work' | 'damage' | 'material_shortage' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  items: any[];
  totalCost: number;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  resolvedAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  history: any[];
}

interface Product {
  id: number;
  name: string;
  categoryId: number;
  unitPrice: number;
  unitType: string;
}

function IncidentsPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<string>('extra_work');
  const [formPriority, setFormPriority] = useState<string>('medium');
  const [formItems, setFormItems] = useState<any[]>([]);

  useEffect(() => {
    fetchIncidents();
    fetchProducts();
  }, [projectId]);

  const fetchIncidents = async () => {
    const token = localStorage.getItem('token');
    try {
      const url = projectId
        ? `/api/incidents?projectId=${projectId}`
        : '/api/incidents';
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { incidents } = await res.json();
      setIncidents(incidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { products } = await res.json();
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Debe seleccionar un proyecto',
        duration: 5000
      });
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          title: formTitle,
          description: formDescription,
          type: formType,
          priority: formPriority,
          items: formItems,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchIncidents();
        addNotification({
          type: 'success',
          title: '✅ Incidencia Creada',
          message: `La incidencia "${formTitle}" ha sido creada exitosamente.`,
          duration: 5000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo crear la incidencia. Intenta de nuevo.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al crear incidencia',
        duration: 5000
      });
    }
  };

  const handleUpdateStatus = async (incidentId: number, newStatus: string, comment?: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: incidentId,
          status: newStatus,
          comment,
        }),
      });

      if (res.ok) {
        fetchIncidents();
        addNotification({
          type: 'success',
          title: '✅ Estado Actualizado',
          message: `El estado de la incidencia ha sido actualizado a "${newStatus}".`,
          duration: 5000
        });
        fetchIncidents();
        setShowDetailsModal(false);
      } else {
        alert('Error al actualizar incidencia');
      }
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormType('extra_work');
    setFormPriority('medium');
    setFormItems([]);
  };

  const addItem = () => {
    setFormItems([...formItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formItems];
    newItems[index][field] = value;

    if (field === 'productId') {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        newItems[index].unitPrice = product.unitPrice;
        newItems[index].productName = product.name;
      }
    }

    setFormItems(newItems);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'change_order':
        return <FileText className="w-5 h-5" />;
      case 'extra_work':
        return <TrendingUp className="w-5 h-5" />;
      case 'damage':
        return <AlertTriangle className="w-5 h-5" />;
      case 'material_shortage':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      change_order: 'Orden de Cambio',
      extra_work: 'Trabajo Extra',
      damage: 'Daño',
      material_shortage: 'Falta de Material',
      special: 'Especial',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  // Filtrar incidencias
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.incidentInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !filterStatus || inc.status === filterStatus;
    const matchesType = !filterType || inc.type === filterType;
    const matchesPriority = !filterPriority || inc.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      in_progress: 'En Progreso',
      completed: 'Completado',
    };
    return labels[status] || status;
  };

  const totalIncidentsCost = incidents.reduce((sum, inc) => sum + inc.totalCost, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <AlertTriangle className="w-12 h-12 text-[#EAB839]" />
          </div>
          <p className="text-[#EAB839] font-semibold">Cargando incidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {projectId && (
              <button
                onClick={() => router.push('/dashboard/projects')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <AlertTriangle className="w-8 h-8 text-[#EAB839]" />
            <div>
              <h1 className="text-4xl font-black text-[#121313]">
                {projectId ? 'Incidencias del Proyecto' : 'Todas las Incidencias'}
              </h1>
              {projectId && (
                <div className="mt-1 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Filtrado por Proyecto #{projectId}
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            Gestiona imprevistos, cambios y trabajos adicionales
          </p>
        </div>

        {projectId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#EAB839] text-white rounded-lg hover:bg-[#d4a532] transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nueva Incidencia
          </button>
        )}
      </div>

      {!projectId && (
        <Link
          href="/dashboard/incidents/new"
          className="flex items-center gap-2 px-4 py-3 bg-[#EAB839] text-white rounded-lg hover:bg-[#d4a532] transition font-semibold w-max"
        >
          <Plus className="w-5 h-5" />
          Nueva Incidencia
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Incidencias</p>
              <p className="text-2xl font-bold text-[#121313]">{incidents.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#EAB839]" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {incidents.filter((i) => i.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">
                {incidents.filter((i) => i.status === 'in_progress').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Costo Total</p>
              <p className="text-2xl font-bold text-[#EAB839]">
                ${totalIncidentsCost.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-[#EAB839]" />
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Buscar y Filtrar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar por título, número o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />

          {/* Filtro por Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobada</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completada</option>
            <option value="rejected">Rechazada</option>
          </select>

          {/* Filtro por Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Todos los tipos</option>
            <option value="change_order">Orden de Cambio</option>
            <option value="extra_work">Trabajo Extra</option>
            <option value="damage">Daño</option>
            <option value="material_shortage">Falta de Material</option>
            <option value="special">Especial</option>
            <option value="other">Otro</option>
          </select>

          {/* Filtro por Prioridad */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Todas las prioridades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>

        {/* Mostrar cantidad de resultados */}
        {(searchQuery || filterStatus || filterType || filterPriority) && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-gray-600">
              Se encontraron <span className="font-semibold">{filteredIncidents.length}</span> incidencias
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setFilterType('');
                setFilterPriority('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery || filterStatus || filterType || filterPriority
                ? 'No hay incidencias que coincidan con los filtros'
                : projectId
                ? 'No hay incidencias para este proyecto'
                : 'No hay incidencias registradas'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className="p-6 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => {
                  setSelectedIncident(incident);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${getPriorityColor(incident.priority)} border`}
                    >
                      {getTypeIcon(incident.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#121313] text-lg">{incident.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            incident.status
                          )}`}
                        >
                          {getStatusLabel(incident.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {incident.incidentInvoiceNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {incident.createdBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(incident.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Costo</p>
                    <p className="text-xl font-bold text-[#EAB839]">
                      ${incident.totalCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{getTypeLabel(incident.type)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white p-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">Nueva Incidencia</h2>
                <p className="text-gray-300 mt-1">Registrar imprevisto o cambio en el proyecto</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#121313] mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent text-gray-900"
                    placeholder="Ej: Daño estructural encontrado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#121313] mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent text-gray-900"
                  >
                    <option value="extra_work">Trabajo Extra</option>
                    <option value="change_order">Orden de Cambio</option>
                    <option value="damage">Daño</option>
                    <option value="material_shortage">Falta de Material</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#121313] mb-2">
                  Prioridad *
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent text-gray-900"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#121313] mb-2">
                  Descripción
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent text-gray-900"
                  placeholder="Describe el problema o cambio requerido..."
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-[#121313]">
                    Materiales/Servicios Adicionales
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 px-3 py-1 bg-[#EAB839] text-white rounded-lg hover:bg-[#d4a532] transition text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        required
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.unitPrice}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        placeholder="Cant."
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, 'unitPrice', parseFloat(e.target.value))
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        placeholder="Precio"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {formItems.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-[#121313]">Costo Total:</span>
                    <span className="text-xl font-bold text-[#EAB839]">
                      $
                      {formItems
                        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#EAB839] text-white rounded-lg hover:bg-[#d4a532] transition font-semibold"
                >
                  Crear Incidencia
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-[#121313] rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedIncident && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white p-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedIncident.title}</h2>
                <p className="text-gray-300 mt-1">{selectedIncident.incidentInvoiceNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-semibold ${getStatusColor(
                      selectedIncident.status
                    )}`}
                  >
                    {getStatusLabel(selectedIncident.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Prioridad</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg border font-semibold ${getPriorityColor(
                      selectedIncident.priority
                    )}`}
                  >
                    {selectedIncident.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tipo</p>
                  <p className="font-bold text-[#121313]">
                    {getTypeLabel(selectedIncident.type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Costo Total</p>
                  <p className="text-xl font-bold text-[#EAB839]">
                    ${selectedIncident.totalCost.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedIncident.description && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Descripción</p>
                  <p className="text-gray-700">{selectedIncident.description}</p>
                </div>
              )}

              {/* Items */}
              {selectedIncident.items && selectedIncident.items.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-3">Materiales/Servicios</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedIncident.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.productName || `Producto #${item.productId}`} × {item.quantity}
                        </span>
                        <span className="font-semibold text-[#121313]">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History */}
              {selectedIncident.history && selectedIncident.history.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-3">Historial</p>
                  <div className="space-y-3">
                    {selectedIncident.history.map((entry: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-2 h-2 bg-[#EAB839] rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#121313]">{entry.action}</p>
                          <p className="text-sm text-gray-600">{entry.comment}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {entry.user} - {new Date(entry.timestamp).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedIncident.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedIncident.id, 'approved', 'Incidencia aprobada')
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedIncident.id, 'rejected', 'Incidencia rechazada')
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    <XCircle className="w-5 h-5" />
                    Rechazar
                  </button>
                </div>
              )}

              {selectedIncident.status === 'approved' && (
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedIncident.id, 'in_progress', 'Trabajo iniciado')
                  }
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Iniciar Trabajo
                </button>
              )}

              {selectedIncident.status === 'in_progress' && (
                <button
                  onClick={() =>
                    handleUpdateStatus(
                      selectedIncident.id,
                      'completed',
                      'Trabajo completado exitosamente'
                    )
                  }
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  Marcar como Completado
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IncidentsPage />
    </Suspense>
  );
}

export default IncidentsPageWrapper;
