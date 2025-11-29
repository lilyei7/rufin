'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';

export default function CatalogPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/categories', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const response = await res.json();
        const data = response.categories || response;
        if (Array.isArray(data)) {
          setCategories(data.filter((c: any) => c.type === 'main'));
        } else {
          console.error('Invalid categories format:', data);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const toggleCategory = (id: number) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCategories(newSet);
  };

  if (loading) return <div className="text-center py-8 text-[#EAB839] text-lg font-semibold">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-[#121313]">Catálogo de Productos</h1>
        <p className="text-gray-600 mt-2">Explora nuestros productos organizados por categoría</p>
      </div>

      <div className="space-y-4">
        {categories.map((category: any) => (
          <div key={category.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white p-4 hover:opacity-90 transition flex justify-between items-center"
            >
              <span className="text-lg font-bold">{category.name}</span>
              <div>
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="w-5 h-5 text-[#EAB839]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#EAB839]" />
                )}
              </div>
            </button>

            {expandedCategories.has(category.id) && (
              <div className="p-6">
                {category.subcategories && category.subcategories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.subcategories.map((sub: any) => (
                      <div key={sub.id} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border-l-4 border-[#EAB839]">
                        <h4 className="font-bold text-[#121313] mb-3">{sub.name}</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          {sub.Products && sub.Products.length > 0 ? (
                            sub.Products.map((p: any) => (
                              <div key={p.id} className="flex justify-between items-center">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-[#EAB839] font-bold">${p.unitPrice}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400">Sin productos</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
                    <Package className="w-5 h-5" />
                    <p>No hay subcategorías</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
