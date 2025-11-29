'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';

export default function InstallerLoginPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      addNotification({
        type: 'error',
        title: 'Campos requeridos',
        message: 'Completa usuario y contraseña',
        duration: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/installers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        // Guardar token
        localStorage.setItem('installerToken', data.sessionToken);
        addNotification({
          type: 'success',
          title: 'Login exitoso',
          message: 'Bienvenido de nuevo',
          duration: 2000
        });
        // Redirigir al dashboard
        setTimeout(() => {
          router.push('/installer/dashboard');
        }, 1000);
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Error de login',
          message: error.message || 'Usuario o contraseña incorrectos',
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al conectar con el servidor',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/logorufin.png" alt="Rufin Logo" className="h-12 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-black text-[#121313]">Acceso Instaladores</h1>
            <p className="text-gray-600 text-sm mt-2">Ingresa tu usuario y contraseña</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#121313] mb-2">
                Usuario
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="juan.garcia"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#121313] mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/30 text-[#121313] placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#EAB839] text-[#121313] rounded-lg font-bold hover:bg-yellow-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#121313] border-t-transparent rounded-full animate-spin"></div>
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Ingresar
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6 rounded">
            <p className="text-sm text-blue-800">
              <strong>¿Eres nuevo?</strong> Haz click en "Registrarse" en la página anterior para crear tu cuenta.
            </p>
          </div>

          {/* Link a registro */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/installer/register')}
              className="text-[#EAB839] hover:text-yellow-500 font-semibold text-sm"
            >
              Crear una nueva cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
