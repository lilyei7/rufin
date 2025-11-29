# Sistema de Notificaciones y Modales

Este documento explica cómo usar el nuevo sistema de notificaciones estéticas y modales de confirmación en la aplicación Rufin.

## Notificaciones Toast

Las notificaciones toast son mensajes temporales que aparecen en la esquina superior derecha de la pantalla para informar al usuario sobre acciones realizadas.

### Tipos de notificaciones

- **success**: Para acciones exitosas (verde)
- **error**: Para errores (rojo)
- **warning**: Para advertencias (amarillo)
- **info**: Para información general (azul)

### Cómo usar

```tsx
import { useNotifications } from '../../../components/ui/notifications';

export default function MiComponente() {
  const { addNotification } = useNotifications();

  const handleAction = () => {
    // Acción exitosa
    addNotification({
      type: 'success',
      title: 'Acción completada',
      message: 'La acción se realizó correctamente'
    });

    // Error
    addNotification({
      type: 'error',
      title: 'Error',
      message: 'Ocurrió un error inesperado'
    });

    // Advertencia
    addNotification({
      type: 'warning',
      title: 'Atención',
      message: 'Revisa los datos antes de continuar'
    });
  };

  return (
    // Tu JSX aquí
  );
}
```

### Opciones disponibles

```tsx
addNotification({
  type: 'success',           // 'success' | 'error' | 'warning' | 'info'
  title: 'Título',          // Título de la notificación (requerido)
  message: 'Mensaje',       // Mensaje adicional (opcional)
  duration: 5000            // Duración en ms (opcional, default: 5000)
});
```

## Modal de Confirmación

El modal de confirmación se usa para pedir confirmación antes de realizar acciones destructivas como eliminar datos.

### Cómo usar

```tsx
import { useConfirmModal } from '../../../components/ui/confirm-modal';

export default function MiComponente() {
  const { confirm, ModalComponent } = useConfirmModal();

  const handleDelete = async (itemId: number) => {
    const confirmed = await confirm({
      title: 'Eliminar elemento',
      message: '¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButtonColor: 'red'
    });

    if (confirmed) {
      // Realizar la eliminación
      console.log('Elemento eliminado:', itemId);
    }
  };

  return (
    <div>
      <button onClick={() => handleDelete(123)}>
        Eliminar elemento
      </button>
      <ModalComponent />
    </div>
  );
}
```

### Opciones disponibles

```tsx
const confirmed = await confirm({
  title: 'Título del modal',              // Título (requerido)
  message: 'Mensaje de confirmación',     // Mensaje (requerido)
  confirmText: 'Texto del botón',         // Texto del botón de confirmar (opcional, default: 'Eliminar')
  cancelText: 'Texto del botón',          // Texto del botón de cancelar (opcional, default: 'Cancelar')
  confirmButtonColor: 'red'               // Color del botón: 'red' | 'blue' | 'green' (opcional, default: 'red')
});
```

## Integración Global

El `NotificationProvider` ya está integrado en el `layout.tsx` principal, por lo que todas las páginas tienen acceso automático a las notificaciones.

## Páginas Actualizadas

Las siguientes páginas ya han sido actualizadas para usar el nuevo sistema:

- **Productos** (`/dashboard/products`): Notificaciones para crear/editar/eliminar productos + modal de confirmación para eliminar
- **Usuarios** (`/dashboard/users`): Notificaciones para crear usuarios
- **Cotizaciones** (`/dashboard/quotes`): Notificaciones para crear cotizaciones y enviar emails
- **Propuestas de Precio** (`/dashboard/price-proposals`): Notificaciones para validaciones

## Mejoras Implementadas

1. **Notificaciones estéticas**: Diseño moderno con colores apropiados, iconos y animaciones
2. **Auto-cierre**: Las notificaciones se cierran automáticamente después de 5 segundos
3. **Modales de confirmación**: Interfaz clara y segura para acciones destructivas
4. **Accesibilidad**: Diseño responsive y navegación por teclado
5. **Consistencia**: Mismo estilo en toda la aplicación

## Próximos pasos

Para completar la migración, actualiza las páginas restantes que aún usan `alert()` nativo:

- Busca en el código: `alert(`
- Reemplaza con el sistema de notificaciones apropiado
- Para eliminaciones, usa el modal de confirmación

## Ejemplo Completo

```tsx
'use client';

import { useNotifications } from '../../../components/ui/notifications';
import { useConfirmModal } from '../../../components/ui/confirm-modal';

export default function EjemploCompleto() {
  const { addNotification } = useNotifications();
  const { confirm, ModalComponent } = useConfirmModal();

  const handleCreate = async () => {
    try {
      // Lógica para crear
      addNotification({
        type: 'success',
        title: 'Elemento creado',
        message: 'El elemento se creó correctamente'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear el elemento'
      });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar este elemento?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        // Lógica para eliminar
        addNotification({
          type: 'success',
          title: 'Elemento eliminado',
          message: 'El elemento se eliminó correctamente'
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo eliminar el elemento'
        });
      }
    }
  };

  return (
    <div>
      <button onClick={handleCreate}>Crear</button>
      <button onClick={() => handleDelete(1)}>Eliminar</button>
      <ModalComponent />
    </div>
  );
}
```