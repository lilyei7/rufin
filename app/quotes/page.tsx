'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Search, Filter, ExternalLink, DollarSign, Store } from 'lucide-react';

interface Quote {
  id: number;
  quoteNumber: string;
  clientName: string;
  totalCost: number;
  description?: string;
  expiresAt?: string;
  vendor: {
    id: number;
    name: string;
    email: string;
  };
  quoteToken: string;
}

export default function PublicQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendor, setFilterVendor] = useState('all');
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quotes?public=true');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);

        // Extraer vendedores únicos
        const uniqueVendors = Array.from(
          new Map(data.quotes.map((q: Quote) => [q.vendor.id, q.vendor])).values()
        );
        setVendors(uniqueVendors);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVendor = filterVendor === 'all' || quote.vendor.id.toString() === filterVendor;
    
    return matchesSearch && matchesVendor;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121313] to-[#1a1a1a] text-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-[#EAB839]" />
            <h1 className="text-4xl font-black">Cotizaciones Públicas</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Explora todas las cotizaciones disponibles de nuestros vendedores. 
            Cada cotización tiene un link temporal que dura hasta la fecha de expiración.
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, número de cotización..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent"
              />
            </div>

            {/* Filtro por Vendedor */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAB839] focus:border-transparent"
              >
                <option value="all">Todos los vendedores</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              No hay cotizaciones disponibles
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterVendor !== 'all' 
                ? 'Intenta con otros términos de búsqueda o filtros'
                : 'Las cotizaciones aparecerán aquí cuando los vendedores las publiquen'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotes.map((quote) => {
              const expiresAt = quote.expiresAt ? new Date(quote.expiresAt) : null;
              const isExpiringSoon = expiresAt && (expiresAt.getTime() - Date.now()) < (7 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={quote.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-200"
                >
                  {/* Encabezado */}
                  <div className="bg-gradient-to-r from-[#EAB839] to-yellow-500 p-4 text-[#121313]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold opacity-90">Cotización</p>
                        <p className="text-lg font-black">{quote.quoteNumber}</p>
                      </div>
                      {isExpiringSoon && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Expira pronto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5 space-y-4">
                    {/* Cliente */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Cliente</p>
                      <p className="text-lg font-bold text-[#121313]">{quote.clientName}</p>
                    </div>

                    {/* Descripción */}
                    {quote.description && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Descripción</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{quote.description}</p>
                      </div>
                    )}

                    {/* Costo */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Costo Total</p>
                      <p className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[#EAB839]" />
                        <span className="text-2xl font-black text-[#121313]">
                          {quote.totalCost.toLocaleString('es-CO', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </p>
                    </div>

                    {/* Vendedor */}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="w-4 h-4 text-[#EAB839]" />
                        <p className="text-xs text-gray-500 uppercase font-semibold">Vendedor</p>
                      </div>
                      <p className="font-semibold text-[#121313]">{quote.vendor.name}</p>
                      <p className="text-xs text-gray-500">{quote.vendor.email}</p>
                    </div>

                    {/* Expiración */}
                    {expiresAt && (
                      <div className="text-xs text-gray-500 text-center pb-2">
                        Disponible hasta {expiresAt.toLocaleDateString('es-CO')}
                      </div>
                    )}

                    {/* Botón Ver */}
                    <Link
                      href={`/quote/${quote.quoteToken}`}
                      className="block w-full mt-4 bg-[#EAB839] hover:bg-yellow-500 text-[#121313] font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Cotización
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ ¿Cómo funcionan las cotizaciones?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Cada cotización tiene un link único válido hasta la fecha de expiración</li>
            <li>✓ Haz clic en "Ver Cotización" para acceder a los detalles y aceptar la oferta</li>
            <li>✓ Al aceptar, se crea automáticamente un proyecto aprobado</li>
            <li>✓ Contacta al vendedor si tienes preguntas sobre la cotización</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
