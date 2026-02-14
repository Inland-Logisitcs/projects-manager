import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToProjects, createProject, updateProject, deleteProject, updateProjectsOrder } from '../services/projectService';
import { subscribeToTasks, updateTask } from '../services/taskService';
import { subscribeToColumns } from '../services/columnService';
import { subscribeToUsers } from '../services/userService';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '../components/common/Icon';
import Toast from '../components/common/Toast';
import DependenciesFlow from '../components/projects/DependenciesFlow';
import TaskDetailSidebar from '../components/kanban/TaskDetailSidebar';
import TaskScheduler from '../components/scheduler/TaskScheduler';
import '../styles/Projects.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout' },
  { id: 'dependencies', label: 'Dependencias', icon: 'git-branch' },
  { id: 'planning', label: 'Planificacion', icon: 'calendar' }
];

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectRisks, setProjectRisks] = useState({}); // { projectId: [risks] }

  useEffect(() => {
    const unsubscribeProjects = subscribeToProjects((fetchedProjects) => {
      setProjects(fetchedProjects);

      // Cargar riesgos de cada proyecto
      const risks = {};
      fetchedProjects.forEach(project => {
        if (project.risks && Array.isArray(project.risks)) {
          risks[project.id] = project.risks;
        }
      });
      setProjectRisks(risks);

      setLoading(false);
    });

    const unsubscribeTasks = subscribeToTasks((fetchedTasks) => {
      setTasks(fetchedTasks.filter(t => !t.archived));
    });

    const unsubscribeColumns = subscribeToColumns((fetchedColumns) => {
      setColumns(fetchedColumns);
    });

    const unsubscribeUsers = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers.filter(u => !u.disabled));
    });

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeColumns();
      unsubscribeUsers();
    };
  }, []);

  const handleCreateProject = async (projectData) => {
    const result = await createProject(projectData);
    if (result.success) {
      setShowModal(false);
    } else {
      setToast({
        isOpen: true,
        message: `Error al crear proyecto: ${result.error}`,
        type: 'error'
      });
    }
  };

  const handleUpdateProject = async (projectId, updates) => {
    const result = await updateProject(projectId, updates);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al actualizar proyecto: ${result.error}`,
        type: 'error'
      });
    }
    return result;
  };

  const handleDeleteProject = async (projectId) => {
    const result = await deleteProject(projectId);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al eliminar proyecto: ${result.error}`,
        type: 'error'
      });
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleTaskUpdate = async (taskId, updates) => {
    const result = await updateTask(taskId, updates);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al actualizar tarea: ${result.error}`,
        type: 'error'
      });
    }
    return result;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = projects.findIndex(p => p.id === active.id);
    const newIndex = projects.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reordenar localmente (optimistic update)
    const reorderedProjects = [...projects];
    const [movedProject] = reorderedProjects.splice(oldIndex, 1);
    reorderedProjects.splice(newIndex, 0, movedProject);

    // Actualizar estado local inmediatamente
    setProjects(reorderedProjects);

    // Actualizar prioridades en Firebase
    const updatesWithNewOrder = reorderedProjects.map((project, index) => ({
      id: project.id,
      priority: index
    }));

    const result = await updateProjectsOrder(updatesWithNewOrder);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al actualizar orden de proyectos: ${result.error}`,
        type: 'error'
      });
      // Revertir cambio local si falla
      const unsubscribeProjects = subscribeToProjects((fetchedProjects) => {
        setProjects(fetchedProjects);
        unsubscribeProjects();
      });
    }
  };

  if (loading) {
    return (
      <div className="page-container page-container-narrow projects-page">
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {projects.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-content">
                  <div className="empty-illustration">
                    <Icon name="folder" size={80} className="empty-icon" />
                  </div>
                  <h2>Comienza tu primer proyecto</h2>
                  <p>Los proyectos te ayudan a organizar y dar seguimiento a tu trabajo de manera efectiva</p>
                  <button className="btn-create-first" onClick={() => setShowModal(true)}>
                    <Icon name="plus" size={20} />
                    <span>Crear mi primer proyecto</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={projects.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="projects-list">
                      {projects.map((project, index) => (
                        <SortableProjectCard
                          key={project.id}
                          project={project}
                          index={index}
                          onUpdate={handleUpdateProject}
                          onDelete={handleDeleteProject}
                          users={users}
                          tasks={tasks}
                          projectRisks={projectRisks[project.id] || []}
                          onRisksChange={async (risks) => {
                            // Actualizar estado local
                            setProjectRisks({ ...projectRisks, [project.id]: risks });
                            // Guardar en Firebase
                            const result = await updateProject(project.id, { risks });
                            if (!result.success) {
                              setToast({
                                isOpen: true,
                                message: `Error al guardar riesgos: ${result.error}`,
                                type: 'error'
                              });
                            } else {
                              setToast({
                                isOpen: true,
                                message: 'Riesgos guardados correctamente',
                                type: 'success'
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <UnassignedTasksSection
                  tasks={tasks}
                  columns={columns}
                  projects={projects}
                  onTaskClick={handleTaskClick}
                  onTaskUpdate={handleTaskUpdate}
                />
              </>
            )}
          </>
        );

      case 'dependencies':
        return (
          <DependenciesFlow
            projects={projects}
            tasks={tasks}
            onTaskClick={handleTaskClick}
            isAdmin={isAdmin}
          />
        );

      case 'planning':
        return (
          <TaskScheduler
            proyectos={projects}
            tareas={tasks}
            columns={columns}
            projectRisks={projectRisks}
            isAdmin={isAdmin}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {toast.isOpen && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ isOpen: false, message: '', type: 'error' })}
        />
      )}

      <div className="page-container page-container-narrow projects-page">
        <div className="projects-header mb-md">
          <div className="page-header">
            <div className="flex items-center gap-base">
              <h1 className="heading-1 text-primary">Proyectos</h1>
              <span className="project-count">
                <Icon name="folder" size={16} />
                {projects.length}
              </span>
            </div>
            <button className="btn btn-primary flex items-center gap-xs" onClick={() => setShowModal(true)}>
              <Icon name="plus" size={20} />
              <span>Nuevo Proyecto</span>
            </button>
          </div>

          <div className="projects-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`projects-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon name={tab.icon} size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="projects-content">
          {renderTabContent()}
        </div>

        {showModal && (
          <ProjectModal
            onClose={() => setShowModal(false)}
            onSave={handleCreateProject}
          />
        )}

        {selectedTask && (
          <TaskDetailSidebar
            task={selectedTask}
            columns={columns}
            allTasks={tasks}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
          />
        )}
      </div>
    </>
  );
};

export const PROJECT_STATUSES = [
  { id: 'planning', label: 'Planificacion', color: 'badge-warning', icon: 'edit-3' },
  { id: 'ready-to-implement', label: 'Listo para implementar', color: 'badge-info', icon: 'check-circle' },
  { id: 'idle', label: 'En pausa', color: 'badge-secondary', icon: 'pause-circle' },
  { id: 'in-progress', label: 'En progreso', color: 'badge-primary', icon: 'loader' },
  { id: 'completed', label: 'Completado', color: 'badge-success', icon: 'check' }
];

export const STATUS_LABELS = Object.fromEntries(PROJECT_STATUSES.map(s => [s.id, s.label]));
export const STATUS_COLORS = Object.fromEntries(PROJECT_STATUSES.map(s => [s.id, s.color]));

const SortableProjectCard = ({ project, index, onUpdate, onDelete, users, tasks, projectRisks, onRisksChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ProjectCard
        project={project}
        index={index}
        onUpdate={onUpdate}
        onDelete={onDelete}
        users={users}
        tasks={tasks}
        projectRisks={projectRisks}
        onRisksChange={onRisksChange}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const ProjectCard = ({ project, index, onUpdate, onDelete, users, tasks, projectRisks, onRisksChange, dragHandleProps }) => {
  const navigate = useNavigate();
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const projectTasks = tasks.filter(t => (t.projectId || t.proyectoId) === project.id);
  const hasGeneralRisk = projectRisks.some(r => !r.usuarioId && !r.userId);
  const userSpecificRisksCount = projectRisks.filter(r => r.usuarioId || r.userId).length;
  const risksCount = userSpecificRisksCount + (hasGeneralRisk ? 1 : 0);

  return (
    <>
      <div className="card project-card project-card-clickable" onClick={() => navigate(`/projects/${project.id}`)}>
        <div className="card-body">
          <div className="flex justify-between items-start gap-base">
            <div className="flex items-center gap-base flex-1">
              <div
                {...dragHandleProps}
                className="drag-handle"
                title="Arrastra para reordenar"
                onClick={e => e.stopPropagation()}
              >
                <Icon name="menu" size={20} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-sm mb-xs">
                  <span className="priority-badge">#{index + 1}</span>
                  <h3
                    className="heading-3 text-primary project-name-link"
                  >
                    {project.name}
                  </h3>
                  <div className="project-status-wrapper" onClick={e => e.stopPropagation()}>
                    <button
                      className={`badge ${STATUS_COLORS[project.status] || 'badge-secondary'} project-status-btn`}
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      title="Cambiar estado"
                    >
                      {STATUS_LABELS[project.status] || project.status}
                      <Icon name="chevron-down" size={12} />
                    </button>
                    {showStatusMenu && (
                      <div className="project-status-menu" onMouseLeave={() => setShowStatusMenu(false)}>
                        {PROJECT_STATUSES.map(status => (
                          <button
                            key={status.id}
                            className={`project-status-option ${project.status === status.id ? 'active' : ''}`}
                            onClick={() => {
                              if (project.status !== status.id) {
                                onUpdate(project.id, { status: status.id });
                              }
                              setShowStatusMenu(false);
                            }}
                          >
                            <Icon name={status.icon} size={14} />
                            <span>{status.label}</span>
                            {project.status === status.id && <Icon name="check" size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {risksCount > 0 && (
                    <span className="badge badge-warning flex items-center gap-xs">
                      <Icon name="alert-triangle" size={12} />
                      {risksCount} {risksCount === 1 ? 'riesgo' : 'riesgos'}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-secondary mb-sm">{project.description}</p>
                )}
                <div className="flex items-center gap-md text-xs text-tertiary">
                  <span className="flex items-center gap-xs">
                    <Icon name="calendar" size={14} />
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </span>
                  <span className="badge badge-secondary">{project.type}</span>
                  <span className="flex items-center gap-xs">
                    <Icon name="check-square" size={14} />
                    {projectTasks.length} {projectTasks.length === 1 ? 'tarea' : 'tareas'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-xs" onClick={e => e.stopPropagation()}>
              <button
                className="btn btn-icon btn-ghost"
                onClick={() => setShowRiskModal(true)}
                title="Gestionar riesgos"
              >
                <Icon name="alert-triangle" size={18} />
              </button>
              <button
                className="btn btn-icon btn-ghost"
                onClick={() => onDelete(project.id)}
                title="Eliminar proyecto"
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
          </div>
          {project.progress > 0 && (
            <div className="project-progress mt-sm">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
              </div>
              <span className="text-xs text-tertiary">{project.progress}%</span>
            </div>
          )}
        </div>
      </div>

      {showRiskModal && (
        <ProjectRiskModal
          project={project}
          users={users}
          tasks={projectTasks}
          risks={projectRisks}
          onClose={() => setShowRiskModal(false)}
          onSave={onRisksChange}
        />
      )}
    </>
  );
};

const UnassignedTasksSection = ({ tasks, columns, projects, onTaskClick, onTaskUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState(null);

  const unassignedTasks = tasks.filter(t => !t.projectId && !t.proyectoId);

  if (unassignedTasks.length === 0) return null;

  const getColumnName = (statusId) => {
    const col = columns.find(c => c.id === statusId);
    return col?.name || statusId;
  };

  const handleAssignProject = async (taskId, projectId) => {
    await onTaskUpdate(taskId, { projectId });
    setAssigningTaskId(null);
  };

  return (
    <div className="unassigned-tasks-section mt-base">
      <button
        className="unassigned-tasks-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-sm">
          <Icon name="inbox" size={18} />
          <span className="text-base font-medium">Tareas sin proyecto</span>
          <span className="badge badge-secondary">{unassignedTasks.length}</span>
        </div>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
      </button>

      {expanded && (
        <div className="unassigned-tasks-list">
          {unassignedTasks.map(task => (
            <div key={task.id} className="unassigned-task-row">
              <div
                className="flex items-center gap-sm flex-1 unassigned-task-info"
                onClick={() => onTaskClick(task)}
              >
                <span className="text-sm text-primary">{task.title}</span>
                <span className="badge badge-secondary text-xs">{getColumnName(task.status)}</span>
                {task.storyPoints > 0 && (
                  <span className="text-xs text-tertiary">{task.storyPoints} SP</span>
                )}
              </div>
              <div className="unassigned-task-assign">
                {assigningTaskId === task.id ? (
                  <select
                    className="select select-sm"
                    autoFocus
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleAssignProject(task.id, e.target.value);
                    }}
                    onBlur={() => setAssigningTaskId(null)}
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    className="btn btn-sm btn-ghost text-xs"
                    onClick={() => setAssigningTaskId(task.id)}
                    title="Asignar a proyecto"
                  >
                    <Icon name="folder-plus" size={14} />
                    <span>Asignar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'ID',
    status: 'planning',
    progress: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Nuevo Proyecto</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Proyecto *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del proyecto"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Descripcion</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripcion del proyecto"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Proyecto *</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="ID">ID</option>
              <option value="Functionality">Functionality</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Inicio</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Fecha de Fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectRiskModal = ({ project, users, tasks, risks, onClose, onSave }) => {
  const [localRisks, setLocalRisks] = useState(risks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [generalRisk, setGeneralRisk] = useState(() => {
    // Buscar si existe un riesgo general (sin usuarioId)
    const existingGeneralRisk = risks.find(r => !r.usuarioId && !r.userId);
    return {
      porcentajeExtra: existingGeneralRisk?.porcentajeExtra || existingGeneralRisk?.extraPercentage || 0,
      razon: existingGeneralRisk?.razon || existingGeneralRisk?.reason || ''
    };
  });
  const [formData, setFormData] = useState({
    usuarioId: '',
    tipo: 'proyecto',
    tareaId: '',
    porcentajeExtra: 0.2,
    diasExtra: 0,
    razon: ''
  });

  const handleAdd = () => {
    setEditingIndex(null);
    setFormData({
      usuarioId: users[0]?.id || '',
      tipo: 'proyecto',
      tareaId: '',
      porcentajeExtra: 0.2,
      diasExtra: 0,
      razon: ''
    });
    setShowAddForm(true);
  };

  const handleEdit = (index) => {
    const riesgo = localRisks[index];
    setEditingIndex(index);
    setFormData({
      usuarioId: riesgo.usuarioId || riesgo.userId,
      tipo: riesgo.tareaId || riesgo.taskId ? 'tarea' : 'proyecto',
      tareaId: riesgo.tareaId || riesgo.taskId || '',
      porcentajeExtra: riesgo.porcentajeExtra || riesgo.extraPercentage || 0,
      diasExtra: riesgo.diasExtra || riesgo.extraDays || 0,
      razon: riesgo.razon || riesgo.reason || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (index) => {
    const nuevosRiesgos = localRisks.filter((_, i) => i !== index);
    setLocalRisks(nuevosRiesgos);
  };

  const handleSaveRisk = () => {
    const nuevoRiesgo = {
      usuarioId: formData.usuarioId,
      proyectoId: project.id,
      ...(formData.tipo === 'tarea' && formData.tareaId
        ? { tareaId: formData.tareaId }
        : {}),
      porcentajeExtra: parseFloat(formData.porcentajeExtra),
      diasExtra: parseInt(formData.diasExtra) || 0,
      razon: formData.razon
    };

    let nuevosRiesgos;
    if (editingIndex !== null) {
      nuevosRiesgos = localRisks.map((r, i) => (i === editingIndex ? nuevoRiesgo : r));
    } else {
      nuevosRiesgos = [...localRisks, nuevoRiesgo];
    }

    setLocalRisks(nuevosRiesgos);
    setShowAddForm(false);
  };

  const handleSaveAll = () => {
    // Filtrar riesgos que no son generales (tienen usuarioId)
    const userSpecificRisks = localRisks.filter(r => r.usuarioId || r.userId);

    // Agregar riesgo general si existe
    const allRisks = [...userSpecificRisks];
    if (generalRisk.porcentajeExtra > 0 && generalRisk.razon) {
      allRisks.push({
        proyectoId: project.id,
        porcentajeExtra: generalRisk.porcentajeExtra,
        razon: generalRisk.razon,
        // Sin usuarioId para indicar que es riesgo general
      });
    }

    onSave(allRisks);
    onClose();
  };

  const getNombreUsuario = (usuarioId) => {
    const usuario = users.find(u => u.id === usuarioId);
    return usuario?.displayName || usuario?.nombre || usuarioId;
  };

  const getNombreTarea = (tareaId) => {
    const tarea = tasks.find(t => t.id === tareaId);
    return tarea?.title || tarea?.nombre || tareaId;
  };

  const getRiskLevel = (porcentaje) => {
    if (porcentaje >= 0.5) return { label: 'Alto', color: 'badge-error' };
    if (porcentaje >= 0.2) return { label: 'Medio', color: 'badge-warning' };
    return { label: 'Bajo', color: 'badge-success' };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="heading-3 text-primary mb-xs">Factores de Riesgo</h3>
            <p className="text-sm text-secondary">{project.name}</p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {!showAddForm ? (
          <>
            <div className="p-base" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {/* Riesgo General del Proyecto */}
              <div className="mb-base">
                <h4 className="text-sm font-semibold text-primary mb-sm flex items-center gap-xs">
                  <Icon name="alert-circle" size={16} />
                  Riesgo General del Proyecto
                </h4>
                <div className="card">
                  <div className="card-body p-base">
                    <div className="form-group mb-sm">
                      <label className="label">Nivel de Incertidumbre *</label>
                      <select
                        className="select"
                        value={generalRisk.porcentajeExtra}
                        onChange={(e) => setGeneralRisk({ ...generalRisk, porcentajeExtra: parseFloat(e.target.value) })}
                      >
                        <option value="0">0% - Sin riesgo general</option>
                        <option value="0.05">5% - Muy bajo</option>
                        <option value="0.1">10% - Bajo</option>
                        <option value="0.15">15% - Medio-bajo</option>
                        <option value="0.2">20% - Medio</option>
                        <option value="0.3">30% - Medio-alto</option>
                        <option value="0.4">40% - Alto</option>
                        <option value="0.5">50% - Muy alto</option>
                        <option value="0.75">75% - Crítico</option>
                        <option value="1.0">100% - Duplica tiempo</option>
                      </select>
                      <p className="text-xs text-tertiary mt-xs">
                        Se aplica a todas las tareas del proyecto
                      </p>
                    </div>

                    {generalRisk.porcentajeExtra > 0 && (
                      <div className="form-group">
                        <label className="label">Razón *</label>
                        <textarea
                          className="textarea"
                          value={generalRisk.razon}
                          onChange={(e) => setGeneralRisk({ ...generalRisk, razon: e.target.value })}
                          placeholder="Ej: Estimaciones basadas en supuestos no confirmados, nueva tecnología, requisitos poco claros..."
                          rows="2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Riesgos por Usuario */}
              <div className="mb-base">
                <h4 className="text-sm font-semibold text-primary mb-sm flex items-center gap-xs">
                  <Icon name="users" size={16} />
                  Riesgos por Usuario/Tarea
                </h4>
                <button className="btn btn-primary flex items-center gap-xs" onClick={handleAdd}>
                  <Icon name="plus" size={18} />
                  Agregar Riesgo Específico
                </button>
              </div>

              {localRisks.filter(r => r.usuarioId || r.userId).length === 0 ? (
                <div className="empty-state py-lg">
                  <Icon name="user-x" size={48} className="text-tertiary" />
                  <p className="text-base text-secondary">No hay riesgos específicos por usuario</p>
                  <p className="text-sm text-tertiary">
                    Los riesgos específicos se aplican a usuarios o tareas concretas
                  </p>
                </div>
              ) : (
                <div>
                  {localRisks.filter(r => r.usuarioId || r.userId).map((riesgo, index) => {
                  const porcentaje = riesgo.porcentajeExtra || riesgo.extraPercentage || 0;
                  const diasExtra = riesgo.diasExtra || riesgo.extraDays || 0;
                  const riskLevel = getRiskLevel(porcentaje);
                  const tareaId = riesgo.tareaId || riesgo.taskId;

                  return (
                    <div key={index} className="card mb-sm">
                      <div className="card-body p-base">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-sm mb-xs">
                              <span className={`badge ${riskLevel.color}`}>{riskLevel.label}</span>
                              <span className="text-base font-medium text-primary">
                                {getNombreUsuario(riesgo.usuarioId || riesgo.userId)}
                              </span>
                            </div>

                            <div className="text-sm">
                              {tareaId && (
                                <p className="mb-xs text-secondary flex items-center gap-xs">
                                  <Icon name="check-square" size={14} />
                                  <strong>Tarea:</strong> {getNombreTarea(tareaId)}
                                </p>
                              )}
                              {!tareaId && (
                                <p className="mb-xs text-secondary flex items-center gap-xs">
                                  <Icon name="folder" size={14} />
                                  <strong>Todo el proyecto</strong>
                                </p>
                              )}

                              <p className="mb-xs text-secondary flex items-center gap-xs">
                                <Icon name="clock" size={14} />
                                <strong>Impacto:</strong> +{(porcentaje * 100).toFixed(0)}%
                                {diasExtra > 0 && ` + ${diasExtra} días`}
                              </p>

                              {riesgo.razon && (
                                <p className="text-tertiary flex items-center gap-xs">
                                  <Icon name="info" size={14} />
                                  {riesgo.razon || riesgo.reason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-xs">
                            <button
                              className="btn btn-icon btn-sm btn-ghost"
                              onClick={() => handleEdit(index)}
                              title="Editar"
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              className="btn btn-icon btn-sm btn-ghost"
                              onClick={() => handleDelete(index)}
                              title="Eliminar"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>

            <div className="modal-footer flex justify-end gap-sm">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveAll}
                disabled={generalRisk.porcentajeExtra > 0 && !generalRisk.razon}
                title={generalRisk.porcentajeExtra > 0 && !generalRisk.razon ? 'Debes agregar una razón para el riesgo general' : ''}
              >
                Guardar Cambios
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-base">
              <h4 className="text-base font-medium text-primary mb-base">
                {editingIndex !== null ? 'Editar' : 'Agregar'} Factor de Riesgo
              </h4>

              <div className="form-group">
                <label className="label">Usuario Afectado *</label>
                <select
                  className="select"
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                >
                  {users.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.displayName || usuario.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Aplicar a *</label>
                <select
                  className="select"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="proyecto">Todo el proyecto</option>
                  <option value="tarea">Tarea específica</option>
                </select>
              </div>

              {formData.tipo === 'tarea' && (
                <div className="form-group">
                  <label className="label">Tarea *</label>
                  <select
                    className="select"
                    value={formData.tareaId}
                    onChange={(e) => setFormData({ ...formData, tareaId: e.target.value })}
                  >
                    <option value="">Seleccionar tarea...</option>
                    {tasks.map(tarea => (
                      <option key={tarea.id} value={tarea.id}>
                        {tarea.title || tarea.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="label">Porcentaje Extra *</label>
                <select
                  className="select"
                  value={formData.porcentajeExtra}
                  onChange={(e) => setFormData({ ...formData, porcentajeExtra: parseFloat(e.target.value) })}
                >
                  <option value="0.1">10% - Riesgo bajo</option>
                  <option value="0.2">20% - Riesgo medio-bajo</option>
                  <option value="0.3">30% - Riesgo medio</option>
                  <option value="0.5">50% - Riesgo alto</option>
                  <option value="0.75">75% - Riesgo muy alto</option>
                  <option value="1.0">100% - Duplica tiempo</option>
                </select>
                <p className="text-xs text-tertiary mt-xs">
                  Se añade este porcentaje al tiempo estimado de la tarea
                </p>
              </div>

              <div className="form-group">
                <label className="label">Días Extra (opcional)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.diasExtra}
                  onChange={(e) => setFormData({ ...formData, diasExtra: e.target.value })}
                  min="0"
                  placeholder="0"
                />
                <p className="text-xs text-tertiary mt-xs">
                  Días fijos adicionales (además del porcentaje)
                </p>
              </div>

              <div className="form-group">
                <label className="label">Razón *</label>
                <textarea
                  className="textarea"
                  value={formData.razon}
                  onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
                  placeholder="Ej: Usuario junior en esta tecnología, complejidad alta, etc."
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer flex justify-end gap-sm">
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Volver
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveRisk}
                disabled={!formData.usuarioId || !formData.razon || (formData.tipo === 'tarea' && !formData.tareaId)}
              >
                {editingIndex !== null ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;
