'use client';

import { useState } from 'react';
import { X, Send, DollarSign, MessageCircle, CheckCircle, Clock, TrendingUp, FileText } from 'lucide-react';
import { useNotifications } from './notifications';

interface PriceHistory {
  id: number;
  timestamp: string;
  action: string;
  comment: string;
  user: string;
  status: string;
}

interface PriceDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onPriceUpdate?: () => void;
  userRole?: string;
  contracts?: any[];
}

export const PriceDisputeModal: React.FC<PriceDisputeModalProps> = ({
  isOpen,
  onClose,
  project,
  onPriceUpdate,
  userRole,
  contracts = []
}) => {
  const { addNotification } = useNotifications();
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [showSendContract, setShowSendContract] = useState(false);
  const [finalPrice, setFinalPrice] = useState(project?.installerPriceProposal?.toString() || '');
  const [customTerms, setCustomTerms] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkExpiry, setLinkExpiry] = useState<string | null>(null);

  // Cargar historial de precios cuando se abre el modal
  const loadPriceHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const project = data.project;
        
        // Filtrar solo eventos de precio
        if (project.history) {
          const priceEvents = project.history.filter((h: any) =>
            h.action && (
              h.action.includes('price') ||
              h.action.includes('precio') ||
              h.action.includes('Precio')
            )
          );
          setPriceHistory(priceEvents);
        }
      }
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  const handleSendCounter = async () => {
    if (!counterPrice || !counterMessage.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ingresa un precio y un mensaje',
        duration: 3000
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: project.id,
          installerPriceStatus: 'counter_offered',
          installerPriceProposal: parseFloat(counterPrice),
          comment: counterMessage
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Éxito',
          message: 'Contra-oferta enviada correctamente',
          duration: 5000
        });
        setCounterPrice('');
        setCounterMessage('');
        
        // Recargar historial
        loadPriceHistory();
        
        if (onPriceUpdate) {
          onPriceUpdate();
        }
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.error || 'No se pudo enviar la contra-oferta',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Error al procesar la contra-oferta',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPrice = async () => {
    const confirmed = window.confirm(
      `¿Aceptar el precio de $${project.installerPriceProposal?.toFixed(2)}?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: project.id,
          installerPriceStatus: 'accepted',
          installerPriceProposal: project.installerPriceProposal,
          comment: 'Precio aceptado'
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Éxito',
          message: 'Precio aceptado',
          duration: 5000
        });
        
        if (onPriceUpdate) {
          onPriceUpdate();
        }
        
        setTimeout(() => onClose(), 1500);
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al aceptar el precio',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (action: string) => {
    if (action.includes('accepted') || action.includes('ACEPTÓ')) {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Aceptado</span>;
    } else if (action.includes('suggested') || action.includes('SUGIRIÓ')) {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">💡 Sugerencia</span>;
    } else if (action.includes('counter')) {
      return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">🔄 Contra-oferta</span>;
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Principal - Disputa de Precio */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Disputa de Precio</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Información del Proyecto */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{project.projectName}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Precio Original:</span>
                  <p className="font-bold text-lg">${project.totalCost?.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Precio Actual Propuesto:</span>
                  <p className="font-bold text-lg text-blue-600">
                    ${project.installerPriceProposal?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Línea de tiempo de precios */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial de Negociación
              </h4>
              
              {priceHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {priceHistory.map((event, idx) => (
                    <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(event.action)}
                            <span className="text-sm font-medium text-gray-700">{event.user}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {event.comment && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">
                              {event.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Sin historial de precios aún</p>
              )}
            </div>

            {/* Sección de Contra-oferta (solo para vendedor/admin) */}
            {(userRole === 'vendor' || userRole === 'admin' || userRole === 'super_admin') && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Enviar Contra-oferta
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Contra-oferta
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        placeholder="Ingresa precio"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje Personalizado
                    </label>
                    <textarea
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder="Explica por qué sugeres este precio..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {counterMessage.length}/300 caracteres
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSendCounter}
                      disabled={loading || !counterPrice || !counterMessage}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? 'Enviando...' : 'Enviar Contra-oferta'}
                    </button>

                    {project.installerPriceStatus === 'suggested' && (
                      <button
                        onClick={handleAcceptPrice}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {loading ? 'Procesando...' : 'Aceptar Precio'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botón para enviar contrato */}
            {(userRole === 'vendor' || userRole === 'admin' || userRole === 'super_admin') && 
             project.installerPriceStatus === 'accepted' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Enviar Contrato para Firma
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Una vez que el precio fue aceptado, puedes enviar el contrato para que sea firmado digitalmente.
                </p>
                <button
                  onClick={() => setShowSendContract(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Contrato para Firma
                </button>
              </div>
            )}

            {/* Botón Cerrar */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para enviar contrato */}
      {showSendContract && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Enviar Contrato</h2>
              </div>
              <button
                onClick={() => setShowSendContract(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del Proyecto */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Proyecto</p>
                <p className="text-lg font-bold text-gray-900">{project.projectName}</p>
              </div>

              {/* Precio Final */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Final del Contrato
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-lg">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Este es el precio que verá en el contrato para firmar</p>
              </div>

              {/* Términos Personalizados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos y Condiciones (Opcional)
                </label>
                <textarea
                  value={customTerms}
                  onChange={(e) => setCustomTerms(e.target.value)}
                  placeholder="Deja vacío para usar términos por defecto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">Si dejas esto vacío, se usarán los términos estándar</p>
              </div>

              {/* Información de Envío */}
              <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-medium mb-2">📧 El contrato será enviado por correo a:</p>
                <p className="text-gray-600">Se enviará un link temporal (válido por 72 horas) donde pueden firmar digitalmente</p>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSendContract(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!finalPrice) {
                      addNotification({
                        type: 'error',
                        title: 'Error',
                        message: 'Ingresa el precio final',
                        duration: 3000
                      });
                      return;
                    }

                    setLoading(true);
                    try {
                      // Llamar al endpoint para generar el link temporal
                      const response = await fetch('/api/contracts/send', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          projectId: project.id, // Pasamos projectId, el endpoint creará el contrato
                          finalPrice: parseFloat(finalPrice),
                          terms: customTerms || 'Términos estándar aplican.',
                          expiryHours: 72
                        })
                      });

                      if (response.ok) {
                        const data = await response.json();
                        setGeneratedLink(data.signatureLink);
                        setLinkExpiry(data.expiresAt);
                        
                        addNotification({
                          type: 'success',
                          title: 'Contrato Preparado',
                          message: 'Link temporal generado exitosamente',
                          duration: 5000
                        });
                      } else {
                        const error = await response.json();
                        addNotification({
                          type: 'error',
                          title: 'Error',
                          message: error.error || 'No se pudo preparar el contrato',
                          duration: 5000
                        });
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      addNotification({
                        type: 'error',
                        title: 'Error de conexión',
                        message: 'Error al preparar el contrato',
                        duration: 5000
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Generando Link...' : 'Generar Link Temporal'}
                </button>
              </div>

              {/* Link Generado */}
              {generatedLink && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Link Temporal Generado
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-green-800 mb-1">
                        Link para Firma Digital:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={generatedLink}
                          readOnly
                          className="flex-1 px-3 py-2 border border-green-300 rounded-lg bg-white text-sm font-mono"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLink);
                            addNotification({
                              type: 'success',
                              title: 'Copiado',
                              message: 'Link copiado al portapapeles',
                              duration: 2000
                            });
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>

                    {linkExpiry && (
                      <div className="text-sm text-green-700">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Expira el: {new Date(linkExpiry).toLocaleString()}
                      </div>
                    )}

                    <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                      📧 Comparte este link con el cliente para que pueda firmar digitalmente el contrato.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
