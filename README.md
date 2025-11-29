# Rufín - Sistema de Gestión de Proyectos

Sistema completo de gestión de proyectos, contratos y clientes para Rufín.

## 🚀 Características

- ✅ **Gestión de Proyectos**: Workflow completo desde creación hasta finalización
- ✅ **Sistema de Contratos**: Creación automática y firma digital
- ✅ **Portal del Cliente**: Acceso seguro para clientes
- ✅ **Sistema de Notificaciones**: Alertas en tiempo real
- ✅ **Gestión de Usuarios**: Roles y permisos avanzados
- ✅ **Dashboard Interactivo**: Métricas y estadísticas en tiempo real

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (File-based storage)
- **Autenticación**: JWT Tokens
- **Base de Datos**: JSON File Storage (desarrollo)
- **UI Components**: Lucide Icons, Custom Components

## 🏃‍♂️ Inicio Rápido

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Abrir en navegador:**
   [http://localhost:3000](http://localhost:3000)

## 📊 Usuarios de Prueba

### Dashboard Administrativo
- **Admin**: `admin` / `admin`
- **Compras**: `purchasing` / `purchasing`
- **Vendedor**: `vendor` / `vendor`

### Portal del Cliente
- **Email**: Cualquier email de usuario registrado
- **Código**: `PORTAL2025`

## 📁 Estructura del Proyecto

```
rufin/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard administrativo
│   ├── portal/            # Portal del cliente
│   └── page.tsx           # Página de login
├── components/            # Componentes reutilizables
├── public/                # Archivos estáticos
│   ├── data.json          # Base de datos (desarrollo)
│   └── logorufin.png      # Logo principal
└── README.md
```

## 🎯 Flujo de Trabajo

1. **Login** → Dashboard administrativo
2. **Crear Proyecto** → Asignar presupuesto
3. **Aprobar Proyecto** → Asignar instalador
4. **Enviar Contrato** → Cliente recibe notificación
5. **Cliente Firma** → Proyecto avanza
6. **Ejecución** → Seguimiento y finalización

## 📞 Soporte

Para soporte técnico contactar a: soporte@rufin.com

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
