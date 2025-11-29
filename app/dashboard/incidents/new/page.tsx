'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Project {
  id: number;
  projectName: string;
  invoiceNumber: string;
  status: string;
}

function CreateIncidentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    projectId: projectIdFromUrl || '',
    title: '',
    description: '',
    type: 'change_order',
    priority: 'medium',
    totalCost: ''
  });

  // Cargar proyectos
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Error cargando proyectos:', err);
        setError('No se pudieron cargar los proyectos');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!formData.projectId || !formData.title || !formData.type) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: parseInt(formData.projectId),
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          totalCost: formData.totalCost ? parseFloat(formData.totalCost) : 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Error al crear incidencia');
      }

      const result = await response.json();
      setSuccess(`✅ Incidencia creada: ${result.incident.incidentInvoiceNumber}`);
      
      // Limpiar formulario
      setFormData({
        projectId: '',
        title: '',
        description: '',
        type: 'change_order',
        priority: 'medium',
        totalCost: ''
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/incidents');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al crear la incidencia');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Incidencia</h1>
          <p className="text-gray-600 mb-6">Reporta una incidencia en un proyecto</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Proyecto */}
            {projectIdFromUrl ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Proyecto</p>
                <p className="text-lg font-semibold text-blue-900">
                  {projects.find(p => p.id === parseInt(projectIdFromUrl))?.invoiceNumber} - {projects.find(p => p.id === parseInt(projectIdFromUrl))?.projectName}
                </p>
                <p className="text-xs text-blue-600 mt-2">Proyecto preseleccionado</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyecto <span className="text-red-500">*</span>
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Selecciona un proyecto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.invoiceNumber} - {project.projectName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ej: Falta de material, problema de instalación"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detalles de la incidencia..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="change_order">Orden de Cambio</option>
                <option value="extra_work">Trabajo Extra</option>
                <option value="damage">Daño</option>
                <option value="material_shortage">Falta de Material</option>
                <option value="special">Especial</option>
                <option value="other">Otro</option>
              </select>
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Adicional (MXN)
              </label>
              <input
                type="number"
                name="totalCost"
                value={formData.totalCost}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {submitting ? 'Creando...' : 'Crear Incidencia'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Información útil */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tipos de Incidencia:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Orden de Cambio:</strong> Cambios en el alcance del proyecto</li>
              <li><strong>Trabajo Extra:</strong> Trabajo adicional no contemplado</li>
              <li><strong>Daño:</strong> Daños en materiales o equipos</li>
              <li><strong>Falta de Material:</strong> Materiales faltantes o atrasados</li>
              <li><strong>Especial:</strong> Incidencias especiales o situaciones excepcionales</li>
              <li><strong>Otro:</strong> Cualquier otra incidencia</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateIncidentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateIncidentPage />
    </Suspense>
  );
}

export default CreateIncidentPageWrapper;
