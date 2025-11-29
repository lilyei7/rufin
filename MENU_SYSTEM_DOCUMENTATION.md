# 🎨 SISTEMA DE MENÚ DASHBOARD - DOCUMENTACIÓN COMPLETA

## 📅 Fecha de Documentación: 18 de noviembre de 2025

## 🎯 ESTADO ACTUAL DEL SISTEMA DE MENÚ

### 📁 Estructura de Archivos

```
components/
└── layout/
    ├── DashboardLayout.tsx      # Layout principal simplificado
    ├── DashboardSidebar.tsx     # Componente de menú lateral compartido
    └── README.md               # Documentación del sistema

app/
└── dashboard/
    ├── layout.tsx              # Layout que usa DashboardLayout
    ├── page.tsx               # Dashboard principal
    ├── admin/page.tsx         # Página de administración
    ├── calendar/page.tsx      # Página de calendario
    ├── catalog/page.tsx       # Página de catálogo
    ├── categories/page.tsx    # Página de categorías
    ├── products/page.tsx      # Página de productos
    ├── projects/page.tsx      # Página de proyectos
    ├── quotes/page.tsx        # Página de cotizaciones
    └── users/page.tsx         # Página de usuarios
```

---

## 🎨 DISEÑO VISUAL DEL MENÚ

### 🎨 Paleta de Colores
- **Fondo Principal**: `bg-gradient-to-b from-[#121313] to-[#1a1a1a]`
- **Color Activo**: `bg-[#EAB839] text-[#121313]`
- **Color Hover**: `hover:bg-white/20 active:bg-white/30`
- **Texto**: `text-white`
- **Bordes**: `border-[#EAB839]/20`

### 📐 Dimensiones
- **Sidebar Abierto**: `w-64` (256px)
- **Sidebar Cerrado**: `w-20` (80px)
- **Transición**: `transition-all duration-300`

### 🔤 Tipografía
- **Logo**: `font-black text-lg` (CLC)
- **Etiquetas**: `text-sm whitespace-nowrap`
- **Botones**: `font-semibold`

---

## 👥 SISTEMA DE ROLES Y PERMISOS

### 👑 ADMINISTRADOR (admin)
**Elementos del menú:**
1. 🏠 Dashboard → `/dashboard`
2. 📄 Cotizaciones → `/dashboard/quotes`
3. 📋 Proyectos → `/dashboard/projects`
4. 📅 Calendario → `/dashboard/calendar`
5. 📦 Productos → `/dashboard/products`
6. 🗂️ Catálogo → `/dashboard/catalog`
7. 👥 Usuarios → `/dashboard/users`
8. ⚙️ Administración → `/dashboard/admin`
9. 🏷️ Categorías → `/dashboard/categories`

### 💼 VENDEDOR (vendor)
**Elementos del menú:**
1. 🏠 Dashboard → `/dashboard`
2. 📄 Cotizaciones → `/dashboard/quotes`
3. 📋 Proyectos → `/dashboard/projects`

### 🛒 DEPARTAMENTO DE COMPRAS (purchasing)
**Elementos del menú:**
1. 🏠 Dashboard → `/dashboard`
2. 📋 Proyectos → `/dashboard/projects`
3. 📅 Calendario → `/dashboard/calendar`
4. 📄 Cotizaciones → `/dashboard/quotes`

### 🔧 INSTALADOR (installer)
**Elementos del menú:**
1. 🏠 Dashboard → `/dashboard`
2. 📅 Calendario → `/dashboard/calendar`

---

## 🏗️ ESTRUCTURA DEL COMPONENTE SIDEBAR

### 📋 Props Interface
```typescript
interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}
```

### 🎯 Estados Internos
- `isClient`: Controla renderizado del lado cliente
- `user`: Información del usuario autenticado

### 🔧 Funciones Principales
- `getNavItems()`: Determina elementos del menú según rol
- `getRoleLabel()`: Convierte rol a etiqueta legible

---

## 🎨 ELEMENTOS VISUALES DEL MENÚ

### 🏷️ Logo Section
```tsx
<div className="p-4 border-b border-[#EAB839]/20 flex items-center justify-between">
  {sidebarOpen && (
    <div className="flex items-center gap-2">
      <div className="bg-[#EAB839] text-[#121313] font-black text-lg w-8 h-8 rounded flex items-center justify-center">
        C
      </div>
      <span className="font-black text-sm">CLC</span>
    </div>
  )}
  <button onClick={() => setSidebarOpen(!sidebarOpen)}>
    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
  </button>
</div>
```

