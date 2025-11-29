# 🤖 GitHub Copilot - Instrucciones para Sistema de Menú

## 🎯 OBJETIVO
Recordar y mantener el diseño optimizado del sistema de menú del dashboard.

## 📋 CONFIGURACIÓN ACTUAL (18 Nov 2025)

### ✅ SISTEMA OPTIMIZADO
- **Estado**: 100% funcional y optimizado
- **Redirecciones**: Eliminadas (sin dobles saltos)
- **Menú**: Compartido en todas las rutas
- **Performance**: Óptima (sin parpadeos)
- **UX**: Fluida y consistente

### 🚫 ACCIONES PROHIBIDAS
1. **NO crear** redirecciones desde `/ruta` a `/dashboard/ruta`
2. **NO agregar** layouts individuales en subdirectorios
3. **NO cambiar** colores sin actualizar documentación
4. **NO modificar** rutas del menú sin actualizar configuración
5. **NO duplicar** lógica del menú

### ✅ ACCIONES PERMITIDAS
1. **Agregar** nuevas secciones siguiendo el patrón establecido
2. **Modificar** contenido de páginas existentes
3. **Actualizar** íconos manteniendo consistencia visual
4. **Optimizar** código sin cambiar funcionalidad
5. **Documentar** cambios en los archivos de referencia

## 🔧 PROCEDIMIENTOS PARA CAMBIOS

### Para Agregar Nueva Sección:
```typescript
// 1. Agregar entrada en getNavItems() según rol
if (user.role === 'admin') {
  return [
    ...baseItems,
    // Agregar aquí nueva entrada
    { href: '/dashboard/nueva-seccion', label: 'Nueva Sección', icon: NuevoIcono },
  ];
}
```

### Para Modificar Colores:
```typescript
// 1. Cambiar en DashboardSidebar.tsx
className={`... bg-[#NUEVO_COLOR] ...`}

// 2. Actualizar menu-system-config.ts
colors: {
  active: 'bg-[#NUEVO_COLOR] text-[#NUEVO_TEXTO]',
  // ...
}

// 3. Actualizar documentación
```

## 📚 ARCHIVOS DE REFERENCIA

### 📖 Documentación Completa
- `MENU_SYSTEM_DOCUMENTATION.md` - Documentación detallada
- `MENU_SYSTEM_REFERENCE.md` - Referencia rápida
- `menu-system-config.ts` - Configuración técnica

### 🔧 Componentes Principales
- `components/layout/DashboardSidebar.tsx` - Componente del menú
- `components/layout/DashboardLayout.tsx` - Layout contenedor
- `app/dashboard/layout.tsx` - Layout del dashboard

## 🎨 PALETA DE COLORES ACTUAL
- **Fondo**: `#121313` → `#1a1a1a` (gradiente)
- **Activo**: `#EAB839` (dorado)
- **Texto Activo**: `#121313` (negro)
- **Hover**: `white/20` (transparente blanco)
- **Bordes**: `#EAB839/20` (dorado transparente)

## 👥 ROLES Y PERMISOS ACTUALES

### Admin (9 elementos)
Dashboard, Cotizaciones, Proyectos, Calendario, Productos, Catálogo, Usuarios, Administración, Categorías

### Vendor (3 elementos)
Dashboard, Cotizaciones, Proyectos

### Purchasing (4 elementos)
Dashboard, Proyectos, Calendario, Cotizaciones

### Installer (2 elementos)
Dashboard, Calendario

## 🚨 ALERTA CRÍTICA

**ESTE SISTEMA ESTÁ PERFECTAMENTE OPTIMIZADO**
- No requiere cambios a menos que sea estrictamente necesario
- Cualquier modificación debe mantener la consistencia
- Siempre verificar que no se introduzcan parpadeos o redirecciones
- Actualizar TODA la documentación al hacer cambios

## 📞 CONTACTO PARA CAMBIOS
Si necesitas modificar el sistema de menú, asegúrate de:
1. Actualizar todos los archivos de documentación
2. Verificar que no se rompa la consistencia
3. Probar en todas las rutas y roles
4. Mantener el rendimiento óptimo