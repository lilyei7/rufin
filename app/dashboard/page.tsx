'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Layers, TrendingUp, Clock, FileText, ClipboardCheck, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface UserToken {
  id: number;
  username: string;
  role: 'admin' | 'vendor' | 'purchasing' | 'installer';
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ products: 0, categories: 0, projects: 0, pendingProjects: 0 });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserToken | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUser(decoded);

          // Redirigir automáticamente a instaladores a su dashboard personalizado
          if (decoded.role === 'installer') {
            router.push('/dashboard/installer-dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [productsRes, categoriesRes, projectsRes] = await Promise.all([
          fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const { products } = await productsRes.json();
        const categoriesResponse = await categoriesRes.json();
        const { projects } = await projectsRes.json();
        
        const categoriesData = categoriesResponse.categories || categoriesResponse;
        const categoriesLength = Array.isArray(categoriesData) ? categoriesData.length : 0;
        
        const pending = projects.filter((p: any) => p.status === 'pending');
        
        setStats({ 
          products: products.length, 
          categories: categoriesLength,
          projects: projects.length,
          pendingProjects: pending.length
        });
        setPendingProjects(pending);
        setRecentProjects(projects.slice(-5).reverse());
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-8 text-[#EAB839] text-lg font-semibold">Cargando...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#121313]">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839] hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">PROYECTOS</p>
              <p className="text-4xl font-black text-[#121313] mt-2">{stats.projects}</p>
            </div>
            <div className="bg-[#EAB839] p-3 rounded-lg">
              <ClipboardCheck className="w-8 h-8 text-[#121313]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">PENDIENTES</p>
              <p className="text-4xl font-black text-[#121313] mt-2">{stats.pendingProjects}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839] hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">PRODUCTOS</p>
              <p className="text-4xl font-black text-[#121313] mt-2">{stats.products}</p>
            </div>
            <div className="bg-[#EAB839] p-3 rounded-lg">
              <Package className="w-8 h-8 text-[#121313]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#121313] hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">CATEGORÍAS</p>
              <p className="text-4xl font-black text-[#121313] mt-2">{stats.categories}</p>
            </div>
            <div className="bg-[#121313] p-3 rounded-lg">
              <Layers className="w-8 h-8 text-[#EAB839]" />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/projects">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer border-l-4 border-blue-500">
            <ClipboardCheck className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-bold text-[#121313] text-lg">Gestionar Proyectos</h3>
            <p className="text-gray-600 text-sm mt-1">Ver y editar todos los proyectos</p>
          </div>
        </Link>

        <Link href="/dashboard/project-checklist">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer border-l-4 border-green-500">
            <Package className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-bold text-[#121313] text-lg">Crear Proyecto con Checklist</h3>
            <p className="text-gray-600 text-sm mt-1">Nuevo proyecto con lista de instalación</p>
          </div>
        </Link>

        <Link href="/dashboard/incidents">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer border-l-4 border-purple-500">
            <AlertCircle className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-bold text-[#121313] text-lg">Gestionar Incidencias</h3>
            <p className="text-gray-600 text-sm mt-1">Reportar y seguir incidencias</p>
          </div>
        </Link>
      </div>

      {/* Notificaciones de Proyectos Pendientes (solo para Admin y Compras) */}
      {(user?.role === 'admin' || user?.role === 'purchasing') && pendingProjects.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <Bell className="w-6 h-6 text-yellow-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Proyectos Pendientes de Aprobación</h2>
                <p className="text-yellow-100 text-sm">Hay {pendingProjects.length} proyecto{pendingProjects.length > 1 ? 's' : ''} esperando tu revisión</p>
              </div>
            </div>
            <Link 
              href="/dashboard/projects"
              className="px-4 py-2 bg-white text-yellow-700 font-bold rounded-lg hover:bg-yellow-50 transition flex items-center gap-2"
            >
              Ver Todos
              <CheckCircle className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="p-4 space-y-3">
            {pendingProjects.slice(0, 3).map((project) => (
              <div key={project.id} className="bg-white rounded-lg p-4 border-l-4 border-yellow-500 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-bold text-[#121313] text-lg">{project.projectName}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Cliente: <span className="font-semibold">{project.clientName}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Creado {new Date(project.createdAt).toLocaleDateString('es-ES')} por {project.createdBy}
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      {project.items.length} material{project.items.length > 1 ? 'es' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-black text-yellow-600">${project.totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {pendingProjects.length > 3 && (
              <div className="text-center py-2">
                <Link 
                  href="/projects"
                  className="text-yellow-700 font-bold hover:text-yellow-800 underline"
                >
                  + Ver {pendingProjects.length - 3} proyecto{pendingProjects.length - 3 > 1 ? 's' : ''} más
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#121313] to-[#2a2a2a] px-6 py-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#EAB839]" />
          <h2 className="text-xl font-black text-white">Proyectos Recientes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-[#121313]">Proyecto</th>
                <th className="px-6 py-4 text-left font-bold text-[#121313]">Cliente</th>
                <th className="px-6 py-4 text-left font-bold text-[#121313]">Estado</th>
                <th className="px-6 py-4 text-right font-bold text-[#121313]">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project, idx) => (
                <tr key={project.id} className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                  idx === 0 ? 'bg-[#EAB839]/5' : ''
                }`}>
                  <td className="px-6 py-4 font-semibold text-[#121313]">{project.projectName || project.projectType}</td>
                  <td className="px-6 py-4 text-gray-600">{project.clientName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      project.status === 'approved' ? 'bg-green-100 text-green-800' :
                      project.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'working' ? 'bg-orange-100 text-orange-800' :
                      project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {project.status === 'pending' ? 'Pendiente' :
                       project.status === 'approved' ? 'Aprobado' :
                       project.status === 'assigned' ? 'Asignado' :
                       project.status === 'working' ? 'En Trabajo' :
                       project.status === 'in-progress' ? 'En Proceso' :
                       project.status === 'completed' ? 'Completado' : 'Otro'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#EAB839]">${project.totalCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
