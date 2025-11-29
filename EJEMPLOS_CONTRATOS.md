# 📝 EJEMPLOS DE USO - Sistema de Contratos

## 🔐 AUTENTICACIÓN

### Login Usuario Interno (Dashboard)
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Login Portal de Clientes
```bash
curl -X POST http://localhost:3000/api/portal/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "cliente1@test.com", "accessCode": "ACC-001"}'
```

---

## 📋 CONTRATOS

### Listar Todos los Contratos
```bash
curl http://localhost:3000/api/contracts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrar Contratos por Tipo
```bash
curl "http://localhost:3000/api/contracts?type=project" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrar por Estado
```bash
curl "http://localhost:3000/api/contracts?status=pending_signature" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Crear Nuevo Contrato
```bash
curl -X POST http://localhost:3000/api/contracts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "project",
    "title": "Sistema Solar 10kW - Cliente Nuevo",
    "description": "Instalación completa de sistema fotovoltaico",
    "content": "CONTRATO DE INSTALACION...",
    "clientId": 1,
    "templateId": 1,
    "amount": 150000,
    "currency": "MXN",
    "startDate": "2025-12-01",
    "endDate": "2026-12-01",
    "paymentTerms": "40% anticipo, 30% avance, 30% finalización",
    "deliveryTerms": "Instalación en 20 días hábiles"
  }'
```

### Actualizar Contrato
```bash
curl -X PATCH http://localhost:3000/api/contracts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "status": "pending_signature",
    "amount": 160000
  }'
```

---

## ✍️ FIRMAS DIGITALES

### Firmar un Contrato
```bash
curl -X POST http://localhost:3000/api/contracts/sign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": 2,
    "signatureData": "data:image/png;base64,iVBORw0KG...",
    "signatureType": "digital",
    "ipAddress": "192.168.1.100",
    "location": "Ciudad de México, México"
  }'
```

**Respuesta:**
```json
{
  "signature": {
    "id": 1,
    "contractId": 2,
    "signerId": 1,
    "signerName": "Administrador",
    "signerRole": "admin",
    "status": "signed",
    "signedAt": "2025-11-21T..."
  },
  "contract": {
    "id": 2,
    "status": "partially_signed",
    ...
  },
  "message": "Firma registrada exitosamente"
}
```

---

## 📄 TEMPLATES

### Listar Templates
```bash
curl http://localhost:3000/api/contracts/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtrar Templates por Tipo
```bash
curl "http://localhost:3000/api/contracts/templates?type=project" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Crear Nuevo Template
```bash
curl -X POST http://localhost:3000/api/contracts/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contrato de Servicio Premium",
    "type": "service",
    "content": "CONTRATO DE SERVICIO PREMIUM\n\nServicios de monitoreo...",
    "variables": {
      "CLIENT_NAME": "string",
      "SERVICE_LEVEL": "string",
      "AMOUNT": "number"
    },
    "active": true
  }'
```

---

## 📜 TÉRMINOS Y CONDICIONES

### Obtener Términos Activos
```bash
curl http://localhost:3000/api/terms-conditions
```

### Aceptar Términos
```bash
curl -X PUT http://localhost:3000/api/terms-conditions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "termsId": 1,
    "ipAddress": "192.168.1.100"
  }'
```

---

## 🌐 PORTAL DE CLIENTES

### Ver Contratos del Cliente
```bash
curl http://localhost:3000/api/portal/contracts \
  -H "Authorization: Bearer PORTAL_TOKEN"
```

**Respuesta:**
```json
{
  "contracts": [
    {
      "id": 1,
      "contractNumber": "CONT-00001",
      "type": "project",
      "status": "signed",
      "title": "Sistema Residencial 5kW - Juan García",
      "amount": 85000,
      "currency": "MXN",
      "startDate": "2025-11-21",
      "endDate": "2026-11-21",
      "signatures": [...],
      "communications": [...]
    }
  ]
}
```

---

## 🧪 ESCENARIOS DE PRUEBA

### Escenario 1: Crear y Firmar Contrato de Proyecto

1. **Login como admin:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')
```

2. **Crear contrato:**
```bash
CONTRACT_ID=$(curl -s -X POST http://localhost:3000/api/contracts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"project",
    "title":"Sistema Test",
    "content":"Contrato de prueba",
    "clientId":1,
    "amount":100000,
    "startDate":"2025-12-01",
    "endDate":"2026-12-01"
  }' | jq -r '.contract.id')
```

