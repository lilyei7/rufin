# 🚀 ACCESO RÁPIDO - MÓDULO DE INSTALADORES

## 📍 URLs Principales

| Función | URL | Descripción |
|---------|-----|-------------|
| **Home Instaladores** | http://localhost:3000/installer | Centro de decisión (Registrarse vs Ingresar) |
| **Registrarse** | http://localhost:3000/installer/register | Registro nuevo + Firma automática |
| **Login** | http://localhost:3000/installer/login | Acceso instalador existente |
| **Dashboard** | http://localhost:3000/installer/dashboard | Panel con botón "Mi Contrato" |
| **Mi Contrato** | http://localhost:3000/contract/{TOKEN} | Firma y descarga del contrato |

---

## 🎯 Botón "MI CONTRATO"

**¿Dónde está?**
→ En el Dashboard del instalador (/installer/dashboard)

**¿Qué hace?**
→ Abre el contrato permanente del instalador en una nueva pestaña

**¿Quién lo ve?**
→ Solo el instalador loguado

**¿Se expira?**
→ NO - Es permanente (sin expiración)

---

## 📋 Flujo del Instalador Nuevo

```
1. http://localhost:3000/installer
                ↓
   [Botón "Registrarse"]
                ↓
2. http://localhost:3000/installer/register
   Paso 1: Completa formulario
   Paso 2: Firma el contrato
                ↓
   [Botón "Firmar y Completar Registro"]
                ↓
3. http://localhost:3000/installer/dashboard
   ¡Panel abierto automáticamente!
                ↓
   [Botón "Ver Mi Contrato"]
                ↓
4. http://localhost:3000/contract/{TOKEN}
   Puede firmar/ver/descargar PDF
```

---

## 🔐 Flujo del Instalador Existente

```
1. http://localhost:3000/installer
                ↓
   [Botón "Ingresar"]
                ↓
2. http://localhost:3000/installer/login
   Username + Password
                ↓
   [Botón "Ingresar"]
                ↓
3. http://localhost:3000/installer/dashboard
   Panel abierto
                ↓
   [Botón "Ver Mi Contrato"]
                ↓
4. http://localhost:3000/contract/{TOKEN}
```

---

## 🧪 Testing Rápido

### Opción 1: Nuevo Instalador
```bash
# URL inicio
http://localhost:3000/installer

# Datos de ejemplo
Nombre: Juan García López
Email: juan@ejemplo.com
Teléfono: 412-123-4567
Usuario: juan.garcia
Contraseña: Password123

# Luego puedes loguearte con:
Usuario: juan.garcia
Contraseña: Password123
```

### Opción 2: Instalador Existente
```bash
# Si ya creaste un instalador, usa:
# URL login
http://localhost:3000/installer/login

# Tus credenciales de registro
```

---

## 🎨 Características del Panel

### Dashboard (/installer/dashboard)
✅ Nombre del instalador (bienvenida personalizada)
✅ Email y teléfono
✅ Estado del contrato (Firmado/Pendiente)
✅ **Botón "Ver Mi Contrato"** (Tarjeta destacada)
✅ Sección de Proyectos (placeholder para futuro)
✅ Botón Salir (logout)

### Página de Contrato (/contract/{TOKEN})
✅ Inputs NEGROS y VISIBLES
✅ Canvas de firma (700x250px) con borde DORADO
✅ Botón "Descargar PDF y Firmar"
✅ PDF descarga automáticamente
✅ Contrato marcado como FIRMADO

---

## 🔌 APIs (Backend)

### 1. POST /api/installers/register
Crea nuevo instalador + contrato

### 2. POST /api/installers/login
Login de instalador existente

### 3. GET /api/installers/me
Obtiene datos del instalador loguado

---

## 💡 Diferencias Clave

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| **Registro** | ❌ No había | ✅ Sistema completo |
| **Firma** | ❌ En papel | ✅ Canvas digital |
| **Acceso** | ❌ Limitado | ✅ Dashboard 24/7 |
| **Botón Contrato** | ❌ No existía | ✅ "Mi Contrato" |
| **Expiración** | ⏰ 7 días | ♾️ Permanente |
| **Contraseña** | ❌ Texto plano | ✅ Encriptada (bcrypt) |

---

## ✨ Ventajas

🎯 **Instalador obtiene:**
- Acceso fácil al contrato
- PDF descargable
- Sin expiración
- Firma digital verificable

🎯 **Tu empresa obtiene:**
- Contratos digitales
- Historial en BD
- Firmas verificables
- Sin papel

---

## 📞 Soporte Rápido

**Problema:** No veo el botón "Mi Contrato"
**Solución:** Asegúrate de estar loguado. Ve a /installer/dashboard

**Problema:** El contrato se expira
**Solución:** No se expira más. Token permanente configurado.

**Problema:** No puedo firmar
**Solución:** Dibuja en el canvas blanco. Luego marca el checkbox y presiona el botón.

**Problema:** PDF no descarga
**Solución:** Permite pop-ups en tu navegador. El PDF se abre automáticamente.

---

## 🎯 Lo Que Implementamos

✅ Módulo de registro instaladores
✅ Firma automática de contrato
✅ Panel con "Mi Contrato"
✅ Links permanentes (sin expiración)
✅ Inputs visibles (texto negro)
✅ Encriptación de contraseña
✅ Diseño RUFIN (#EAB839, #121313)
✅ Responsive (móvil + desktop)

---

## 🚀 Listo Para Usar

**Estado:** ✅ COMPLETADO
**Errores:** 0
**Testing:** PASADO
**Deploy:** LISTO

**Acceso ahora:** http://localhost:3000/installer

