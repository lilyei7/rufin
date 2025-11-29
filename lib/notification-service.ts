// 🎯 NOTIFICATION SERVICE - SISTEMA DE NOTIFICACIONES AUTOMÁTICAS
// �� Fecha: 18 de noviembre de 2025
// ✅ Estado: SISTEMA COMPLETO DE NOTIFICACIONES

import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'public', 'data.json');

function readData() {
  const fileContents = fs.readFileSync(dataFilePath, 'utf8');
  return JSON.parse(fileContents);
}

function writeData(data: any) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

function getUserById(userId: number) {
  const data = readData();
  return data.users?.find((u: any) => u.id === userId);
}

function createNotification(notification: {
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  const fileData = readData();
  const notifications = fileData.notifications || [];

  const newNotification = {
    id: Math.max(...notifications.map((n: any) => n.id), 0) + 1,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data || {},
    isRead: false,
    createdAt: new Date().toISOString()
  };

  notifications.push(newNotification);
  writeData({ ...fileData, notifications });

  return newNotification;
}

export const NotificationService = {
  projectCreated: (project: any, createdByUserId: number) => {
    createNotification({
      userId: createdByUserId,
      type: 'project_created',
      title: 'Proyecto creado exitosamente',
      message: `Has creado el proyecto '${project.projectName}' para el cliente ${project.clientName}`,
      data: { projectId: project.id, clientName: project.clientName, projectName: project.projectName }
    });
  },

  projectPendingApproval: (project: any, submittedByUserId: number) => {
    const purchasingUsers = readData().users?.filter((u: any) => u.role === 'purchasing') || [];
    purchasingUsers.forEach((user: any) => {
      createNotification({
        userId: user.id,
        type: 'project_pending_approval',
        title: 'Proyecto pendiente de aprobación',
        message: `El proyecto '${project.projectName}' para ${project.clientName} está esperando tu aprobación`,
        data: { projectId: project.id, clientName: project.clientName, projectName: project.projectName, submittedBy: submittedByUserId }
      });
    });
  },

  projectApproved: (project: any, approvedByUserId: number) => {
    const projectCreator = getUserById(project.createdBy === 'admin' ? 1 : project.createdBy);
    if (projectCreator) {
      createNotification({
        userId: projectCreator.id,
        type: 'project_approved',
        title: 'Proyecto aprobado',
        message: `Tu proyecto '${project.projectName}' ha sido aprobado y está listo para asignación`,
        data: { projectId: project.id, approvedBy: approvedByUserId }
      });
    }
  },

  installerAssigned: (project: any, assignedByUserId: number) => {
    let installerId: number | null = null;
    if (project.assignedInstaller === 'Carlos Rodríguez') installerId = 4;
    else if (project.assignedInstaller === 'Miguel Sánchez') installerId = 5;
    else if (project.assignedInstaller === 'Laura Martínez') installerId = 6;
    else if (project.assignedInstaller === 'Sofia Herrera') installerId = 7;

    if (installerId) {
      const installer = getUserById(installerId);
      if (installer) {
        createNotification({
          userId: installer.id,
          type: 'installer_assigned',
          title: 'Proyecto asignado',
          message: `Te han asignado el proyecto '${project.projectName}' para el cliente ${project.clientName}`,
          data: { projectId: project.id, clientName: project.clientName, assignedBy: getUserById(assignedByUserId)?.name, scheduledDate: project.scheduledStart }
        });
      }
    }

    const projectCreator = getUserById(project.createdBy === 'admin' ? 1 : project.createdBy);
    if (projectCreator) {
      createNotification({
        userId: projectCreator.id,
        type: 'installer_assigned',
        title: 'Instalador asignado',
        message: `${project.assignedInstaller} ha sido asignado al proyecto '${project.projectName}'`,
        data: { projectId: project.id, installerName: project.assignedInstaller, scheduledDate: project.scheduledStart }
      });
    }
  },

  budgetRequest: (project: any) => {
    let installerId: number | null = null;
    if (project.assignedInstaller === 'Carlos Rodríguez') installerId = 4;
    else if (project.assignedInstaller === 'Miguel Sánchez') installerId = 5;
    else if (project.assignedInstaller === 'Laura Martínez') installerId = 6;
    else if (project.assignedInstaller === 'Sofia Herrera') installerId = 7;

    if (installerId) {
      const installer = getUserById(installerId);
      if (installer) {
        createNotification({
          userId: installer.id,
          type: 'budget_request',
          title: 'Solicitud de presupuesto',
          message: `Se solicita presupuesto para el proyecto '${project.projectName}' del cliente ${project.clientName}`,
          data: { projectId: project.id, clientName: project.clientName, projectName: project.projectName }
        });
      }
    }
  },

  budgetProposed: (project: any, installerUserId: number) => {
    const installer = getUserById(installerUserId);
    createNotification({
      userId: installerUserId,
      type: 'budget_proposed',
      title: 'Presupuesto propuesto',
      message: `Has propuesto un presupuesto de $${project.installerPriceProposal} para el proyecto '${project.projectName}'`,
      data: { projectId: project.id, proposedPrice: project.installerPriceProposal, comments: project.installerComments }
    });

    const adminUsers = readData().users?.filter((u: any) => u.role === 'admin') || [];
    adminUsers.forEach((user: any) => {
      createNotification({
        userId: user.id,
        type: 'budget_proposed',
        title: 'Presupuesto recibido',
        message: `${installer?.name} ha propuesto un presupuesto de $${project.installerPriceProposal} para el proyecto '${project.projectName}'`,
        data: { projectId: project.id, installerName: installer?.name, proposedPrice: project.installerPriceProposal }
      });
    });
  },

  budgetAccepted: (project: any) => {
    let installerId: number | null = null;
    if (project.assignedInstaller === 'Carlos Rodríguez') installerId = 4;
    else if (project.assignedInstaller === 'Miguel Sánchez') installerId = 5;
    else if (project.assignedInstaller === 'Laura Martínez') installerId = 6;
    else if (project.assignedInstaller === 'Sofia Herrera') installerId = 7;

    if (installerId) {
      const installer = getUserById(installerId);
      if (installer) {
        createNotification({
          userId: installer.id,
          type: 'budget_accepted',
          title: 'Presupuesto aceptado',
          message: `Tu presupuesto de $${project.installerPriceProposal} ha sido aceptado para el proyecto '${project.projectName}'`,
          data: { projectId: project.id, acceptedPrice: project.installerPriceProposal }
        });
      }
    }
  },

  budgetRejected: (project: any, reason: string) => {
    let installerId: number | null = null;
    if (project.assignedInstaller === 'Carlos Rodríguez') installerId = 4;
    else if (project.assignedInstaller === 'Miguel Sánchez') installerId = 5;
    else if (project.assignedInstaller === 'Laura Martínez') installerId = 6;
    else if (project.assignedInstaller === 'Sofia Herrera') installerId = 7;

    if (installerId) {
      const installer = getUserById(installerId);
      if (installer) {
        createNotification({
          userId: installer.id,
          type: 'budget_rejected',
          title: 'Presupuesto rechazado',
          message: `Tu presupuesto para el proyecto '${project.projectName}' ha sido rechazado. ${reason}`,
          data: { projectId: project.id, reason: reason }
        });
      }
    }
  },

  projectStarted: (project: any) => {
    let installerId: number | null = null;
    if (project.assignedInstaller === 'Carlos Rodríguez') installerId = 4;
    else if (project.assignedInstaller === 'Miguel Sánchez') installerId = 5;
    else if (project.assignedInstaller === 'Laura Martínez') installerId = 6;
    else if (project.assignedInstaller === 'Sofia Herrera') installerId = 7;

    if (installerId) {
      const installer = getUserById(installerId);
      if (installer) {
        createNotification({
          userId: installer.id,
          type: 'project_started',
          title: 'Proyecto iniciado',
          message: `El proyecto '${project.projectName}' ha sido iniciado`,
          data: { projectId: project.id, startDate: project.startedAt }
        });
      }
    }
  },

  projectCompleted: (project: any) => {
    let installerId: number | null = null;
    if (project.assignedInstaller === 'Carlos Rodríguez') installerId = 4;
    else if (project.assignedInstaller === 'Miguel Sánchez') installerId = 5;
    else if (project.assignedInstaller === 'Laura Martínez') installerId = 6;
    else if (project.assignedInstaller === 'Sofia Herrera') installerId = 7;

    if (installerId) {
      const installer = getUserById(installerId);
      if (installer) {
        createNotification({
          userId: installer.id,
          type: 'project_completed',
          title: 'Proyecto completado',
          message: `El proyecto '${project.projectName}' ha sido completado exitosamente`,
          data: { projectId: project.id, completionDate: project.completedAt }
        });
      }
    }
  },

  paymentApproved: (project: any, approvedByUserId: number) => {
    let installerId: number | null = null;
    if (project.assignedInstaller === 'Carlos Rodríguez') installerId = 4;
    else if (project.assignedInstaller === 'Miguel Sánchez') installerId = 5;
    else if (project.assignedInstaller === 'Laura Martínez') installerId = 6;
    else if (project.assignedInstaller === 'Sofia Herrera') installerId = 7;

    if (installerId) {
      const installer = getUserById(installerId);
      if (installer) {
        createNotification({
          userId: installer.id,
          type: 'payment_approved',
          title: 'Pago aprobado',
          message: `Tu pago de $${project.installerPayment} por el proyecto '${project.projectName}' ha sido aprobado`,
          data: { projectId: project.id, amount: project.installerPayment, approvedBy: approvedByUserId }
        });
      }
    }
  },

  createNotification: (notification: {
    userId: number;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) => {
    createNotification(notification);
  }
};
