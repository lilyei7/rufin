'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Package, RefreshCw } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';

interface Category {
  id: number;
  name: string;
  description: string;
  type: string;
  parentCategoryId: number | null;
}

interface Product {
  id: number;
  name: string;
  categoryId: number;
  unitPrice: number;
  unitType: string;
}

interface QuoteItem {
  productId: number;
  quantity: number;
  total: number;
}

export default function QuotesPage() {
  const { addNotification } = useNotifications();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<Category | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const loadData = () => {
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories);
        setProducts(data.products);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  };

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

    loadData();
  }, []);

  const mainCategories = categories.filter(cat => cat.type === 'main');
  const systems = selectedCategory ? categories.filter(cat => cat.parentCategoryId === selectedCategory.id) : [];
  const systemProducts = selectedSystem ? products.filter(prod => prod.categoryId === selectedSystem.id) : [];

  const handleQuantityChange = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const total = quantity * product.unitPrice;
    setQuoteItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        if (quantity === 0) {
          return prev.filter(item => item.productId !== productId);
        }
        return prev.map(item => item.productId === productId ? { ...item, quantity, total } : item);
      } else if (quantity > 0) {
        return [...prev, { productId, quantity, total }];
      }
      return prev;
    });
  };

  const getQuantity = (productId: number) => {
    const item = quoteItems.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const getTotal = (productId: number) => {
    const item = quoteItems.find(item => item.productId === productId);
    return item ? item.total : 0;
  };

  const grandTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
  const removeItem = (productId: number) => {
    setQuoteItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSendForApproval = async () => {
    if (!user || quoteItems.length === 0 || !selectedCategory || !selectedSystem) {
      addNotification({
        type: 'warning',
        title: 'Información Incompleta',
        message: 'Por favor selecciona una categoría, sistema y al menos un material antes de enviar.',
        duration: 4000
      });
      return;
    }

    try {
      // Preparar los items con información completa del producto
      const itemsWithDetails = quoteItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name || '',
          categoryId: product?.categoryId || 0,
          quantity: item.quantity,
          unitPrice: product?.unitPrice || 0,
          unitType: product?.unitType || '',
          total: item.total
        };
      });

      const totalCost = grandTotal;

      // Crear el proyecto
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectName: `${selectedCategory.name} - ${selectedSystem.name}`,
          clientName: user.name, // El vendedor es el cliente en este caso
          clientEmail: user.email || '',
          items: itemsWithDetails,
          totalCost: totalCost,
          createdBy: user.name,
          categoryId: selectedCategory.id,
          systemId: selectedSystem.id
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Proyecto Enviado',
          message: 'Tu proyecto ha sido enviado para aprobación exitosamente. El administrador lo revisará pronto.',
          duration: 6000
        });
        // Limpiar la selección
        setSelectedCategory(null);
        setSelectedSystem(null);
        setQuoteItems([]);
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Error al Enviar',
          message: `No se pudo enviar el proyecto: ${error.error}`,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error sending project for approval:', error);
      addNotification({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudo enviar el proyecto para aprobación. Verifica tu conexión e intenta nuevamente.',
        duration: 5000
      });
    }
  };

  if (loading) return (
    <div className="p-6 flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'vendor' ? 'Seleccionar Materiales' : 'Crear Cotización'}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'vendor' ? 'Selecciona categoría, sistema y cantidades de materiales' : 'Selecciona categoría, sistema y productos'}
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            loadData();
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw size={16} />
          Actualizar Precios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              1. {user?.role === 'vendor' ? 'Seleccionar Tipo de Proyecto' : 'Seleccionar Categoría'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mainCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSystem(null);
                    setQuoteItems([]);
                  }}
                  className={`p-4 rounded-lg font-semibold transition-all ${
                    selectedCategory?.id === cat.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Systems */}
          {selectedCategory && (
            <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                2. {user?.role === 'vendor' ? 'Seleccionar Sistema' : 'Seleccionar Sistema'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {systems.map(sys => (
                  <button
                    key={sys.id}
                    onClick={() => {
                      setSelectedSystem(sys);
                      setQuoteItems([]);
                    }}
                    className={`p-4 rounded-lg font-semibold transition-all text-left ${
                      selectedSystem?.id === sys.id
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sys.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {selectedSystem && systemProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                3. {user?.role === 'vendor' ? 'Seleccionar Materiales' : 'Agregar Productos'}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Producto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Unidad</th>
                      {user?.role !== 'vendor' && (
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Precio</th>
                      )}
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Cantidad</th>
                      {user?.role !== 'vendor' && (
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {systemProducts.map(prod => (
                      <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 text-gray-900">{prod.name}</td>
                        <td className="py-3 px-4 text-gray-600">{prod.unitType}</td>
                        {user?.role !== 'vendor' && (
                          <td className="py-3 px-4 text-right text-gray-900 font-semibold">${prod.unitPrice.toFixed(2)}</td>
                        )}
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            value={getQuantity(prod.id)}
                            onChange={(e) => handleQuantityChange(prod.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        {user?.role !== 'vendor' && (
                          <td className="py-3 px-4 text-right text-gray-900 font-semibold">${getTotal(prod.id).toFixed(2)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedSystem && systemProducts.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">No hay productos disponibles para este sistema.</p>
            </div>
          )}
        </div>

        {/* Right Side - Summary */}
        <div className="space-y-4">
          {/* Quote Summary */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={24} />
              <h3 className="text-lg font-bold">
                {user?.role === 'vendor' ? 'Resumen de Materiales' : 'Resumen de Cotización'}
              </h3>
            </div>
            
            <div className="space-y-3 mb-6 pb-6 border-b border-blue-500">
              <div className="flex justify-between">
                <span className="text-blue-100">Productos agregados:</span>
                <span className="font-bold">{quoteItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Total de unidades:</span>
                <span className="font-bold">{quoteItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
            </div>

            {user?.role !== 'vendor' && (
              <div className="mb-6">
                <div className="text-sm text-blue-100 mb-2">Monto Total</div>
                <div className="text-4xl font-bold">${grandTotal.toFixed(2)}</div>
              </div>
            )}

            {user?.role === 'vendor' && (
              <div className="mb-6">
                <div className="text-sm text-blue-100 mb-2">Total de Materiales</div>
                <div className="text-4xl font-bold">{quoteItems.reduce((sum, item) => sum + item.quantity, 0)} unidades</div>
              </div>
            )}

            <button 
              onClick={user?.role === 'vendor' ? handleSendForApproval : undefined}
              className="w-full bg-white text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition"
            >
              {user?.role === 'vendor' ? 'Enviar a Aprobación' : 'Guardar Cotización'}
            </button>
          </div>

          {/* Items List */}
          {quoteItems.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-4 text-gray-900">
                {user?.role === 'vendor' ? 'Materiales Seleccionados' : 'Items Seleccionados'}
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {quoteItems.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{product?.name}</p>
                        <p className="text-xs text-gray-600">{item.quantity} {product?.unitType}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        {user?.role !== 'vendor' && (
                          <span className="font-bold text-gray-900">${item.total.toFixed(2)}</span>
                        )}
                        {user?.role === 'vendor' && (
                          <span className="font-bold text-gray-900">{item.quantity} {product?.unitType}</span>
                        )}
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