### 👤 User Info Section
```tsx
{sidebarOpen && (
  <div className="px-4 py-3 border-b border-[#EAB839]/20">
    <p className="text-xs text-[#EAB839] font-bold">SESIÓN ACTIVA</p>
    <p className="text-sm font-bold text-white mt-1">{user.name}</p>
    <p className="text-xs text-gray-400">@{user.username}</p>
    <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-[#EAB839]/20 text-[#EAB839] font-bold">
      {getRoleLabel()}
    </span>
  </div>
)}
```

### 🧭 Navigation Section
```tsx
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
```

### 🚪 Logout Section
```tsx
<div className="p-4 border-t border-[#EAB839]/20">
  <button onClick={() => { localStorage.removeItem('token'); router.push('/'); }}>
    <LogOut className="w-5 h-5 flex-shrink-0" />
    {sidebarOpen && <span className="text-sm">Salir</span>}
  </button>
</div>
```

---

## 🎯 COMPONENTE NavItem

### 📋 Props
```typescript
interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  expanded: boolean;
}
```

### 🎨 Estilos
```tsx
className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
  isActive
    ? 'bg-[#EAB839] text-[#121313] shadow-lg'
    : 'text-white hover:bg-white/20 active:bg-white/30'
}`}
```

---

## 🔧 FUNCIONALIDADES TÉCNICAS

### 🔐 Autenticación
- Verifica token JWT en localStorage
- Redirige a `/` si no hay token válido
- Decodifica información del usuario

### 🎭 Control de Roles
- **admin**: Acceso completo a todas las secciones
- **vendor**: Solo cotizaciones y proyectos
- **purchasing**: Proyectos, calendario y cotizaciones
- **installer**: Solo calendario

### 📍 Detección de Ruta Activa
- Usa `usePathname()` de Next.js
- Compara `pathname === item.href` para activar elementos

### 📱 Responsive Design
- Sidebar colapsable con botón toggle
- Iconos siempre visibles, texto solo cuando está expandido
- Transiciones suaves de 300ms

---

## 🎨 ÍCONOS UTILIZADOS

```typescript
import {
  LayoutDashboard,  // 🏠 Dashboard
  Package,          // 📦 Productos
  Settings,         // ⚙️ Administración
  Layers,           // 🗂️ Catálogo/Categorías
  LogOut,           // 🚪 Salir
  Menu,             // 📱 Menú (cerrado)
  X,                // ❌ Cerrar (abierto)
  FileText,         // 📄 Cotizaciones
  ClipboardList,    // 📋 Proyectos
  Users,            // 👥 Usuarios
  Calendar          // 📅 Calendario
} from 'lucide-react';
```

---

## 🚀 OPTIMIZACIONES IMPLEMENTADAS

### ✅ Eliminación de Redirecciones
- **Antes**: `/quotes` → redirección → `/dashboard/quotes`
- **Ahora**: Directo a `/dashboard/quotes`

### ✅ Menú Compartido
- Un solo componente `DashboardSidebar` para todas las rutas
- Estado consistente del sidebar (abierto/cerrado)
- Sin parpadeos ni recargas

### ✅ Rutas Directas
- Todas las rutas apuntan directamente a `/dashboard/*`
- Sin saltos intermedios que causen UX pobre

### ✅ Performance
- Componente compartido reduce duplicación de código
- Un solo layout para todo el dashboard
- Estado persistente del menú

---

## 📋 CHECKLIST DE FUNCIONALIDADES

### ✅ Diseño Visual
- [x] Gradiente de fondo consistente
- [x] Color activo dorado (#EAB839)
- [x] Transiciones suaves
- [x] Logo CLC visible
- [x] Información de usuario
- [x] Botón de logout

### ✅ Funcionalidad
- [x] Autenticación JWT
- [x] Control de roles
- [x] Navegación fluida
- [x] Sidebar colapsable
- [x] Detección de ruta activa
- [x] Responsive design

### ✅ Optimización
- [x] Sin redirecciones dobles
- [x] Menú compartido
- [x] Estado persistente
- [x] Performance óptima
- [x] Sin parpadeos

---

## 🎯 CONCLUSIONES

Este sistema de menú está **100% optimizado** y proporciona una experiencia de usuario consistente y fluida. El diseño visual es coherente, la funcionalidad es completa, y el rendimiento es óptimo.

**IMPORTANTE**: Mantener esta estructura y diseño para futuras actualizaciones del sistema.