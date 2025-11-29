// 🎯 DASHBOARD SIDEBAR COMPONENT - SISTEMA OPTIMIZADO
// 📅 Fecha: 18 de noviembre de 2025
// ✅ Estado: COMPLETAMENTE OPTIMIZADO
//
// 🚫 REGLAS IMPORTANTES:
// - NO modificar rutas a /ruta → usar /dashboard/ruta
// - NO agregar layouts individuales → usar DashboardLayout
// - MANTENER menú compartido para todas las rutas
// - PRESERVAR colores y diseño visual
// - ASEGURAR que no haya parpadeos al navegar
//
// 🎨 DISEÑO VISUAL:
// - Fondo: gradiente #121313 → #1a1a1a
// - Activo: #EAB839 con texto #121313
// - Sidebar: 256px (abierto) / 80px (cerrado)
// - Logo: Logo Rufín (logorufin.png) + texto "Rufín"
//
// 📋 REFERENCIAS:
// - Ver MENU_SYSTEM_CONFIG en /menu-system-config.ts
// - Ver MENU_SYSTEM_DOCUMENTATION.md para docs completas
// - Ver MENU_SYSTEM_REFERENCE.md para referencia rápida

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Settings, Layers, LogOut, Menu, X, FileText, ClipboardList, Users, Calendar, AlertTriangle, DollarSign } from 'lucide-react';
import { NotificationBell } from '../ui/notification-bell';

const NavItem = ({ href, label, icon: Icon, isActive, expanded }: any) => (
  <Link
    href={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-[#EAB839] text-[#121313] shadow-lg'
        : 'text-white hover:bg-white/20 active:bg-white/30'
    }`}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    {expanded && <span className="text-sm whitespace-nowrap">{label}</span>}
  </Link>
);

interface UserToken {
  id: number;
  username: string;
  role: 'admin' | 'vendor' | 'purchasing' | 'installer';
  name: string;
}

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function DashboardSidebar({ sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<UserToken | null>(null);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        setUser(decoded);
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router]);

  if (!isClient || !user) return null;

  // Determinar qué items de menú mostrar según el rol
  const getNavItems = () => {
    const baseItems = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { href: '/dashboard/quotes', label: 'Cotizaciones', icon: FileText },
        { href: '/dashboard/projects', label: 'Proyectos', icon: ClipboardList },
        { href: '/dashboard/incidents', label: 'Incidencias', icon: AlertTriangle },
        { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
        { href: '/dashboard/products', label: 'Productos', icon: Package },
        { href: '/dashboard/price-management', label: 'Gestión de Precios', icon: DollarSign },
        { href: '/dashboard/catalog', label: 'Catálogo', icon: Layers },
        { href: '/dashboard/users', label: 'Usuarios', icon: Users },
        { href: '/dashboard/admin', label: 'Administración', icon: Settings },
        { href: '/dashboard/categories', label: 'Categorías', icon: Layers },
      ];
    } else if (user.role === 'vendor') {
      // Vendedor ve Cotizaciones, Proyectos, Calendario e Incidencias
      return [
        ...baseItems,
        { href: '/dashboard/quotes', label: 'Cotizaciones', icon: FileText },
        { href: '/dashboard/projects', label: 'Proyectos', icon: ClipboardList },
        { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
        { href: '/dashboard/incidents', label: 'Incidencias', icon: AlertTriangle },
      ];
    } else if (user.role === 'purchasing') {
      // Compras ve Proyectos y puede aprobarlos
      return [
        ...baseItems,
        { href: '/dashboard/projects', label: 'Proyectos', icon: ClipboardList },
        { href: '/dashboard/incidents', label: 'Incidencias', icon: AlertTriangle },
        { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
        { href: '/dashboard/quotes', label: 'Cotizaciones', icon: FileText },
      ];
    } else if (user.role === 'installer') {
      // Instalador tiene su propio dashboard personalizado
      return [
        { href: '/dashboard/installer-dashboard', label: 'Mi Panel', icon: LayoutDashboard },
        { href: '/dashboard/work-order', label: 'Mi Orden de Trabajo', icon: ClipboardList },
        { href: '/dashboard/incidents', label: 'Incidencias', icon: AlertTriangle },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div
      className={`bg-gradient-to-b from-[#121313] to-[#1a1a1a] text-white transition-all duration-300 relative ${
        sidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col shadow-2xl`}
    >
      {/* Logo */}
      <div className="px-4 py-3">
        {/* Fila única: Logo + Campana + X */}
        <div className="flex items-center justify-between">
          {/* Logo a la izquierda */}
          <div className="flex items-center">
            {sidebarOpen ? (
              <img
                src="/logorufin.png"
                alt="Rufín Logo"
                className="h-12 w-auto object-contain"
              />
            ) : (
              <img
                src="/logorufin.png"
                alt="Rufín Logo"
                className="h-10 w-auto object-contain"
              />
            )}
          </div>

          {/* Campana y X a la derecha */}
          <div className="flex items-center gap-2">
            <NotificationBell userId={user.id} />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#EAB839]/20 rounded-lg transition"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Información de Sesión */}
      <div className="px-4 pb-4 border-b border-white/10">
        {sidebarOpen ? (
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium truncate">
              {user.name}
            </div>
            <div className="text-[#EAB839] text-xs font-semibold uppercase tracking-wide">
              {user.role === 'admin' ? 'Administrador' :
               user.role === 'vendor' ? 'Vendedor' :
               user.role === 'purchasing' ? 'Compras' :
               user.role === 'installer' ? 'Instalador' :
               user.role === 'super_admin' ? 'Super Admin' : 'Usuario'}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-[#EAB839] rounded-full flex items-center justify-center mx-auto mb-1">
              <span className="text-[#121313] text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-[#EAB839] text-xs font-semibold">
              {user.role === 'admin' ? 'ADM' :
               user.role === 'vendor' ? 'VEN' :
               user.role === 'purchasing' ? 'COM' :
               user.role === 'installer' ? 'INS' :
               user.role === 'super_admin' ? 'SUP' : 'USR'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.href}
            expanded={sidebarOpen}
          />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-[#EAB839]/20">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/');
          }}
          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-semibold hover:bg-red-600/30 transition-all duration-200 text-red-400 ${
            sidebarOpen ? '' : ''
          }`}
          title="Salir"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">Salir</span>}
        </button>
      </div>
    </div>
  );
}