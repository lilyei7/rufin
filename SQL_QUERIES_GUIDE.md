# 🔍 GUÍA TÉCNICA - CONSULTAS SQL Y OPERACIONES

## 📋 PROYECTOS

### Ver todos los proyectos de un vendor
```sql
SELECT p.* FROM projects p
WHERE p.createdById = 3; -- ID del vendor jhayco
```

### Ver proyectos pendientes de aprobación
```sql
SELECT p.id, p.projectName, p.clientName, p.totalCost, p.status
FROM projects p
WHERE p.status = 'pending_approval'
ORDER BY p.createdAt DESC;
```

### Ver detalles completos de un proyecto
```sql
SELECT 
    p.*,
    u1.name as createdByName,
    u2.name as approvedByName,
    u3.name as installerName,
    COUNT(pi.id) as itemCount,
    SUM(pi.quantity * pi.unitPrice) as calculatedTotal
FROM projects p
LEFT JOIN users u1 ON p.createdById = u1.id
LEFT JOIN users u2 ON p.approvedById = u2.id
LEFT JOIN users u3 ON p.assignedInstallerId = u3.id
LEFT JOIN project_items pi ON p.id = pi.projectId
WHERE p.id = 1
GROUP BY p.id;
```

### Ver historial de cambios de un proyecto
```sql
SELECT * FROM project_history
WHERE projectId = 1
ORDER BY timestamp DESC;
```

---

## 🛒 ITEMS DE PROYECTO

### Ver items de un proyecto con datos de producto
```sql
SELECT 
    pi.*,
    p.name as productName,
    p.unitPrice as currentPrice,
    c.name as categoryName
FROM project_items pi
JOIN products p ON pi.productId = p.id
JOIN categories c ON p.categoryId = c.id
WHERE pi.projectId = 1;
```

### Calcular total de proyecto
```sql
SELECT 
    SUM(quantity * unitPrice) as projectTotal,
    COUNT(*) as itemCount
FROM project_items
WHERE projectId = 1;
```

---

## 🚨 INCIDENTES

### Ver todos los incidentes de un proyecto
```sql
SELECT 
    i.*,
    u.name as createdByName,
    p.projectName,
    COUNT(ii.id) as itemCount
FROM incidents i
LEFT JOIN users u ON i.createdById = u.id
LEFT JOIN projects p ON i.projectId = p.id
LEFT JOIN incident_items ii ON i.id = ii.incidentId
WHERE i.projectId = 1
GROUP BY i.id
ORDER BY i.createdAt DESC;
```

### Ver incidentes por prioridad
```sql
SELECT priority, status, COUNT(*) as count
FROM incidents
GROUP BY priority, status
ORDER BY CASE 
    WHEN priority = 'critical' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'medium' THEN 3
    ELSE 4
END;
```

### Ver costo total de incidentes por proyecto
```sql
SELECT 
    p.projectName,
    SUM(i.totalCost) as incidentCost,
    COUNT(i.id) as incidentCount
FROM incidents i
JOIN projects p ON i.projectId = p.id
GROUP BY p.id, p.projectName
ORDER BY incidentCost DESC;
```

---

## 📄 CONTRATOS

### Ver contratos por estado
```sql
SELECT 
    status,
    COUNT(*) as count,
    SUM(totalAmount) as totalValue,
    AVG(totalAmount) as avgValue
FROM contracts
GROUP BY status;
```

### Ver contratos firmados con firma
```sql
SELECT 
    c.*,
    u.name as signedByName,
    p.projectName
FROM contracts c
LEFT JOIN users u ON c.clientId = u.id
LEFT JOIN projects p ON c.projectId = p.id
WHERE c.isSigned = 1
ORDER BY c.signedAt DESC;
```

### Ver contratos próximos a expirar
```sql
SELECT *
FROM contracts
WHERE isSigned = 0
AND expiresAt < datetime('now', '+7 days')
AND expiresAt > datetime('now')
ORDER BY expiresAt ASC;
```

### Ver contratos con tokens inválidos
```sql
SELECT *
FROM contracts
WHERE isSigned = 0
AND expiresAt < datetime('now')
ORDER BY expiresAt DESC;
```

---

## 💬 MENSAJES

### Ver mensajes recibidos por un usuario
```sql
SELECT 
    m.*,
    u1.name as senderName,
    p.projectName,
    i.title as incidentTitle,
    c.contractNumber
FROM messages m
LEFT JOIN users u1 ON m.senderId = u1.id
LEFT JOIN projects p ON m.projectId = p.id
LEFT JOIN incidents i ON m.incidentId = i.id
LEFT JOIN contracts c ON m.contractId = c.id
WHERE m.recipientId = 1
ORDER BY m.createdAt DESC;
```

### Ver conversaciones sobre un proyecto
```sql
SELECT 
    m.*,
    u1.name as senderName,
    u2.name as recipientName
FROM messages m
JOIN users u1 ON m.senderId = u1.id
JOIN users u2 ON m.recipientId = u2.id
WHERE m.projectId = 1
ORDER BY m.createdAt ASC;
```

