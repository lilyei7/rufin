'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quote {
  id: number;
  quoteNumber: string;
  clientName: string;
  totalCost: number;
  status: string;
  quoteToken: string;
  description?: string;
  expiresAt?: string;
  items?: { id: number; productName: string; quantity: number; unitPrice: number }[];
  project?: { id: number; projectName: string; status: string };
}

export default function QuotesManagerPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    description: '',
    expiresAt: ''
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      } else {
        console.error('Error fetching quotes:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (quoteId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
        alert('Cotización actualizada');
      } else {
        alert('Error al actualizar la cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar');
    }
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cotización?')) return;

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setQuotes(quotes.filter(q => q.id !== quoteId));
        alert('Cotización eliminada');
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar');
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/quote/${token}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado al portapapeles');
  };

  const filteredQuotes = filterStatus === 'all' 
    ? quotes 
    : quotes.filter(q => q.status === filterStatus);

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    published: quotes.filter(q => q.status === 'published').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121313]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EAB839] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121313]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-[#EAB839]/20 pb-6">
          <h1 className="text-4xl font-black text-white mb-2">📋 Gestor de Cotizaciones</h1>
          <p className="text-gray-400">Administra, publica y monitorea tus cotizaciones de forma rápida</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Total</p>
            <p className="text-3xl font-black text-[#EAB839] mt-2">{stats.total}</p>
          </div>
          <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Borradores</p>
            <p className="text-3xl font-black text-yellow-500 mt-2">{stats.draft}</p>
          </div>
          <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Publicadas</p>
            <p className="text-3xl font-black text-blue-500 mt-2">{stats.published}</p>
          </div>
          <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Aceptadas</p>
            <p className="text-3xl font-black text-green-500 mt-2">{stats.accepted}</p>
          </div>
        </div>

        {/* Filtros y botón */}
        <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-6 mb-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-[#EAB839] text-[#121313]'
                    : 'bg-white/10 text-gray-300 border border-[#EAB839]/30 hover:border-[#EAB839]/60'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'draft'
                    ? 'bg-[#EAB839] text-[#121313]'
                    : 'bg-white/10 text-gray-300 border border-[#EAB839]/30 hover:border-[#EAB839]/60'
                }`}
              >
                Borradores
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'published'
                    ? 'bg-[#EAB839] text-[#121313]'
                    : 'bg-white/10 text-gray-300 border border-[#EAB839]/30 hover:border-[#EAB839]/60'
                }`}
              >
                Publicadas
              </button>
              <button
                onClick={() => setFilterStatus('accepted')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'accepted'
                    ? 'bg-[#EAB839] text-[#121313]'
                    : 'bg-white/10 text-gray-300 border border-[#EAB839]/30 hover:border-[#EAB839]/60'
                }`}
              >
                Aceptadas
              </button>
            </div>
            <Link href="/dashboard/my-quotes">
              <button className="bg-gradient-to-r from-[#EAB839] to-yellow-500 text-[#121313] px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-[#EAB839]/30 font-bold transition">
                ➕ Nueva Cotización
              </button>
            </Link>
          </div>
        </div>

        {/* Tabla de cotizaciones */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg p-12 text-center backdrop-blur-sm">
            <p className="text-gray-400 text-lg mb-4">No hay cotizaciones en este estado</p>
            <Link href="/dashboard/my-quotes">
              <button className="bg-[#EAB839] text-[#121313] px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-[#EAB839]/30 font-bold">
                Crear primera cotización
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white/5 border border-[#EAB839]/20 rounded-lg overflow-hidden backdrop-blur-sm">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#EAB839]/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#EAB839]">Número</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#EAB839]">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#EAB839]">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#EAB839]">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#EAB839]">Productos</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#EAB839]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAB839]/10">
                {filteredQuotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-[#1a1a1a] transition">
                    <td className="px-6 py-4 text-sm font-bold text-[#EAB839]">{quote.quoteNumber}</td>
                    <td className="px-6 py-4 text-sm text-white">{quote.clientName}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white">${quote.totalCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={quote.status}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-bold cursor-pointer border transition ${
                          quote.status === 'draft'
                            ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                            : quote.status === 'published'
                            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                            : 'bg-green-500/20 border-green-500/30 text-green-400'
                        }`}
                      >
                        <option value="draft">Borrador</option>
                        <option value="published">Publicada</option>
                        <option value="accepted">Aceptada</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {quote.items ? quote.items.length : 0} items
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      {quote.status === 'published' && (
                        <button
                          onClick={() => copyToClipboard(quote.quoteToken)}
                          className="text-[#EAB839] hover:text-yellow-500 font-bold transition"
                          title="Copiar link de cotización"
                        >
                          🔗 Link
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-500 hover:text-red-400 font-bold transition"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
