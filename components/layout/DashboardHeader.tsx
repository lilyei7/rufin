'use client';

import { useState, useEffect } from 'react';

interface DashboardHeaderProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

interface UserToken {
  id: number;
  username: string;
  role: 'admin' | 'vendor' | 'purchasing' | 'installer';
  name: string;
}

export default function DashboardHeader({ sidebarOpen, setSidebarOpen }: DashboardHeaderProps) {
  const [user, setUser] = useState<UserToken | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUser(decoded);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Administrador';
    if (user?.role === 'vendor') return 'Vendedor';
    if (user?.role === 'purchasing') return 'Compras';
    if (user?.role === 'installer') return 'Instalador';
    return 'Usuario';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative">
      {/* Badge de rol en esquina superior derecha */}
      {user && (
        <div className="absolute top-4 right-6">
          <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-[#EAB839]/20 text-[#EAB839] font-bold">
            {getRoleLabel()}
          </span>
        </div>
      )}
    </header>
  );
}