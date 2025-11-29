'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface IncidentDetail {
  id: number;
  incidentInvoiceNumber: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  totalCost: number;
  projectId: number;
  projectName: string;
  project?: {
    invoiceNumber: string;
    projectName: string;
  };
  createdBy: string;
  createdByUser?: { name: string; email: string };
  createdAt: string;
  approvedBy?: string;
  approvedByUser?: { name: string; email: string };
  approvedAt?: string;
  items?: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    product?: { name: string };
  }>;
  history?: Array<{
    id: number;
    action: string;
    comment?: string;
    username: string;
    createdAt: string;
  }>;
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/incidents?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('No se encontró la incidencia');
        
        const data = await response.json();
        const foundIncident = data.incidents?.find((inc: any) => inc.id === parseInt(id));
        
        if (!foundIncident) throw new Error('Incidencia no encontrada');
        
        setIncident(foundIncident);
        setNewStatus(foundIncident.status);
      } catch (err: any) {
        setError(err.message || 'Error cargando la incidencia');
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === incident?.status) {
      setError('Selecciona un estado diferente');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: parseInt(id),
          status: newStatus,
          comment: comment
        })
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const result = await response.json();
      setIncident(result.incident);
      setComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Cargando incidencia...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600 mb-4">{error || 'Incidencia no encontrada'}</p>
          <Link href="/dashboard/incidents" className="text-blue-600 hover:text-blue-700">
            ← Volver a incidencias
          </Link>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-blue-100 text-blue-800',
      approved: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/incidents" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Volver a incidencias
          </Link>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{incident.title}</h1>
                <p className="text-gray-600">{incident.incidentInvoiceNumber}</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getPriorityColor(incident.priority)}`}>
                  {incident.priority}
                </span>
              </div>
            </div>
            {incident.description && (
              <p className="text-gray-700 border-t pt-4">{incident.description}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalles principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información básica */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Proyecto</p>
                  <p className="text-base font-medium text-gray-900">{incident.projectName}</p>
                  {incident.project && (
                    <p className="text-xs text-gray-500">{incident.project.invoiceNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="text-base font-medium text-gray-900">
                    {incident.type === 'change_order' && 'Orden de Cambio'}
                    {incident.type === 'extra_work' && 'Trabajo Extra'}
                    {incident.type === 'damage' && 'Daño'}
                    {incident.type === 'material_shortage' && 'Falta de Material'}
                    {incident.type === 'special' && 'Especial'}
                    {incident.type === 'other' && 'Otro'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Costo Total</p>
                  <p className="text-base font-medium text-green-600">${incident.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prioridad</p>
                  <p className="text-base font-medium text-gray-900 capitalize">{incident.priority}</p>
                </div>
              </div>
            </div>

            {/* Crear/Actualizar estado */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actualizar Estado</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo Estado
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobada</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentario
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Agrega un comentario sobre el cambio de estado..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
                >
                  {updating ? 'Actualizando...' : 'Actualizar Estado'}
                </button>
              </div>
            </div>

            {/* Items de incidencia */}
            {incident.items && incident.items.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Artículos</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left font-medium text-gray-700 pb-2">Producto</th>
                        <th className="text-right font-medium text-gray-700 pb-2">Cantidad</th>
                        <th className="text-right font-medium text-gray-700 pb-2">Precio Unitario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incident.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="py-2 text-gray-900">{item.product?.name || `Producto ${item.productId}`}</td>
                          <td className="text-right text-gray-900">{item.quantity}</td>
                          <td className="text-right text-gray-900">${item.unitPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Historial */}
            {incident.history && incident.history.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial</h2>
                <div className="space-y-4">
                  {incident.history.map((entry) => (
                    <div key={entry.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900 capitalize">{entry.action}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">Por: {entry.username}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar con información */}
          <div className="space-y-6">
            {/* Información de creación */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Información de Creación</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Creado por</p>
                  <p className="text-sm font-medium text-gray-900">{incident.createdBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Fecha</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(incident.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Información de aprobación */}
            {incident.approvedBy && (
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <h3 className="font-semibold text-gray-900 mb-4">Información de Aprobación</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Aprobado por</p>
                    <p className="text-sm font-medium text-gray-900">{incident.approvedBy}</p>
                  </div>
                  {incident.approvedAt && (
                    <div>
                      <p className="text-xs text-gray-600">Fecha</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(incident.approvedAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
