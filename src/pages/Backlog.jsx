import { useState, useEffect, useRef } from 'react';
import { subscribeToTasks, updateTask, createTask, archiveTask, moveTaskToSprint } from '../services/taskService';
import { subscribeToSprints, createSprint, startSprint } from '../services/sprintService';
import { subscribeToColumns } from '../services/columnService';
import { subscribeToProjects } from '../services/projectService';
import Icon from '../components/common/Icon';
import UserSelect from '../components/common/UserSelect';
import UserAvatar from '../components/common/UserAvatar';
import StoryPointsSelect from '../components/common/StoryPointsSelect';
import ProjectSelect from '../components/common/ProjectSelect';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TaskDetailSidebar from '../components/kanban/TaskDetailSidebar';
import '../styles/Backlog.css';

const Backlog = () => {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const newTaskInputRef = useRef(null);

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

    return () => {
      unsubscribeTasks();
      unsubscribeSprints();
      unsubscribeColumns();
      unsubscribeProjects();
    };
  }, []);

  // Filtrar tareas del backlog (sin sprint asignado)
  const backlogTasks = tasks.filter(task => !task.sprintId);

  // Filtrar sprints planificados (no completados)
  const activeSprints = sprints.filter(sprint => sprint.status !== 'completed');

  // Obtener tareas de un sprint específico
  const getSprintTasks = (sprintId) => {
    return tasks.filter(task => task.sprintId === sprintId);
  };

  // Obtener el nombre del proyecto por su ID
  const getProjectName = (projectId) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Proyecto desconocido';
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToSprint = async (e, sprintId) => {
    e.preventDefault();
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
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      // Al mover al backlog, quitar el sprint y el estado
      await moveTaskToSprint(taskId, null, false);
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

  return (
    <div className="backlog-page">
      {/* Header */}
      <div className="backlog-header flex justify-between items-center mb-md pb-base">
        <div className="flex items-center gap-base">
          <h2 className="heading-1 text-primary">Backlog</h2>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-primary flex items-center gap-xs" onClick={() => setShowSprintModal(true)}>
            <Icon name="plus" size={18} />
            Crear Sprint
          </button>
        </div>
      </div>

      {/* Sprints activos */}
      {activeSprints.map(sprint => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          tasks={getSprintTasks(sprint.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToSprint(e, sprint.id)}
          onStartSprint={startSprint}
          onTaskClick={setSelectedTask}
          getProjectName={getProjectName}
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
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarea</th>
                  <th style={{ width: '150px' }}>Proyecto</th>
                  <th style={{ width: '120px' }}>Prioridad</th>
                  <th style={{ width: '100px' }}>Story Points</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th style={{ width: '150px' }}>Asignado a</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {isCreatingTask && (
                  <tr className="inline-create-row">
                    <td>
                      <Icon name="plus-circle" size={16} className="inline-create-icon" />
                    </td>
                    <td colSpan="7">
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
                    onArchive={archiveTask}
                    onUpdateTask={updateTask}
                    onTaskClick={setSelectedTask}
                    getProjectName={getProjectName}
                  />
                ))}
              </tbody>
            </table>
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
    </div>
  );
};

// Componente de Sprint Section
const SprintSection = ({ sprint, tasks, onDragOver, onDrop, onStartSprint, onTaskClick, getProjectName }) => {
  const [expanded, setExpanded] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
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

  // Calcular story points completados y totales
  const completedPoints = tasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

  const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

  // Formatear fechas
  const formatSprintDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
          {totalPoints > 0 && (
            <span className="text-sm font-semibold text-primary has-tooltip" data-tooltip="Story Points completados / totales">
              {completedPoints}/{totalPoints} pts
            </span>
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
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarea</th>
                  <th style={{ width: '150px' }}>Proyecto</th>
                  <th style={{ width: '120px' }}>Prioridad</th>
                  <th style={{ width: '100px' }}>Story Points</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th style={{ width: '150px' }}>Asignado a</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {isCreatingTask && (
                  <tr className="inline-create-row">
                    <td>
                      <Icon name="plus-circle" size={16} className="inline-create-icon" />
                    </td>
                    <td colSpan="7">
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
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    onArchive={archiveTask}
                    onUpdateTask={updateTask}
                    onTaskClick={onTaskClick}
                    getProjectName={getProjectName}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de fila de tarea
const TaskRow = ({ task, onDragStart, onArchive, onUpdateTask, onTaskClick, getProjectName }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const userSelectRef = useRef(null);
  const projectSelectRef = useRef(null);

  const priorityLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica'
  };

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
        className="task-row"
        draggable
        onDragStart={(e) => onDragStart(e, task)}
      >
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
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Icon name="folder" size={14} className="text-secondary" />
                <span className="text-sm text-secondary">{getProjectName(task.projectId)}</span>
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
          <span className={`priority-badge priority-${task.priority}`}>
            {priorityLabels[task.priority]}
          </span>
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
            {task.assignedTo ? (
              <div
                onClick={() => setShowUserSelect(!showUserSelect)}
                style={{ cursor: 'pointer' }}
              >
                <UserAvatar userId={task.assignedTo} size={24} showName={true} />
              </div>
            ) : (
              <button
                className="btn-assign-user-backlog"
                onClick={() => setShowUserSelect(!showUserSelect)}
              >
                <Icon name="user-plus" size={16} />
                <span>Asignar</span>
              </button>
            )}
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
          <button
            className="btn-icon has-tooltip"
            onClick={handleArchive}
            data-tooltip="Archivar tarea"
          >
            <Icon name="archive" size={16} />
          </button>
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

export default Backlog;
