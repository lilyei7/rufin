'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Contract {
  id: number;
  contractNumber: string;
  title: string;
  totalAmount: number;
  status: string;
  signatureToken?: string;
  expiresAt?: string;
  isSigned: boolean;
}

export default function ContractSignatureLinkPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [signatureLink, setSignatureLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No autenticado');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/contracts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data);
        setError(null);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Error al cargar contratos');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const generateSignatureLink = async (contractId: number) => {
    setGeneratingLink(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No autenticado');
        return;
      }

      const response = await fetch('/api/contracts/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contractId })
      });

      if (response.ok) {
        const data = await response.json();
        const publicUrl = `${window.location.origin}/contract/${data.signatureToken}`;
        setSignatureLink(publicUrl);
        setError(null);
        
        // Actualizar contrato en la lista
        setContracts(prev =>
          prev.map(c =>
            c.id === contractId
              ? {
                  ...c,
                  signatureToken: data.signatureToken,
                  expiresAt: data.expiresAt,
                  status: 'sent'
                }
              : c
          )
        );
      } else {
        const data = await response.json();
        setError(data.error || 'Error al generar el link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      setError('Error de conexión');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    if (signatureLink) {
      navigator.clipboard.writeText(signatureLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 font-medium"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📋 Generar Links de Firma</h1>
          <p className="text-gray-600 mt-2">Crea links públicos para que los clientes firmen contratos</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Grid de Contratos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Contratos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contratos Disponibles</h2>
            
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay contratos disponibles</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contracts.map(contract => (
                  <div
                    key={contract.id}
                    onClick={() => {
                      setSelectedContract(contract);
                      setSignatureLink(null);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedContract?.id === contract.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{contract.contractNumber}</h3>
                        <p className="text-sm text-gray-600 mt-1">{contract.title}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>${contract.totalAmount?.toFixed(2)}</span>
                          <span
                            className={`px-2 py-1 rounded ${
                              contract.isSigned
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {contract.isSigned ? '✅ Firmado' : '⏳ Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel de Generación */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {selectedContract ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles del Contrato</h2>

                {/* Información del Contrato */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Número</p>
                    <p className="font-semibold text-gray-900">{selectedContract.contractNumber}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Título</p>
                    <p className="font-semibold text-gray-900">{selectedContract.title}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="font-semibold text-gray-900">${selectedContract.totalAmount?.toFixed(2)}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className={`font-semibold ${selectedContract.isSigned ? 'text-green-600' : 'text-orange-600'}`}>
                      {selectedContract.isSigned ? '✅ Firmado' : '⏳ Por Firmar'}
                    </p>
                  </div>

                  {selectedContract.expiresAt && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">Link válido hasta:</p>
                      <p className="font-semibold text-blue-900">
                        {new Date(selectedContract.expiresAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón Generar Link */}
                {!selectedContract.signatureToken && (
                  <button
                    onClick={() => generateSignatureLink(selectedContract.id)}
                    disabled={generatingLink}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
                  >
                    {generatingLink ? '⏳ Generando...' : '🔗 Generar Link de Firma'}
                  </button>
                )}

                {/* Link Generado */}
                {signatureLink && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 font-semibold mb-3">✅ Link Generado</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={signatureLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-green-300 rounded bg-white text-sm font-mono text-green-900"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                      >
                        {copied ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-3">
                      💡 Comparte este link con el cliente para que firme el contrato. Válido por 7 días.
                    </p>
                  </div>
                )}

                {/* Link Anterior */}
                {selectedContract.signatureToken && !signatureLink && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-600 font-semibold mb-3">🔗 Link Existente</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/contract/${selectedContract.signatureToken}`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-blue-300 rounded bg-white text-sm font-mono text-blue-900"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/contract/${selectedContract.signatureToken}`
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                      >
                        {copied ? '✅ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-3">
                      Válido hasta: {selectedContract.expiresAt && new Date(selectedContract.expiresAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">👈 Selecciona un contrato para generar el link</p>
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Cómo Funciona</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">1</span>
              <span>Selecciona un contrato de la lista</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">2</span>
              <span>Haz clic en "Generar Link de Firma"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">3</span>
              <span>Copia el link y comparte con el cliente</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">4</span>
              <span>El cliente firma digitalmente en el link (válido 7 días)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">5</span>
              <span>Recibes una notificación cuando se firme</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
