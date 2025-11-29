// 🎯 MENU SYSTEM CONFIGURATION - GitHub Copilot Reference
// Fecha: 18 de noviembre de 2025
// Estado: OPTIMIZADO Y COMPLETO

export const MENU_SYSTEM_CONFIG = {
  // 🎨 VISUAL DESIGN
  colors: {
    background: 'bg-gradient-to-b from-[#121313] to-[#1a1a1a]',
    active: 'bg-[#EAB839] text-[#121313]',
    hover: 'hover:bg-white/20 active:bg-white/30',
    text: 'text-white',
    border: 'border-[#EAB839]/20'
  },

  // 📐 DIMENSIONS
  sidebar: {
    open: 'w-64',    // 256px
    closed: 'w-20',  // 80px
    transition: 'transition-all duration-300'
  },

  // 👥 ROLES & PERMISSIONS
  roles: {
    admin: {
      label: 'Administrador',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { href: '/dashboard/quotes', label: 'Cotizaciones', icon: 'FileText' },
        { href: '/dashboard/projects', label: 'Proyectos', icon: 'ClipboardList' },
        { href: '/dashboard/calendar', label: 'Calendario', icon: 'Calendar' },
        { href: '/dashboard/products', label: 'Productos', icon: 'Package' },
        { href: '/dashboard/catalog', label: 'Catálogo', icon: 'Layers' },
        { href: '/dashboard/users', label: 'Usuarios', icon: 'Users' },
        { href: '/dashboard/admin', label: 'Administración', icon: 'Settings' },
        { href: '/dashboard/categories', label: 'Categorías', icon: 'Layers' }
      ]
    },
    vendor: {
      label: 'Vendedor',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { href: '/dashboard/quotes', label: 'Cotizaciones', icon: 'FileText' },
        { href: '/dashboard/projects', label: 'Proyectos', icon: 'ClipboardList' }
      ]
    },
    purchasing: {
      label: 'Compras',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { href: '/dashboard/projects', label: 'Proyectos', icon: 'ClipboardList' },
        { href: '/dashboard/calendar', label: 'Calendario', icon: 'Calendar' },
        { href: '/dashboard/quotes', label: 'Cotizaciones', icon: 'FileText' }
      ]
    },
    installer: {
      label: 'Instalador',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { href: '/dashboard/calendar', label: 'Calendario', icon: 'Calendar' }
      ]
    }
  },

  // 🔧 COMPONENT STRUCTURE
  components: {
    main: 'DashboardSidebar.tsx',
    layout: 'DashboardLayout.tsx',
    location: '/components/layout/'
  },

  // 🚫 RULES TO FOLLOW
  rules: {
    noRedirects: true,           // No redirecciones dobles
    sharedMenu: true,            // Menú compartido obligatorio
    directRoutes: true,          // Rutas directas /dashboard/*
    persistentState: true,       // Estado del sidebar persistente
    noBlinking: true            // Sin parpadeos al navegar
  },

  // ✅ OPTIMIZATION STATUS
  optimization: {
    redirects: 'ELIMINATED',     // Redirecciones eliminadas
    performance: 'OPTIMAL',      // Performance óptima
    ux: 'FLUID',                // UX fluida
    consistency: 'PERFECT'      // Consistencia perfecta
  }
};

// 🎯 QUICK REFERENCE FOR FUTURE DEVELOPMENT
export const QUICK_REFERENCE = {
  // Para agregar nueva sección al menú
  addNewSection: {
    steps: [
      '1. Crear página en /app/dashboard/nueva-seccion/page.tsx',
      '2. Agregar entrada en getNavItems() según rol',
      '3. Importar ícono de Lucide React',
      '4. Actualizar MENU_SYSTEM_CONFIG',
      '5. Actualizar documentación'
    ]
  },

  // Para modificar colores
  modifyColors: {
    steps: [
      '1. Cambiar en DashboardSidebar.tsx',
      '2. Actualizar MENU_SYSTEM_CONFIG.colors',
      '3. Verificar consistencia en todas las rutas'
    ]
  }
};