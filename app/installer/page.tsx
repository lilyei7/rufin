'use client';

import { useRouter } from 'next/navigation';
import { UserPlus, LogIn, FileText, Shield, Clock } from 'lucide-react';

export default function InstallerHomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121313] to-[#1a1a1a] text-white px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <img src="/logorufin.png" alt="Rufin Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-4xl font-black">RUFIN</h1>
              <p className="text-gray-300">Portal de Instaladores</p>
            </div>
          </div>
          <p className="text-gray-300 max-w-2xl">
            Bienvenido al sistema de gestión de contratos RUFIN. 
            Aquí puedes registrarte como instalador y firmar tu contrato de servicios.
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Opciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Registrarse */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-8 h-8 text-[#EAB839]" />
              <h2 className="text-2xl font-bold text-[#121313]">¿Eres Nuevo?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Crea tu cuenta como instalador y firma tu contrato de servicios en 2 pasos simples. 
              Accede a tus proyectos asignados y gestiona tu información.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#EAB839] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <p className="text-sm text-gray-700">Completa tu información personal</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#EAB839] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <p className="text-sm text-gray-700">Firma el contrato de servicios</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#EAB839] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <p className="text-sm text-gray-700">¡Listo! Accede a tu panel</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/installer/register')}
              className="w-full px-6 py-3 bg-[#EAB839] text-[#121313] rounded-lg font-bold hover:bg-yellow-500 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Registrarse
            </button>
          </div>

          {/* Iniciar sesión */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <LogIn className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-[#121313]">¿Ya Tienes Cuenta?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Inicia sesión con tu usuario y contraseña para acceder a tu panel de instalador. 
              Revisa tu contrato y gestiona tus proyectos asignados.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-700">Inicio seguro con tu usuario</p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-700">Acceso a tu contrato firmado</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-700">Gestiona tus proyectos</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/installer/login')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Ingresar
            </button>
          </div>
        </div>

        {/* Beneficios */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-[#121313] mb-6">¿Por qué registrarse?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-[#EAB839] mx-auto mb-3" />
              <h4 className="font-bold text-[#121313] mb-2">Contrato Seguro</h4>
              <p className="text-sm text-gray-600">
                Tu contrato está protegido y disponible en cualquier momento
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-[#EAB839] mx-auto mb-3" />
              <h4 className="font-bold text-[#121313] mb-2">Información Segura</h4>
              <p className="text-sm text-gray-600">
                Tus datos están encriptados y protegidos en nuestro sistema
              </p>
            </div>
            <div className="text-center">
              <Clock className="w-12 h-12 text-[#EAB839] mx-auto mb-3" />
              <h4 className="font-bold text-[#121313] mb-2">Acceso 24/7</h4>
              <p className="text-sm text-gray-600">
                Accede a tu información cuando lo necesites desde cualquier lugar
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-sm">
            ¿Preguntas? Contacta con nuestro equipo de soporte
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © 2024 RUFIN - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
