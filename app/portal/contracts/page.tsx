'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Contract {
  id: number;
  contractNumber: string;
  type: string;
  title: string;
  description: string;
  status: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  signedAt: string;
  createdAt: string;
  signatures: any[];
  communications: any[];
}

export default function PortalContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signatureType, setSignatureType] = useState<'touch' | 'initials'>('touch');
  const [initials, setInitials] = useState('');
  const [touchSignature, setTouchSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      router.push('/portal');
      return;
    }
    fetchContracts();
  }, [router]);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      const response = await fetch('/api/portal/contracts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar contratos');

      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_client');
    router.push('/portal');
  };

  const handleSignContract = async (contractId: number) => {
    try {
      let signatureToSend = '';

      if (signatureType === 'touch' && touchSignature) {
        signatureToSend = touchSignature;
      } else if (signatureType === 'initials' && initials.trim()) {
        signatureToSend = initials.trim().toUpperCase();
      } else {
        alert('Por favor complete la firma antes de continuar');
        return;
      }

      const token = localStorage.getItem('portal_token');
      const response = await fetch('/api/contracts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: contractId,
          status: 'signed',
          signedAt: new Date().toISOString(),
          signature: {
            type: signatureType,
            data: signatureToSend,
            signedAt: new Date().toISOString(),
            ipAddress: 'portal_client'
          }
        })
      });

      if (!response.ok) throw new Error('Error al firmar contrato');

      alert('Contrato firmado exitosamente');
      setShowSignModal(false);
      setSignatureData('');
      setInitials('');
      setTouchSignature('');
      setSignatureType('touch');
      fetchContracts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Funciones para firma táctil
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();

    // Guardar la firma como base64
    setTouchSignature(canvas.toDataURL());
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setTouchSignature('');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      draft: 'bg-gray-100 text-gray-800',
      pending_signature: 'bg-yellow-100 text-yellow-800',
      partially_signed: 'bg-blue-100 text-blue-800',
      signed: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const labels: any = {
      draft: 'Borrador',
      pending_signature: 'Pendiente Firma',
      partially_signed: 'Parcialmente Firmado',
      signed: 'Firmado',
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Portal de Clientes</h1>
              <p className="text-sm text-gray-500">Mis Contratos</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {contracts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes contratos</h3>
            <p className="text-gray-600">Cuando se te asignen contratos aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {contracts.map(contract => (
              <div key={contract.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">{contract.title}</h2>
                        {getStatusBadge(contract.status)}
                      </div>
                      <p className="text-sm text-gray-600">{contract.contractNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">
                        ${contract.amount?.toLocaleString()} {contract.currency}
                      </p>
                    </div>
                  </div>

                  {contract.description && (
                    <p className="text-gray-700 mb-4">{contract.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Fecha Inicio</p>
                      <p className="font-semibold">{new Date(contract.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fecha Fin</p>
                      <p className="font-semibold">{new Date(contract.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {contract.signatures.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Firmas ({contract.signatures.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {contract.signatures.map((sig: any, idx: number) => (
                          <div key={idx} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {sig.signer?.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedContract(contract)}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Ver Detalles
                    </button>
                    {['pending_signature', 'partially_signed'].includes(contract.status) && (
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowSignModal(true);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Firmar Contrato
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Firma */}
      {showSignModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Firmar Contrato</h3>
            <p className="text-gray-700 mb-4">
              Estás por firmar el contrato: <strong>{selectedContract.title}</strong>
            </p>

            {/* Contenido del contrato */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 max-h-40 overflow-y-auto">
              <h4 className="font-semibold mb-2">Contenido del Contrato:</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedContract.description}</pre>
            </div>

            {/* Selector de tipo de firma */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Selecciona el método de firma:</h4>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="signatureType"
                    value="touch"
                    checked={signatureType === 'touch'}
                    onChange={(e) => setSignatureType(e.target.value as 'touch')}
                    className="mr-2"
                  />
                  Firma con touch/dedo
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="signatureType"
                    value="initials"
                    checked={signatureType === 'initials'}
                    onChange={(e) => setSignatureType(e.target.value as 'initials')}
                    className="mr-2"
                  />
                  Iniciales escritas
                </label>
              </div>
            </div>

            {/* Área de firma */}
            {signatureType === 'touch' && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Firma con touch/dedo:</h4>
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                  <canvas
                    id="signature-canvas"
                    width={600}
                    height={200}
                    className="border border-gray-200 rounded cursor-crosshair touch-none"
                    style={{ maxWidth: '100%', height: 'auto' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Firme en el recuadro arriba usando su dedo o mouse</p>
                    <button
                      onClick={clearSignature}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {signatureType === 'initials' && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Escriba sus iniciales:</h4>
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <input
                    type="text"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    placeholder="Escriba sus iniciales (ej: ABC)"
                    className="w-full p-3 text-2xl font-bold text-center border border-gray-200 rounded uppercase"
                    maxLength={5}
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Escriba sus iniciales usando el teclado
                  </p>
                </div>
              </div>
            )}

            {/* Términos de aceptación */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 mb-2"><strong>Al firmar este contrato, aceptas:</strong></p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Todos los términos y condiciones establecidos</li>
                <li>• Las políticas de costos extras descritas</li>
                <li>• Las obligaciones y responsabilidades del contrato</li>
                <li>• El monto acordado: ${selectedContract.amount?.toLocaleString()} {selectedContract.currency}</li>
                <li>• El período de vigencia del contrato</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSignModal(false);
                  setSignatureData('');
                  setInitials('');
                  setTouchSignature('');
                  setSignatureType('touch');
                  clearSignature();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSignContract(selectedContract.id)}
                disabled={
                  (signatureType === 'touch' && !touchSignature) ||
                  (signatureType === 'initials' && !initials.trim())
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Firmar Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