3. **Firmar contrato:**
```bash
curl -X POST http://localhost:3000/api/contracts/sign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"contractId\":$CONTRACT_ID,
    \"signatureData\":\"digital_sig_$(date +%s)\",
    \"signatureType\":\"digital\"
  }"
```

### Escenario 2: Cliente Firma desde Portal

1. **Login cliente:**
```bash
PORTAL_TOKEN=$(curl -s -X POST http://localhost:3000/api/portal/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente1@test.com","accessCode":"ACC-001"}' | jq -r '.token')
```

2. **Ver contratos:**
```bash
curl http://localhost:3000/api/portal/contracts \
  -H "Authorization: Bearer $PORTAL_TOKEN"
```

3. **Firmar contrato pendiente:**
```bash
curl -X POST http://localhost:3000/api/contracts/sign \
  -H "Authorization: Bearer $PORTAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": 2,
    "signatureData": "client_signature_data",
    "signatureType": "digital"
  }'
```

---

## 🔍 CONSULTAS ÚTILES

### Contratos Pendientes de Firma
```bash
curl "http://localhost:3000/api/contracts?status=pending_signature" \
  -H "Authorization: Bearer $TOKEN"
```

### Contratos de un Proyecto
```bash
curl "http://localhost:3000/api/contracts?projectId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Templates Activos
```bash
curl "http://localhost:3000/api/contracts/templates?active=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 RESPUESTAS DE EJEMPLO

### Contrato Completo
```json
{
  "contract": {
    "id": 1,
    "contractNumber": "CONT-00001",
    "type": "project",
    "status": "signed",
    "title": "Sistema Residencial 5kW - Juan García",
    "description": "Sistema fotovoltaico residencial completo",
    "content": "CONTRATO DE VENTA E INSTALACION...",
    "amount": 85000,
    "currency": "MXN",
    "startDate": "2025-11-21T00:00:00.000Z",
    "endDate": "2026-11-21T00:00:00.000Z",
    "paymentTerms": "50% anticipo, 50% contraentrega",
    "deliveryTerms": "Instalación en 15 días hábiles",
    "signedAt": "2025-11-21T12:00:00.000Z",
    "activatedAt": "2025-11-21T12:00:00.000Z",
    "client": {
      "id": 1,
      "name": "Juan García Pérez",
      "email": "cliente1@test.com",
      "company": "Residencial Los Pinos"
    },
    "template": {
      "id": 1,
      "name": "Contrato de Proyecto con Cliente"
    },
    "signatures": [
      {
        "id": 1,
        "signerId": 2,
        "signerName": "Administrador",
        "signerEmail": "admin@rufin.com",
        "signerRole": "admin",
        "status": "signed",
        "signedAt": "2025-11-21T12:00:00.000Z"
      }
    ],
    "communications": [
      {
        "id": 1,
        "subject": "Contrato firmado exitosamente",
        "type": "email",
        "status": "sent",
        "sentAt": "2025-11-21T12:05:00.000Z"
      }
    ]
  }
}
```

---

## ⚠️ ERRORES COMUNES

### 401 - No Autorizado
```json
{"error": "No autorizado"}
```
**Solución:** Incluir token válido en header Authorization

### 403 - Sin Permisos
```json
{"error": "Sin permisos"}
```
**Solución:** Tu rol no tiene acceso a este endpoint

### 400 - Datos Inválidos
```json
{"error": "Faltan campos requeridos: title, type, content"}
```
**Solución:** Revisar campos requeridos en la documentación

### 404 - No Encontrado
```json
{"error": "Contrato no encontrado"}
```
**Solución:** Verificar que el ID existe

---

## 🎯 TIPS Y MEJORES PRÁCTICAS

1. **Siempre guardar el token** después del login
2. **Verificar el estado** del contrato antes de intentar firmarlo
3. **Usar templates** para contratos recurrentes
4. **Registrar IP y metadata** en las firmas
5. **Enviar comunicaciones** después de acciones importantes
6. **No modificar contratos firmados** (solo puedes cambiar metadata)
7. **Usar accessCode seguro** para clientes (alfanumérico, 8+ caracteres)

---

**¿Necesitas ayuda?** Consulta CREDENCIALES_Y_DATOS.md para más información 📚
