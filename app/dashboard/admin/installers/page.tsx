'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

interface Installer {
  id: number;
  name: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export default function InstallersManagementPage() {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchInstallers();
  }, []);

  const fetchInstallers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/installers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInstallers(data.installers || []);
        console.log(`Instaladores cargados: ${data.active} activos, ${data.inactive} inactivos`);
      } else {
        throw new Error('Error al cargar instaladores');
      }
    } catch (error) {
      console.error('Error:', error);
      setNotificationMessage('Error al cargar instaladores');
      setNotificationType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (installerId: number, currentActive: boolean) => {
    // Si ya está activo, solo permitir desactivar en emergencia
    if (currentActive) {
      if (!confirm('⚠️ ¿Desactivar este instalador? Solo hazlo en caso de emergencia. Podrás reactivarlo después.')) {
        return;
      }
    }

    setUpdating(installerId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/installers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          installerId,
          active: !currentActive  // Alterna entre activo/inactivo
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar la lista local
        setInstallers(prev => 
          prev.map(i => i.id === installerId ? { ...i, active: !currentActive } : i)
        );

        setNotificationMessage(data.message);
        setNotificationType('success');
        setTimeout(() => setNotificationMessage(''), 3000);
      } else {
        const error = await response.json();
        setNotificationMessage(error.error || 'No se pudo actualizar');
        setNotificationType('error');
        setTimeout(() => setNotificationMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setNotificationMessage('No se pudo actualizar el instalador');
      setNotificationType('error');
      setTimeout(() => setNotificationMessage(''), 3000);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EAB839] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando instaladores...</p>
        </div>
      </div>
    );
  }

  const activeCount = installers.filter(i => i.active).length;
  const inactiveCount = installers.filter(i => !i.active).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-[#EAB839]" />
            <h1 className="text-3xl font-black text-[#121313]">Gestión de Instaladores</h1>
          </div>
          <p className="text-gray-600">
            <strong>ℹ️ NOTA IMPORTANTE:</strong> Los instaladores se activan AUTOMÁTICAMENTE al registrarse. 
            Esta página es solo informativa. Si necesitas desactivar un instalador por emergencia, usa el botón "Desactivar".
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Instaladores</p>
            <p className="text-3xl font-bold text-[#121313]">{installers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Activos
            </p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Inactivos
            </p>
            <p className="text-3xl font-bold text-red-600">{inactiveCount}</p>
          </div>
        </div>

        {/* Lista de instaladores */}
        <div className="space-y-3">
          {installers.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay instaladores registrados</p>
            </div>
          ) : (
            installers.map(installer => (
              <div
                key={installer.id}
                className={`bg-white rounded-lg shadow p-4 hover:shadow-lg transition-all flex items-center justify-between ${
                  !installer.active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-bold text-[#121313]">{installer.name}</h3>
                      <p className="text-sm text-gray-600">@{installer.username}</p>
                      {installer.email && (
                        <p className="text-xs text-gray-500">{installer.email}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Registrado: {new Date(installer.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      installer.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {installer.active ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        ACTIVO
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        INACTIVO
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => handleToggleActive(installer.id, installer.active)}
                    disabled={updating === installer.id || installer.active}
                    title={installer.active ? 'Los instaladores activos no se pueden reactivar' : 'Desactivar en caso de emergencia'}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      installer.active
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {updating === installer.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Actualizando...
                      </>
                    ) : installer.active ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Activo (No se puede cambiar)
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Reactivar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info importante */}
        {inactiveCount > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mt-6">
            <p className="text-sm text-red-800">
              <strong>⚠️ ALERTA:</strong> Tienes {inactiveCount} instalador(es) desactivado(s). 
              Los instaladores desactivados NO aparecerán en la lista de asignación. 
              Esto puede ser intencional (por emergencia o inactividad). 
              Si fue accidental, haz clic en "Reactivar" para volver a activarlos.
            </p>
          </div>
        )}

        {/* Info normal */}
        {inactiveCount === 0 && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 mt-6">
            <p className="text-sm text-green-800">
              <strong>✅ PERFECTO:</strong> Todos los instaladores están activos y disponibles para asignar proyectos. 
              Los instaladores se activan automáticamente al registrarse, así que no es necesario hacer nada más.
            </p>
          </div>
        )}

        {/* Info Jorge */}
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Para asignar a Jorge:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
            <li>Jorge se registra → Automáticamente ACTIVO ✅</li>
            <li>Jorge firma contrato → Listo ✅</li>
            <li>Jhayco ve a Jorge en lista de asignación → Automático ✅</li>
            <li>No hay que hacer nada más</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
