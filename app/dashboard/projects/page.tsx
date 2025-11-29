'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../../components/ui/notifications';
import { useConfirmModal } from '../../../components/ui/confirm-modal';
import { PriceDisputeModal } from '../../../components/ui/price-dispute-modal';
import {
  AlertTriangle,
  Plus,
  Eye,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  FileText,
  Users,
  Clock,
  Check,
  CalendarDays,
  ClipboardList,
  Edit,
  RefreshCw,
  History,
  ArrowRight,
  Package,
  X,
} from 'lucide-react';

interface Project {
  id: number;
  projectName: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  status: string;
  totalCost: number;
  startDate?: string;
  endDate?: string;
  scheduledStart?: string;
  createdBy: string;
  createdById?: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  lastModified?: string;
  lastModifiedBy?: string;
  notes?: string;
  description?: string;
  assignedInstaller?: string;
  installerPriceProposal?: number;
  installerPriceStatus?: string;
  installerStatus?: string;
  scheduledInstallation?: string;
  categoryId?: number;
  systemId?: number;
  history?: any[];
  items?: any[];
}

interface Incident {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: number;
  createdAt: string;
  incidentInvoiceNumber?: string;
}

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { confirm, ModalComponent } = useConfirmModal();
  const [projects, setProjects] = useState<Project[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterInstaller, setFilterInstaller] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [installers, setInstallers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState<{[key: number]: number}>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedInstaller, setSelectedInstaller] = useState('');
  const [installerPrice, setInstallerPrice] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [installationTime, setInstallationTime] = useState('');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showChangeHistory, setShowChangeHistory] = useState(false);
  const [projectChangeHistory, setProjectChangeHistory] = useState<any[]>([]);
  const [approving, setApproving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [sendingContract, setSendingContract] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [showPriceDispute, setShowPriceDispute] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Obtener información del usuario
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        setUser(decoded);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    fetchData();
  }, [router]);

  // Cargar usuarios cuando el user esté disponible
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchUsers();
    }
  }, [user]);

  // Manejar apertura automática de proyecto desde notificación
  useEffect(() => {
    if (projects.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('projectId');
      if (projectId) {
        const project = projects.find(p => p.id === parseInt(projectId));
        if (project) {
          setSelectedProject(project);
          setShowModal(true);
          loadPriceHistory(project.id);
          // Limpiar query params
          window.history.replaceState({}, document.title, '/dashboard/projects');
        }
      }
    }
  }, [projects]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Primero intentar obtener del nuevo endpoint de instaladores disponibles
      const installersRes = await fetch('/api/installers/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (installersRes.ok) {
        const installersData = await installersRes.json();
        const installersList = installersData.installers || [];
        console.log('✅ Instaladores disponibles cargados:', installersList);
        setInstallers(installersList);
      } else {
        // Fallback al endpoint antiguo
        const usersRes = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        const users = usersData.users || [];
        const installersList = users.filter((u: any) => u.role === 'installer');
        console.log('Instaladores cargados (fallback):', installersList);
        setInstallers(installersList);
      }
      
      // Obtener vendedores (igual que antes)
      const usersRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      const users = usersData.users || [];
      const vendorsList = users.filter((u: any) => u.role === 'vendor');
      console.log('Vendedores cargados:', vendorsList);
      setVendors(vendorsList);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar instaladores',
        duration: 3000
      });
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Cargar proyectos
      const projectsRes = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projectsData = await projectsRes.json();
      setProjects(projectsData.projects || []);

      // Cargar incidencias
      const incidentsRes = await fetch('/api/incidents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const incidentsData = await incidentsRes.json();
      setIncidents(incidentsData.incidents || []);

      // Cargar notificaciones
      const notificationsRes = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notificationsData = await notificationsRes.json();
      setNotifications(notificationsData.notifications || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-200 text-gray-900 border border-gray-400',
      pending_approval: 'bg-yellow-400 text-yellow-900 border border-yellow-600',
      pending: 'bg-orange-400 text-orange-900 border border-orange-600',
      approved: 'bg-green-500 text-white border border-green-600',
      assigned: 'bg-blue-500 text-white border border-blue-600',
      contract_sent: 'bg-indigo-500 text-white border border-indigo-600',
      in_progress: 'bg-blue-500 text-white border border-blue-600',
      completed: 'bg-purple-500 text-white border border-purple-600',
      rejected: 'bg-red-500 text-white border border-red-600'
    };
    return colors[status] || 'bg-gray-200 text-gray-900 border border-gray-400';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      draft: 'Borrador',
      pending_approval: 'Pendiente de Aprobación',
      pending: 'Pendiente',
      approved: 'Aprobado',
      assigned: 'Instalador Asignado',
      contract_sent: 'Contrato Enviado',
      in_progress: 'En Progreso',
      completed: 'Completado',
      rejected: 'Rechazado'
    };
    return texts[status] || status;
  };

  // Función para obtener etiquetas de progreso
  const getProgressBadges = (project: Project) => {
    const badges = [];
    if (project.status === 'approved' || ['approved', 'assigned', 'contract_sent', 'in_progress', 'completed'].includes(project.status)) {
      badges.push({ label: '✓ Aprobado', color: 'bg-green-100 text-green-800' });
    }
    if (project.assignedInstaller) {
      badges.push({ label: '✓ Instalador Asignado', color: 'bg-blue-100 text-blue-800' });
    }
    if (project.installerPriceStatus === 'accepted') {
      badges.push({ label: '✓ Precio Aceptado', color: 'bg-purple-100 text-purple-800' });
    }
    if (project.status === 'in_progress') {
      badges.push({ label: '⚡ En Progreso', color: 'bg-yellow-100 text-yellow-800' });
    }
    if (project.status === 'completed') {
      badges.push({ label: '✓ Completado', color: 'bg-green-100 text-green-800' });
    }
    return badges;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      critical: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const countIncidentsByProject = (projectId: number) => {
    return incidents.filter(inc => inc.projectId === projectId).length;
  };

  const getIncidentsForProject = (projectId: number) => {
    return incidents.filter(inc => inc.projectId === projectId);
  };

  // Función para obtener el nombre del instalador por ID
  const getInstallerName = (installerId: string) => {
    if (!installerId) return '';
    const installer = installers.find((i: any) => i.id.toString() === installerId);
    return installer?.name || '';
  };

  // Función para obtener proyectos del instalador en una fecha específica
  const getInstallerProjectsForDate = (installerId: string, dateStr: string) => {
    const installerName = getInstallerName(installerId);
    return projects.filter(project => {
      // Solo mostrar proyectos del vendedor actual
      if (project.createdBy !== user?.name) return false;
      
      // Solo proyectos asignados al instalador seleccionado
      if (project.assignedInstaller !== installerName) return false;
      
      // Solo proyectos con fecha de instalación programada
      if (!project.scheduledInstallation) return false;
      
      // Solo proyectos en la fecha especificada
      const projectDate = new Date(project.scheduledInstallation).toISOString().split('T')[0];
      return projectDate === dateStr;
    });
  };

  // Función para obtener el número de proyectos de un instalador en la semana actual
  const getInstallerProjectsForWeek = (installerId: string) => {
    const installerName = getInstallerName(installerId);
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return projects.filter(project => {
      if (project.createdBy !== user?.name) return false;
      if (project.assignedInstaller !== installerName) return false;
      if (!project.scheduledInstallation) return false;
      
      const projectDate = new Date(project.scheduledInstallation);
      return projectDate >= weekStart && projectDate <= weekEnd;
    }).length;
  };

  // Función para obtener el inicio de la semana actual
  const currentWeekStart = (() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (currentWeek * 7)); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  })();

  // Función para obtener el número de semana
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    // Filtro por estado
    if (filterStatus) {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    // Filtro por fecha
    if (filterDate) {
      const now = new Date();
      let startDate: Date;

      switch (filterDate) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        default:
          startDate = new Date(0); // Todos
      }

      if (filterDate !== '') {
        filtered = filtered.filter(project => new Date(project.createdAt) >= startDate);
      }
    }

    // Filtro por instalador
    if (filterInstaller) {
      filtered = filtered.filter(project => project.assignedInstaller === filterInstaller);
    }

    // Filtro por vendedor
    if (filterVendor) {
      filtered = filtered.filter(project => project.createdBy === filterVendor);
    }

    return filtered;
  };

  const loadPriceHistory = async (projectId: number) => {
    setLoadingPriceHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Obtener el historial y filtrar solo cambios de precio
        const history = data.history || [];
        const priceChanges = history.filter((h: any) => 
          h.action === 'price_suggested' || 
          h.action === 'price_accepted' || 
          h.status?.includes('price') ||
          h.comment?.toLowerCase().includes('precio')
        );
        setPriceHistory(priceChanges);
      }
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const handleApproveProject = async (projectId: number) => {
    const confirmed = await confirm({
      title: 'Aprobar Proyecto',
      message: '¿Estás seguro de que quieres aprobar este proyecto? Esto permitirá asignar un instalador.',
      confirmText: 'Aprobar',
      cancelText: 'Cancelar',
      confirmButtonColor: 'green'
    });

    if (!confirmed) {
      return;
    }

    setApproving(true);
    try {
      const response = await fetch(`/api/projects`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: projectId,
          status: 'approved',
          comment: 'Proyecto aprobado por administrador'
        }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Proyecto Aprobado',
          message: 'El proyecto ha sido aprobado exitosamente y está listo para asignar instalador.',
          duration: 5000
        });
        // Refresh projects
        fetchData();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo aprobar el proyecto. Intenta de nuevo.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al aprobar el proyecto',
        duration: 5000
      });
    } finally {
      setApproving(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    // Inicializar las cantidades editadas con los valores actuales
    const initialQuantities: {[key: number]: number} = {};
    (project.items || []).forEach((item, index) => {
      initialQuantities[index] = item.quantity;
    });
    setEditedQuantities(initialQuantities);
    setShowEditModal(true);
  };

  const handleSaveEditedProject = async (project: Project) => {
    try {
      // Crear items actualizados con las nuevas cantidades
      const updatedItems = (project.items || []).map((item, index) => ({
        ...item,
        quantity: editedQuantities[index] || item.quantity,
        total: (editedQuantities[index] || item.quantity) * item.unitPrice
      }));

      const newTotalCost = updatedItems.reduce((sum, item) => sum + item.total, 0);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: updatedItems,
          totalCost: newTotalCost
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Cambios Guardados',
          message: 'Las cantidades del proyecto han sido actualizadas exitosamente.',
          duration: 4000
        });
        setShowEditModal(false);
        setEditedQuantities({});
        fetchData(); // Recargar los proyectos
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Error',
          message: `No se pudieron guardar los cambios: ${error.error}`,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error saving edited project:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al guardar los cambios.',
        duration: 5000
      });
    }
  };

  const handleShowChangeHistory = (project: Project) => {
    // Obtener historial de cambios desde las notificaciones
    const projectNotifications = notifications.filter(
      notif => notif.type === 'project_quantity_changed' && 
               notif.data && 
               JSON.parse(notif.data).projectId === project.id
    );

    const changes = projectNotifications.map(notif => {
      const data = JSON.parse(notif.data);
      return {
        date: new Date(data.editedAt),
        vendor: data.vendorName,
        message: notif.message,
        changes: data.quantityChanges,
        oldTotal: data.oldTotalCost,
        newTotal: data.newTotalCost
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Ordenar de más reciente a más viejo

    setProjectChangeHistory(changes);
    setSelectedProject(project);
    setShowChangeHistory(true);
  };

  const handleDeleteProject = async (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: '🗑️ Proyecto Eliminado',
          message: `El proyecto "${projectToDelete.projectName}" ha sido eliminado exitosamente.`,
          duration: 4000
        });
        
        setShowDeleteConfirmModal(false);
        setProjectToDelete(null);
        setShowModal(false);
        setSelectedProject(null);
        
        // Recargar los datos
        fetchData();
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Error',
          message: `No se pudo eliminar el proyecto: ${error.error}`,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      addNotification({
        type: 'error',
        title: 'Error de Conexión',
        message: 'Error al eliminar el proyecto. Intenta de nuevo.',
        duration: 5000
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSendContract = async (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const confirmed = await confirm({
      title: 'Enviar Contrato',
      message: `¿Enviar contrato para el proyecto "${project.projectName}"? Esto creará un contrato y lo enviará al cliente para firma.`,
      confirmText: 'Enviar Contrato',
      cancelText: 'Cancelar',
      confirmButtonColor: 'blue'
    });

    if (!confirmed) {
      return;
    }

    setSendingContract(true);
    try {
      // Crear contrato directamente
      const contractData = {
        type: 'service_contract',
        title: `Contrato de Servicios - ${project.projectName}`,
        description: `Contrato de instalación para el proyecto ${project.projectName} con ${project.assignedInstaller || 'Instalador asignado'}. 

POLÍTICAS DE COSTOS EXTRAS:
• Costos por materiales adicionales no incluidos en el presupuesto inicial
• Costos por cambios en el alcance del proyecto
• Costos por retrasos causados por el cliente
• Costos por permisos y autorizaciones adicionales
• Todos los costos extras requieren aprobación previa por escrito

TÉRMINOS Y CONDICIONES:
• El cliente acepta los términos del contrato al firmarlo
• Los trabajos comenzarán según el cronograma acordado
• Cualquier cambio debe ser aprobado por ambas partes
• Los pagos se realizarán según el calendario establecido`,
        amount: project.installerPriceProposal || project.totalCost,
        currency: 'USD',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clientId: project.createdBy, // Asumiendo que createdBy es el ID del cliente
        vendorId: project.createdBy,
        installerId: project.assignedInstaller,
        projectId: project.id
      };

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (response.ok) {
        // Actualizar el estado del proyecto a 'contract_sent'
        await fetch(`/api/projects`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: projectId,
            status: 'contract_sent',
            comment: 'Contrato enviado al cliente para firma'
          }),
        });

        fetchData();
        alert('Contrato enviado exitosamente al cliente');
      } else {
        alert('Error al enviar el contrato');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar el contrato');
    } finally {
      setSendingContract(false);
    }
  };

  const handleAssignInstaller = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      // Establecer valores por defecto
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setInstallationDate(tomorrow.toISOString().split('T')[0]);
      setInstallationTime('09:00');
      setSelectedInstaller('');
      setInstallerPrice('');
      setCurrentWeek(0); // Resetear a la semana actual
      // Recargar instaladores cuando se abre el modal
      fetchUsers();
      setShowAssignModal(true);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedProject || !selectedInstaller || !installationDate || !installationTime) return;

    setAssigning(true);
    try {
      // Obtener el nombre del instalador seleccionado
      const selectedInstallerObj = installers.find((i: any) => i.id.toString() === selectedInstaller);
      if (!selectedInstallerObj) {
        setAssigning(false);
        return;
      }

      const response = await fetch(`/api/projects`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: selectedProject.id,
          assignedInstaller: selectedInstallerObj.name,
          installerPriceProposal: parseFloat(installerPrice) || 0,
          scheduledInstallation: installationDate && installationTime ? `${installationDate}T${installationTime}:00` : null,
          status: 'assigned',
          comment: `Instalador asignado: ${selectedInstallerObj.name}${installationDate && installationTime ? ` - Instalación programada: ${installationDate} ${installationTime}` : ''}`
        }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Instalador Asignado',
          message: `${selectedInstallerObj.name} ha sido asignado al proyecto "${selectedProject.projectName}".`,
          duration: 5000
        });
        fetchData();
        setShowAssignModal(false);
        setSelectedInstaller('');
        setInstallerPrice('');
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo asignar el instalador. Intenta de nuevo.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al asignar instalador',
        duration: 5000
      });
    } finally {
      setAssigning(false);
    }
  };

  const filteredProjects = getFilteredProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
            <p className="text-gray-600 mt-1">Gestiona tus proyectos e incidencias</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/projects/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition flex items-center gap-2"
            >
              <Plus size={20} /> Nuevo Proyecto
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-3 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="pending_approval">Pendiente de Aprobación</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="rejected">Rechazado</option>
          </select>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
          </select>

          {/* Filtros adicionales solo para admin */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <>
              <select
                value={filterInstaller}
                onChange={(e) => setFilterInstaller(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los instaladores</option>
                {installers.map((installer) => (
                  <option key={installer.id} value={installer.name}>
                    {installer.name}
                  </option>
                ))}
              </select>

              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los vendedores</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.name}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="text-sm text-gray-600 ml-4">
            Mostrando {filteredProjects.length} de {projects.length} proyectos
          </div>
          <Link
            href="/dashboard/incidents"
            className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition"
          >
            Ver todas las Incidencias
          </Link>
        </div>

        {/* Lista de proyectos */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">
              {filterStatus || filterDate || filterInstaller || filterVendor ? 'No hay proyectos que coincidan con los filtros seleccionados' : 'No hay proyectos disponibles'}
            </p>
            {(filterStatus || filterDate || filterInstaller || filterVendor) && (
              <button
                onClick={() => {
                  setFilterStatus('');
                  setFilterDate('');
                  setFilterInstaller('');
                  setFilterVendor('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map(project => {
              const projectIncidents = getIncidentsForProject(project.id);

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-500"
                >
                  <div className="p-6">
                    {/* Encabezado del proyecto con fecha en esquina */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{project.projectName}</h3>
                          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {project.invoiceNumber}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{project.clientName}</span></p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {/* Fecha de creación prominente en esquina */}
                        <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                          <p className="text-xs text-blue-700 font-medium">Creado</p>
                          <p className="text-sm font-bold text-blue-900">
                            {new Date(project.createdAt).toLocaleDateString('es-MX')}
                          </p>
                          <p className="text-xs text-blue-600">
                            {new Date(project.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </div>
                    </div>

                    {/* Etiquetas de progreso */}
                    <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                      {getProgressBadges(project).map((badge, idx) => (
                        <span key={idx} className={`text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      ))}
                    </div>

                    {/* Información del proyecto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-xs text-gray-600">Costo Total</p>
                        <p className="text-lg font-semibold text-green-600">${project.totalCost.toFixed(2)}</p>
                      </div>
                      {project.endDate && (
                        <div>
                          <p className="text-xs text-gray-600">Fecha Fin</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(project.endDate).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600">Creado por</p>
                        <p className="text-sm font-medium text-gray-900">{project.createdBy}</p>
                      </div>
                    </div>



                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowModal(true);
                          // Cargar historial de precio si hay instalador asignado
                          if (project.assignedInstaller) {
                            loadPriceHistory(project.id);
                          }
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Eye size={18} /> Ver Detalles
                      </button>

                      {/* Botón de edición para vendedores (solo proyectos pendientes de aprobación creados por ellos) */}
                      {project.status === 'pending_approval' && user?.role === 'vendor' && (() => {
                        const normalizeName = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        return normalizeName(project.createdBy || '') === normalizeName(user.name);
                      })() && (
                        <button
                          onClick={() => handleEditProject(project)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Edit size={18} /> Editar Cantidades
                        </button>
                      )}

                      {/* Botones de aprobación para admin */}
                      {(project.status === 'draft' || project.status === 'pending_approval' || project.status === 'pending') && user?.role === 'admin' && (
                        <button
                          onClick={() => handleApproveProject(project.id)}
                          disabled={approving}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} /> {approving ? 'Aprobando...' : 'Aprobar Proyecto'}
                        </button>
                      )}

                      {/* Botón para asignar instalador (solo para proyectos aprobados) */}
                      {project.status === 'approved' && !project.assignedInstaller && (
                        <button
                          onClick={() => handleAssignInstaller(project.id)}
                          disabled={assigning}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <User size={18} /> {assigning ? 'Asignando...' : 'Asignar Instalador'}
                        </button>
                      )}

                      {/* Botón para enviar contrato (solo para proyectos con instalador asignado) */}
                      {project.status === 'assigned' && project.assignedInstaller && (
                        <button
                          onClick={() => handleSendContract(project.id)}
                          disabled={sendingContract}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <FileText size={18} /> {sendingContract ? 'Enviando...' : 'Enviar Contrato'}
                        </button>
                      )}

                      <Link
                        href={`/dashboard/incidents/new?projectId=${project.id}`}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Nueva Incidencia
                      </Link>
                      <Link
                        href={`/dashboard/incidents?projectId=${project.id}`}
                        className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={18} /> Ver Incidencias
                      </Link>
                      
                      <button
                        onClick={() => handleShowChangeHistory(project)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} /> Ver Cambios
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.projectName}</h2>
                  <p className="text-gray-600">{selectedProject.invoiceNumber}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  x
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Cliente</p>
                  <p className="text-sm font-medium text-gray-900">{selectedProject.clientName}</p>
                  <p className="text-xs text-gray-500">{selectedProject.clientEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Estado</p>
                  <p className={`text-sm font-medium px-3 py-1 rounded-full w-fit ${getStatusColor(selectedProject.status)}`}>
                    {getStatusText(selectedProject.status)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Creado por</p>
                  <p className="text-sm font-medium text-gray-900">{selectedProject.createdBy}</p>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Fecha de Creación</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedProject.createdAt).toLocaleDateString('es-MX')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedProject.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {selectedProject.scheduledStart && (
                  <div>
                    <p className="text-xs text-gray-600">Fecha Programada</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedProject.scheduledStart).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
                {selectedProject.endDate && (
                  <div>
                    <p className="text-xs text-gray-600">Fecha de Fin</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedProject.endDate).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
              </div>

              {/* Materiales del proyecto */}
              {selectedProject.items && selectedProject.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Materiales del Proyecto</h3>
                  <div className="space-y-3">
                    {selectedProject.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.productName || `Producto ID: ${item.productId}`}
                          </p>
                          <p className="text-xs text-gray-600">
                            Cantidad: {item.quantity} unidades
                          </p>
                        </div>
                        {/* Mostrar precios solo si NO es vendedor */}
                        {user?.role !== 'vendor' && (
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              ${item.unitPrice.toFixed(2)} c/u
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Mostrar total solo si NO es vendedor */}
                  {user?.role !== 'vendor' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-semibold text-gray-900">Total del Proyecto:</p>
                        <p className="text-2xl font-bold text-green-600">${selectedProject.totalCost.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Información adicional */}
              {selectedProject.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                  <p className="text-sm text-gray-700">{selectedProject.description}</p>
                </div>
              )}

              {/* Instalador asignado */}
              {selectedProject.assignedInstaller && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Instalador Asignado</h3>
                  <p className="text-sm text-gray-700">{selectedProject.assignedInstaller}</p>
                  {selectedProject.installerPriceProposal && (
                    <p className="text-sm text-green-600 font-medium">
                      Pago acordado: ${selectedProject.installerPriceProposal.toFixed(2)}
                    </p>
                  )}
                  {selectedProject.scheduledInstallation && (
                    <p className="text-sm text-blue-600">
                      Instalación programada: {new Date(selectedProject.scheduledInstallation).toLocaleDateString('es-MX')} a las {new Date(selectedProject.scheduledInstallation).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {selectedProject.installerStatus && (
                    <p className="text-xs text-gray-600">Estado: {selectedProject.installerStatus}</p>
                  )}
                  {selectedProject.installerPriceStatus && (
                    <p className={`text-xs font-medium px-2 py-1 rounded-full w-fit mt-2 ${
                      selectedProject.installerPriceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                      selectedProject.installerPriceStatus === 'suggested' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      Estado del precio: {selectedProject.installerPriceStatus === 'accepted' ? '✓ Aceptado' : selectedProject.installerPriceStatus === 'suggested' ? '💡 Sugerencia pendiente' : '⏳ Pendiente'}
                    </p>
                  )}
                </div>
              )}

              {/* 💬 Historial de Negociación de Precios - SOLO PARA VENDEDORES */}
              {selectedProject.assignedInstaller && user?.role === 'vendor' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      💬 Negociación de Precio de Instalación
                    </h3>
                    {loadingPriceHistory && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  
                  {priceHistory && priceHistory.length > 0 ? (
                    <div className="space-y-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      {priceHistory.map((entry, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              entry.action === 'price_accepted' || entry.status?.includes('accepted') ? 'bg-green-100 text-green-800' :
                              entry.action === 'price_suggested' || entry.status?.includes('suggested') ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.action === 'price_accepted' || entry.status?.includes('accepted') ? '✓ ACEPTADO' :
                               entry.action === 'price_suggested' || entry.status?.includes('suggested') ? '💡 SUGERENCIA' :
                               'CAMBIO'}
                            </span>
                            <span className="text-xs text-gray-600">
                              {new Date(entry.timestamp || entry.createdAt).toLocaleDateString('es-MX')} {new Date(entry.timestamp || entry.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium mb-1">{entry.comment}</p>
                          <p className="text-xs text-gray-600">Por: {entry.user}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">Sin historial de negociación de precios</p>
                    </div>
                  )}
                </div>
              )}

              {/* Historial */}
              {selectedProject.history && selectedProject.history.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial del Proyecto</h3>
                  <div className="space-y-2">
                    {selectedProject.history.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.comment}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(entry.timestamp).toLocaleDateString('es-MX')} {new Date(entry.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {/* Botones de aprobación para admin */}
                {(selectedProject.status === 'draft' || selectedProject.status === 'pending_approval' || selectedProject.status === 'pending') && user?.role === 'admin' && (
                  <button
                    onClick={() => handleApproveProject(selectedProject.id)}
                    className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} /> Aprobar Proyecto
                  </button>
                )}

                {/* Botón para asignar instalador (solo para proyectos aprobados) */}
                {selectedProject.status === 'approved' && !selectedProject.assignedInstaller && (
                  <button
                    onClick={() => handleAssignInstaller(selectedProject.id)}
                    className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <User size={18} /> Asignar Instalador
                  </button>
                )}

                {/* Botón para enviar contrato (solo para proyectos con instalador asignado) */}
                {selectedProject.status === 'assigned' && selectedProject.assignedInstaller && (
                  <button
                    onClick={() => handleSendContract(selectedProject.id)}
                    className="flex-1 min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FileText size={18} /> Enviar Contrato
                  </button>
                )}

                {/* Botón para ver/gestionar disputa de precio */}
                {selectedProject.assignedInstaller && selectedProject.installerPriceStatus && (
                  <button
                    onClick={() => setShowPriceDispute(true)}
                    className="flex-1 min-w-[200px] bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <DollarSign size={18} /> Disputa de Precio
                  </button>
                )}

                <Link
                  href={`/dashboard/incidents/new?projectId=${selectedProject.id}`}
                  className="flex-1 min-w-[200px] bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Nueva Incidencia
                </Link>
                <Link
                  href={`/dashboard/incidents?projectId=${selectedProject.id}`}
                  className="flex-1 min-w-[200px] bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={18} /> Ver Incidencias
                </Link>

                {/* Botón para eliminar proyecto - Visible para admin/super_admin en cualquier estado eliminable */}
                {(user?.role === 'admin' || user?.role === 'super_admin' || user?.id === selectedProject.createdById) && 
                 (selectedProject.status === 'draft' || 
                  selectedProject.status === 'pending_approval' || 
                  selectedProject.status === 'pending' || 
                  selectedProject.status === 'approved' || 
                  selectedProject.status === 'assigned') && (
                  <button
                    onClick={() => handleDeleteProject(selectedProject)}
                    className="flex-1 min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Eliminar Proyecto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de calendario completo */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="w-8 h-8 text-blue-600" />
                    Calendario de Instaladores
                  </h2>
                  <p className="text-gray-600 text-lg mt-1">{selectedProject.projectName}</p>
                  <p className="text-gray-500 text-sm">Selecciona instalador, fecha y hora disponibles</p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedInstaller('');
                    setInstallerPrice('');
                    setInstallationDate('');
                    setInstallationTime('');
                    setCurrentWeek(0);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex h-[80vh]">
              {/* Panel izquierdo - Lista de instaladores */}
              <div className="w-1/4 p-6 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Instaladores Disponibles
                </h3>
                <div className="space-y-3">
                    {installers.length > 0 ? (
                    installers.map((installer: any) => {
                      const isSelected = selectedInstaller === installer.id.toString();
                      const todayProjects = getInstallerProjectsForDate(installer.id.toString(), new Date().toISOString().split('T')[0]);
                      const weekProjects = getInstallerProjectsForWeek(installer.id.toString());                      // Colores aleatorios para cada instalador
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-yellow-500'];
                      const color = colors[installer.id % colors.length];
                      
                      return (
                        <div
                          key={installer.id}
                          onClick={() => setSelectedInstaller(installer.id.toString())}
                          className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 shadow-md' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {installer.name}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600">{installer.role}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-sm text-gray-700 ml-1">4.5</span>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded border">
                              <div className="text-gray-600">Hoy</div>
                              <div className={`font-semibold ${todayProjects.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {todayProjects.length} proyecto{todayProjects.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <div className="text-gray-600">Esta semana</div>
                              <div className={`font-semibold ${weekProjects > 2 ? 'text-red-600' : weekProjects > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {weekProjects} proyecto{weekProjects !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No hay instaladores disponibles. Crea usuarios con rol "installer".
                    </div>
                  )}
                </div>
              </div>

              {/* Panel central - Calendario semanal estilo Google Calendar */}
              <div className="flex-1 p-6 overflow-hidden">
                {selectedInstaller ? (
                  <div className="h-full flex flex-col">
                    {/* Header con navegación */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          Semana {getWeekNumber(currentWeekStart)} - {getInstallerName(selectedInstaller)}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          getInstallerProjectsForWeek(selectedInstaller) === 0 ? 'bg-green-100 text-green-800' :
                          getInstallerProjectsForWeek(selectedInstaller) <= 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getInstallerProjectsForWeek(selectedInstaller)} proyectos esta semana
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentWeek(currentWeek - 1)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          ← Semana anterior
                        </button>
                        <button
                          onClick={() => setCurrentWeek(0)}
                          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium"
                        >
                          Hoy
                        </button>
                        <button
                          onClick={() => setCurrentWeek(currentWeek + 1)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          Semana siguiente →
                        </button>
                      </div>
                    </div>

                    {/* Calendario semanal estilo Google Calendar */}
                    <div className="flex-1 overflow-auto">
                      <div className="grid grid-cols-8 gap-1 min-h-full">
                        {/* Columna de horas */}
                        <div className="pr-2">
                          <div className="h-16 border-b border-gray-200"></div> {/* Espacio para header */}
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = 8 + i; // De 8:00 a 19:00
                            return (
                              <div key={hour} className="h-16 border-b border-gray-100 flex items-start pt-1">
                                <span className="text-sm text-gray-600 font-medium">
                                  {hour.toString().padStart(2, '0')}:00
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Columnas de días */}
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const date = new Date(currentWeekStart);
                          date.setDate(date.getDate() + dayIndex);
                          const dateStr = date.toISOString().split('T')[0];
                          const isToday = dateStr === new Date().toISOString().split('T')[0];
                          const isPast = date < new Date(new Date().setHours(0,0,0,0));
                          const dayProjects = getInstallerProjectsForDate(selectedInstaller, dateStr);

                          return (
                            <div key={dayIndex} className="border-l border-gray-200">
                              {/* Header del día */}
                              <div className={`h-16 border-b border-gray-200 p-2 text-center ${
                                isToday ? 'bg-blue-50' : 'bg-gray-50'
                              }`}>
                                <div className={`text-sm font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                  {date.getDate()}
                                </div>
                                {dayProjects.length > 0 && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    {dayProjects.length} proyecto{dayProjects.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>

                              {/* Slots horarios */}
                              {Array.from({ length: 12 }, (_, hourIndex) => {
                                const hour = 8 + hourIndex;
                                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                                const isSelected = installationDate === dateStr && installationTime === timeSlot;
                                
                                // Verificar si hay un proyecto en este slot
                                const projectInSlot = dayProjects.find(project => {
                                  if (!project.scheduledInstallation) return false;
                                  const projectTime = new Date(project.scheduledInstallation).toTimeString().slice(0, 5);
                                  return projectTime === timeSlot;
                                });

                                return (
                                  <div
                                    key={hourIndex}
                                    onClick={() => {
                                      if (!isPast && !projectInSlot) {
                                        setInstallationDate(dateStr);
                                        setInstallationTime(timeSlot);
                                      }
                                    }}
                                    className={`h-16 border-b border-gray-100 cursor-pointer transition-all relative ${
                                      isPast
                                        ? 'bg-gray-50 cursor-not-allowed'
                                        : projectInSlot
                                        ? 'bg-red-100 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-blue-200 border-blue-400'
                                        : 'hover:bg-blue-50'
                                    }`}
                                  >
                                    {projectInSlot && (
                                      <div className="absolute inset-1 bg-red-500 text-white text-xs p-1 rounded overflow-hidden">
                                        <div className="font-medium truncate">{projectInSlot.projectName}</div>
                                        <div className="text-xs opacity-90">{projectInSlot.clientName}</div>
                                      </div>
                                    )}
                                    
                                    {isSelected && !projectInSlot && (
                                      <div className="absolute inset-1 bg-blue-500 text-white text-xs p-1 rounded flex items-center justify-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span className="font-medium">Seleccionado</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
                        <span>Seleccionado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                        <span>Ocupado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 rounded"></div>
                        <span>No disponible</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-medium text-gray-900 mb-2">Selecciona un instalador</h3>
                      <p className="text-gray-600 text-lg">Elige un instalador para ver su calendario semanal</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel derecho - Detalles y confirmación */}
              <div className="w-1/4 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Detalles de la Asignación
                </h3>
                
                {selectedInstaller && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-2">Instalador Seleccionado</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          [
                            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
                            'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-yellow-500'
                          ][[
                            'Carlos Rodríguez', 'Miguel Sánchez', 'Laura Martínez', 'Sofia Herrera',
                            'Pedro Ramírez', 'Diego Torres', 'Fernando Morales', 'María González', 'José Antonio Díaz'
                          ].indexOf(selectedInstaller)]
                        }`}></div>
                        <p className="text-gray-700">{selectedInstaller}</p>
                      </div>
                    </div>

                    {installationDate && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-2">Fecha Programada</h4>
                        <p className="text-gray-700">
                          {new Date(installationDate).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {installationTime && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-2">Hora Programada</h4>
                        <p className="text-gray-700">{installationTime} horas</p>
                      </div>
                    )}

                    <div className="bg-white p-4 rounded-lg border">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Precio Propuesto al Instalador ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={installerPrice || ''}
                        onChange={(e) => setInstallerPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Proyecto</h4>
                      <p className="text-blue-800 text-sm">{selectedProject.projectName}</p>
                      <p className="text-blue-700 text-sm">Cliente: {selectedProject.clientName}</p>
                      <p className="text-blue-700 text-sm">Costo Total: ${selectedProject.totalCost.toLocaleString()}</p>
                    </div>

                    <button
                      onClick={handleAssignSubmit}
                      disabled={!selectedInstaller || !installationDate || !installationTime || assigning}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {assigning ? 'Asignando...' : 'Confirmar Asignación'}
                    </button>
                  </div>
                )}

                {!selectedInstaller && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Completa la selección</h4>
                    <p className="text-gray-600">Selecciona instalador, fecha y hora para continuar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición para vendedores */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Editar Cantidades</h2>
                  <p className="text-gray-600">{selectedProject.projectName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditedQuantities({});
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {selectedProject.items && selectedProject.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.productName || `Producto ID: ${item.productId}`}
                      </p>
                      {user?.role === 'admin' && (
                        <p className="text-xs text-gray-600">
                          Precio unitario: ${item.unitPrice}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        value={editedQuantities[index] || item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          setEditedQuantities(prev => ({
                            ...prev,
                            [index]: newQuantity
                          }));
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-gray-900 font-semibold"
                      />
                      <span className="text-sm text-gray-600">unidades</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditedQuantities({});
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveEditedProject(selectedProject)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial de Cambios */}
      {showChangeHistory && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-[#121313] to-[#2a2a2a]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="w-6 h-6 text-[#EAB839]" />
                    <h2 className="text-2xl font-bold text-white">Historial de Cambios</h2>
                  </div>
                  <p className="text-gray-300 mt-2">Proyecto: <span className="font-bold text-[#EAB839]">{selectedProject.invoiceNumber}</span></p>
                </div>
                <button
                  onClick={() => {
                    setShowChangeHistory(false);
                    setProjectChangeHistory([]);
                  }}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {projectChangeHistory.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No hay cambios registrados para este proyecto</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {projectChangeHistory.map((change, index) => (
                    <div key={index} className="bg-gray-50 border-l-4 border-[#EAB839] p-5 rounded-lg">
                      {/* Header de cambio */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-[#121313]" />
                            <p className="font-bold text-[#121313]">{change.vendor}</p>
                            <span className="inline-block bg-[#EAB839] text-[#121313] px-3 py-1 rounded-full text-xs font-bold ml-2">
                              Cambio #{index + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {new Date(change.date).toLocaleDateString('es-MX')} - {new Date(change.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Cambios por producto */}
                      {change.changes && change.changes.length > 0 && (
                        <div className="mb-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#121313]" />
                            <p className="font-semibold text-[#121313] text-sm">Cambios en cantidades</p>
                          </div>
                          {change.changes.map((productChange: any, pIndex: number) => (
                            <div key={pIndex} className="ml-6 bg-white p-4 rounded border border-gray-200 space-y-3">
                              <p className="font-bold text-[#121313] text-base">{productChange.productName || `Producto ${productChange.productId}`}</p>
                              
                              {/* Cantidad - Visible para todos */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-red-50 rounded border border-red-200">
                                  <p className="text-xs text-red-700 font-semibold mb-1">Cantidad Anterior</p>
                                  <p className="text-lg font-bold text-red-700">{productChange.oldQuantity}</p>
                                  <p className="text-xs text-red-600">unidades</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded border border-green-200">
                                  <p className="text-xs text-green-700 font-semibold mb-1">Cantidad Nueva</p>
                                  <p className="text-lg font-bold text-green-700">{productChange.newQuantity}</p>
                                  <p className="text-xs text-green-600">unidades</p>
                                </div>
                              </div>

                              {/* Precio Unitario - Solo si NO es vendedor */}
                              {user?.role !== 'vendor' && (
                                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs text-blue-700 font-semibold mb-1">Precio Unitario</p>
                                  <p className="text-lg font-bold text-blue-700">${productChange.unitPrice.toFixed(2)}</p>
                                </div>
                              )}

                              {/* Totales - Solo si NO es vendedor */}
                              {user?.role !== 'vendor' && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-red-50 rounded border border-red-200">
                                      <p className="text-xs text-red-700 font-semibold mb-1">Total Anterior</p>
                                      <p className="text-lg font-bold text-red-700 line-through">${productChange.oldTotal.toFixed(2)}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded border border-green-200">
                                      <p className="text-xs text-green-700 font-semibold mb-1">Total Nuevo</p>
                                      <p className="text-lg font-bold text-green-700">${productChange.newTotal.toFixed(2)}</p>
                                    </div>
                                  </div>

                                  {/* Diferencia */}
                                  <div className={`p-3 rounded border ${(productChange.newTotal - productChange.oldTotal) >= 0 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                                    <p className={`text-xs font-semibold mb-1 ${(productChange.newTotal - productChange.oldTotal) >= 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                                      Diferencia
                                    </p>
                                    <p className={`text-lg font-bold ${(productChange.newTotal - productChange.oldTotal) >= 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                                      {(productChange.newTotal - productChange.oldTotal) >= 0 ? '+' : ''} ${(productChange.newTotal - productChange.oldTotal).toFixed(2)}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Resumen de costo total - Solo si NO es vendedor */}
                      {user?.role !== 'vendor' && (
                        <div className="p-4 bg-gradient-to-r from-[#121313] to-[#2a2a2a] rounded-lg border border-[#EAB839]">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-[#EAB839]" />
                              <p className="font-bold text-white">Costo Total del Proyecto</p>
                            </div>
                            <div className="text-right">
                              <p className="line-through text-red-400 font-semibold text-sm">${change.oldTotal.toFixed(2)}</p>
                              <p className="text-[#EAB839] font-bold text-lg">${change.newTotal.toFixed(2)}</p>
                              <p className={`text-xs font-bold mt-1 ${(change.newTotal - change.oldTotal) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {(change.newTotal - change.oldTotal) >= 0 ? '+' : ''} ${(change.newTotal - change.oldTotal).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowChangeHistory(false);
                    setProjectChangeHistory([]);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirmModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <h2 className="text-2xl font-bold text-red-600">Eliminar Proyecto</h2>
                  <p className="text-sm text-red-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2"><strong>Proyecto:</strong></p>
                <p className="font-bold text-gray-900">{projectToDelete.projectName}</p>
                <p className="text-sm text-gray-600">{projectToDelete.invoiceNumber}</p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Advertencia:</strong> Al eliminar este proyecto, se eliminarán todos los datos asociados incluyendo items, historial y notificaciones. 
                </p>
              </div>

              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas eliminar este proyecto? Escribe el número de factura <strong>{projectToDelete.invoiceNumber}</strong> para confirmar.
              </p>

              <input
                type="text"
                placeholder={projectToDelete.invoiceNumber}
                id="deleteConfirmInput"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 font-semibold"
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setProjectToDelete(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('deleteConfirmInput') as HTMLInputElement;
                  if (input.value === projectToDelete.invoiceNumber) {
                    confirmDeleteProject();
                  } else {
                    addNotification({
                      type: 'error',
                      title: 'Error',
                      message: 'El número de factura no coincide.',
                      duration: 3000
                    });
                  }
                }}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                {deleting ? '⏳ Eliminando...' : '🗑️ Eliminar Proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      <ModalComponent />

      {/* Modal de Disputa de Precio */}
      {selectedProject && (
        <PriceDisputeModal
          isOpen={showPriceDispute}
          onClose={() => setShowPriceDispute(false)}
          project={selectedProject}
          onPriceUpdate={() => {
            fetchData();
            setShowPriceDispute(false);
          }}
          userRole={user?.role}
        />
      )}
    </div>
  );
}
