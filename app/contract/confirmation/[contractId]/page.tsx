'use client';

import { useParams } from 'next/navigation';
import { CheckCircle, Download, Mail } from 'lucide-react';

export default function ContractConfirmationPage() {
  const params = useParams();
  const contractId = params.contractId as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center space-y-6">
          {/* Icono de éxito */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse"></div>
              <CheckCircle className="w-24 h-24 text-green-600 relative" />
            </div>
          </div>

          {/* Título */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Contrato Firmado!
            </h1>
            <p className="text-gray-600">
              Tu contrato ha sido firmado y registrado exitosamente
            </p>
          </div>

          {/* ID del Contrato */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">ID del Contrato</p>
            <p className="text-lg font-mono font-bold text-gray-900">
              #{contractId}
            </p>
          </div>

          {/* Información */}
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>Se ha enviado un PDF a tu correo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Tu firma digital está guardada de forma segura</span>
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-3 pt-4">
            <a
              href="/"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
            >
              Volver al Inicio
            </a>
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cerrar Ventana
            </button>
          </div>

          {/* Pie */}
          <p className="text-xs text-gray-500 border-t border-gray-200 pt-4">
            Puedes descargar tu copia del contrato firmado desde tu correo
          </p>
        </div>
      </div>
    </div>
  );
}
