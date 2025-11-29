'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Edit2, Trash2, Share2, Eye, LogOut, Calendar, DollarSign, Check, X } from 'lucide-react';
import Link from 'next/link';

interface QuoteItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Quote {
  id: number;
  quoteNumber: string;
  clientName: string;
  totalCost: number;
  description?: string;
  items: QuoteItem[];
  status: string;
  expiresAt?: string;
  quoteToken: string;
  acceptedAt?: string;
  project?: {
    id: number;
    projectName: string;
    status: string;
  };
}

interface VendorData {
  id: number;
  name: string;
  email: string;
  username: string;
}

export default function VendorQuotesManagementPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  useEffect(() => {
    if (vendor) {
      fetchQuotes();
    }
  }, [vendor, filterStatus]);

  const fetchVendorData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.role !== 'vendor') {
          router.push('/');
          return;
        }
        setVendor(data);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const url = `/api/quotes${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cotización?')) return;

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setQuotes(quotes.filter(q => q.id !== quoteId));
        alert('Cotización eliminada');
      } else {
        alert('Error al eliminar la cotización');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Error al eliminar la cotización');
    }
  };

  const handlePublishQuote = async (quoteId: number) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'published',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        })
      });

      if (response.ok) {
        const updatedQuote = await response.json();
        setQuotes(quotes.map(q => q.id === quoteId ? updatedQuote : q));
        alert('Cotización publicada exitosamente');
      } else {
        alert('Error al publicar la cotización');
      }
    } catch (error) {
      console.error('Error publishing quote:', error);
      alert('Error al publicar la cotización');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return null;
  }

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    published: quotes.filter(q => q.status === 'published').length,
    accepted: quotes.filter(q => q.status === 'accepted').length
  };

  const filteredQuotes = filterStatus === 'all' 
    ? quotes 
    : quotes.filter(q => q.status === filterStatus);

  const statusColors: { [key: string]: { bg: string; text: string; label: string } } = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Borrador' },
    published: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Publicada' },
    accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceptada' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' },
    expired: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Expirada' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121313] to-[#1a1a1a] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logorufin.png" alt="Rufin Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-3xl font-black">Mis Cotizaciones</h1>
              <p className="text-gray-300 text-sm">Gestiona tus cotizaciones y compartelas con clientes</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Card de Bienvenida */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#121313] mb-1">Hola, {vendor.name}!</h2>
              <p className="text-gray-600">{vendor.email}</p>
            </div>
            <Link
              href="/dashboard/quotes/new"
              className="bg-[#EAB839] hover:bg-yellow-500 text-[#121313] font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nueva Cotización
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm font-semibold">Total</p>
            <p className="text-3xl font-black text-[#121313]">{stats.total}</p>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm font-semibold">Borradores</p>
            <p className="text-3xl font-black text-gray-700">{stats.draft}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6 text-center">
            <p className="text-blue-600 text-sm font-semibold">Publicadas</p>
            <p className="text-3xl font-black text-blue-700">{stats.published}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 text-center">
            <p className="text-green-600 text-sm font-semibold">Aceptadas</p>
            <p className="text-3xl font-black text-green-700">{stats.accepted}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#EAB839]"
          >
            <option value="all">Todas las cotizaciones</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicadas</option>
            <option value="accepted">Aceptadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>

        {/* Lista de Cotizaciones */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No hay cotizaciones</h3>
            <p className="text-gray-500 mb-6">
              {filterStatus === 'all'
                ? 'Comienza creando una nueva cotización'
                : `No hay cotizaciones en estado "${statusColors[filterStatus]?.label}"`}
            </p>
            <Link
              href="/dashboard/quotes/new"
              className="inline-block bg-[#EAB839] hover:bg-yellow-500 text-[#121313] font-bold py-3 px-6 rounded-lg transition-all"
            >
              <Plus className="inline w-4 h-4 mr-2" />
              Nueva Cotización
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => {
              const status = statusColors[quote.status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: quote.status };
              const expiresAt = quote.expiresAt ? new Date(quote.expiresAt) : null;
              const isExpired = expiresAt && expiresAt < new Date();

              return (
                <div
                  key={quote.id}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all border-l-4 border-[#EAB839]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Información Principal */}
                    <div>
                      <p className="text-sm text-gray-500 uppercase font-semibold">Cotización</p>
                      <p className="text-lg font-bold text-[#121313]">{quote.quoteNumber}</p>
                      <p className="text-sm text-gray-600">{quote.clientName}</p>
                    </div>

                    {/* Monto */}
                    <div>
                      <p className="text-sm text-gray-500 uppercase font-semibold">Monto</p>
                      <p className="text-lg font-bold text-[#EAB839] flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {quote.totalCost.toLocaleString('es-CO')}
                      </p>
                    </div>

                    {/* Estado */}
                    <div>
                      <p className="text-sm text-gray-500 uppercase font-semibold">Estado</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      {quote.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handlePublishQuote(quote.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-3 rounded transition-all flex items-center justify-center gap-1"
                            title="Publicar cotización"
                          >
                            <Share2 className="w-4 h-4" />
                            Publicar
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded transition-all flex items-center justify-center gap-1"
                            title="Eliminar cotización"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {quote.status === 'published' && (
                        <>
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/quote/${quote.quoteToken}`)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-3 rounded transition-all flex items-center justify-center gap-1"
                            title="Copiar link"
                          >
                            <Share2 className="w-4 h-4" />
                            Copiar Link
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQuote(quote);
                              setShowDetailModal(true);
                            }}
                            className="flex-1 bg-[#EAB839] hover:bg-yellow-500 text-[#121313] text-sm font-bold py-2 px-3 rounded transition-all flex items-center justify-center gap-1"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                        </>
                      )}

                      {quote.status === 'accepted' && (
                        <button
                          onClick={() => {
                            setSelectedQuote(quote);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 bg-[#EAB839] hover:bg-yellow-500 text-[#121313] text-sm font-bold py-2 px-3 rounded transition-all flex items-center justify-center gap-1"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Proyecto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {expiresAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          {isExpired ? 'Expirada el' : 'Válida hasta'} {expiresAt.toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    )}
                    {quote.project && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">
                          Proyecto: {quote.project.projectName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showDetailModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-[#121313] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Detalles - {selectedQuote.quoteNumber}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-xl font-bold hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Items */}
              <div>
                <h3 className="font-bold text-[#121313] mb-3">Productos Cotizados</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2">Producto</th>
                      <th className="text-center py-2">Cantidad</th>
                      <th className="text-right py-2">Precio</th>
                      <th className="text-right py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2">{item.productName}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">${item.unitPrice.toLocaleString('es-CO')}</td>
                        <td className="text-right py-2 font-bold">
                          ${(item.quantity * item.unitPrice).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="bg-[#EAB839] bg-opacity-20 rounded-lg p-4 text-right">
                <p className="text-gray-600 mb-1">Total a Cotizar:</p>
                <p className="text-3xl font-black text-[#EAB839]">
                  ${selectedQuote.totalCost.toLocaleString('es-CO')}
                </p>
              </div>

              {/* Proyecto */}
              {selectedQuote.project && (
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <p className="font-bold text-green-900 mb-2">Proyecto Generado:</p>
                  <p className="text-green-800">{selectedQuote.project.projectName}</p>
                  <p className="text-sm text-green-700 mt-1">Estado: {selectedQuote.project.status}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
              {selectedQuote.status === 'published' && (
                <button
                  onClick={() => {
                    copyToClipboard(`${window.location.origin}/quote/${selectedQuote.quoteToken}`);
                    setShowDetailModal(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all"
                >
                  Copiar Link
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
