'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, MessageSquare, DollarSign, Clock, User } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';

interface Project {
  id: number;
  projectName: string;
  clientName: string;
  status: string;
  assignedInstaller?: string;
  installerStatus?: 'assigned' | 'working' | 'completed' | 'approved';
  installerPayment?: number;
  installerPriceProposal?: number;
  installerPriceStatus?: 'pending' | 'accepted' | 'rejected';
  installerComments?: string;
  priceProposalDate?: string;
  totalCost: number;
}

interface UserToken {
  id: number;
  username: string;
  role: 'admin' | 'vendor' | 'purchasing' | 'installer';
  name: string;
}

export default function PriceProposalsPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [user, setUser] = useState<UserToken | null>(null);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
      const { projects } = await res.json();

      // Filtrar solo proyectos asignados al instalador actual
      const assignedProjects = projects.filter((p: Project) =>
        p.assignedInstaller === user?.name && p.status === 'approved'
      );

      setProjects(assignedProjects);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
          router.push('/dashboard');
          return;
        }
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
    }

    fetchProjects();
  }, [router]);

  const handleAcceptPrice = async (projectId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installerPriceStatus: 'accepted',
          installerComments: 'Precio aceptado'
        }),
      });

      if (res.ok) {
        // Recargar proyectos
        const projectsRes = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        const { projects } = await projectsRes.json();
        const user = JSON.parse(atob(token!.split('.')[1]));
        const assignedProjects = projects.filter((p: Project) =>
          p.assignedInstaller === user.name && p.status === 'approved'
        );
        setProjects(assignedProjects);
      }
    } catch (error) {
      console.error('Error accepting price:', error);
    }
  };

  const handleRejectPrice = async (projectId: number) => {
    if (!comments.trim()) {
      addNotification({
        type: 'warning',
        title: 'Observaciones requeridas',
        message: 'Por favor ingrese observaciones para rechazar el precio'
      });
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installerPriceStatus: 'rejected',
          installerComments: comments
        }),
      });

      if (res.ok) {
        // Recargar proyectos
        const projectsRes = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        const { projects } = await projectsRes.json();
        const user = JSON.parse(atob(token!.split('.')[1]));
        const assignedProjects = projects.filter((p: Project) =>
          p.assignedInstaller === user.name && p.status === 'approved'
        );
        setProjects(assignedProjects);
        setComments('');
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error rejecting price:', error);
    }
  };

  const handleProposePrice = async (projectId: number) => {
    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      addNotification({
        type: 'warning',
        title: 'Precio inválido',
        message: 'Por favor ingrese un precio válido mayor a cero'
      });
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installerPriceProposal: price,
          installerPriceStatus: 'pending',
          priceProposalDate: new Date().toISOString(),
          installerComments: comments || 'Propuesta de precio enviada'
        }),
      });

      if (res.ok) {
        // Recargar proyectos
        const projectsRes = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        const { projects } = await projectsRes.json();
        const user = JSON.parse(atob(token!.split('.')[1]));
        const assignedProjects = projects.filter((p: Project) =>
          p.assignedInstaller === user.name && p.status === 'approved'
        );
        setProjects(assignedProjects);
        setProposedPrice('');
        setComments('');
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error proposing price:', error);
    }
  };

  if (loading) return <div className="text-center py-8 text-[#EAB839] text-lg font-semibold">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-black text-[#121313]">Propuestas de Precio</h1>
        <p className="text-gray-600 mt-2">Acepta, rechaza o propone precios para tus proyectos asignados</p>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#121313] mb-2">{project.projectName}</h3>
                <p className="text-gray-600 mb-2">Cliente: {project.clientName}</p>
                <p className="text-gray-600 mb-4">Costo Total del Proyecto: ${project.totalCost}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-[#EAB839]" />
                      <span className="font-semibold text-[#121313]">Precio Propuesto</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      ${project.installerPriceProposal || 'No definido'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-[#EAB839]" />
                      <span className="font-semibold text-[#121313]">Estado</span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      project.installerPriceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                      project.installerPriceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.installerPriceStatus === 'accepted' ? 'Aceptado' :
                       project.installerPriceStatus === 'rejected' ? 'Rechazado' :
                       'Pendiente'}
                    </span>
                  </div>
                </div>

                {project.installerComments && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Observaciones</span>
                    </div>
                    <p className="text-blue-700">{project.installerComments}</p>
                  </div>
                )}
              </div>
            </div>

            {project.installerPriceStatus === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAcceptPrice(project.id)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aceptar Precio
                </button>
                <button
                  onClick={() => setSelectedProject(project)}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar Precio
                </button>
                <button
                  onClick={() => setSelectedProject(project)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <DollarSign className="w-4 h-4" />
                  Proponer Precio
                </button>
              </div>
            )}

            {project.installerPriceStatus === 'accepted' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Precio aceptado. Puedes proceder con la instalación.
                </p>
              </div>
            )}

            {project.installerPriceStatus === 'rejected' && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800 font-medium flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Precio rechazado. Esperando respuesta del administrador.
                </p>
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay proyectos asignados</h3>
            <p className="text-gray-500">No tienes proyectos pendientes de aprobación de precio</p>
          </div>
        )}
      </div>

      {/* Modal para rechazar precio */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#121313] mb-4">
              {selectedProject.installerPriceProposal ? 'Rechazar Precio' : 'Proponer Precio'}
            </h3>

            {selectedProject.installerPriceProposal && (
              <div className="mb-4">
                <label className="block text-[#121313] font-bold mb-2">Precio Actual</label>
                <p className="text-lg font-semibold text-gray-700">${selectedProject.installerPriceProposal}</p>
              </div>
            )}

            {!selectedProject.installerPriceProposal && (
              <div className="mb-4">
                <label className="block text-[#121313] font-bold mb-2">Precio Propuesto</label>
                <input
                  type="number"
                  step="0.01"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
                  placeholder="Ingrese su precio propuesto"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[#121313] font-bold mb-2">
                {selectedProject.installerPriceProposal ? 'Observaciones' : 'Comentarios'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839] h-24"
                placeholder={selectedProject.installerPriceProposal ?
                  "Explique por qué rechaza este precio..." :
                  "Agregue comentarios sobre su propuesta..."}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (selectedProject.installerPriceProposal) {
                    handleRejectPrice(selectedProject.id);
                  } else {
                    handleProposePrice(selectedProject.id);
                  }
                }}
                className="flex-1 bg-[#121313] text-white py-2 rounded-lg hover:opacity-90 transition"
              >
                {selectedProject.installerPriceProposal ? 'Rechazar' : 'Enviar Propuesta'}
              </button>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setComments('');
                  setProposedPrice('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}