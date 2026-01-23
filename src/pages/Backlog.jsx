import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToTasks, updateTask, createTask, archiveTask, moveTaskToSprint } from '../services/taskService';
import { subscribeToSprints, createSprint, startSprint } from '../services/sprintService';
import { subscribeToColumns } from '../services/columnService';
import { subscribeToProjects } from '../services/projectService';
import { subscribeToUsers } from '../services/userService';
import { getSprintCapacityInfo, isUserOverbooked } from '../services/capacityService';
import Icon from '../components/common/Icon';
import UserSelect from '../components/common/UserSelect';
import UserAvatar from '../components/common/UserAvatar';
import StoryPointsSelect from '../components/common/StoryPointsSelect';
import ProjectSelect from '../components/common/ProjectSelect';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TaskDetailSidebar from '../components/kanban/TaskDetailSidebar';
import Toast from '../components/common/Toast';
import CapacityDetailModal from '../components/modals/CapacityDetailModal';
import TaskSelectionModal from '../components/modals/TaskSelectionModal';
import { createPlanningPokerSession, getAnyActiveSession, joinSession } from '../services/planningPokerService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Backlog.css';

const Backlog = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState(null);
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const newTaskInputRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);

  useEffect(() => {
    const unsubscribeTasks = subscribeToTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    const unsubscribeSprints = subscribeToSprints((fetchedSprints) => {
      setSprints(fetchedSprints);
    });

    const unsubscribeColumns = subscribeToColumns((fetchedColumns) => {
      setColumns(fetchedColumns);
    });

    const unsubscribeProjects = subscribeToProjects((fetchedProjects) => {
      setProjects(fetchedProjects);
    });

    const unsubscribeUsers = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSprints();
      unsubscribeColumns();
      unsubscribeProjects();
      unsubscribeUsers();
    };
  }, []);

  // Filtrar y ordenar tareas del backlog (sin sprint asignado)
  const backlogTasks = tasks
    .filter(task => !task.sprintId)
    .sort((a, b) => {
      // Obtener proyectos para comparar priority
      const projectA = projects.find(p => p.id === a.projectId);
      const projectB = projects.find(p => p.id === b.projectId);

      // Primero ordenar por priority del proyecto
      const projectPriorityA = projectA?.priority ?? Infinity;
      const projectPriorityB = projectB?.priority ?? Infinity;

      if (projectPriorityA !== projectPriorityB) {
        return projectPriorityA - projectPriorityB;
      }

      // Si tienen la misma prioridad, agrupar por projectId
      const projectIdA = a.projectId || '';
      const projectIdB = b.projectId || '';

      if (projectIdA !== projectIdB) {
        // Tareas sin proyecto van al final
        if (!projectIdA) return 1;
        if (!projectIdB) return -1;
        return projectIdA.localeCompare(projectIdB);
      }

      // Luego ordenar por order de la tarea (posición manual)
      const taskOrderA = a.order ?? Infinity;
      const taskOrderB = b.order ?? Infinity;

      if (taskOrderA !== taskOrderB) {
        return taskOrderA - taskOrderB;
      }

      // Si ambas tienen el mismo order, ordenar por fecha de creación
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateA - dateB;
    });

  // Filtrar sprints planificados (no completados)
  const activeSprints = sprints.filter(sprint => sprint.status !== 'completed');

  // Obtener y ordenar tareas de un sprint específico
  const getSprintTasks = (sprintId) => {
    return tasks
      .filter(task => task.sprintId === sprintId)
      .sort((a, b) => {
        // Obtener proyectos para comparar priority
        const projectA = projects.find(p => p.id === a.projectId);
        const projectB = projects.find(p => p.id === b.projectId);

        // Primero ordenar por priority del proyecto
        const projectPriorityA = projectA?.priority ?? Infinity;
        const projectPriorityB = projectB?.priority ?? Infinity;

        if (projectPriorityA !== projectPriorityB) {
          return projectPriorityA - projectPriorityB;
        }

        // Si tienen la misma prioridad, agrupar por projectId
        const projectIdA = a.projectId || '';
        const projectIdB = b.projectId || '';

        if (projectIdA !== projectIdB) {
          // Tareas sin proyecto van al final
          if (!projectIdA) return 1;
          if (!projectIdB) return -1;
          return projectIdA.localeCompare(projectIdB);
        }

        // Luego ordenar por order de la tarea (posición manual)
        const taskOrderA = a.order ?? Infinity;
        const taskOrderB = b.order ?? Infinity;

        if (taskOrderA !== taskOrderB) {
          return taskOrderA - taskOrderB;
        }

        // Si ambas tienen el mismo order, ordenar por fecha de creación
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateA - dateB;
      });
  };

  // Obtener el nombre del proyecto por su ID
  const getProjectName = (projectId) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Proyecto desconocido';
  };

  // Generar un color consistente para un proyecto basado en su ID
  const getProjectColor = (projectId) => {
    if (!projectId) return '#6B7280'; // Color gris por defecto

    // Paleta de colores suaves y diferenciables
    const colors = [
      '#3B82F6', // Azul
      '#10B981', // Verde
      '#F59E0B', // Naranja
      '#EF4444', // Rojo
      '#8B5CF6', // Púrpura
      '#EC4899', // Rosa
      '#14B8A6', // Teal
      '#F97316', // Naranja oscuro
      '#6366F1', // Índigo
      '#84CC16', // Lima
    ];

    // Generar un índice consistente basado en el projectId
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;

    return colors[index];
  };

  // Auto-scroll durante el drag
  const handleAutoScroll = (e) => {
    const scrollZone = 100; // Píxeles desde el borde para activar el scroll
    const scrollSpeed = 10; // Píxeles por intervalo
    const { clientY } = e;
    const windowHeight = window.innerHeight;

    // Limpiar intervalo previo
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Detectar si está cerca del borde superior
    if (clientY < scrollZone) {
      autoScrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, -scrollSpeed);
      }, 20);
    }
    // Detectar si está cerca del borde inferior
    else if (clientY > windowHeight - scrollZone) {
      autoScrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, scrollSpeed);
      }, 20);
    }
  };

  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('projectId', task.projectId || '');
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(task.id);
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDraggedTaskId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Activar auto-scroll también en zonas de drop generales
    handleAutoScroll(e);
  };

  const handleDragOverTask = (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();

    // Activar auto-scroll
    handleAutoScroll(e);

    const draggedTask = draggedTaskId ? tasks.find(t => t.id === draggedTaskId) : null;

    // Solo validar si ambas tareas están en el backlog (mismo contenedor)
    // Si la tarea arrastrada viene de un sprint, permitir drop sin validación
    if (draggedTask && !draggedTask.sprintId && !targetTask.sprintId) {
      const draggedActualProjectId = draggedTask.projectId || null;
      const targetProjectId = targetTask.projectId || null;

      // Verificar si están en el mismo proyecto solo para reordenamiento dentro del backlog
      if (draggedActualProjectId === targetProjectId) {
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
        e.currentTarget.classList.remove('drag-over-invalid');
      } else {
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over-invalid');
        e.currentTarget.classList.remove('drag-over');
      }
    } else {
      // Si viene de un sprint, siempre permitir
      e.dataTransfer.dropEffect = 'move';
      e.currentTarget.classList.add('drag-over');
      e.currentTarget.classList.remove('drag-over-invalid');
    }
  };

  const handleDragLeaveTask = (e) => {
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('drag-over-invalid');
  };

  const handleDropOnTask = async (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('drag-over-invalid');
    stopAutoScroll();
    setDraggedTaskId(null);

    const taskId = e.dataTransfer.getData('taskId');
    const draggedProjectId = e.dataTransfer.getData('projectId') || null;
    const targetProjectId = targetTask.projectId || null;

    if (taskId === targetTask.id) {
      return;
    }

    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    // Si la tarea arrastrada viene de un sprint, moverla al backlog sin reordenar
    if (draggedTask.sprintId) {
      await moveTaskToSprint(taskId, null, false);
      return;
    }

    // Si ambas tareas están en el backlog, validar que sean del mismo proyecto para reordenar
    if (!draggedTask.sprintId && !targetTask.sprintId) {
      if (draggedProjectId !== targetProjectId) {
        setToast({
          message: 'No se puede reordenar: las tareas deben pertenecer al mismo proyecto',
          type: 'error'
        });
        return;
      }

      // Obtener todas las tareas del mismo proyecto en el backlog
      const projectTasks = backlogTasks.filter(t =>
        (t.projectId || null) === (targetProjectId || null)
      );

      // Encontrar índices
      const draggedIndex = projectTasks.findIndex(t => t.id === taskId);
      const targetIndex = projectTasks.findIndex(t => t.id === targetTask.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reordenar array
      const reorderedTasks = [...projectTasks];
      const [movedTask] = reorderedTasks.splice(draggedIndex, 1);
      reorderedTasks.splice(targetIndex, 0, movedTask);

      // Actualizar order field basándose en el nuevo orden
      const updatePromises = reorderedTasks.map((task, index) => {
        return updateTask(task.id, { order: index });
      });

      await Promise.all(updatePromises);
    }
  };

  const handleDropToSprint = async (e, sprintId) => {
    e.preventDefault();
    stopAutoScroll();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      // Determinar si el sprint está activo
      const sprint = sprints.find(s => s.id === sprintId);
      const isSprintActive = sprint?.status === 'active';

      await moveTaskToSprint(taskId, sprintId, isSprintActive);
    }
  };

  const handleDropToBacklog = async (e) => {
    e.preventDefault();
    stopAutoScroll();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      // Al mover al backlog, quitar el sprint y el estado
      await moveTaskToSprint(taskId, null, false);
    }
  };

  // Handlers para reordenar tareas dentro de un sprint
  const handleDragOverSprintTask = (e, targetTask, sprintId) => {
    e.preventDefault();
    e.stopPropagation();

    // Activar auto-scroll
    handleAutoScroll(e);

    const draggedTask = draggedTaskId ? tasks.find(t => t.id === draggedTaskId) : null;

    // Solo validar si ambas tareas están en el mismo sprint (reordenamiento)
    // Si la tarea arrastrada viene del backlog, permitir drop sin validación
    if (draggedTask && draggedTask.sprintId === sprintId && targetTask.sprintId === sprintId) {
      const draggedActualProjectId = draggedTask.projectId || null;
      const targetProjectId = targetTask.projectId || null;

      // Verificar si están en el mismo proyecto solo para reordenamiento dentro del sprint
      if (draggedActualProjectId === targetProjectId) {
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
        e.currentTarget.classList.remove('drag-over-invalid');
      } else {
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over-invalid');
        e.currentTarget.classList.remove('drag-over');
      }
    } else {
      // Si viene del backlog, siempre permitir
      e.dataTransfer.dropEffect = 'move';
      e.currentTarget.classList.add('drag-over');
      e.currentTarget.classList.remove('drag-over-invalid');
    }
  };

  const handleDragLeaveSprintTask = (e) => {
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('drag-over-invalid');
  };

  const handleDropOnSprintTask = async (e, targetTask, sprintId) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('drag-over-invalid');
    stopAutoScroll();
    setDraggedTaskId(null);

    const taskId = e.dataTransfer.getData('taskId');
    const draggedProjectId = e.dataTransfer.getData('projectId') || null;
    const targetProjectId = targetTask.projectId || null;

    if (taskId === targetTask.id) {
      return;
    }

    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    // Si la tarea arrastrada viene del backlog, moverla al sprint sin reordenar
    if (!draggedTask.sprintId) {
      const sprint = sprints.find(s => s.id === sprintId);
      const isSprintActive = sprint?.status === 'active';
      await moveTaskToSprint(taskId, sprintId, isSprintActive);
      return;
    }

    // Si ambas tareas están en el mismo sprint, validar que sean del mismo proyecto para reordenar
    if (draggedTask.sprintId === sprintId && targetTask.sprintId === sprintId) {
      if (draggedProjectId !== targetProjectId) {
        setToast({
          message: 'No se puede reordenar: las tareas deben pertenecer al mismo proyecto',
          type: 'error'
        });
        return;
      }

      // Obtener todas las tareas del mismo proyecto en el sprint
      const sprintTasks = getSprintTasks(sprintId);
      const projectTasks = sprintTasks.filter(t =>
        (t.projectId || null) === (targetProjectId || null)
      );

      // Encontrar índices
      const draggedIndex = projectTasks.findIndex(t => t.id === taskId);
      const targetIndex = projectTasks.findIndex(t => t.id === targetTask.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reordenar array
      const reorderedTasks = [...projectTasks];
      const [movedTask] = reorderedTasks.splice(draggedIndex, 1);
      reorderedTasks.splice(targetIndex, 0, movedTask);

      // Actualizar order field basándose en el nuevo orden
      const updatePromises = reorderedTasks.map((task, index) => {
        return updateTask(task.id, { order: index });
      });

      await Promise.all(updatePromises);
    }
  };

  const handleCreateTask = async (taskData) => {
    // Cerrar el modal primero para mejor UX
    setShowTaskModal(false);
    // Crear la tarea después de cerrar el modal
    await createTask(taskData);
  };

  const handleCreateSprint = async (sprintData) => {
    // Cerrar el modal primero para mejor UX
    setShowSprintModal(false);
    // Crear el sprint después de cerrar el modal
    await createSprint(sprintData);
  };

  // Función para iniciar creación inline
  const handleStartInlineCreate = () => {
    setIsCreatingTask(true);
    setNewTaskName('');
    // Focus en el input después de que se renderice
    setTimeout(() => {
      newTaskInputRef.current?.focus();
    }, 0);
  };

  // Función para guardar tarea inline
  const handleSaveInlineTask = async () => {
    const trimmedName = newTaskName.trim();
    if (trimmedName) {
      await createTask({ title: trimmedName });
      setNewTaskName('');
      // Mantener el input activo para seguir creando
      setTimeout(() => {
        newTaskInputRef.current?.focus();
      }, 0);
    } else {
      // Si está vacío, cancelar
      setIsCreatingTask(false);
      setNewTaskName('');
    }
  };

  // Función para cancelar creación inline
  const handleCancelInlineCreate = () => {
    setIsCreatingTask(false);
    setNewTaskName('');
  };

  // Manejar teclas en el input inline
  const handleInlineInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineTask();
    } else if (e.key === 'Escape') {
      handleCancelInlineCreate();
    }
  };

  // Funciones de multi-selección
  const handleToggleTaskSelection = (taskId, event) => {
    // Obtener todas las tareas visibles (backlog + sprints)
    const allVisibleTasks = [...backlogTasks, ...activeSprints.flatMap(s => getSprintTasks(s.id))];

    // Extraer las propiedades del evento (puede ser nativeEvent o el evento directo)
    const shiftKey = event?.shiftKey || event?.nativeEvent?.shiftKey || false;
    const ctrlKey = event?.ctrlKey || event?.nativeEvent?.ctrlKey || false;
    const metaKey = event?.metaKey || event?.nativeEvent?.metaKey || false;

    if (shiftKey && lastSelectedTaskId) {
      // Selección de rango con Shift
      const lastIndex = allVisibleTasks.findIndex(t => t.id === lastSelectedTaskId);
      const currentIndex = allVisibleTasks.findIndex(t => t.id === taskId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = allVisibleTasks.slice(start, end + 1).map(t => t.id);

        setSelectedTaskIds(prev => [...new Set([...prev, ...rangeIds])]);
      }
    } else if (ctrlKey || metaKey) {
      // Selección individual con Ctrl/Cmd (toggle)
      setSelectedTaskIds(prev =>
        prev.includes(taskId)
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      );
      setLastSelectedTaskId(taskId);
    } else {
      // Click normal (toggle)
      setSelectedTaskIds(prev =>
        prev.includes(taskId)
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      );
      setLastSelectedTaskId(taskId);
    }
  };

  const handleToggleAllTasks = (tasksList) => {
    const taskIds = tasksList.map(t => t.id);
    const allSelected = taskIds.every(id => selectedTaskIds.includes(id));

    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !taskIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => [...new Set([...prev, ...taskIds])]);
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // Acciones masivas
  const handleBulkMoveToSprint = async (sprintId) => {
    const sprint = sprints.find(s => s.id === sprintId);
    const isSprintActive = sprint?.status === 'active';

    for (const taskId of selectedTaskIds) {
      await moveTaskToSprint(taskId, sprintId, isSprintActive);
    }

    setSelectedTaskIds([]);
    setToast({
      message: `${selectedTaskIds.length} tarea(s) movida(s) al sprint`,
      type: 'success'
    });
  };

  const handleBulkMoveToBacklog = async () => {
    for (const taskId of selectedTaskIds) {
      await moveTaskToSprint(taskId, null, false);
    }

    setSelectedTaskIds([]);
    setToast({
      message: `${selectedTaskIds.length} tarea(s) movida(s) al backlog`,
      type: 'success'
    });
  };

  const handleBulkAssignUser = async (userId) => {
    const updates = { assignedTo: userId };

    for (const taskId of selectedTaskIds) {
      await updateTask(taskId, updates);
    }

    setSelectedTaskIds([]);
    setToast({
      message: `${selectedTaskIds.length} tarea(s) asignada(s)`,
      type: 'success'
    });
  };

  const handleBulkAssignProject = async (projectId) => {
    for (const taskId of selectedTaskIds) {
      await updateTask(taskId, { projectId: projectId || null });
    }

    setSelectedTaskIds([]);
    setToast({
      message: `${selectedTaskIds.length} tarea(s) asignada(s) al proyecto`,
      type: 'success'
    });
  };

  const handleBulkArchive = async () => {
    for (const taskId of selectedTaskIds) {
      await archiveTask(taskId);
    }

    setSelectedTaskIds([]);
    setToast({
      message: `${selectedTaskIds.length} tarea(s) archivada(s)`,
      type: 'success'
    });
  };

  // Abrir modal de selección de tareas para Planning Poker
  const handleOpenTaskSelection = async () => {
    // Buscar CUALQUIER sesión activa
    const result = await getAnyActiveSession();

    if (result.success && result.session) {
      const session = result.session;

      // Verificar si el usuario ya es parte de la sesión
      const isModerator = session.moderatorId === user.uid;
      const isParticipant = session.participants?.some(p => p.userId === user.uid);

      if (!isModerator && !isParticipant) {
        // Si no es moderador ni participante, unirse automáticamente
        await joinSession(session.id, {
          userId: user.uid,
          userName: userProfile?.displayName || user.email
        });
      }

      // Navegar a la sesión
      navigate(`/planning-poker?session=${session.id}`);
    } else {
      // Si no hay sesión activa, abrir modal para crear una nueva
      setShowTaskSelection(true);
    }
  };

  // Confirmar selección e iniciar Planning Poker
  const handleConfirmTaskSelection = async (selectedTasks, pokerValues) => {
    setShowTaskSelection(false);

    // Enriquecer con detalles completos de las tareas
    const taskDetails = selectedTasks.map(t => ({
      id: t.id,
      title: t.title || t.name,
      description: t.description || '',
      attachments: t.attachments || [],
      projectId: t.projectId,
      projectName: getProjectName(t.projectId)
    }));

    const result = await createPlanningPokerSession({
      tasks: selectedTasks.map(t => t.id),
      taskDetails: taskDetails,
      moderatorId: user.uid,
      moderatorName: userProfile.displayName || userProfile.email,
      pokerValues: pokerValues
    });

    if (result.success) {
      // Navegar a la página de Planning Poker con el ID de la sesión
      navigate(`/planning-poker?session=${result.sessionId}`);
    } else {
      setToast({
        message: 'Error al crear sesión de Planning Poker',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="backlog-page">
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Cargando backlog...</p>
        </div>
      </div>
    );
  }

  // Calcular story points totales del backlog
  const backlogStoryPoints = backlogTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

  // Renderizar barra de acciones masivas
  const renderBulkActionsBar = () => {
    if (selectedTaskIds.length === 0) return null;

    const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));
    const allInBacklog = selectedTasks.every(t => !t.sprintId);
    const allInSprint = selectedTasks.every(t => t.sprintId);

    return (
      <BulkActionsBar
        selectedCount={selectedTaskIds.length}
        onClear={handleClearSelection}
        onMoveToSprint={handleBulkMoveToSprint}
        onMoveToBacklog={handleBulkMoveToBacklog}
        onAssignUser={handleBulkAssignUser}
        onAssignProject={handleBulkAssignProject}
        onArchive={handleBulkArchive}
        sprints={activeSprints}
        showMoveToSprint={allInBacklog}
        showMoveToBacklog={allInSprint}
      />
    );
  };

  return (
    <div className="backlog-page">
      {/* Barra de acciones masivas */}
      {renderBulkActionsBar()}

      {/* Header */}
      <div className="backlog-header mb-md pb-base">
        <div className="backlog-header-title">
          <h2 className="heading-1 text-primary m-0">Backlog</h2>
        </div>
        <div className="backlog-header-actions">
          <button
            className="btn btn-planning-poker flex items-center gap-xs"
            onClick={handleOpenTaskSelection}
            disabled={backlogTasks.length === 0}
          >
            <Icon name="zap" size={18} />
            <span className="btn-text-desktop">Planning Poker</span>
            <span className="btn-text-mobile">Poker</span>
          </button>
          <button
            className="btn btn-create-sprint flex items-center gap-xs"
            onClick={() => setShowSprintModal(true)}
          >
            <Icon name="plus" size={18} />
            <span className="btn-text-desktop">Crear Sprint</span>
            <span className="btn-text-mobile">Sprint</span>
          </button>
        </div>
      </div>

      {/* Sprints activos */}
      {activeSprints.map(sprint => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          tasks={getSprintTasks(sprint.id)}
          users={users}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToSprint(e, sprint.id)}
          onStartSprint={startSprint}
          onTaskClick={setSelectedTask}
          getProjectName={getProjectName}
          getProjectColor={getProjectColor}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOverTask={handleDragOverSprintTask}
          onDragLeaveTask={handleDragLeaveSprintTask}
          onDropOnTask={handleDropOnSprintTask}
          onUpdateTask={updateTask}
          sprints={activeSprints}
          onMoveToSprint={moveTaskToSprint}
          selectedTaskIds={selectedTaskIds}
          onToggleTaskSelection={handleToggleTaskSelection}
          onToggleAllTasks={handleToggleAllTasks}
        />
      ))}

      {/* Backlog (tareas sin sprint) */}
      <div
        className="backlog-section"
        onDragOver={handleDragOver}
        onDrop={handleDropToBacklog}
      >
        <div className="section-header flex items-center gap-base p-lg bg-white border-b-light">
          <div className="flex items-center gap-base flex-1">
            <Icon name="list" size={20} />
            <h3 className="heading-3 text-primary m-0">Backlog</h3>
            <button
              className="btn btn-icon btn-sm has-tooltip"
              onClick={handleStartInlineCreate}
              data-tooltip="Crear tarea rápida"
            >
              <Icon name="plus" size={18} />
            </button>
            <span className="text-sm font-semibold text-secondary">
              {backlogTasks.length} tareas
            </span>
            {backlogStoryPoints > 0 && (
              <span className="text-sm font-semibold text-secondary">
                {backlogStoryPoints} story points
              </span>
            )}
          </div>
        </div>

        <div className="tasks-table p-base">
          {backlogTasks.length === 0 && !isCreatingTask ? (
            <div className="empty-state text-center p-3xl text-secondary">
              <Icon name="inbox" size={48} />
              <p className="my-base text-base">No hay tareas en el backlog</p>
              <button onClick={handleStartInlineCreate} className="btn btn-primary btn-sm mt-base">
                Crear primera tarea
              </button>
            </div>
          ) : (
            <>
            {/* Desktop table view */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={backlogTasks.length > 0 && backlogTasks.every(t => selectedTaskIds.includes(t.id))}
                      onChange={() => handleToggleAllTasks(backlogTasks)}
                      className="task-checkbox"
                    />
                  </th>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarea</th>
                  <th style={{ width: '150px' }}>Proyecto</th>
                  <th style={{ width: '100px' }}>Story Points</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th style={{ width: '150px' }}>Asignado a</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {isCreatingTask && (
                  <tr className="inline-create-row">
                    <td></td>
                    <td>
                      <Icon name="plus-circle" size={16} className="inline-create-icon" />
                    </td>
                    <td colSpan="6">
                      <div className="inline-create-wrapper">
                        <input
                          ref={newTaskInputRef}
                          type="text"
                          className="inline-create-input"
                          placeholder="Nombre de la tarea..."
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyDown={handleInlineInputKeyDown}
                          onBlur={handleSaveInlineTask}
                          autoFocus
                        />
                        <div className="inline-create-hint">
                          <span className="hint-text">Presiona Enter para crear</span>
                          <span className="hint-text">·</span>
                          <span className="hint-text">Esc para cancelar</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {backlogTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOverTask}
                    onDragLeave={handleDragLeaveTask}
                    onDrop={handleDropOnTask}
                    onArchive={archiveTask}
                    onUpdateTask={updateTask}
                    onTaskClick={setSelectedTask}
                    getProjectName={getProjectName}
                    getProjectColor={getProjectColor}
                    sprints={activeSprints}
                    onMoveToSprint={moveTaskToSprint}
                    isSelected={selectedTaskIds.includes(task.id)}
                    onToggleSelection={handleToggleTaskSelection}
                    sprint={null}
                    users={users}
                    allTasks={tasks}
                    onOpenPlanningPoker={null}
                  />
                ))}
              </tbody>
            </table>

            {/* Mobile card view */}
            <div className="tasks-cards-mobile">
              {backlogTasks.map(task => (
                <TaskCardMobile
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onArchive={archiveTask}
                  onUpdateTask={updateTask}
                  onTaskClick={setSelectedTask}
                  getProjectName={getProjectName}
                  getProjectColor={getProjectColor}
                  sprints={activeSprints}
                  onMoveToSprint={moveTaskToSprint}
                  isSelected={selectedTaskIds.includes(task.id)}
                  onToggleSelection={handleToggleTaskSelection}
                  sprint={null}
                  users={users}
                  allTasks={tasks}
                />
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {showSprintModal && (
        <SprintModal
          onClose={() => setShowSprintModal(false)}
          onSave={handleCreateSprint}
        />
      )}

      {/* Task Detail Sidebar */}
      {selectedTask && (
        <TaskDetailSidebar
          task={tasks.find(t => t.id === selectedTask.id) || selectedTask}
          columns={columns}
          allTasks={tasks}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Task Selection Modal */}
      {showTaskSelection && (
        <TaskSelectionModal
          tasks={backlogTasks.map(t => ({
            ...t,
            projectName: getProjectName(t.projectId)
          }))}
          onClose={() => setShowTaskSelection(false)}
          onConfirm={handleConfirmTaskSelection}
        />
      )}
    </div>
  );
};

// Componente de Sprint Section
const SprintSection = ({ sprint, tasks, users, onDragOver, onDrop, onStartSprint, onTaskClick, getProjectName, getProjectColor, onDragStart, onDragEnd, onDragOverTask, onDragLeaveTask, onDropOnTask, onUpdateTask, sprints, onMoveToSprint, selectedTaskIds, onToggleTaskSelection, onToggleAllTasks }) => {
  const [expanded, setExpanded] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const newTaskInputRef = useRef(null);

  const handleStartSprint = () => {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    onStartSprint(sprint.id, formatDate(today), formatDate(twoWeeksLater));
  };

  // Calcular capacidad del sprint
  const capacityInfo = getSprintCapacityInfo(sprint, tasks, users);

  // Función para iniciar creación inline
  const handleStartInlineCreate = () => {
    setIsCreatingTask(true);
    setNewTaskName('');
    setTimeout(() => {
      newTaskInputRef.current?.focus();
    }, 0);
  };

  // Función para guardar tarea inline
  const handleSaveInlineTask = async () => {
    const trimmedName = newTaskName.trim();
    if (trimmedName) {
      // Crear tarea asignada al sprint
      const taskData = {
        title: trimmedName,
        sprintId: sprint.id
      };

      // Si el sprint está activo, asignar estado 'pending'
      if (sprint.status === 'active') {
        taskData.status = 'pending';
      }

      await createTask(taskData);
      setNewTaskName('');
      // Mantener el input activo para seguir creando
      setTimeout(() => {
        newTaskInputRef.current?.focus();
      }, 0);
    } else {
      // Si está vacío, cancelar
      setIsCreatingTask(false);
      setNewTaskName('');
    }
  };

  // Manejar teclas en el input inline
  const handleInlineInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineTask();
    } else if (e.key === 'Escape') {
      setIsCreatingTask(false);
      setNewTaskName('');
    }
  };

  // Formatear fechas
  const formatSprintDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Determinar el color del indicador de capacidad
  const getCapacityColor = () => {
    if (capacityInfo.status === 'over-capacity') return '#EF4444'; // Rojo
    if (capacityInfo.status === 'near-limit') return '#F59E0B'; // Naranja
    return '#10B981'; // Verde
  };

  return (
    <div
      className={`sprint-section ${sprint.status}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="section-header flex items-center gap-base p-lg bg-white border-b-light">
        <button
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
        </button>
        <div className="flex items-center gap-base flex-1">
          <Icon name="zap" size={20} />
          <h3 className="heading-3 text-primary m-0">{sprint.name}</h3>
          <button
            className="btn btn-icon btn-sm has-tooltip"
            onClick={handleStartInlineCreate}
            data-tooltip="Crear tarea rápida"
          >
            <Icon name="plus" size={18} />
          </button>
          <span className={`status-badge ${sprint.status}`}>
            {sprint.status === 'planned' && 'Planificado'}
            {sprint.status === 'active' && 'Activo'}
          </span>
          <span className="count-badge">{tasks.length}</span>
          {sprint.startDate && sprint.endDate && (
            <span className="text-sm text-secondary">
              {formatSprintDate(sprint.startDate)} - {formatSprintDate(sprint.endDate)}
            </span>
          )}
          {capacityInfo.completedPoints > 0 && (
            <span className="text-sm font-semibold text-primary has-tooltip" data-tooltip="Story Points completados / totales">
              {capacityInfo.completedPoints}/{capacityInfo.assignedPoints} pts
            </span>
          )}
          {capacityInfo.capacity > 0 && (
            <div
              className="capacity-indicator has-tooltip"
              data-tooltip={`Capacidad del equipo: ${capacityInfo.capacity} pts | Asignado: ${capacityInfo.assignedPoints} pts | Disponible: ${capacityInfo.remaining} pts | Click para ver detalles`}
              onClick={() => setShowCapacityModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex items-center gap-xs">
                <Icon name="users" size={14} />
                <span className="text-sm font-semibold" style={{ color: getCapacityColor() }}>
                  {capacityInfo.assignedPoints}/{capacityInfo.capacity} pts
                </span>
                <div className="capacity-bar" style={{ width: '60px', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${Math.min(capacityInfo.percentage, 100)}%`,
                      height: '100%',
                      backgroundColor: getCapacityColor(),
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <span className="text-xs text-secondary">{capacityInfo.percentage}%</span>
              </div>
            </div>
          )}
        </div>
        {sprint.status === 'planned' && tasks.length > 0 && (
          <button className="btn btn-primary flex items-center gap-xs" onClick={handleStartSprint}>
            <Icon name="play" size={16} />
            Iniciar Sprint
          </button>
        )}
      </div>

      {expanded && (
        <div className="sprint-tasks p-base">
          {tasks.length === 0 && !isCreatingTask ? (
            <div className="empty-sprint text-center p-3xl text-secondary">
              <p className="my-base text-base">Arrastra tareas aquí para agregarlas al sprint</p>
              <button onClick={handleStartInlineCreate} className="btn btn-primary btn-sm mt-base">
                Crear primera tarea
              </button>
            </div>
          ) : (
            <>
            {/* Desktop table view */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={tasks.length > 0 && tasks.every(t => selectedTaskIds.includes(t.id))}
                      onChange={() => onToggleAllTasks(tasks)}
                      className="task-checkbox"
                    />
                  </th>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarea</th>
                  <th style={{ width: '150px' }}>Proyecto</th>
                  <th style={{ width: '100px' }}>Story Points</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th style={{ width: '150px' }}>Asignado a</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {isCreatingTask && (
                  <tr className="inline-create-row">
                    <td></td>
                    <td>
                      <Icon name="plus-circle" size={16} className="inline-create-icon" />
                    </td>
                    <td colSpan="6">
                      <div className="inline-create-wrapper">
                        <input
                          ref={newTaskInputRef}
                          type="text"
                          className="inline-create-input"
                          placeholder="Nombre de la tarea..."
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyDown={handleInlineInputKeyDown}
                          onBlur={handleSaveInlineTask}
                          autoFocus
                        />
                        <div className="inline-create-hint">
                          <span className="hint-text">Presiona Enter para crear</span>
                          <span className="hint-text">·</span>
                          <span className="hint-text">Esc para cancelar</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDragStart={(e) => onDragStart(e, task)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e, t) => onDragOverTask(e, t, sprint.id)}
                    onDragLeave={onDragLeaveTask}
                    onDrop={(e, t) => onDropOnTask(e, t, sprint.id)}
                    onArchive={archiveTask}
                    onUpdateTask={onUpdateTask}
                    onTaskClick={onTaskClick}
                    getProjectName={getProjectName}
                    getProjectColor={getProjectColor}
                    sprints={sprints}
                    onMoveToSprint={onMoveToSprint}
                    currentSprintId={sprint.id}
                    isSelected={selectedTaskIds.includes(task.id)}
                    onToggleSelection={onToggleTaskSelection}
                    sprint={sprint}
                    users={users}
                    allTasks={tasks}
                    onOpenPlanningPoker={null}
                  />
                ))}
              </tbody>
            </table>

            {/* Mobile card view */}
            <div className="tasks-cards-mobile">
              {tasks.map(task => (
                <TaskCardMobile
                  key={task.id}
                  task={task}
                  onDragStart={(e) => onDragStart(e, task)}
                  onDragEnd={onDragEnd}
                  onArchive={archiveTask}
                  onUpdateTask={onUpdateTask}
                  onTaskClick={onTaskClick}
                  getProjectName={getProjectName}
                  getProjectColor={getProjectColor}
                  sprints={sprints}
                  onMoveToSprint={onMoveToSprint}
                  isSelected={selectedTaskIds.includes(task.id)}
                  onToggleSelection={onToggleTaskSelection}
                  sprint={sprint}
                  users={users}
                  allTasks={tasks}
                />
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Capacidad Detallada */}
      <CapacityDetailModal
        isOpen={showCapacityModal}
        onClose={() => setShowCapacityModal(false)}
        sprint={sprint}
        users={users}
        tasks={tasks}
      />
    </div>
  );
};

// Componente de tarjeta móvil para tareas
const TaskCardMobile = ({ task, onDragStart, onDragEnd, onArchive, onUpdateTask, onTaskClick, getProjectName, getProjectColor, sprints, onMoveToSprint, isSelected, onToggleSelection, sprint, users, allTasks }) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef(null);

  // Cerrar menú de acciones al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionsMenu]);

  const handleMoveToBacklog = async () => {
    await onMoveToSprint(task.id, null, false);
    setShowActionsMenu(false);
  };

  const handleMoveToSprint = async (sprintId) => {
    const sprint = sprints?.find(s => s.id === sprintId);
    const isSprintActive = sprint?.status === 'active';
    await onMoveToSprint(task.id, sprintId, isSprintActive);
    setShowActionsMenu(false);
  };

  const handleArchive = () => {
    onArchive(task.id);
    setShowActionsMenu(false);
  };

  return (
    <div
      className={`task-card-mobile ${isSelected ? 'selected' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-header">
        <div className="task-card-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection(task.id, e);
            }}
            className="task-checkbox"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div
          className="task-card-title"
          onClick={() => onTaskClick(task)}
        >
          {task.title || task.name}
        </div>
        <div className="task-card-drag-handle">
          <Icon name="grip-vertical" size={18} />
        </div>
        <div className="task-card-actions" ref={actionsMenuRef}>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowActionsMenu(!showActionsMenu);
            }}
          >
            <Icon name="more-vertical" size={18} />
          </button>
          {showActionsMenu && (
            <div className="actions-menu">
              {/* Opciones de mover a sprint (solo si está en backlog) */}
              {!task.sprintId && sprints && sprints.length > 0 && (
                <>
                  <div className="actions-menu-header">Mover a sprint</div>
                  {sprints.map(sprint => (
                    <button
                      key={sprint.id}
                      className="actions-menu-item"
                      onClick={() => handleMoveToSprint(sprint.id)}
                    >
                      <Icon name="zap" size={14} />
                      <span>{sprint.name}</span>
                    </button>
                  ))}
                  <div className="actions-menu-divider"></div>
                </>
              )}

              {/* Opción de mover a backlog (solo si está en un sprint) */}
              {task.sprintId && (
                <>
                  <button
                    className="actions-menu-item"
                    onClick={handleMoveToBacklog}
                  >
                    <Icon name="list" size={14} />
                    <span>Mover a Backlog</span>
                  </button>
                  <div className="actions-menu-divider"></div>
                </>
              )}

              {/* Opción de archivar */}
              <button
                className="actions-menu-item danger"
                onClick={handleArchive}
              >
                <Icon name="archive" size={14} />
                <span>Archivar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="task-card-meta">
        {task.projectId && (
          <div
            className="task-card-meta-item"
            style={{
              backgroundColor: `${getProjectColor(task.projectId)}15`,
              border: `1px solid ${getProjectColor(task.projectId)}40`,
              color: getProjectColor(task.projectId),
              padding: '0.125rem 0.5rem',
              borderRadius: '4px',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          >
            <Icon name="folder" size={12} />
            <span>{getProjectName(task.projectId)}</span>
          </div>
        )}
        {task.storyPoints && (
          <div className="task-card-meta-item">
            <Icon name="zap" size={12} />
            <span>{task.storyPoints} pts</span>
          </div>
        )}
        {task.status && (
          <span className={`status-badge ${task.status}`}>
            {task.status}
          </span>
        )}
        {task.assignedTo && (
          <div className="task-card-meta-item">
            <UserAvatar
              userId={task.assignedTo}
              size={24}
              showName={false}
              isOverbooked={task.assignedTo && sprint ? isUserOverbooked(task.assignedTo, sprint, allTasks || [], users || []) : false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de fila de tarea
const TaskRow = ({ task, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onArchive, onUpdateTask, onTaskClick, getProjectName, getProjectColor, sprints, onMoveToSprint, currentSprintId, isSelected, onToggleSelection, sprint, users, allTasks, onOpenPlanningPoker }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const userSelectRef = useRef(null);
  const projectSelectRef = useRef(null);
  const actionsMenuRef = useRef(null);

  // Cerrar menú de usuario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userSelectRef.current && !userSelectRef.current.contains(event.target)) {
        setShowUserSelect(false);
      }
    };

    if (showUserSelect) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserSelect]);

  // Cerrar menú de proyecto al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectSelectRef.current && !projectSelectRef.current.contains(event.target)) {
        setShowProjectSelect(false);
      }
    };

    if (showProjectSelect) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProjectSelect]);

  // Cerrar menú de acciones al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionsMenu]);

  const handleArchive = () => {
    setShowConfirm(true);
  };

  const confirmArchive = () => {
    onArchive(task.id);
    setShowConfirm(false);
  };

  const handleAssignUser = async (userId) => {
    const updates = { assignedTo: userId };

    // Solo incluir previousAssignedTo si tiene un valor válido
    if (task.assignedTo) {
      updates.previousAssignedTo = task.assignedTo;
    }

    await onUpdateTask(task.id, updates);
    setShowUserSelect(false);
  };

  const handleAssignProject = async (projectId) => {
    await onUpdateTask(task.id, {
      projectId: projectId || null
    });
    setShowProjectSelect(false);
  };

  const handleMoveToBacklog = async () => {
    await onMoveToSprint(task.id, null, false);
    setShowActionsMenu(false);
  };

  const handleMoveToSprint = async (sprintId) => {
    const sprint = sprints?.find(s => s.id === sprintId);
    const isSprintActive = sprint?.status === 'active';
    await onMoveToSprint(task.id, sprintId, isSprintActive);
    setShowActionsMenu(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Archivar tarea"
        message="¿Archivar esta tarea? Podrás recuperarla después desde la vista de archivados."
        confirmText="Archivar"
        cancelText="Cancelar"
        confirmVariant="primary"
        onConfirm={confirmArchive}
        onCancel={() => setShowConfirm(false)}
      />
      <tr
        className={`task-row ${isSelected ? 'selected' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, task)}
        onDragEnd={onDragEnd || undefined}
        onDragOver={onDragOver ? (e) => onDragOver(e, task) : undefined}
        onDragLeave={onDragLeave || undefined}
        onDrop={onDrop ? (e) => onDrop(e, task) : undefined}
      >
        <td onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection(task.id, e);
            }}
            className="task-checkbox"
          />
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <Icon name="grip-vertical" size={16} style={{ opacity: 0.5, cursor: 'grab' }} />
        </td>
        <td onClick={() => onTaskClick(task)} style={{ cursor: 'pointer' }}>
          <div className="task-title font-semibold text-primary">{task.title || task.name}</div>
        </td>
        <td>
          <div className="task-project" ref={projectSelectRef}>
            {task.projectId ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProjectSelect(!showProjectSelect);
                }}
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: `${getProjectColor(task.projectId)}15`,
                  border: `1px solid ${getProjectColor(task.projectId)}40`,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: getProjectColor(task.projectId),
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${getProjectColor(task.projectId)}25`;
                  e.currentTarget.style.borderColor = `${getProjectColor(task.projectId)}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${getProjectColor(task.projectId)}15`;
                  e.currentTarget.style.borderColor = `${getProjectColor(task.projectId)}40`;
                }}
              >
                <Icon name="folder" size={12} />
                <span>{getProjectName(task.projectId)}</span>
              </div>
            ) : (
              <button
                className="btn-assign-user-backlog"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProjectSelect(!showProjectSelect);
                }}
              >
                <Icon name="folder" size={16} />
                <span>Asignar</span>
              </button>
            )}
            {showProjectSelect && (
              <div
                className="user-select-dropdown-backlog"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <ProjectSelect
                  value={task.projectId}
                  onChange={handleAssignProject}
                  mode="list"
                />
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="flex items-center justify-center">
            <StoryPointsSelect
              value={task.storyPoints}
              onChange={async (storyPoints) => {
                await onUpdateTask(task.id, { storyPoints });
              }}
              size="small"
            />
          </div>
        </td>
        <td>
          <span className={`status-badge ${task.status}`}>
            {task.status}
          </span>
        </td>
        <td>
          <div className="task-assignee" ref={userSelectRef}>
            <div
              onClick={() => setShowUserSelect(!showUserSelect)}
              style={{ cursor: 'pointer' }}
            >
              <UserAvatar
                userId={task.assignedTo}
                size={28}
                showName={false}
                isOverbooked={task.assignedTo && sprint ? isUserOverbooked(task.assignedTo, sprint, allTasks || [], users || []) : false}
              />
            </div>
            {showUserSelect && (
              <div
                className="user-select-dropdown-backlog"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <UserSelect
                  value={task.assignedTo}
                  onChange={handleAssignUser}
                  mode="list"
                />
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="task-actions" ref={actionsMenuRef}>
            <button
              className="btn-icon has-tooltip"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              data-tooltip="Más opciones"
            >
              <Icon name="more-vertical" size={16} />
            </button>
            {showActionsMenu && (
              <div className="actions-menu">
                {/* Opciones de mover a sprint (solo si está en backlog) */}
                {!task.sprintId && sprints && sprints.length > 0 && (
                  <>
                    <div className="actions-menu-header">Mover a sprint</div>
                    {sprints.map(sprint => (
                      <button
                        key={sprint.id}
                        className="actions-menu-item"
                        onClick={() => handleMoveToSprint(sprint.id)}
                      >
                        <Icon name="zap" size={14} />
                        <span>{sprint.name}</span>
                      </button>
                    ))}
                    <div className="actions-menu-divider"></div>
                  </>
                )}

                {/* Opción de mover a backlog (solo si está en un sprint) */}
                {task.sprintId && (
                  <>
                    <button
                      className="actions-menu-item"
                      onClick={handleMoveToBacklog}
                    >
                      <Icon name="list" size={14} />
                      <span>Mover a Backlog</span>
                    </button>
                    <div className="actions-menu-divider"></div>
                  </>
                )}

                {/* Opción de archivar */}
                <button
                  className="actions-menu-item danger"
                  onClick={() => {
                    setShowActionsMenu(false);
                    handleArchive();
                  }}
                >
                  <Icon name="archive" size={14} />
                  <span>Archivar</span>
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
};

// Modal para crear tarea
const TaskModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    storyPoints: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-header">Nueva Tarea</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-base">
          <div className="form-group">
            <label className="label">Título *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-row grid gap-base">
            <div className="form-group">
              <label className="label">Prioridad</label>
              <select
                className="select"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Story Points</label>
              <input
                type="number"
                className="input"
                value={formData.storyPoints}
                onChange={e => setFormData({ ...formData, storyPoints: e.target.value })}
                min="1"
                max="100"
              />
            </div>
          </div>

          <div className="modal-footer flex justify-end gap-sm">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para crear sprint
const SprintModal = ({ onClose, onSave }) => {
  // Calcular fechas sugeridas (hoy y 2 semanas después)
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    startDate: formatDate(today),
    endDate: formatDate(twoWeeksLater)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      status: 'planned'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-header">Nuevo Sprint</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-base">
          <div className="form-group">
            <label className="label">Nombre del Sprint *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sprint 1"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label">Objetivo</label>
            <textarea
              className="textarea"
              value={formData.goal}
              onChange={e => setFormData({ ...formData, goal: e.target.value })}
              placeholder="¿Qué se quiere lograr en este sprint?"
              rows={3}
            />
          </div>

          <div className="form-row grid gap-base">
            <div className="form-group">
              <label className="label">Fecha de Inicio *</label>
              <input
                type="date"
                className="input"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Fecha de Fin *</label>
              <input
                type="date"
                className="input"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
              />
            </div>
          </div>

          <div className="modal-footer flex justify-end gap-sm">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Crear Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de barra de acciones masivas
const BulkActionsBar = ({ selectedCount, onClear, onMoveToSprint, onMoveToBacklog, onAssignUser, onAssignProject, onArchive, sprints, showMoveToSprint, showMoveToBacklog }) => {
  const [showSprintMenu, setShowSprintMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const sprintMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const projectMenuRef = useRef(null);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sprintMenuRef.current && !sprintMenuRef.current.contains(event.target)) {
        setShowSprintMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) {
        setShowProjectMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bulk-actions-bar">
      <div className="bulk-actions-content">
        <div className="bulk-actions-left">
          <span className="bulk-actions-count">{selectedCount} tarea(s) seleccionada(s)</span>
          <button className="btn btn-secondary btn-sm" onClick={onClear}>
            <Icon name="x" size={16} />
            Limpiar selección
          </button>
        </div>

        <div className="bulk-actions-right flex items-center gap-sm">
          {/* Mover a Sprint */}
          {showMoveToSprint && sprints && sprints.length > 0 && (
            <div className="bulk-action-menu" ref={sprintMenuRef}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowSprintMenu(!showSprintMenu)}
              >
                <Icon name="zap" size={16} />
                Mover a Sprint
              </button>
              {showSprintMenu && (
                <div className="bulk-dropdown">
                  {sprints.map(sprint => (
                    <button
                      key={sprint.id}
                      className="bulk-dropdown-item"
                      onClick={() => {
                        onMoveToSprint(sprint.id);
                        setShowSprintMenu(false);
                      }}
                    >
                      <Icon name="zap" size={14} />
                      <span>{sprint.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mover a Backlog */}
          {showMoveToBacklog && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onMoveToBacklog}
            >
              <Icon name="list" size={16} />
              Mover a Backlog
            </button>
          )}

          {/* Asignar Usuario */}
          <div className="bulk-action-menu" ref={userMenuRef}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Icon name="user" size={16} />
              Asignar Usuario
            </button>
            {showUserMenu && (
              <div className="bulk-dropdown">
                <UserSelect
                  value={null}
                  onChange={(userId) => {
                    onAssignUser(userId);
                    setShowUserMenu(false);
                  }}
                  mode="list"
                />
              </div>
            )}
          </div>

          {/* Asignar Proyecto */}
          <div className="bulk-action-menu" ref={projectMenuRef}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowProjectMenu(!showProjectMenu)}
            >
              <Icon name="folder" size={16} />
              Asignar Proyecto
            </button>
            {showProjectMenu && (
              <div className="bulk-dropdown">
                <ProjectSelect
                  value={null}
                  onChange={(projectId) => {
                    onAssignProject(projectId);
                    setShowProjectMenu(false);
                  }}
                  mode="list"
                />
              </div>
            )}
          </div>

          {/* Archivar */}
          <button
            className="btn btn-danger btn-sm"
            onClick={onArchive}
          >
            <Icon name="archive" size={16} />
            Archivar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Backlog;
