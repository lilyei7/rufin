'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Project {
  id: number;
  projectName: string;
  clientName: string;
  status: string;
  assignedInstaller?: string;
  installerPayment?: number;
  installerStatus?: 'assigned' | 'working' | 'completed' | 'approved';
  installerPriceProposal?: number;
  installerPriceStatus?: 'pending' | 'accepted' | 'rejected';
  installerComments?: string;
  priceProposalDate?: string;
  totalCost: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'installers' | 'price-proposals'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [installerProjects, setInstallerProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    unitPrice: '',
    unitType: 'paquete'
  });

  useEffect(() => {
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
        if (!Array.isArray(categoriesData)) {
          console.error('Invalid categories format:', categoriesData);
          setCategories([]);
        } else {
          setCategories(categoriesData.filter((c: any) => c.type !== 'main'));
        }

        setProducts(products);
        setInstallerProjects(projects.filter((p: Project) => p.assignedInstaller));
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateInstallerPayment = async (projectId: number, payment: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installerPayment: payment }),
      });

      if (res.ok) {
        // Recargar proyectos
        const projectsRes = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        const { projects } = await projectsRes.json();
        setInstallerProjects(projects.filter((p: Project) => p.assignedInstaller));
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const approveWork = async (projectId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installerStatus: 'approved' }),
      });

      if (res.ok) {
        // Recargar proyectos
        const projectsRes = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        const { projects } = await projectsRes.json();
        setInstallerProjects(projects.filter((p: Project) => p.assignedInstaller));
      }
    } catch (error) {
      console.error('Error approving work:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          unitPrice: parseFloat(formData.unitPrice)
        })
      });

      if (res.ok) {
        const newProduct = await res.json();
        setProducts([...products, newProduct]);
        setFormData({ name: '', categoryId: '', unitPrice: '', unitType: 'paquete' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="text-center py-8 text-[#EAB839] text-lg font-semibold">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-[#121313]">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona productos e instaladores</p>
      </div>

      {/* Pestañas manuales */}
      <div className="w-full">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('price-proposals')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'price-proposals'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Propuestas de Precio
          </button>
          <button
            onClick={() => setActiveTab('installers')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'installers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Instaladores
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulario de creación */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839]">
                <div className="flex items-center gap-2 mb-6">
                  <Plus className="w-6 h-6 text-[#EAB839]" />
                  <h3 className="text-2xl font-bold text-[#121313]">Nuevo Producto</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[#121313] font-bold mb-2">Nombre</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#121313] font-bold mb-2">Categoría</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#121313] font-bold mb-2">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                        className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#121313] font-bold mb-2">Unidad</label>
                      <select
                        value={formData.unitType}
                        onChange={(e) => setFormData({...formData, unitType: e.target.value})}
                        className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
                      >
                        <option>paquete</option>
                        <option>pie²</option>
                        <option>rollo</option>
                        <option>unidad</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white font-bold py-2 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Producto
                  </button>
                </form>
              </div>

              {/* Lista de productos */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#121313]">
                <h3 className="text-2xl font-bold text-[#121313] mb-4">Productos ({products.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map((product: any) => (
                    <div key={product.id} className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border-l-4 border-[#EAB839] hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-[#121313]">{product.name}</p>
                          <p className="text-sm text-gray-600">${product.unitPrice.toFixed(2)} / {product.unitType}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-[#EAB839] hover:text-[#121313] p-1 transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800 p-1 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'price-proposals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839]">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-6 h-6 text-[#EAB839]" />
                <h3 className="text-2xl font-bold text-[#121313]">Propuestas de Precio de Instaladores</h3>
              </div>
              <p className="text-gray-600 mb-6">Revisa y responde a las propuestas de precio enviadas por instaladores</p>

              <div className="space-y-4">
                {installerProjects.filter(p => p.installerPriceStatus === 'pending' || p.installerPriceStatus === 'rejected').map((project) => (
                  <div key={project.id} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border-l-4 border-[#EAB839] hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-[#121313] text-lg">{project.projectName}</h4>
                        <p className="text-sm text-gray-600">
                          Cliente: {project.clientName} |
                          Instalador: {project.assignedInstaller}
                        </p>
                        <p className="text-sm text-gray-600">
                          Estado: {project.installerPriceStatus === 'pending' ? 'Propuesta Enviada' : 'Precio Rechazado'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        project.installerPriceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.installerPriceStatus === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[#121313] font-bold mb-1">Precio Propuesto</label>
                        <p className="text-2xl font-semibold text-blue-600">
                          ${project.installerPriceProposal || 0}
                        </p>
                      </div>
                      <div>
                        <label className="block text-[#121313] font-bold mb-1">Costo Total del Proyecto</label>
                        <p className="text-lg font-semibold text-gray-700">
                          ${project.totalCost || 0}
                        </p>
                      </div>
                    </div>

                    {project.installerComments && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-800">Comentarios del Instalador</span>
                        </div>
                        <p className="text-blue-700">{project.installerComments}</p>
                      </div>
                    )}

                    {project.installerPriceStatus === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            fetch(`/api/projects/${project.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                installerPriceStatus: 'accepted',
                                installerStatus: 'assigned'
                              }),
                            }).then(() => {
                              // Recargar proyectos
                              const projectsRes = fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
                              projectsRes.then(res => res.json()).then(({ projects }) => {
                                setInstallerProjects(projects.filter((p: Project) => p.assignedInstaller));
                              });
                            });
                          }}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aceptar Propuesta
                        </button>
                        <button
                          onClick={() => {
                            const newPrice = prompt('Ingrese el nuevo precio para este proyecto:');
                            if (newPrice && !isNaN(parseFloat(newPrice))) {
                              const token = localStorage.getItem('token');
                              fetch(`/api/projects/${project.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  installerPriceProposal: parseFloat(newPrice),
                                  installerPriceStatus: 'pending',
                                  installerComments: 'Precio ajustado por administrador'
                                }),
                              }).then(() => {
                                // Recargar proyectos
                                const projectsRes = fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
                                projectsRes.then(res => res.json()).then(({ projects }) => {
                                  setInstallerProjects(projects.filter((p: Project) => p.assignedInstaller));
                                });
                              });
                            }
                          }}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          <DollarSign className="w-4 h-4" />
                          Proponer Nuevo Precio
                        </button>
                      </div>
                    )}

                    {project.installerPriceStatus === 'rejected' && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-red-800 font-medium flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          El instalador rechazó el precio anterior. Esperando nueva propuesta.
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {installerProjects.filter(p => p.installerPriceStatus === 'pending' || p.installerPriceStatus === 'rejected').length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay propuestas pendientes</h3>
                    <p className="text-gray-500">Todas las propuestas de precio han sido procesadas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'installers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839]">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-6 h-6 text-[#EAB839]" />
                <h3 className="text-2xl font-bold text-[#121313]">Gestión de Instaladores</h3>
              </div>
              <p className="text-gray-600 mb-6">Gestiona pagos y aprueba trabajos completados por instaladores</p>

              <div className="space-y-4">
                {installerProjects.map((project) => (
                  <div key={project.id} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border-l-4 border-[#EAB839] hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-[#121313] text-lg">{project.projectName}</h4>
                        <p className="text-sm text-gray-600">
                          Cliente: {project.clientName} | 
                          Instalador: {project.assignedInstaller}
                        </p>
                        <p className="text-sm text-gray-600">
                          Estado: {project.installerStatus || 'Asignado'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                        project.installerStatus === 'approved' ? 'border-transparent bg-blue-600 text-white' :
                        project.installerStatus === 'completed' ? 'border-transparent bg-gray-600 text-white' :
                        'text-gray-700 border-gray-300'
                      }`}>
                        {project.installerStatus === 'approved' ? 'Aprobado' :
                         project.installerStatus === 'completed' ? 'Completado' :
                         'En Progreso'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[#121313] font-bold mb-1">Pago Actual</label>
                        <p className="text-lg font-semibold text-green-600">
                          ${project.installerPayment || 0}
                        </p>
                      </div>
                      <div>
                        <label className="block text-[#121313] font-bold mb-1">Costo Total</label>
                        <p className="text-lg font-semibold text-blue-600">
                          ${project.totalCost || 0}
                        </p>
                      </div>
                    </div>

                    {project.installerStatus === 'completed' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#121313] font-bold mb-2">Nuevo Pago</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ingrese el monto del pago"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                updateInstallerPayment(project.id, value);
                              }
                            }}
                            className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
                          />
                        </div>
                        <button
                          onClick={() => approveWork(project.id)}
                          className="w-full bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white font-bold py-2 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprobar Trabajo y Confirmar Pago
                        </button>
                      </div>
                    )}

                    {project.installerStatus === 'approved' && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-green-800 font-medium">
                          Trabajo aprobado y pago confirmado: ${project.installerPayment}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {installerProjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay proyectos asignados a instaladores
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
