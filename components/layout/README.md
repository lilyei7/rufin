# Sistema de Menú Compartido

## 📁 Estructura de Componentes

```
components/
└── layout/
    ├── DashboardLayout.tsx      # Layout principal simplificado
    └── DashboardSidebar.tsx     # Componente de menú lateral compartido
```

## 🔧 Cómo Funciona

### DashboardSidebar.tsx
- **Contiene toda la lógica del menú**: navegación, autenticación, roles, estado del sidebar
- **Estado compartido**: El estado del sidebar (abierto/cerrado) se pasa desde el layout padre
- **Lógica de roles**: Determina qué elementos mostrar según el rol del usuario
- **Navegación consistente**: Mantiene el mismo comportamiento en todas las rutas

### DashboardLayout.tsx
- **Layout simplificado**: Solo maneja el estado del sidebar y la estructura general
- **Reutilizable**: Puede ser usado en cualquier layout que necesite el menú
- **Estado persistente**: El estado del menú se mantiene al navegar entre rutas

## 🎯 Beneficios

- ✅ **Menú consistente** en todas las rutas del dashboard
- ✅ **Estado compartido** del sidebar (abierto/cerrado)
- ✅ **Lógica centralizada** de autenticación y roles
- ✅ **Mantenimiento simplificado** - un solo lugar para cambios
- ✅ **Reutilizable** en futuros layouts

## 🚀 Uso

```tsx
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MyPage() {
  return (
    <DashboardLayout>
      <div>Contenido de mi página</div>
    </DashboardLayout>
  );
}
```

El menú se mantendrá consistente y funcional en todas las páginas que usen este layout.