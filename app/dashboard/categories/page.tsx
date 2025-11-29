'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'sub',
    parentCategoryId: ''
  });
  const [mainCategories, setMainCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/categories', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          const categoriesData = data.categories || data; // Fallback por si viene como array directo
          
          if (Array.isArray(categoriesData)) {
            setCategories(categoriesData);
            setMainCategories(categoriesData.filter((c: any) => c.type === 'main'));
          } else {
            console.error('Invalid categories data format');
            setCategories([]);
            setMainCategories([]);
          }
        } else {
          console.error('Failed to fetch categories:', res.status);
          setCategories([]);
          setMainCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        setMainCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const newCategory = await res.json();
        setCategories([...categories, newCategory]);
        setFormData({ name: '', type: 'sub', parentCategoryId: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="text-center py-8 text-[#EAB839] text-lg font-semibold">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-[#121313]">Gestión de Categorías</h1>
        <p className="text-gray-600 mt-2">Organiza y administra las categorías de productos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de creación */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839]">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-6 h-6 text-[#EAB839]" />
            <h3 className="text-2xl font-bold text-[#121313]">Nueva Categoría</h3>
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
              <label className="block text-[#121313] font-bold mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
              >
                <option value="main">Principal</option>
                <option value="sub">Subcategoría</option>
              </select>
            </div>

            {formData.type === 'sub' && (
              <div>
                <label className="block text-[#121313] font-bold mb-2">Categoría Principal</label>
                <select
                  value={formData.parentCategoryId}
                  onChange={(e) => setFormData({...formData, parentCategoryId: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#EAB839]"
                  required
                >
                  <option value="">Selecciona una categoría principal</option>
                  {mainCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white font-bold py-2 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Categoría
            </button>
          </form>
        </div>

        {/* Lista de categorías */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#121313]">
          <h3 className="text-2xl font-bold text-[#121313] mb-4">Categorías ({categories?.length || 0})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mainCategories && mainCategories.length > 0 ? mainCategories.map((mainCat: any) => (
              <div key={mainCat.id} className="bg-gradient-to-r from-[#EAB839]/10 to-transparent rounded-lg p-4 border-l-4 border-[#EAB839]">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-[#121313] text-lg">{mainCat.name}</p>
                  <div className="flex gap-1">
                    <button className="p-1 text-[#EAB839] hover:bg-[#EAB839]/20 rounded transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-100 rounded transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 ml-4">
                  {categories?.filter((cat: any) => cat.parentCategoryId === mainCat.id).map((subCat: any) => (
                    <div key={subCat.id} className="text-sm text-gray-700 flex justify-between items-center py-2 px-2 hover:bg-gray-50 rounded transition">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-[#EAB839]" />
                        <span>{subCat.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1 text-[#EAB839] hover:bg-[#EAB839]/20 rounded transition">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-100 rounded transition">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>No hay categorías disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
