'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, DollarSign, User, Mail, Phone, Calendar, CheckCircle, X, Download } from 'lucide-react';

interface QuoteItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  product?: {
    id: number;
    name: string;
    unitPrice: number;
  };
}

interface Quote {
  id: number;
  quoteNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  totalCost: number;
  description?: string;
  items: QuoteItem[];
  status: string;
  expiresAt?: string;
  acceptedAt?: string;
  vendor: {
    id: number;
    name: string;
    email: string;
  };
  project?: {
    id: number;
    projectName: string;
    status: string;
    invoiceNumber: string;
  };
  notes?: string;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const token = params.token as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotes/public/${token}`);

      if (!response.ok) {
        if (response.status === 403) {
          setError('Esta cotización no está disponible o ha expirado.');
        } else if (response.status === 404) {
          setError('Cotización no encontrada.');
        } else {
          setError('Error al cargar la cotización.');
        }
        return;
      }

      const data = await response.json();
      setQuote(data);
      if (data.status === 'accepted') {
        setAccepted(true);
      }
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Error al cargar la cotización.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote) return;

    setAccepting(true);
    try {
      const response = await fetch(`/api/quotes/public/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          downPaymentStatus: 'pending'
        })
      });

      if (response.ok) {
        setAccepted(true);
        const data = await response.json();
        setQuote(data.quote);
        alert('✅ Cotización aceptada. Se ha creado un proyecto automáticamente. El vendedor se pondrá en contacto para confirmar el anticipo.');
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Error al aceptar la cotización');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotización...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#121313] mb-2">Cotización No Disponible</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/quotes"
            className="inline-block bg-[#EAB839] hover:bg-yellow-500 text-[#121313] font-bold py-3 px-6 rounded-lg transition-all"
          >
            Ver Todas las Cotizaciones
          </Link>
        </div>
      </div>
    );
  }

  const expiresAt = quote.expiresAt ? new Date(quote.expiresAt) : null;
  const subtotal = quote.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121313] to-[#1a1a1a] text-white px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-10 h-10 text-[#EAB839]" />
            <div>
              <h1 className="text-3xl font-black">Cotización {quote.quoteNumber}</h1>
              <p className="text-gray-300 text-sm">Cliente: {quote.clientName}</p>
            </div>
          </div>
          <div className="text-right">
            {accepted && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold">Aceptada</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información del Vendedor */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#121313] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#EAB839]" />
                Información del Vendedor
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Vendedor</p>
                  <p className="text-lg font-bold text-[#121313]">{quote.vendor.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${quote.vendor.email}`} className="text-[#EAB839] hover:underline">
                    {quote.vendor.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#121313] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#EAB839]" />
                Información del Cliente
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Nombre</p>
                  <p className="text-lg font-bold text-[#121313]">{quote.clientName}</p>
                </div>
                {quote.clientEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-700">{quote.clientEmail}</p>
                  </div>
                )}
                {quote.clientPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-700">{quote.clientPhone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            {quote.description && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#121313] mb-4">Descripción del Proyecto</h2>
                <p className="text-gray-700 leading-relaxed">{quote.description}</p>
              </div>
            )}

            {/* Items de la Cotización */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#121313] mb-6">Detalles de la Cotización</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Producto</th>
                      <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">Cantidad</th>
                      <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">Precio Unitario</th>
                      <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-700">{item.productName}</td>
                        <td className="py-3 px-3 text-center text-gray-700">{item.quantity}</td>
                        <td className="py-3 px-3 text-right text-gray-700">
                          ${item.unitPrice.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900">
                          ${(item.quantity * item.unitPrice).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notas */}
            {quote.notes && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
                <h3 className="font-bold text-yellow-900 mb-2">📝 Notas</h3>
                <p className="text-yellow-800">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Columna Lateral - Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6 space-y-6">
              {/* Resumen de Costos */}
              <div>
                <h3 className="text-lg font-bold text-[#121313] mb-4">Resumen</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-[#121313]">Total:</span>
                    <span className="text-2xl font-black text-[#EAB839]">
                      ${quote.totalCost.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="border-t border-gray-200 pt-6">
                {expiresAt && (
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Válida hasta</p>
                      <p className="font-semibold text-gray-700">{expiresAt.toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>
                )}
                {quote.acceptedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Aceptada</p>
                      <p className="font-semibold text-gray-700">{new Date(quote.acceptedAt).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Proyecto */}
              {quote.project && (
                <div className="border-t border-gray-200 pt-6 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-600 uppercase font-semibold">Proyecto Creado</p>
                  </div>
                  <p className="font-bold text-green-900">{quote.project.projectName}</p>
                  <p className="text-sm text-green-700 mt-1">Factura: {quote.project.invoiceNumber}</p>
                </div>
              )}

              {/* Botón Aceptar */}
              {!accepted && (
                <button
                  onClick={handleAcceptQuote}
                  disabled={accepting}
                  className="w-full bg-[#EAB839] hover:bg-yellow-500 disabled:bg-yellow-300 disabled:cursor-not-allowed text-[#121313] font-bold py-4 px-4 rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                >
                  <CheckCircle className="w-5 h-5" />
                  {accepting ? 'Procesando...' : 'Aceptar Cotización'}
                </button>
              )}

              {accepted && (
                <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-900">Cotización Aceptada</p>
                  <p className="text-sm text-green-700 mt-1">El vendedor se pondrá en contacto pronto</p>
                </div>
              )}

              {/* Botón Contactar */}
              <a
                href={`mailto:${quote.vendor.email}?subject=Consulta sobre cotización ${quote.quoteNumber}`}
                className="w-full border-2 border-[#EAB839] hover:bg-[#EAB839] hover:text-[#121313] text-[#EAB839] font-bold py-3 px-4 rounded-lg transition-all text-center"
              >
                Contactar al Vendedor
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Información Importante</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Esta cotización es válida hasta la fecha indicada</li>
            <li>✓ Al aceptar, se crea automáticamente un proyecto aprobado</li>
            <li>✓ El vendedor se pondrá en contacto para confirmar el anticipo</li>
            <li>✓ Puedes contactar al vendedor directamente si tienes preguntas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
