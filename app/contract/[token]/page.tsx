'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { SignaturePad } from '../../../components/ui/signature-pad';
import { CheckCircle, XCircle, Clock, DollarSign, FileText, Download, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';
import { downloadPDF } from '../../../components/ui/contract-pdf-generator';

interface ContractData {
  id: number;
  projectId: number | null;
  projectName?: string;
  clientName: string;
  finalPrice?: number;
  amount: number;
  content: string;
  title: string;
  description?: string;
  contractNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  isSigned: boolean;
  signedAt?: string;
  project?: {
    id: number;
    invoiceNumber: string;
    projectName: string;
  } | null;
}

export default function SignContractPage() {
  const params = useParams();
  const token = params.token as string;
  const { addNotification } = useNotifications();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const signaturePadRef = useRef<any>(null);

  useEffect(() => {
    fetchContractData();
  }, [token]);

  const fetchContractData = async () => {
    try {
      // Obtener detalles del contrato usando el token
      const response = await fetch(`/api/contracts/by-token?token=${token}`);

      if (response.ok) {
        const data = await response.json();
        setContract(data);
      } else if (response.status === 404) {
        addNotification({
          type: 'error',
          title: 'Contrato no encontrado',
          message: 'El link del contrato no es válido o ha expirado',
          duration: 5000
        });
      } else if (response.status === 410) {
        addNotification({
          type: 'error',
          title: 'Contrato expirado',
          message: 'El link de este contrato ha expirado. Solicita uno nuevo',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar el contrato',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!signature || !termsAccepted || !clientName.trim() || !clientEmail.trim()) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'Completa todos los campos, acepta los términos y firma el contrato',
        duration: 3000
      });
      return;
    }

    setSigning(true);
    try {
      // Primero firmar el contrato
      const response = await fetch(`/api/contracts/sign/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signature,
          clientName,
          clientEmail,
          clientPhone
        })
      });

      if (response.ok) {
        // Generar PDF automáticamente
        if (contract) {
          downloadPDF({
            contractNumber: contract.contractNumber,
            title: contract.title,
            clientName: clientName,
            clientEmail: clientEmail,
            companyName: 'RUFIN - Sistema de Gestión',
            companyLicense: 'PA200734',
            companyPhone: '412 583 2296',
            companyEmail: 'info@rufin.com',
            address: 'Professional Contractors LLC',
            scope: [
              'Servicios profesionales de construcción y remodelación',
              'Trabajos especializados según especificaciones del contrato',
              'Garantía de calidad en todos los trabajos realizados'
            ],
            paymentTerms: 'Deposito del 40% para agendar • Pago final 60% al completar',
            totalAmount: contract.totalAmount,
            currency: 'USD',
            signatureImage: signature,
            signedDate: new Date().toLocaleString('es-ES'),
            content: contract.content
          });

          addNotification({
            type: 'success',
            title: '✅ Contrato Firmado Exitosamente',
            message: 'Tu contrato ha sido firmado y el PDF se está descargando automáticamente',
            duration: 5000
          });

          setTimeout(() => {
            window.location.href = `/contract/confirmation/${contract.id}`;
          }, 2000);
        }
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Error al firmar',
          message: error.error || 'Error al firmar el contrato',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Error al procesar la firma',
        duration: 5000
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contrato No Encontrado</h1>
          <p className="text-gray-600 mb-6">
            El link del contrato no es válido, ha expirado o ya fue firmado.
          </p>
          <p className="text-sm text-gray-500">
            Contacta al vendedor para solicitar un nuevo link de firma.
          </p>
        </div>
      </div>
    );
  }

  if (contract.isSigned) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contrato Ya Firmado</h1>
          <p className="text-gray-600 mb-2">
            Este contrato ya fue firmado el {new Date(contract.signedAt || '').toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            Si necesitas una copia, contacta al vendedor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Profesional */}
        <div className="bg-white rounded-t-lg shadow-lg overflow-hidden">
          {/* Banner con paleta del sistema */}
          <div className="bg-gradient-to-r from-[#121313] to-[#1a1a1a] px-8 py-6">
            <div className="flex items-center gap-4">
              <img src="/logorufin.png" alt="Rufin Logo" className="h-16 w-auto" />
              <div className="text-white">
                <h1 className="text-3xl font-black">RUFIN</h1>
                <p className="text-gray-300 text-sm">Sistema de Gestión de Contratos</p>
              </div>
            </div>
          </div>

          {/* Información de empresa */}
          <div className="bg-white px-8 py-4 border-b-4 border-[#EAB839] grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">License</p>
              <p className="font-bold text-[#121313]">PA200734</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Teléfono</p>
              <p className="font-bold text-[#121313]">412 583 2296</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
              <p className="font-bold text-[#121313]">info@clemente.com</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Ubicación</p>
              <p className="font-bold text-[#121313]">Avalon, PA 15202</p>
            </div>
          </div>

          {/* Título del contrato */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-[#121313] to-gray-800">
            <h2 className="text-2xl font-black text-[#EAB839] mb-2">{contract?.title}</h2>
            <p className="text-gray-300">Contrato: <span className="font-mono font-semibold text-[#EAB839]">{contract?.contractNumber}</span></p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="bg-white shadow-lg">
          <div className="p-8 space-y-8">
            {/* Advertencia de expiración */}
            <div className="flex items-center gap-3 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-900">Este link expira el {new Date(contract?.expiresAt || '').toLocaleDateString('es-ES')}</p>
                <p className="text-sm text-orange-800">Por favor, firma antes de que expire</p>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-l-4 border-[#EAB839]">
              <div>
                <h3 className="font-bold text-[#121313] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#EAB839]" />
                  Detalles del Proyecto
                </h3>
                <div className="space-y-3">
                  {contract?.project && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Número de Factura</p>
                        <p className="font-bold text-[#121313]">{contract.project.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Proyecto</p>
                        <p className="font-bold text-[#121313]">{contract.project.projectName}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#121313] mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#EAB839]" />
                  Información de Pago
                </h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border-l-4 border-[#EAB839]">
                    <p className="text-sm text-gray-600">Monto Total</p>
                    <p className="text-3xl font-black text-[#EAB839]">
                      ${contract?.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p className="font-bold">Plan de Pago:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Deposito 40%: ${((contract?.totalAmount || 0) * 0.4).toFixed(2)}</li>
                      <li>Pago Final 60%: ${((contract?.totalAmount || 0) * 0.6).toFixed(2)}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Alcance del Trabajo */}
            <div>
              <h3 className="font-bold text-lg text-[#121313] mb-4">📋 Alcance del Trabajo</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 p-3 bg-gradient-to-r from-[#EAB839]/10 to-transparent rounded border-l-4 border-[#EAB839]">
                  <span className="text-[#EAB839] font-black">✓</span>
                  <span className="text-gray-700">Servicios profesionales de construcción y remodelación</span>
                </li>
                <li className="flex gap-3 p-3 bg-gradient-to-r from-[#EAB839]/10 to-transparent rounded border-l-4 border-[#EAB839]">
                  <span className="text-[#EAB839] font-black">✓</span>
                  <span className="text-gray-700">Trabajos especializados según especificaciones del contrato</span>
                </li>
                <li className="flex gap-3 p-3 bg-gradient-to-r from-[#EAB839]/10 to-transparent rounded border-l-4 border-[#EAB839]">
                  <span className="text-[#EAB839] font-black">✓</span>
                  <span className="text-gray-700">Garantía de calidad en todos los trabajos realizados</span>
                </li>
                <li className="flex gap-3 p-3 bg-gradient-to-r from-[#EAB839]/10 to-transparent rounded border-l-4 border-[#EAB839]">
                  <span className="text-[#EAB839] font-black">✓</span>
                  <span className="text-gray-700">Seguimiento profesional durante toda la duración del proyecto</span>
                </li>
              </ul>
            </div>

            {/* Términos y Condiciones */}
            <div>
              <h3 className="font-bold text-lg text-[#121313] mb-4">📄 Términos y Condiciones</h3>
              <div className="border-2 border-[#EAB839] rounded-lg p-6 bg-gray-50 max-h-80 overflow-y-auto">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {contract?.content}
                </div>
              </div>
            </div>

            {/* Datos del Firmante */}
            <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-l-4 border-[#EAB839]">
              <h3 className="font-bold text-lg text-[#121313] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#EAB839]" />
                Información del Firmante
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#121313] mb-2">
                    Nombre Completo <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej: Juan García López"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                    disabled={signing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#121313] mb-2">
                    Correo Electrónico <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                    disabled={signing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#121313] mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                    disabled={signing}
                  />
                </div>
              </div>
            </div>

            {/* Firma Digital */}
            <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-l-4 border-[#EAB839]">
              <h3 className="font-bold text-lg text-[#121313] flex items-center gap-2">
                ✍️ Tu Firma Digital
              </h3>
              <p className="text-sm text-gray-600">
                Dibuja tu firma en el recuadro de abajo. Puedes usar mouse, trackpad o dedo si usas dispositivo táctil.
              </p>

              <div className="border-4 border-dashed border-[#EAB839] rounded-lg overflow-hidden bg-white">
                <SignaturePad
                  ref={signaturePadRef}
                  onSignatureSaved={setSignature}
                  width={700}
                  height={250}
                />
              </div>

              {signature && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">✓ Firma capturada correctamente</span>
                </div>
              )}

              {!signature && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <AlertCircle size={20} className="text-red-600" />
                  <span className="text-sm font-bold text-red-700">Por favor, dibuja tu firma arriba</span>
                </div>
              )}
            </div>

            {/* Aceptar Términos */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#EAB839]/20 to-transparent border-2 border-[#EAB839] rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-6 h-6 text-[#EAB839] rounded cursor-pointer border-2 border-[#EAB839]"
                  disabled={signing}
                />
                <label htmlFor="terms" className="text-sm text-gray-800 cursor-pointer leading-relaxed">
                  <span className="font-bold block mb-2">✓ Acepto los Términos y Condiciones</span>
                  <span className="text-gray-700">
                    Confirmo que he leído, entendido y acepto completamente los términos y condiciones de este contrato. 
                    Autorizo y acepto digitalmente la firma de este contrato de servicios profesionales. Entiendo que esta firma 
                    digital es legalmente vinculante.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer con Botones */}
          <div className="bg-gradient-to-r from-[#121313] to-gray-800 p-8 border-t-4 border-[#EAB839] flex gap-4 justify-between items-center rounded-b-lg">
            <div className="text-sm text-gray-300">
              🔒 Tu firma es guardada con encriptación y es legalmente válida
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (signaturePadRef.current?.clear) {
                    signaturePadRef.current.clear();
                    setSignature(null);
                  }
                }}
                disabled={signing || !signature}
                className="px-6 py-3 border-2 border-gray-500 rounded-lg text-gray-300 font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Limpiar Firma
              </button>
              <button
                onClick={handleSignContract}
                disabled={signing || !signature || !termsAccepted || !clientName.trim() || !clientEmail.trim()}
                className="px-8 py-3 bg-gradient-to-r from-[#EAB839] to-yellow-400 hover:from-yellow-400 hover:to-[#EAB839] disabled:bg-gray-400 text-[#121313] font-black rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#121313]"></div>
                    Firmando y generando PDF...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Firmar y Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Información de Seguridad */}
        <div className="mt-6 bg-white/90 backdrop-blur rounded-lg p-6 shadow-md border-l-4 border-[#EAB839]">
          <h4 className="font-bold text-[#121313] mb-2">🔐 Seguridad y Legalidad</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ Tu firma digital es legalmente válida y vinculante</li>
            <li>✓ El PDF se descargará automáticamente después de firmar</li>
            <li>✓ Se enviará una copia a tu correo electrónico</li>
            <li>✓ Todos los datos están encriptados y protegidos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
