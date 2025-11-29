'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  MapPin,
  Phone,
  Mail,
  User,
  TrendingUp,
  Briefcase,
  CalendarDays
} from 'lucide-react';

interface Project {
  id: number;
  projectName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  status: string;
  assignedInstaller?: string;
  installerStatus?: 'assigned' | 'working' | 'completed' | 'approved';
  installerPayment?: number;
  installerPriceProposal?: number;
  installerPriceStatus?: 'pending' | 'accepted' | 'rejected';
  scheduledStart?: string;
  scheduledEnd?: string;
  totalCost: number;
  systemName?: string;
}

interface UserToken {
  id: number;
  username: string;
  role: 'admin' | 'vendor' | 'purchasing' | 'installer';
  name: string;
}

export default function InstallerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserToken | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assigned: 0,
    pending: 0,
    working: 0,
    completed: 0,
    totalEarnings: 0,
    pendingPayments: 0
  });

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
        if (decoded.role !== 'installer') {
          router.push('/dashboard');
          return;
        }
        setUser(decoded);
        fetchInstallerData(token);
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router]);

  const fetchInstallerData = async (token: string) => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const { projects } = await res.json();

      // Filtrar solo proyectos relacionados con el instalador
      const installerProjects = projects.filter((project: Project) =>
        project.assignedInstaller === user?.name &&
        project.status !== 'draft' &&
        project.status !== 'rejected'
      );

      setProjects(installerProjects);

      // Calcular estadísticas
      const assigned = installerProjects.filter((p: Project) => p.installerStatus === 'assigned').length;
      const pending = installerProjects.filter((p: Project) => p.installerPriceStatus === 'pending').length;
      const working = installerProjects.filter((p: Project) => p.installerStatus === 'working').length;
      const completed = installerProjects.filter((p: Project) => p.installerStatus === 'completed').length;

      const totalEarnings = installerProjects
        .filter((p: Project) => p.installerPayment && p.installerPayment > 0)
        .reduce((sum: number, p: Project) => sum + (p.installerPayment || 0), 0);

      const pendingPayments = installerProjects
        .filter((p: Project) => p.installerStatus === 'completed' && (!p.installerPayment || p.installerPayment === 0))
        .reduce((sum: number, p: Project) => sum + (p.installerPriceProposal || 0), 0);

      setStats({
        assigned,
        pending,
        working,
        completed,
        totalEarnings,
        pendingPayments
      });

    } catch (error) {
      console.error('Error fetching installer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'working': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <AlertCircle className="w-4 h-4" />;
      case 'working': return <PlayCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No programado';
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUpcomingProjects = () => {
    const now = new Date();
    return projects
      .filter((p: Project) => p.scheduledStart && new Date(p.scheduledStart) > now)
      .sort((a: Project, b: Project) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime())
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EAB839]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#EAB839] to-[#d4a034] rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenido, {user.name}!</h1>
        <p className="text-lg opacity-90">Tu panel de control de instalador</p>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proyectos Asignados</p>
              <p className="text-3xl font-bold text-gray-900">{stats.assigned}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-3xl font-bold text-gray-900">{stats.working}</p>
            </div>
            <PlayCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
              <p className="text-3xl font-bold text-gray-900">${stats.pendingPayments.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Trabajos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Próximos Trabajos</h2>
            <CalendarDays className="w-6 h-6 text-gray-400" />
          </div>

          <div className="space-y-4">
            {getUpcomingProjects().length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay trabajos programados próximamente</p>
            ) : (
              getUpcomingProjects().map((project) => (
                <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{project.projectName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(project.installerStatus || 'assigned')}`}>
                      {getStatusIcon(project.installerStatus || 'assigned')}
                      {project.installerStatus || 'Asignado'}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{project.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.scheduledStart)}</span>
                    </div>
                    {project.systemName && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{project.systemName}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold text-[#EAB839]">
                      ${project.installerPriceProposal?.toLocaleString() || 'Pendiente'}
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard/work-order`)}
                      className="px-3 py-1 bg-[#EAB839] text-white rounded-md text-sm hover:bg-[#d4a034] transition-colors"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trabajos Pendientes de Acción */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Acciones Pendientes</h2>
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>

          <div className="space-y-4">
            {/* Proyectos asignados sin presupuesto */}
            {projects.filter((p: Project) => p.installerStatus === 'assigned' && p.installerPriceStatus === 'pending').length > 0 && (
              <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-orange-900">Presupuestos Pendientes</h3>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                    {projects.filter((p: Project) => p.installerStatus === 'assigned' && p.installerPriceStatus === 'pending').length}
                  </span>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  Tienes proyectos asignados que requieren propuesta de precio
                </p>
                <button
                  onClick={() => router.push('/dashboard/price-proposals')}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  Gestionar Presupuestos
                </button>
              </div>
            )}

            {/* Proyectos en progreso */}
            {projects.filter((p: Project) => p.installerStatus === 'working').length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-900">Trabajos en Progreso</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {projects.filter((p: Project) => p.installerStatus === 'working').length}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Proyectos actualmente en ejecución
                </p>
                <button
                  onClick={() => router.push('/dashboard/work-order')}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Ver Orden de Trabajo
                </button>
              </div>
            )}

            {/* Proyectos completados esperando pago */}
            {projects.filter((p: Project) => p.installerStatus === 'completed' && (!p.installerPayment || p.installerPayment === 0)).length > 0 && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-green-900">Pagos Pendientes</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {projects.filter((p: Project) => p.installerStatus === 'completed' && (!p.installerPayment || p.installerPayment === 0)).length}
                  </span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Trabajos completados esperando aprobación de pago
                </p>
                <button
                  onClick={() => router.push('/dashboard/work-order')}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Ver Estado de Pagos
                </button>
              </div>
            )}

            {projects.filter((p: Project) =>
              p.installerStatus === 'assigned' && p.installerPriceStatus === 'pending' ||
              p.installerStatus === 'working' ||
              (p.installerStatus === 'completed' && (!p.installerPayment || p.installerPayment === 0))
            ).length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">¡Todo al día! No hay acciones pendientes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de Ingresos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Resumen de Ingresos</h2>
          <TrendingUp className="w-6 h-6 text-green-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Ganado</p>
            <p className="text-2xl font-bold text-green-600">${stats.totalEarnings.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Pagos Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">${stats.pendingPayments.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Trabajos Activos</p>
            <p className="text-2xl font-bold text-blue-600">{stats.assigned + stats.working}</p>
          </div>
        </div>
      </div>
    </div>
  );
}