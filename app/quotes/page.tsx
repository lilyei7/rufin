'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, DollarSign, Store, TrendingUp, Clock } from 'lucide-react';

interface Quote {
  id: number;
  quoteNumber: string;
  clientName: string;
  totalCost: number;
  status: string;
  description?: string;
  expiresAt?: string;
  items?: any[];
  vendor: {
    id: number;
    name: string;
    email: string;
  };
  quoteToken: string;
}

export default function PublicQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendor, setFilterVendor] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, filterVendor, sortBy, quotes]);

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

  const applyFiltersAndSort = () => {
    let filtered = quotes;

    // Filtrar por vendedor
    if (filterVendor !== 'all') {
      filtered = filtered.filter(q => q.vendor.id.toString() === filterVendor);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(quote =>
        quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.totalCost - b.totalCost);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.totalCost - a.totalCost);
        break;
      case 'newest':
        filtered.reverse();
        break;
      default:
        break;
    }

    setFilteredQuotes(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121313] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: quotes.length,
    vendors: vendors.length,
    totalValue: quotes.reduce((sum, q) => sum + q.totalCost, 0)
  };

  return (
    <div className="min-h-screen bg-[#121313]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] via-[#121313] to-[#0a0a0a] px-6 py-16 border-b border-[#EAB839]/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#EAB839]/10 rounded-lg">
              <TrendingUp className="w-8 h-8 text-[#EAB839]" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white">Cotizaciones</h1>
              <p className="text-[#EAB839] text-sm font-semibold mt-1">Panel Público de Ofertas</p>
            </div>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            Descubre las mejores cotizaciones disponibles de nuestros vendedores asociados. 
            Cada oferta incluye link temporal con validez hasta la fecha de expiración.
          </p>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total de Cotizaciones</p>
              <p className="text-2xl font-bold text-[#EAB839] mt-2">{stats.total}</p>
            </div>
            <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Vendedores Activos</p>
              <p className="text-2xl font-bold text-[#EAB839] mt-2">{stats.vendors}</p>
            </div>
            <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Valor Total en Ofertas</p>
              <p className="text-2xl font-bold text-[#EAB839] mt-2">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filtros */}
        <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-6 mb-10 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-[#EAB839] mb-3">
                <Search className="w-4 h-4 inline mr-2" />
                Buscar
              </label>
              <input
                type="text"
                placeholder="Cliente, número o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#EAB839]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EAB839] focus:border-transparent transition"
              />
            </div>

            {/* Filtro Vendedor */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-[#EAB839] mb-3">
                <Store className="w-4 h-4 inline mr-2" />
                Vendedor
              </label>
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#EAB839]/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#EAB839] focus:border-transparent transition"
              >
                <option value="all">Todos ({quotes.length})</option>
                {vendors.map((vendor) => {
                  const count = quotes.filter(q => q.vendor.id === vendor.id).length;
                  return (
                    <option key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Ordenar */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-[#EAB839] mb-3">
                <Filter className="w-4 h-4 inline mr-2" />
                Ordenar
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#EAB839]/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#EAB839] focus:border-transparent transition"
              >
                <option value="newest">Más Recientes</option>
                <option value="price_asc">Menor Precio</option>
                <option value="price_desc">Mayor Precio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-16 text-center backdrop-blur-sm">
            <TrendingUp className="w-16 h-16 text-[#EAB839]/30 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No hay cotizaciones</h3>
            <p className="text-gray-400">
              {searchTerm || filterVendor !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Los vendedores publicarán sus cotizaciones aquí pronto'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                Mostrando <span className="text-[#EAB839] font-bold">{filteredQuotes.length}</span> de{' '}
                <span className="text-[#EAB839] font-bold">{quotes.length}</span> cotizaciones
              </p>
            </div>

            {/* Grid de Cotizaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuotes.map((quote) => {
                const expiresAt = quote.expiresAt ? new Date(quote.expiresAt) : null;
                const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <Link key={quote.id} href={`/quote/${quote.quoteToken}`}>
                    <div className="group h-full bg-gradient-to-br from-white/10 to-white/5 border border-[#EAB839]/30 rounded-lg overflow-hidden hover:border-[#EAB839]/60 hover:shadow-2xl hover:shadow-[#EAB839]/20 transition-all duration-300 backdrop-blur-sm cursor-pointer">
                      {/* Header con número y estado */}
                      <div className="relative h-24 bg-gradient-to-r from-[#EAB839] to-yellow-500 p-4 overflow-hidden">
                        {/* Efecto de fondo */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white rounded-full"></div>
                        </div>
                        
                        <div className="relative z-10">
                          <p className="text-xs text-[#121313] opacity-80 font-semibold uppercase">Cotización #</p>
                          <h3 className="text-2xl font-black text-[#121313]">{quote.quoteNumber}</h3>
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="p-5 space-y-4">
                        {/* Cliente */}
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Cliente</p>
                          <p className="text-base font-bold text-white group-hover:text-[#EAB839] transition">{quote.clientName}</p>
                        </div>

                        {/* Vendedor */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#EAB839]/20">
                          <Store className="w-4 h-4 text-[#EAB839]" />
                          <div className="text-sm">
                            <p className="text-gray-500">Por</p>
                            <p className="font-semibold text-white">{quote.vendor.name}</p>
                          </div>
                        </div>

                        {/* Descripción */}
                        {quote.description && (
                          <div>
                            <p className="text-sm text-gray-400 line-clamp-2">{quote.description}</p>
                          </div>
                        )}

                        {/* Items */}
                        {quote.items && quote.items.length > 0 && (
                          <div className="text-sm text-gray-400">
                            <span className="text-[#EAB839] font-bold">{quote.items.length}</span> productos incluidos
                          </div>
                        )}

                        {/* Expiración */}
                        {daysLeft !== null && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-[#EAB839]/20">
                            <Clock className="w-4 h-4" />
                            {daysLeft > 0 ? (
                              <span>{daysLeft} día{daysLeft !== 1 ? 's' : ''} para expirar</span>
                            ) : (
                              <span className="text-red-500">Expirada</span>
                            )}
                          </div>
                        )}

                        {/* Precio */}
                        <div className="bg-gradient-to-r from-[#EAB839]/20 to-yellow-500/20 border border-[#EAB839]/30 rounded-lg p-4 mt-4">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total</p>
                          <div className="flex items-baseline gap-2">
                            <DollarSign className="w-5 h-5 text-[#EAB839]" />
                            <p className="text-3xl font-black text-[#EAB839]">
                              {quote.totalCost.toLocaleString('es-CO', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Botón */}
                        <button className="w-full mt-4 bg-gradient-to-r from-[#EAB839] to-yellow-500 hover:from-[#d4a534] hover:to-yellow-600 text-[#121313] font-bold py-3 px-4 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#EAB839]/30 flex items-center justify-center gap-2">
                          <span>Ver Detalles</span>
                          <span className="group-hover:translate-x-1 transition">→</span>
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Footer Info */}
        <div className="mt-16 bg-white/5 border border-[#EAB839]/20 rounded-lg p-8 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4">ℹ️ Cómo usar este panel</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="font-semibold text-[#EAB839] mb-2">1. Explorar Ofertas</p>
              <p className="text-gray-400 text-sm">Busca y filtra cotizaciones por vendedor, precio o descripción.</p>
            </div>
            <div>
              <p className="font-semibold text-[#EAB839] mb-2">2. Ver Detalles</p>
              <p className="text-gray-400 text-sm">Haz clic en cualquier cotización para ver los productos incluidos.</p>
            </div>
            <div>
              <p className="font-semibold text-[#EAB839] mb-2">3. Aceptar Oferta</p>
              <p className="text-gray-400 text-sm">Confirma la cotización y se creará automáticamente un proyecto aprobado.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