### Contar mensajes no leídos
```sql
SELECT recipientId, COUNT(*) as unreadCount
FROM messages
WHERE isRead = 0
GROUP BY recipientId;
```

---

## 🔔 NOTIFICACIONES

### Ver notificaciones no leídas
```sql
SELECT 
    n.*,
    u.name as userName
FROM notifications n
JOIN users u ON n.userId = u.id
WHERE n.isRead = 0
ORDER BY n.createdAt DESC;
```

### Ver notificaciones por tipo
```sql
SELECT type, COUNT(*) as count
FROM notifications
WHERE createdAt > datetime('now', '-7 days')
GROUP BY type
ORDER BY count DESC;
```

### Marcar notificaciones como leídas
```sql
UPDATE notifications
SET isRead = 1
WHERE userId = 1 AND isRead = 0;
```

---

## 📊 REPORTES

### Dashboard Vendor
```sql
SELECT 
    'Proyectos Creados' as metric,
    COUNT(*) as value
FROM projects
WHERE createdById = 3

UNION ALL

SELECT 
    'Proyectos Aprobados',
    COUNT(*)
FROM projects
WHERE createdById = 3 AND status IN ('approved', 'assigned', 'completed')

UNION ALL

SELECT 
    'Valor Total en Proyectos',
    SUM(totalCost)
FROM projects
WHERE createdById = 3

UNION ALL

SELECT 
    'Incidentes Reportados',
    COUNT(*)
FROM incidents
WHERE createdById = 3;
```

### Dashboard Admin
```sql
SELECT 
    'Total Proyectos' as metric,
    COUNT(*) as value
FROM projects

UNION ALL

SELECT 
    'Pendientes de Aprobación',
    COUNT(*)
FROM projects
WHERE status = 'pending_approval'

UNION ALL

SELECT 
    'Contratos Firmados',
    COUNT(*)
FROM contracts
WHERE isSigned = 1

UNION ALL

SELECT 
    'Incidentes Activos',
    COUNT(*)
FROM incidents
WHERE status IN ('pending', 'investigating');
```

### Reporte de Ingresos
```sql
SELECT 
    DATE(p.approvedAt) as approvalDate,
    COUNT(p.id) as projectCount,
    SUM(p.totalCost) as totalRevenue,
    AVG(p.totalCost) as avgProjectValue
FROM projects p
WHERE p.status IN ('approved', 'assigned', 'completed')
AND p.approvedAt IS NOT NULL
GROUP BY DATE(p.approvedAt)
ORDER BY approvalDate DESC;
```

---

## 🔧 OPERACIONES COMUNES

### Crear un nuevo proyecto
```sql
INSERT INTO projects (
    projectName, invoiceNumber, clientName, status, 
    totalCost, createdBy, createdById, lastModified, lastModifiedBy
) VALUES (
    'ROOFING - Cliente XYZ', 'INV-001', 'Cliente XYZ', 'draft',
    1500.00, 'jhayco', 3, datetime('now'), 'jhayco'
);

-- Obtener el ID generado
SELECT last_insert_rowid() as projectId;
```

### Agregar items a proyecto
```sql
INSERT INTO project_items (projectId, productId, productName, quantity, unitPrice)
VALUES (1, 1, 'ASPHALT SHINGLES', 5, 50.00);
```

### Crear historial de cambio
```sql
INSERT INTO project_history (
    projectId, timestamp, status, comment, user, action
) VALUES (
    1, datetime('now'), 'pending_approval', 
    'Project submitted for approval', 'jhayco', 'submit'
);
```

### Actualizar estado de proyecto
```sql
UPDATE projects
SET status = 'approved', 
    approvedById = 1, 
    approvedBy = 'admin',
    approvedAt = datetime('now')
WHERE id = 1;
```

### Crear contrato desde proyecto
```sql
INSERT INTO contracts (
    contractNumber, projectId, type, status, title, 
    totalAmount, createdBy, createdById
) VALUES (
    'CONT-001', 1, 'project', 'draft',
    'Acuerdo de Techo - Cliente XYZ', 1500.00,
    'admin', 1
);
```

---

## 🔐 VALIDACIONES IMPORTANTES

```sql
-- ✅ Un vendedor solo puede ver sus proyectos
WHERE createdById = [userId]

-- ✅ Solo admin puede aprobar proyectos
UPDATE projects SET status = 'approved' 
-- solo si usuario es admin/super_admin

-- ✅ No se puede crear incidente sin proyecto existente
-- (FK: projectId RESTRICT)

-- ✅ Tokens de firma expiran automáticamente
WHERE expiresAt < datetime('now')

-- ✅ Mensajes se eliminan en cascada si proyecto/incidente/contrato se borra
-- (FK: CASCADE)
```
