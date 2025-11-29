'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Save, X, DollarSign } from 'lucide-react';

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

export default function PriceManagementPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    // Verificar permisos de acceso
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          if (!['admin', 'purchasing'].includes(decoded.role)) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        router.push('/');
        return;
      }
    }

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
  }, [router]);

  const mainCategories = categories.filter(cat => cat.type === 'main');
  const systems = selectedCategory ? categories.filter(cat => cat.parentCategoryId === selectedCategory) : [];
  const filteredProducts = selectedCategory
    ? products.filter(prod => {
        const productCategory = categories.find(cat => cat.id === prod.categoryId);
        if (!productCategory) return false;
        return productCategory.parentCategoryId === selectedCategory;
      })
    : [];

  const handleEditPrice = (productId: number, currentPrice: number) => {
    setEditingProduct(productId);
    setEditPrice(currentPrice.toString());
  };

  const handleSavePrice = async (productId: number) => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    try {
      // Actualizar en el servidor
      const response = await fetch('/api/update-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, newPrice }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar precio');
      }

      // Actualizar localmente para UI inmediata
      setProducts(prev => prev.map(prod =>
        prod.id === productId ? { ...prod, unitPrice: newPrice } : prod
      ));

      setEditingProduct(null);
      setEditPrice('');

      alert('Precio actualizado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el precio. Inténtalo de nuevo.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditPrice('');
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Precios</h1>
          <p className="text-gray-600 mt-1">Administra los precios de productos por categoría y sistema</p>
        </div>
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
          <DollarSign size={20} />
          <span className="font-semibold">Sistema de Precios</span>
        </div>
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Seleccionar Categoría</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mainCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-4 rounded-lg font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {selectedCategory && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Productos - {mainCategories.find(cat => cat.id === selectedCategory)?.name}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Producto</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Sistema</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Unidad</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">Precio Actual</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(prod => {
                  const productCategory = categories.find(cat => cat.id === prod.categoryId);
                  return (
                    <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-6 text-gray-900 font-medium">{prod.name}</td>
                      <td className="py-4 px-6 text-gray-600">{productCategory?.name}</td>
                      <td className="py-4 px-6 text-gray-600">{prod.unitType}</td>
                      <td className="py-4 px-6 text-right">
                        {editingProduct === prod.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <span className="font-semibold text-gray-900">
                            ${prod.unitPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {editingProduct === prod.id ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleSavePrice(prod.id)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditPrice(prod.id, prod.unitPrice)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No hay productos en esta categoría
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Cómo gestionar precios:</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Selecciona una categoría (ROOFING, SIDING, GUTTERS)</li>
          <li>• Los productos se muestran organizados por sistema</li>
          <li>• Haz clic en el ícono de editar para cambiar el precio</li>
          <li>• Los precios se guardan automáticamente en el sistema</li>
          <li>• Los precios actualizados aparecerán inmediatamente en las cotizaciones</li>
        </ul>
      </div>
    </div>
  );
}