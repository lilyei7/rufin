'use client';

import { useState, useEffect } from 'react';
import { FileText, Copy, Check, Plus, Link as LinkIcon, DollarSign, Trash2 } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';

interface Contract {
  id: number;
  contractNumber: string;
  title: string;
  totalAmount: number;
  status: string;
  signatureToken: string | null;
  isSigned: boolean;
  createdAt: string;
  signedAt?: string;
}

interface GeneratedLink {
  id: number;
  contractNumber: string;
  title: string;
  totalAmount: number;
  signatureToken: string;
  publicUrl: string;
  isSigned: boolean;
  createdAt: string;
}

export default function ContractsManagementPage() {
  const { addNotification } = useNotifications();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'generated'>('available');

  useEffect(() => {
    fetchContracts();
    fetchGeneratedLinks();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || data);
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar contratos',
        duration: 3000
      });
    }
  };

  const fetchGeneratedLinks = async () => {
    try {
      const response = await fetch('/api/contracts/generated-links');
      if (response.ok) {
        const data = await response.json();
        setGeneratedLinks(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async (contractId: number) => {
    setGeneratingToken(contractId);
    try {
      const response = await fetch('/api/contracts/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId })
      });

      if (response.ok) {
        const data = await response.json();
        addNotification({
          type: 'success',
          title: 'Link generado',
          message: 'El link permanente ha sido creado exitosamente',
          duration: 3000
        });
        fetchContracts();
        fetchGeneratedLinks();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo generar el link',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al generar el link',
        duration: 3000
      });
    } finally {
      setGeneratingToken(null);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addNotification({
      type: 'success',
      title: 'Copiado',
      message: 'Link copiado al portapapeles',
      duration: 2000
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLink = async (contractId: number) => {
    if (!confirm('¿Deseas eliminar este link?')) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Link eliminado',
          message: 'El link ha sido eliminado correctamente',
          duration: 3000
        });
        fetchContracts();
        fetchGeneratedLinks();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo eliminar el link',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al eliminar el link',
        duration: 3000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#EAB839]" />
            <h1 className="text-3xl font-black text-[#121313]">Gestión de Contratos</h1>
          </div>
          <p className="text-gray-600">Crea y gestiona links permanentes para que los clientes firmen contratos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-[#EAB839] text-[#121313]'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Contratos Disponibles ({contracts.filter(c => !c.signatureToken).length})
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'generated'
                ? 'bg-[#EAB839] text-[#121313]'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Links Generados ({generatedLinks.length})
          </button>
        </div>

        {/* Tab: Available Contracts */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {contracts.filter(c => !c.signatureToken).length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay contratos disponibles para generar links</p>
              </div>
            ) : (
              contracts
                .filter(c => !c.signatureToken)
                .map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-[#121313]">
                            {contract.contractNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            contract.isSigned
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {contract.isSigned ? 'Firmado' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-gray-700 font-medium mb-2">{contract.title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-[#EAB839]" />
                            ${contract.totalAmount.toLocaleString()}
                          </span>
                          <span>
                            Creado: {new Date(contract.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleGenerateLink(contract.id)}
                        disabled={generatingToken === contract.id}
                        className="px-4 py-2 bg-[#EAB839] text-[#121313] rounded-lg font-semibold hover:bg-yellow-500 transition-all disabled:opacity-50"
                      >
                        {generatingToken === contract.id ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#121313] border-t-transparent rounded-full animate-spin"></div>
                            Generando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Generar Link
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Tab: Generated Links */}
        {activeTab === 'generated' && (
          <div className="space-y-4">
            {generatedLinks.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aún no hay links generados</p>
              </div>
            ) : (
              generatedLinks.map((link) => (
                <div
                  key={link.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-[#121313]">
                          {link.contractNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          link.isSigned
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {link.isSigned ? 'Firmado' : 'Pendiente de firma'}
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium mb-2">{link.title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-[#EAB839]" />
                          ${link.totalAmount.toLocaleString()}
                        </span>
                        <span>
                          Generado: {new Date(link.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Link Display */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between">
                    <code className="text-sm text-gray-700 break-all flex-1">
                      {link.publicUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(link.publicUrl, link.id)}
                      className="ml-4 p-2 hover:bg-gray-200 rounded transition-all"
                      title="Copiar link"
                    >
                      {copiedId === link.id ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-[#EAB839]" />
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => window.open(link.publicUrl, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all text-sm"
                    >
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
