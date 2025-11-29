'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, LogOut, Download, CheckCircle, Briefcase, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';

interface InstallerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  contractToken?: string;
  contractSigned: boolean;
}

interface Project {
  id: number;
  projectName: string;
  invoiceNumber: string;
  clientName: string;
  totalCost: number;
  status: string;
  scheduledInstallation?: string;
  installerPriceProposal?: number;
  installerPriceStatus?: string;
  createdAt: string;
  notes?: string;
}

export default function InstallerDashboard() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [installer, setInstaller] = useState<InstallerData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    fetchInstallerData();
  }, []);

  useEffect(() => {
    if (installer) {
      fetchProjects();
    }
  }, [installer]);

  const fetchInstallerData = async () => {
    try {
      const response = await fetch('/api/installers/me');
      if (response.ok) {
        const data = await response.json();
        setInstaller(data);
      } else if (response.status === 401) {
        router.push('/installer/register');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await fetch('/api/installers/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleViewContract = () => {
    if (installer?.contractToken) {
      window.open(`/contract/${installer.contractToken}`, '_blank');
    }
  };

  const handleLogout = () => {
    // Limpiar sesión y redirigir
    localStorage.removeItem('installerToken');
    router.push('/installer/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!installer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">No se pudo cargar tu información</p>
          <button
            onClick={() => router.push('/installer/register')}
            className="px-6 py-3 bg-[#EAB839] text-[#121313] rounded-lg font-bold hover:bg-yellow-500"
          >
            Volver al Registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121313] to-[#1a1a1a] text-white px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logorufin.png" alt="Rufin Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-3xl font-black">Panel de Instalador</h1>
              <p className="text-gray-300 text-sm">Bienvenido, {installer.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tarjeta de Bienvenida */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#121313] mb-2">Hola, {installer.name}!</h2>
              <p className="text-gray-600 mb-4">
                Aquí está tu información y acceso al contrato de servicios
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Email:</strong> {installer.email}</p>
                <p><strong>Teléfono:</strong> {installer.phone}</p>
                {installer.company && <p><strong>Empresa:</strong> {installer.company}</p>}
              </div>
            </div>
            <div className="text-right">
              {installer.contractSigned && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                  <span className="font-bold">Contrato Firmado</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mi Contrato */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-[#EAB839]" />
              <h3 className="text-xl font-bold text-[#121313]">Mi Contrato</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Accede a tu contrato de servicios de instalación firmado. Puedes revisar los términos, 
              descargar copias en PDF y gestionar tu información.
            </p>
            <button
              onClick={handleViewContract}
              className="w-full px-6 py-3 bg-[#EAB839] text-[#121313] rounded-lg font-bold hover:bg-yellow-500 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Ver Mi Contrato
            </button>
          </div>

          {/* Proyectos */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-8 h-8 text-[#EAB839]" />
              <h3 className="text-xl font-bold text-[#121313]">Proyectos Asignados</h3>
            </div>
            {projectsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : projects.length === 0 ? (
              <p className="text-gray-600">
                No hay proyectos asignados en este momento. Pronto recibirás nuevas oportunidades.
              </p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#EAB839] transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-[#121313] text-lg">{project.projectName}</h4>
                        <p className="text-sm text-gray-600">Factura: {project.invoiceNumber}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status === 'completed' ? 'Completado' :
                         project.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <span><strong>Cliente:</strong> {project.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign className="w-4 h-4 text-[#EAB839]" />
                        <span><strong>Costo:</strong> ${project.totalCost.toLocaleString()}</span>
                      </div>
                      {project.scheduledInstallation && (
                        <div className="flex items-center gap-2 text-gray-700 col-span-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span><strong>Instalación:</strong> {new Date(project.scheduledInstallation).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-[#EAB839] text-[#121313] rounded font-semibold text-sm hover:bg-yellow-500 transition-all">
                        Ver Detalles
                      </button>
                      {project.status === 'in_progress' && (
                        <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700 transition-all">
                          Marcar Completado
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info importante */}
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6 mt-8">
          <h4 className="font-bold text-blue-900 mb-2">ℹ️ Información Importante</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Tu contrato está firmado y vigente</li>
            <li>✓ Mantén tus datos actualizados</li>
            <li>✓ Revisa tu contrato regularmente para cambios</li>
            <li>✓ Contacta con soporte si tienes preguntas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
