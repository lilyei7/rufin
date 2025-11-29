'use client';

import { useState, useEffect } from 'react';
import { Plus, X, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../../components/ui/notifications';

interface Product {
  id: number;
  name: string;
  categoryId: number;
  unitPrice: number;
  unitType: string;
}

const PROJECT_CHECKLIST = [
  { id: 25, name: 'HardieTrim® NT3™ - Outside/Inside Corner', usage: 'Recommended', category: 'Siding' },
  { id: 26, name: 'HardieTrim® NT3™ - Windows', usage: 'Recommended', category: 'Siding' },
  { id: 27, name: 'Flat Tabs', usage: 'Recommended', category: 'Siding' },
  { id: 28, name: 'Corner Tabs', usage: 'Recommended', category: 'Siding' },
  { id: 29, name: 'Color Matching Caulking', usage: 'Required', category: 'Siding' },
  { id: 30, name: 'ColorPlus® Touch-Up Kit', usage: 'Required', category: 'Siding' },
  { id: 31, name: 'ColorMatch Aluminum Coil', usage: 'Required', category: 'Siding' },
  { id: 32, name: 'HardieWrap®', usage: 'Recommended', category: 'Siding' },
  { id: 33, name: 'Window Flashing', usage: 'Required', category: 'Siding' },
  { id: 34, name: 'Seam Tape', usage: 'Required', category: 'Siding' },
  { id: 35, name: 'Insulation Underlayment (if applicable)', usage: 'Recommended', category: 'Siding' },
  { id: 36, name: 'Siding Gauges', usage: 'Recommended', category: 'Siding' },
  { id: 37, name: 'Galvanized Nails (stainless 1 mile from shore)', usage: 'Required', category: 'Siding' },
  { id: 38, name: 'Clipped Head Finish Trim Nails', usage: 'Required', category: 'Siding' },
  { id: 39, name: 'Crown Staples', usage: 'Required', category: 'Siding' },
  { id: 40, name: 'HardieBlade®', usage: 'Required', category: 'Siding' },
  { id: 41, name: 'Best Practice Manual', usage: 'Required', category: 'Siding' },
  { id: 42, name: 'Tarp - To Cover Material on Site', usage: 'Required', category: 'Siding' },
  { id: 43, name: 'Wood Shims- Window Trim', usage: 'Recommended', category: 'Siding' },
  { id: 44, name: 'SturdiBuild Mounting Blocks', usage: 'Recommended', category: 'Siding' },
];

export default function ProjectChecklistPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    selectedItems: [] as number[],
    quantities: {} as Record<number, number>,
  });

  useEffect(() => {
    // Obtener información del usuario
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUser(decoded);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getProduct = (productId: number) => {
    return products.find(p => p.id === productId);
  };

  const toggleItem = (productId: number, isRequired: boolean) => {
    setFormData(prev => {
      const isSelected = prev.selectedItems.includes(productId);
      const newSelected = isSelected
        ? prev.selectedItems.filter(id => id !== productId)
        : [...prev.selectedItems, productId];
      
      // Inicializar cantidad en 1
      const newQuantities = { ...prev.quantities };
      if (!isSelected && !newQuantities[productId]) {
        newQuantities[productId] = 1;
      }
      
      return {
        ...prev,
        selectedItems: newSelected,
        quantities: newQuantities
      };
    });
  };

  const selectAllRequired = () => {
    const requiredItems = PROJECT_CHECKLIST.filter(item => item.usage === 'Required');
    const newSelected = requiredItems.map(item => item.id);
    const newQuantities: Record<number, number> = {};
    requiredItems.forEach(item => {
      newQuantities[item.id] = 1;
    });
    
    setFormData(prev => ({
      ...prev,
      selectedItems: newSelected,
      quantities: newQuantities
    }));
  };

  const selectAll = () => {
    const allItems = PROJECT_CHECKLIST.map(item => item.id);
    const newQuantities: Record<number, number> = {};
    allItems.forEach(item => {
      newQuantities[item] = 1;
    });
    
    setFormData(prev => ({
      ...prev,
      selectedItems: allItems,
      quantities: newQuantities
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      
      const items = formData.selectedItems.map(productId => {
        const product = getProduct(productId);
        const quantity = formData.quantities[productId] || 1;
        return {
          productId,
          quantity,
          unitPrice: product?.unitPrice || 0
        };
      });

      const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          totalCost,
          items
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear proyecto');
      }

      // Resetear formulario
      setFormData({
        projectName: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        selectedItems: [],
        quantities: {},
      });
      
      setShowModal(false);
      addNotification({
        type: 'success',
        title: '✅ Proyecto Creado',
        message: `El proyecto "${formData.projectName}" ha sido creado exitosamente. Los administradores recibirán la notificación.`,
        duration: 5000
      });
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear el proyecto. Intenta de nuevo.',
        duration: 5000
      });
    }
  };

  const calculateTotal = () => {
    return formData.selectedItems.reduce((sum, productId) => {
      const product = getProduct(productId);
      const quantity = formData.quantities[productId] || 1;
      return sum + ((product?.unitPrice || 0) * quantity);
    }, 0);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-900">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#121313]">Checklist de Proyectos</h1>
            <p className="text-gray-600 mt-2">Crea proyectos con checklist de instalación recomendado</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#EAB839] text-[#121313] px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            <Plus className="w-5 h-5" />
            Nuevo Proyecto
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-[#121313]">Nuevo Proyecto con Checklist</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="p-6 space-y-6">
                {/* Datos del Proyecto */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nombre del Proyecto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.projectName}
                      onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Ej: Sistema de Siding - Casa de María"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email del Cliente
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="cliente@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="555-0000"
                    />
                  </div>
                </div>

                {/* Botones de Selección Rápida */}
                <div className="flex gap-2 justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllRequired}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold hover:bg-red-200 transition"
                    >
                      Seleccionar Requeridos
                    </button>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold hover:bg-blue-200 transition"
                    >
                      Seleccionar Todo
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Items seleccionados: {formData.selectedItems.length}</p>
                    {user?.role !== 'vendor' && (
                      <p className="text-lg font-bold text-[#EAB839]">
                        Total: ${calculateTotal().toLocaleString()}
                      </p>
                    )}
                    {user?.role === 'vendor' && (
                      <p className="text-lg font-bold text-[#EAB839]">
                        Total Items: {formData.selectedItems.reduce((sum, itemId) => sum + (formData.quantities[itemId] || 1), 0)} unidades
                      </p>
                    )}
                  </div>
                </div>

                {/* Checklist */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Items de Instalación</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {PROJECT_CHECKLIST.map((item) => {
                      const product = getProduct(item.id);
                      const isSelected = formData.selectedItems.includes(item.id);
                      const isRequired = item.usage === 'Required';

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition ${
                            isSelected
                              ? 'border-[#EAB839] bg-yellow-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.id, isRequired)}
                            className="w-5 h-5 rounded cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {item.name}
                              </p>
                              {isRequired && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                                  Requerido
                                </span>
                              )}
                              {!isRequired && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2 mt-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={formData.quantities[item.id] || 1}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    quantities: {
                                      ...prev.quantities,
                                      [item.id]: parseInt(e.target.value) || 1
                                    }
                                  }))}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                />
                                <span className="text-sm text-gray-600">
                                  {user?.role === 'vendor' ? 
                                    `Cantidad: ${formData.quantities[item.id] || 1} ${product?.unitType || 'unidades'}` :
                                    `x $${product?.unitPrice || 0} = $${((formData.quantities[item.id] || 1) * (product?.unitPrice || 0)).toLocaleString()}`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3 justify-end pt-4 border-t sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formData.selectedItems.length === 0}
                    className="px-6 py-2 bg-[#EAB839] text-[#121313] rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Crear Proyecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Acerca de la Checklist</h3>
              <p className="text-sm text-blue-800 mt-1">
                Esta checklist contiene todos los items recomendados por los fabricantes para una instalación correcta de sistemas de siding. 
                Los items marcados como "Requerido" son esenciales para garantizar la calidad de la instalación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
