'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error en el login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121313] via-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs - Oro */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#EAB839] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-1/3 right-20 w-96 h-96 bg-[#d4a034] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-[#EAB839] rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl relative z-10">
        {/* Left side - Form */}
        <div className="flex flex-col justify-center px-6">
          <div className="space-y-8">
            {/* Logo/Header */}
            <div className="text-left">
              <div className="mb-8 flex items-center gap-4">
                <img 
                  src="/logorufin.png" 
                  alt="Rufín Logo" 
                  className="h-14 w-auto object-contain"
                />
                <div className="h-12 w-1 bg-gradient-to-b from-[#EAB839] to-transparent rounded-full"></div>
              </div>
              <h1 className="text-5xl font-black text-white mb-3">Inicia Sesión</h1>
              <p className="text-[#EAB839]/70 text-lg">Accede al Sistema de Gestión</p>
            </div>

            {/* Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121313] rounded-3xl shadow-2xl p-10 space-y-7 border border-[#EAB839]/10">
              {error && (
                <div className="bg-red-900/20 border-l-4 border-red-500 text-red-400 px-5 py-4 rounded-xl">
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-7">
                {/* Usuario */}
                <div>
                  <label className="block text-white font-bold mb-3 text-sm uppercase tracking-wide">Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#EAB839] w-5 h-5 group-focus-within:text-[#d4a034] transition" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ingresa tu usuario"
                      className="w-full pl-12 pr-4 py-4 bg-[#0f0f0f] border-2 border-[#EAB839]/20 rounded-xl focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/20 text-white font-medium placeholder-[#888] transition duration-300 hover:border-[#EAB839]/40"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-white font-bold mb-3 text-sm uppercase tracking-wide">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#EAB839] w-5 h-5 group-focus-within:text-[#d4a034] transition" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="w-full pl-12 pr-12 py-4 bg-[#0f0f0f] border-2 border-[#EAB839]/20 rounded-xl focus:outline-none focus:border-[#EAB839] focus:ring-2 focus:ring-[#EAB839]/20 text-white font-medium placeholder-[#888] transition duration-300 hover:border-[#EAB839]/40"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#EAB839] hover:text-[#d4a034] transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Opciones */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded bg-[#0f0f0f] border-2 border-[#EAB839]/30 checked:border-[#EAB839] checked:bg-[#EAB839] transition cursor-pointer" 
                    />
                    <span className="text-[#EAB839]/70 group-hover:text-[#EAB839] transition font-medium">Recuérdame</span>
                  </label>
                  <a href="#" className="text-[#EAB839]/70 hover:text-[#EAB839] font-semibold text-sm transition">¿Olvidaste tu contraseña?</a>
                </div>

                {/* Botón */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#EAB839] to-[#d4a034] text-[#121313] font-bold py-4 px-6 rounded-xl hover:from-[#d4a034] hover:to-[#EAB839] transition shadow-xl shadow-[#EAB839]/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-wide mt-4"
                >
                  <LogIn className="w-6 h-6" />
                  {loading ? 'Ingresando...' : 'INGRESAR'}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center text-[#EAB839]/50 text-sm">
              © 2025 Sistema Rufín. Todos los derechos reservados.
            </div>
          </div>
        </div>

        {/* Right side - Banner */}
        <div className="hidden lg:flex flex-col items-center justify-center relative h-screen sticky top-0">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-[#EAB839]/5 to-transparent rounded-3xl"></div>
            <img
              src="/banner_1_1-scaled.webp"
              alt="Welcome Banner"
              className="w-full h-full object-cover rounded-3xl shadow-2xl shadow-[#EAB839]/20 border border-[#EAB839]/10"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121313]/40 via-transparent to-transparent rounded-3xl"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
