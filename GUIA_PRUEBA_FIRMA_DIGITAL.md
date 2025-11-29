# 🧪 Guía de Prueba - Sistema de Firma Digital

## 📋 Instrucciones para Probar los Enlaces

### Paso 1: Acceder al Enlace
1. Abre este enlace en tu navegador:
   - **Contrato Instalador:** http://localhost:3000/contract/ad59e1a0-c150-4ef5-a832-85a8734ab252
   - **Contrato Cliente:** http://localhost:3000/contract/c9ed9672-1cdb-466e-be9d-3226f9bfe460

### Paso 2: Revisar el Contrato
✓ Observa el diseño profesional con logo de empresa
✓ Lee los detalles del proyecto y monto
✓ Revisa el alcance del trabajo
✓ Lee los términos y condiciones

### Paso 3: Completar el Formulario
1. **Nombre Completo:** Ingresa tu nombre (ej: Juan García López)
2. **Email:** Ingresa un email válido (ej: juan@example.com)
3. **Teléfono:** (Opcional) Ingresa tu teléfono (ej: 412-123-4567)

### Paso 4: Firmar Digitalmente
1. Haz click en el área del canvas (el recuadro púrpura)
2. Dibuja tu firma:
   - Puedes usar el mouse
   - Puedes usar trackpad
   - Si es dispositivo táctil, usa tu dedo
3. Haz click en "Confirmar Firma"
4. Verás el mensaje: "✓ Firma capturada correctamente"

### Paso 5: Aceptar Términos
1. Lee el texto en el recuadro amarillo
2. Haz click en el checkbox
3. Se habilitará el botón "Firmar y Descargar PDF"

### Paso 6: Descargar PDF
1. Haz click en "Firmar y Descargar PDF"
2. Espera a que la firma se procese
3. El PDF se descargará automáticamente
4. Verás la notificación: "✅ Contrato Firmado Exitosamente"

### Paso 7: Revisar el PDF Descargado
1. Abre el PDF (ej: CTR-INST-001-Juan García López.pdf)
2. Verifica que contenga:
   ✓ Logo y nombre de empresa
   ✓ Número de contrato
   ✓ Datos del cliente
   ✓ Montos y términos de pago
   ✓ Tu firma digital
   ✓ Fecha y hora de firma

## 🧬 Datos de Prueba Recomendados

### Cliente 1 (Instalador)
- **Nombre:** Juan Carlos Rodríguez García
- **Email:** juan.rodriguez@example.com
- **Teléfono:** 412-585-1234
- **Contrato:** CTR-INST-001
- **Monto:** $2,500.00 USD

### Cliente 2 (Cliente Final)
- **Nombre:** María Elena Martínez López
- **Email:** maria.martinez@example.com
- **Teléfono:** 717-342-5678
- **Contrato:** CTR-CLIENT-001
- **Monto:** $5,000.00 USD

## ⚙️ Validaciones a Verificar

### Campos Requeridos
- ✓ No permite enviar sin nombre
- ✓ No permite enviar sin email
- ✓ Requiere firma dibujada
- ✓ Requiere aceptación de términos

### Validaciones de Token
- ✓ Muestra error si token es inválido
- ✓ Muestra error si token ha expirado
- ✓ Muestra error si ya fue firmado

### Validaciones de Formato
- ✓ Email debe ser válido
- ✓ Nombre no puede ser solo espacios
- ✓ Teléfono acepta formatos diversos

## 🎨 Elementos de Interfaz a Validar

### Header
- ✓ Logo de empresa visible
- ✓ Nombre de empresa: "CLEMENTE LEGACY CONTRACTORS"
- ✓ Info: License, Teléfono, Email, Ubicación

### Secciones Principales
- ✓ Advertencia de expiración con fecha
- ✓ Detalles del proyecto (factura, proyecto)
- ✓ Información de pago (monto total, desglose)
- ✓ Alcance del trabajo con checkmarks
- ✓ Términos y condiciones (scrollable)

### Formulario
- ✓ Campos de entrada con estilos claros
- ✓ Labels con asteriscos en requeridos
- ✓ Placeholder text descriptivo

### Firma
- ✓ Canvas con borde púrpura
- ✓ Fondo blanco
- ✓ Cursor crosshair
- ✓ Botón "Limpiar Firma"
- ✓ Botón "Confirmar Firma"

### Términos Checkbox
- ✓ Fondo amarillo
- ✓ Texto claro y legible
- ✓ Checkbox funcional

### Botones Finales
- ✓ "Limpiar Firma" deshabilitado si no hay firma
- ✓ "Firmar y Descargar PDF" deshabilitado hasta completar todo
- ✓ Ambos con estados visuales claros

## 📊 Estado de la Base de Datos

### Después de Firmar, Verificar:
```sql
sqlite3 dev.db "SELECT id, contractNumber, clientName, isSigned, signedAt FROM contracts;"
```

Deberías ver:
```
1|CTR-INST-001|Juan Carlos Rodríguez García|1|2025-11-24 12:34:56.789
2|CTR-CLIENT-001|María Elena Martínez López|1|2025-11-24 12:35:10.123
```

## 🔍 Debugging

### Si algo no funciona:

1. **Abre la consola del navegador** (F12)
   - Busca errores en la pestaña "Console"
   - Busca llamadas a API en "Network"

2. **Verifica los logs del servidor:**
   ```bash
   # En la terminal donde está npm running
   # Deberías ver logs como:
   # POST /api/contracts/sign/[token] 200
   ```

3. **Comprueba la base de datos:**
   ```bash
   sqlite3 dev.db "SELECT * FROM contracts WHERE contractNumber='CTR-INST-001';"
   ```

## ✅ Checklist de Validación Completa

- [ ] Acceder a ambos enlaces sin errores
- [ ] Ver diseño profesional de contrato
- [ ] Leer información de empresa
- [ ] Revisar detalles del proyecto
- [ ] Ver términos de pago desglosados
- [ ] Dibujar firma correctamente
- [ ] Aceptar términos correctamente
- [ ] PDF se descarga automáticamente
- [ ] PDF contiene la firma
- [ ] Contrato se marca como firmado en BD
- [ ] Acceso posterior al enlace muestra "Ya Firmado"
- [ ] Notificaciones funcionan correctamente
- [ ] Interfaz es responsive en mobile

## 📞 Soporte

Si encuentras problemas:
1. Verifica que el servidor esté corriendo en puerto 3000
2. Comprueba la conexión a la base de datos
3. Revisa los logs de la terminal
4. Asegúrate de que los tokens sean válidos

---

**Prueba completada exitosamente = Sistema Funcional ✅**
