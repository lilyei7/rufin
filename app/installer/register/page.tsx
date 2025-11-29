'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SignaturePad } from '../../../components/ui/signature-pad';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';

export default function InstallerRegisterPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [step, setStep] = useState<'form' | 'contract'>('form');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Contract data
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const signaturePadRef = useRef<any>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterClick = () => {
    // Validar formulario
    if (!formData.name || !formData.email || !formData.phone || !formData.username || !formData.password) {
      addNotification({
        type: 'error',
        title: 'Campos requeridos',
        message: 'Completa todos los campos',
        duration: 3000
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Contraseñas no coinciden',
        message: 'Las contraseñas deben ser iguales',
        duration: 3000
      });
      return;
    }

    if (formData.password.length < 6) {
      addNotification({
        type: 'error',
        title: 'Contraseña débil',
        message: 'La contraseña debe tener al menos 6 caracteres',
        duration: 3000
      });
      return;
    }

    // Pasar a paso 2: firma de contrato
    setStep('contract');
  };

  const handleSignContract = async () => {
    if (!signature || !termsAccepted) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'Debes firmar el contrato y aceptar los términos',
        duration: 3000
      });
      return;
    }

    setLoading(true);

    try {
      // Crear usuario instalador
      const userResponse = await fetch('/api/installers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          username: formData.username,
          password: formData.password,
          signature: signature
        })
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || 'Error al registrar');
      }

      const userData = await userResponse.json();

      addNotification({
        type: 'success',
        title: '¡Registro exitoso!',
        message: 'Tu cuenta ha sido creada y el contrato firmado',
        duration: 3000
      });

      setRegistered(true);

      // Redirigir a dashboard después de 2 segundos
      setTimeout(() => {
        router.push('/installer/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al registrar',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignature(null);
    }
  };

  // Paso 1: Formulario de registro
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <img src="/logorufin.png" alt="Rufin Logo" className="h-12 w-auto mx-auto mb-4" />
              <h1 className="text-2xl font-black text-[#121313]">Registro de Instalador</h1>
              <p className="text-gray-600 text-sm mt-2">Crea tu cuenta para acceder al sistema</p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#121313] mb-2">
                  Nombre Completo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Juan García López"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#121313] mb-2">
                  Correo Electrónico <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#121313] mb-2">
                  Teléfono <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#121313] mb-2">
                  Empresa/Razón Social
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleFormChange}
                  placeholder="Mi Empresa S.A."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#121313] mb-2">
                  Usuario <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  placeholder="juan.garcia"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#121313] mb-2">
                  Contraseña <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#121313] mb-2">
                  Confirmar Contraseña <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
                />
              </div>

              <button
                onClick={handleRegisterClick}
                className="w-full px-6 py-3 bg-[#EAB839] text-[#121313] rounded-lg font-bold hover:bg-yellow-500 transition-all"
              >
                Siguiente: Firmar Contrato
              </button>

              <p className="text-xs text-gray-600 text-center mt-4">
                Al continuar, aceptas los términos y condiciones de RUFIN
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paso 2: Firma de contrato
  if (step === 'contract') {
    if (registered) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido!</h1>
            <p className="text-gray-600 mb-2">
              Tu cuenta ha sido creada exitosamente
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a tu panel de control...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#121313] to-[#1a1a1a] px-8 py-6">
              <div className="flex items-center gap-4">
                <img src="/logorufin.png" alt="Rufin Logo" className="h-16 w-auto" />
                <div className="text-white">
                  <h1 className="text-3xl font-black">RUFIN</h1>
                  <p className="text-gray-300 text-sm">Contrato de Instalador</p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#121313] mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#EAB839]" />
                Contrato de Servicios de Instalación
              </h2>

              {/* Contrato */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto border-l-4 border-[#EAB839]">
                <h3 className="font-bold text-[#121313] mb-4">TÉRMINOS Y CONDICIONES</h3>

                <div className="space-y-4 text-sm text-gray-700">
                  <p>
                    <strong>1. Alcance de Servicios:</strong> El instalador acepta prestar servicios de instalación 
                    de sistemas según lo especificado en los proyectos asignados por RUFIN.
                  </p>

                  <p>
                    <strong>2. Responsabilidades:</strong> El instalador es responsable de:
                    <ul className="list-disc ml-6 mt-2">
                      <li>Completar los trabajos con estándares de calidad profesionales</li>
                      <li>Utilizar materiales certificados y aprobados</li>
                      <li>Respetar cronogramas acordados</li>
                      <li>Mantener el sitio de trabajo seguro y limpio</li>
                      <li>Proporcionar documentación de trabajos realizados</li>
                    </ul>
                  </p>

                  <p>
                    <strong>3. Compensación:</strong> La compensación será según lo acordado en cada proyecto específico, 
                    pagadera dentro de 15 días de completados los trabajos.
                  </p>

                  <p>
                    <strong>4. Confidencialidad:</strong> El instalador acepta mantener confidencial toda información 
                    de clientes y proyectos de RUFIN.
                  </p>

                  <p>
                    <strong>5. Licencias y Seguros:</strong> El instalador garantiza tener todas las licencias y 
                    seguros requeridos para ejercer su profesión.
                  </p>

                  <p>
                    <strong>6. Duración:</strong> Este contrato es de duración indefinida y puede ser terminado por 
                    cualquiera de las partes con 30 días de notificación.
                  </p>

                  <p>
                    <strong>7. Aceptación:</strong> Al firmar abajo, el instalador acepta todos los términos y condiciones 
                    de este contrato y se compromete a cumplirlos.
                  </p>
                </div>
              </div>

              {/* Firma */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#121313] mb-3">
                  Tu Firma <span className="text-red-600">*</span>
                </label>
                <div className="border-2 border-[#EAB839] rounded-lg overflow-hidden bg-white">
                  <SignaturePad
                    ref={signaturePadRef}
                    onSignatureSaved={setSignature}
                  />
                </div>
                {signature && (
                  <button
                    onClick={clearSignature}
                    className="mt-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-semibold"
                  >
                    Limpiar firma
                  </button>
                )}
              </div>

              {/* Checkbox */}
              <div className="mb-6 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 text-[#EAB839] rounded border-2 border-gray-300 focus:border-[#EAB839] mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  Acepto los términos y condiciones del contrato de servicios de instalación de RUFIN
                </label>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Importante:</strong> Una vez firmado este contrato, podrás acceder a tu panel de control 
                  y ver los proyectos asignados. Tu firma será vinculante y registrada en nuestro sistema.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('form')}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition-all disabled:opacity-50"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSignContract}
                  disabled={loading || !signature || !termsAccepted}
                  className="flex-1 px-6 py-3 bg-[#EAB839] text-[#121313] rounded-lg font-bold hover:bg-yellow-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Completando registro...' : 'Firmar y Completar Registro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
