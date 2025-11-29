# Sistema de Roles - Rufin

## Descripción General

El sistema de Rufin implementa un control de acceso basado en roles con dos niveles de administración: **Admin** y **Super Admin**.

## Roles Disponibles

### 1. **Super Admin** 🔴
- **Nivel de acceso**: Control total del sistema
- **Permisos**:
  - ✅ Crear nuevos usuarios (cualquier rol)
  - ✅ Ver lista completa de usuarios
  - ✅ Eliminar cualquier usuario (incluidos otros admins)
  - ✅ Cambiar rol de cualquier usuario
  - ✅ Acceso a todas las funciones del sistema
  - ✅ Ver y modificar todos los proyectos
  - ✅ Ver y gestionar todas las notificaciones

**Restricciones**: Ninguna

**Ejemplo de credenciales**:
- Username: `superadmin`
- Password: `superadmin123`

---

### 2. **Admin** 🟡
- **Nivel de acceso**: Administración de la mayoría de funciones
- **Permisos**:
  - ✅ Ver lista de usuarios
  - ✅ Crear nuevos usuarios (no super_admin)
  - ✅ Cambiar rol de usuarios (no admin ni super_admin)
  - ✅ Eliminar usuarios (no admin ni super_admin)
  - ✅ Acceso a todas las funciones del sistema
  - ✅ Ver y modificar todos los proyectos
  - ✅ Gestionar notificaciones

**Restricciones**:
- ❌ No puede eliminar a otro admin
- ❌ No puede eliminar a un super_admin
- ❌ No puede modificar el rol de un admin o super_admin
- ❌ No puede crear usuarios con rol super_admin

**Ejemplo de credenciales**:
- Username: `admin`
- Password: `admin123`

---

### 3. **Vendor** 🟢
- **Nivel de acceso**: Gestor de proyectos/cotizaciones
- **Permisos**:
  - ✅ Crear cotizaciones y proyectos
  - ✅ Ver proyectos que creó
  - ✅ Ver proyectos aprobados
  - ✅ Ver proyectos en progreso

**Restricciones**:
- ❌ No puede ver/gestionar usuarios
- ❌ No puede ver proyectos que no creó (excepto aprobados/en progreso)
- ❌ No puede cambiar roles

---

### 4. **Installer** 🔵
- **Nivel de acceso**: Técnico de instalación
- **Permisos**:
  - ✅ Ver proyectos asignados
  - ✅ Proponer presupuestos
  - ✅ Actualizar estado de instalación
  - ✅ Ver calendario de trabajos

**Restricciones**:
- ❌ No puede ver/gestionar usuarios
- ❌ No puede ver proyectos no asignados
- ❌ No puede crear proyectos

---

### 5. **Purchasing** 🟣
- **Nivel de acceso**: Departamento de compras
- **Permisos**:
  - ✅ Ver proyectos pendientes de aprobación
  - ✅ Aprobar proyectos
  - ✅ Rechazar proyectos
  - ✅ Ver proyectos en progreso

**Restricciones**:
- ❌ No puede ver/gestionar usuarios
- ❌ No puede crear proyectos
- ❌ No puede ver estadísticas de otros departamentos

---

## Endpoints de API

### Gestión de Usuarios

#### Obtener lista de usuarios
```bash
GET /api/users
Authorization: Bearer {token}
```
**Acceso**: Solo admin y super_admin

#### Crear nuevo usuario
```bash
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nombre del Usuario",
  "username": "username_unico",
  "email": "email@example.com",
  "role": "vendor|installer|purchasing|admin",
  "password": "password123"
}
```
**Acceso**: Solo super_admin

#### Actualizar rol de usuario
```bash
PATCH /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": 5,
  "role": "vendor"
}
```
**Acceso**: Admin y super_admin (con restricciones)

#### Eliminar usuario
```bash
DELETE /api/users?id=5
Authorization: Bearer {token}
```
**Acceso**: Admin y super_admin (con restricciones)

---

## Reglas de Negocio

### Creación de Usuarios
- Solo **super_admin** puede crear nuevos usuarios
- Admin puede crear usuarios que no sean super_admin ni admin

### Eliminación de Usuarios
- **Super_admin**: Puede eliminar cualquier usuario
- **Admin**: Puede eliminar usuarios que no sean admin ni super_admin
- Otros roles: No pueden eliminar usuarios

### Modificación de Roles
- **Super_admin**: Puede cambiar el rol de cualquier usuario
- **Admin**: Puede cambiar roles de usuarios que no sean admin ni super_admin
- Otros roles: No pueden cambiar roles

### Protección de Cuentas
- Los admins no pueden ser eliminados por otros admins
- Los super_admins no pueden ser eliminados por admins
- No se pueden crear múltiples super_admins accidentalmente

---

## Ejemplo de Flujo de Autenticación

1. Usuario intenta login con username y password
2. Sistema verifica credenciales en `/api/login`
3. Si son válidas, se genera un JWT token con el rol
4. Cliente almacena el token en localStorage
5. Todas las peticiones incluyen el token en el header `Authorization: Bearer {token}`
6. Server valida el token y verifica permisos según el rol

---

## Mejores Prácticas

✅ **Hacer:**
- Usar super_admin solo para operaciones administrativas críticas
- Crear admins para supervisar departamentos específicos
- Auditar cambios de permisos regularmente
- Cambiar contraseñas por defecto inmediatamente

❌ **No Hacer:**
- Compartir credenciales de super_admin
- Almacenar contraseñas en el código
- Crear múltiples super_admins innecesariamente
- Confiar solo en validación del cliente

---

## Próximas Mejoras

- [ ] Implementar bcryptjs para hashing de contraseñas
- [ ] Agregar auditoría de cambios de permisos
- [ ] Implementar 2FA para super_admin
- [ ] Crear panel de administración de usuarios
- [ ] Agregar logs de acceso
- [ ] Implementar caducidad de sesiones
- [ ] Agregar roles personalizados

