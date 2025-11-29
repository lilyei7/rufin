'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { useNotifications } from '../../../components/ui/notifications';
import { useConfirmModal } from '../../../components/ui/confirm-modal';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'vendor' | 'purchasing' | 'installer' | 'super_admin';
}

const roleLabels = {
  admin: 'Administrador',
  vendor: 'Vendedor',
  purchasing: 'Compras',
  installer: 'Instalador',
  super_admin: 'Super Administrador'
};

const roleColors = {
  admin: 'bg-red-600 text-white',
  vendor: 'bg-blue-600 text-white',
  purchasing: 'bg-green-600 text-white',
  installer: 'bg-yellow-600 text-white',
  super_admin: 'bg-purple-600 text-white'
};

export default function UsersPage() {
  const { addNotification } = useNotifications();
  const { confirm, ModalComponent } = useConfirmModal();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'vendor'
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      setError('No has iniciado sesión');
      setLoading(false);
      return;
    }

    try {
      const userData = userStr ? JSON.parse(userStr) : null;
      console.log('User from storage:', userData);
      setUser(userData);
      setCurrentUser(userData);
      
      if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
        console.log('Role check failed. User role:', userData?.role);
        setError('No tienes permisos para acceder a esta página');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error parsing user:', error);
      setError('Error al verificar permisos');
      setLoading(false);
      return;
    }

    fetchUsers();
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (res.status === 401) {
        setError('No tienes permisos para acceder a esta página');
        setLoading(false);
        return;
      }
      
      if (res.ok) {
        const { users } = await res.json();
        setUsers(users);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setUsers([...users, data.user]);
        resetForm();
        addNotification({
          type: 'success',
          title: 'Usuario creado',
          message: 'El usuario se ha creado correctamente'
        });
      } else {
        const error = await res.json();
        addNotification({
          type: 'error',
          title: 'Error al crear usuario',
          message: error.error || 'No se pudo crear el usuario'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error al crear usuario',
        message: 'Ocurrió un error inesperado. Inténtalo de nuevo.'
      });
    }
  };

  const handleDelete = async (userId: number) => {
    const token = localStorage.getItem('token');
    const userToDelete = users.find(u => u.id === userId);
    
    if (!userToDelete) return;

    const confirmed = await confirm({
      title: 'Eliminar usuario',
      message: `¿Estás seguro de que quieres eliminar a ${userToDelete.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar'
    });

    if (!confirmed) return;

    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId })
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        addNotification({
          type: 'success',
          title: 'Usuario eliminado',
          message: 'El usuario ha sido eliminado correctamente'
        });
      } else {
        const data = await res.json();
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'No se pudo eliminar el usuario'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ocurrió un error al eliminar el usuario'
      });
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, role: newRole })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user;
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        addNotification({
          type: 'success',
          title: 'Rol actualizado',
          message: 'El rol del usuario ha sido actualizado correctamente'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo actualizar el rol'
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChangePassword = async (userId: number) => {
    if (!newPassword) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Por favor ingresa una contraseña'
      });
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, password: newPassword })
      });

      if (res.ok) {
        setShowPasswordChange(null);
        setNewPassword('');
        addNotification({
          type: 'success',
          title: 'Contraseña actualizada',
          message: 'La contraseña del usuario ha sido cambiada correctamente'
        });
      } else {
        const data = await res.json();
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'No se pudo cambiar la contraseña'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ocurrió un error al cambiar la contraseña'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'vendor'
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="text-center py-8 text-[#EAB839] text-lg font-semibold">Cargando...</div>;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Solo los administradores pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-[#121313]">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-2">Administra usuarios y permisos del sistema</p>
      </div>

      {/* Create User Button */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#EAB839]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#EAB839]" />
            <h3 className="text-2xl font-bold text-[#121313]">Nuevo Usuario</h3>
          </div>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#121313] font-bold mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#EAB839] text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[#121313] font-bold mb-2">Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#EAB839] text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[#121313] font-bold mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:border-[#EAB839] text-gray-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#EAB839] transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#121313] font-bold mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#EAB839] text-gray-900"
                >
                  <option value="vendor">Vendedor</option>
                  <option value="purchasing">Compras</option>
                  <option value="installer">Instalador</option>
                  <option value="admin">Administrador</option>
                  <option value="super_admin">Super Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white font-bold py-3 rounded-lg hover:opacity-90 transition"
              >
                Crear Usuario
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-300 text-[#121313] font-bold rounded-lg hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 w-full bg-gradient-to-r from-[#121313] to-[#2a2a2a] text-white font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Usuario
          </button>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#121313] to-[#2a2a2a] px-6 py-4">
          <h2 className="text-xl font-black text-white">Usuarios ({users.length})</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {users.map((user, index) => {
            // Determinar si el select debe estar deshabilitado
            const isSelectDisabled = user.role === 'super_admin' && currentUser?.role === 'admin';
            // Determinar si el botón de eliminar debe estar visible
            const canDelete = !(currentUser?.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin'));
            // Determinar si puede cambiar contraseña
            const canChangePassword = !(currentUser?.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin'));
            
            return (
            <div key={`user-${user.id}-${index}`} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#121313]">{user.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">@{user.username}</p>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    disabled={isSelectDisabled}
                    className={`px-4 py-2 rounded-lg font-bold text-sm ${
                      isSelectDisabled 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-50' 
                        : `cursor-pointer ${roleColors[user.role]}`
                    }`}
                    title={isSelectDisabled ? 'No puedes cambiar el rol de un super_admin' : ''}
                  >
                    <option value="vendor">Vendedor</option>
                    <option value="purchasing">Compras</option>
                    <option value="installer">Instalador</option>
                    <option value="admin">Administrador</option>
                    {currentUser?.role === 'super_admin' && <option value="super_admin">Super Administrador</option>}
                  </select>
                  
                  {canChangePassword && (
                    <button
                      onClick={() => setShowPasswordChange(showPasswordChange === user.id ? null : user.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Cambiar contraseña"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                  
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {showPasswordChange === user.id && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-bold text-[#121313] mb-2">Nueva Contraseña</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingresa la nueva contraseña"
                        className="w-full border-2 border-blue-300 rounded-lg p-2 pr-10 focus:outline-none focus:border-[#EAB839] text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#EAB839] transition"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleChangePassword(user.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-sm"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordChange(null);
                        setNewPassword('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-bold text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
      <ModalComponent />
    </div>
  );
}
