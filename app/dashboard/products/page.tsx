'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';
import { useConfirmModal } from '../../../components/ui/confirm-modal';

interface Category {
  id: number;
  name: string;
  type: string;
  parentCategoryId: number | null;
  subcategories?: Category[];
}

interface Product {
  id: number;
  name: string;
  categoryId: number;
  unitPrice: number;
  unitType: string;
}

interface FormData {
  name: string;
  categoryId: string;
  unitPrice: string;
  unitType: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { confirm, ModalComponent } = useConfirmModal();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: '',
    unitPrice: '',
    unitType: 'unit'
  });

  useEffect(() => {
    // Verificar permisos de acceso
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          if (decoded.role === 'vendor') {
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        router.push('/');
        return;
      }
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const categoriesData = await categoriesRes.json();
      const { products: productsData } = await productsRes.json();
      
      const { categories: extractedCategories } = typeof categoriesData === 'object' && 'categories' in categoriesData 
        ? categoriesData 
        : { categories: categoriesData };
      
      setCategories(extractedCategories);
      setProducts(productsData);
      
      // Select first subcategory by default
      const firstSubcategory = extractedCategories.find((c: Category) => c.type === 'sub');
      if (firstSubcategory) {
        setSelectedCategory(firstSubcategory.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      addNotification({
        type: 'warning',
        title: 'Categoría requerida',
        message: 'Por favor selecciona una categoría para el producto'
      });
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          categoryId: parseInt(formData.categoryId || String(selectedCategory)),
          unitPrice: parseFloat(formData.unitPrice),
          unitType: formData.unitType,
          ...(editingId && { id: editingId })
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (editingId) {
          setProducts(products.map(p => p.id === editingId ? result : p));
          addNotification({
            type: 'success',
            title: 'Producto actualizado',
            message: 'El producto se ha actualizado correctamente'
          });
        } else {
          setProducts([...products, result]);
          addNotification({
            type: 'success',
            title: 'Producto creado',
            message: 'El producto se ha creado correctamente'
          });
        }
        resetForm();
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudo guardar el producto. Inténtalo de nuevo.'
      });
    }
  };

  const handleDelete = async (productId: number) => {
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButtonColor: 'red'
    });

    if (!confirmed) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== productId));
        addNotification({
          type: 'success',
          title: 'Producto eliminado',
          message: 'El producto se ha eliminado correctamente'
        });
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error al eliminar',
        message: 'No se pudo eliminar el producto. Inténtalo de nuevo.'
      });
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      categoryId: String(product.categoryId),
      unitPrice: String(product.unitPrice),
      unitType: product.unitType
    });
    setSelectedCategory(product.categoryId);
    setEditingId(product.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      unitPrice: '',
      unitType: 'unit'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : [];

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getMainCategories = () => {
    return categories.filter(c => c.type === 'main');
  };

  const getSubcategoriesByMain = (mainId: number) => {
    return categories.filter(c => c.type === 'sub' && c.parentCategoryId === mainId);
  };

  if (loading) return <div className="text-center py-8 text-[#EAB839] text-lg font-semibold">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-[#121313]">Gestión de Productos</h1>
        <p className="text-gray-600 mt-2">Administra productos por categoría</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839] h-fit">
          <h3 className="text-xl font-bold text-[#121313] mb-4">SISTEMAS</h3>
          <div className="space-y-4">
            {getMainCategories().map(mainCat => (
              <div key={mainCat.id}>
                <p className="font-bold text-[#121313] text-sm px-2 py-1 bg-gray-100 rounded mb-2">
                  {mainCat.name}
                </p>
                <div className="space-y-1">
                  {getSubcategoriesByMain(mainCat.id).map(subCat => (
                    <button
                      key={subCat.id}
                      onClick={() => {
                        setSelectedCategory(subCat.id);
                        setShowForm(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition text-sm font-semibold ${
                        selectedCategory === subCat.id
                          ? 'bg-[#EAB839] text-[#121313]'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {subCat.name}
                      <span className="float-right text-xs">
                        ({products.filter(p => p.categoryId === subCat.id).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Form Section */}
          {selectedCategory && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#121313]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Plus className="w-6 h-6 text-[#121313]" />
                  <h3 className="text-2xl font-bold text-[#121313]">
                    {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                </div>
                {showForm && (
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {showForm ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[#121313] font-bold mb-2 text-sm">Nombre del Producto</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#EAB839] text-gray-900"
                      required
                      placeholder="Ej: EPDM Membrane"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#121313] font-bold mb-2 text-sm">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#EAB839] text-gray-900"
                        required
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-[#121313] font-bold mb-2 text-sm">Unidad</label>
                      <select
                        value={formData.unitType}
                        onChange={(e) => setFormData({...formData, unitType: e.target.value})}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#EAB839] text-gray-900"
                      >
                        <option value="unit">Unidad</option>
                        <option value="pie">Pie</option>
                        <option value="pie²">Pie²</option>
                        <option value="roll">Rollo</option>
                        <option value="bucket">Cubo</option>
                        <option value="gallon">Galón</option>
                        <option value="bundle">Bundle</option>
                        <option value="box">Caja</option>
                        <option value="sheet">Lámina</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#121313] font-bold mb-2 text-sm">Categoría</label>
                      <select
                        value={formData.categoryId || selectedCategory}
                        onChange={(e) => {
                          setFormData({...formData, categoryId: e.target.value});
                          setSelectedCategory(Number(e.target.value));
                        }}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#EAB839] text-gray-900"
                      >
                        {categories.filter(c => c.type === 'sub').map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white font-bold py-3 rounded-lg hover:opacity-90 transition"
                    >
                      {editingId ? 'Actualizar Producto' : 'Crear Producto'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-300 text-[#121313] font-bold rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Producto
                </button>
              )}
            </div>
          )}

          {/* Products List */}
          {selectedCategory && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#121313] to-[#2a2a2a] px-6 py-4">
                <h2 className="text-xl font-black text-white">
                  {getCategoryName(selectedCategory)} ({filteredProducts.length} productos)
                </h2>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay productos en esta categoría
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="p-6 hover:bg-gray-50 transition flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#121313]">{product.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-semibold">${product.unitPrice.toFixed(2)}</span> por {product.unitType}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-3 bg-[#EAB839] text-[#121313] rounded-lg hover:opacity-80 transition font-bold"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ModalComponent />
    </div>
  );
}
