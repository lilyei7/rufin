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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 Gestión de Cotizaciones</h1>
          <p className="text-gray-600">Administra, publica y monitorea tus cotizaciones</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm uppercase">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm uppercase">Borradores</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm uppercase">Publicadas</p>
            <p className="text-3xl font-bold text-blue-600">{stats.published}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm uppercase">Aceptadas</p>
            <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'draft'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Borradores
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'published'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Publicadas
              </button>
              <button
                onClick={() => setFilterStatus('accepted')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'accepted'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Aceptadas
              </button>
            </div>
            <Link href="/dashboard/my-quotes">
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                ➕ Nueva Cotización
              </button>
            </Link>
          </div>
        </div>

        {/* Tabla de cotizaciones */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No hay cotizaciones en este estado</p>
            <Link href="/dashboard/my-quotes">
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                Crear primera cotización
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Número</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Productos</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{quote.quoteNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{quote.clientName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${quote.totalCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={quote.status}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                          quote.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : quote.status === 'published'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        <option value="draft">Borrador</option>
                        <option value="published">Publicada</option>
                        <option value="accepted">Aceptada</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quote.items ? quote.items.length : 0} items
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {quote.status === 'published' && (
                        <button
                          onClick={() => copyToClipboard(quote.quoteToken)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          title="Copiar link de cotización"
                        >
                          🔗 Link
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
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
