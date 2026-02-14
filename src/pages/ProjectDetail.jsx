import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToProjects, updateProject } from '../services/projectService';
import { subscribeToTasks, updateTask, createTask } from '../services/taskService';
import { subscribeToColumns } from '../services/columnService';
import { subscribeToUsers } from '../services/userService';
import { PROJECT_STATUSES, STATUS_LABELS, STATUS_COLORS } from './Projects';
import Icon from '../components/common/Icon';
import Toast from '../components/common/Toast';
import UserAvatar from '../components/common/UserAvatar';
import TaskDetailSidebar from '../components/kanban/TaskDetailSidebar';
import '../styles/ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    const unsubProjects = subscribeToProjects((fetchedProjects) => {
      const found = fetchedProjects.find(p => p.id === projectId);
      setProject(found || null);
      setLoading(false);
    });

    const unsubTasks = subscribeToTasks((fetchedTasks) => {
      setAllTasks(fetchedTasks.filter(t => !t.archived));
    });

    const unsubColumns = subscribeToColumns((fetchedColumns) => {
      setColumns(fetchedColumns);
    });

    const unsubUsers = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers.filter(u => !u.disabled));
    });

    return () => {
      unsubProjects();
      unsubTasks();
      unsubColumns();
      unsubUsers();
    };
  }, [projectId]);

  const projectTasks = useMemo(() => {
    return allTasks.filter(t => (t.projectId || t.proyectoId) === projectId);
  }, [allTasks, projectId]);

  const stats = useMemo(() => {
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'completed' || t.status === 'qa').length;
    const inProgress = projectTasks.filter(t => t.status === 'in-progress').length;
    const pending = projectTasks.filter(t => t.status === 'pending').length;
    const other = total - completed - inProgress - pending;
    const totalSP = projectTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedSP = projectTasks
      .filter(t => t.status === 'completed' || t.status === 'qa')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, other, totalSP, completedSP, progressPercent };
  }, [projectTasks]);

  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterAssignee !== 'all') {
        if (filterAssignee === 'unassigned') {
          if (t.assignedTo || t.assignee) return false;
        } else {
          if ((t.assignedTo || t.assignee) !== filterAssignee) return false;
        }
      }
      return true;
    });
  }, [projectTasks, filterStatus, filterAssignee]);

  const assignedUserIds = useMemo(() => {
    const ids = new Set();
    projectTasks.forEach(t => {
      const userId = t.assignedTo || t.assignee;
      if (userId) ids.add(userId);
    });
    return Array.from(ids);
  }, [projectTasks]);

  const getColumnInfo = (statusId) => {
    const col = columns.find(c => c.id === statusId);
    return col || { title: statusId || 'Sin estado', color: '#94A3B8' };
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.displayName || user?.email || 'Sin asignar';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleUpdateProject = async (updates) => {
    const result = await updateProject(projectId, updates);
    if (!result.success) {
      setToast({ isOpen: true, message: `Error al actualizar proyecto: ${result.error}`, type: 'error' });
    }
    return result;
  };

  const handleTaskUpdate = async (taskId, updates) => {
    const result = await updateTask(taskId, updates);
    if (!result.success) {
      setToast({ isOpen: true, message: `Error al actualizar tarea: ${result.error}`, type: 'error' });
    }
    return result;
  };

  const handleSaveDescription = async () => {
    await handleUpdateProject({ description: descriptionDraft });
    setEditingDescription(false);
  };

  const handleCreateTask = async (taskData) => {
    const result = await createTask({
      ...taskData,
      projectId,
      status: 'pending'
    });
    if (result.success) {
      setShowCreateTask(false);
      setToast({ isOpen: true, message: 'Tarea creada correctamente', type: 'success' });
    } else {
      setToast({ isOpen: true, message: `Error al crear tarea: ${result.error}`, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="page-container page-container-narrow">
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container page-container-narrow">
        <div className="empty-state">
          <Icon name="alert-circle" size={48} />
          <p>Proyecto no encontrado</p>
          <button className="btn btn-primary mt-base" onClick={() => navigate('/projects')}>
            Volver a Proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast.isOpen && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ isOpen: false, message: '', type: 'error' })}
        />
      )}

      <div className="page-container page-container-narrow project-detail-page">
        {/* Back button */}
        <button
          className="btn btn-ghost flex items-center gap-xs mb-base project-detail-back"
          onClick={() => navigate('/projects')}
        >
          <Icon name="arrow-left" size={18} />
          <span>Proyectos</span>
        </button>

        {/* Header */}
        <div className="project-detail-header mb-md">
          <div className="flex items-center gap-sm flex-wrap">
            <h1 className="heading-1 text-primary">{project.name}</h1>
            <div className="project-status-wrapper">
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
                          handleUpdateProject({ status: status.id });
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
            <span className="badge badge-secondary">{project.type}</span>
          </div>
          <div className="flex items-center gap-md text-sm text-secondary mt-xs">
            <span className="flex items-center gap-xs">
              <Icon name="calendar" size={14} />
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="project-detail-stats mb-md">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total tareas</div>
          </div>
          <div className="stat-card stat-card-success">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completadas</div>
          </div>
          <div className="stat-card stat-card-primary">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">En progreso</div>
          </div>
          <div className="stat-card stat-card-warning">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completedSP}/{stats.totalSP}</div>
            <div className="stat-label">Story Points</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="project-detail-progress mb-md">
          <div className="flex justify-between items-center mb-xs">
            <span className="text-sm font-medium text-primary">Progreso general</span>
            <span className="text-sm font-medium text-primary">{stats.progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.progressPercent}%` }}></div>
          </div>
        </div>

        {/* Description */}
        <div className="card mb-md">
          <div className="card-body">
            <div className="flex justify-between items-center mb-sm">
              <h3 className="text-sm font-semibold text-secondary">Descripcion</h3>
              {!editingDescription && (
                <button
                  className="btn btn-icon btn-ghost btn-sm"
                  onClick={() => {
                    setDescriptionDraft(project.description || '');
                    setEditingDescription(true);
                  }}
                  title="Editar descripcion"
                >
                  <Icon name="edit" size={14} />
                </button>
              )}
            </div>
            {editingDescription ? (
              <div>
                <textarea
                  className="textarea"
                  value={descriptionDraft}
                  onChange={e => setDescriptionDraft(e.target.value)}
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-xs mt-sm">
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingDescription(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveDescription}>
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-base text-primary">
                {project.description || 'Sin descripcion'}
              </p>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="project-detail-tasks">
          <div className="flex justify-between items-center mb-base">
            <h2 className="heading-2 text-primary">Tareas</h2>
            <button
              className="btn btn-primary btn-sm flex items-center gap-xs"
              onClick={() => setShowCreateTask(true)}
            >
              <Icon name="plus" size={16} />
              <span>Nueva tarea</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-sm mb-base flex-wrap">
            <select
              className="select project-detail-filter"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              {columns.map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>

            <select
              className="select project-detail-filter"
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
            >
              <option value="all">Todos los usuarios</option>
              <option value="unassigned">Sin asignar</option>
              {assignedUserIds.map(uid => (
                <option key={uid} value={uid}>{getUserName(uid)}</option>
              ))}
            </select>

            {(filterStatus !== 'all' || filterAssignee !== 'all') && (
              <button
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => { setFilterStatus('all'); setFilterAssignee('all'); }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="empty-state py-xl">
              <Icon name="check-square" size={48} className="text-tertiary" />
              <p className="text-base text-secondary mt-sm">
                {projectTasks.length === 0
                  ? 'No hay tareas en este proyecto'
                  : 'No hay tareas que coincidan con los filtros'}
              </p>
            </div>
          ) : (
            <div className="project-task-list">
              <div className="project-task-list-header">
                <span className="project-task-col-title">Tarea</span>
                <span className="project-task-col-status">Estado</span>
                <span className="project-task-col-assignee">Asignado</span>
                <span className="project-task-col-sp">SP</span>
              </div>
              {filteredTasks.map(task => {
                const colInfo = getColumnInfo(task.status);
                const assigneeId = task.assignedTo || task.assignee;

                return (
                  <div
                    key={task.id}
                    className="project-task-row"
                    onClick={() => setSelectedTask(task)}
                  >
                    <span className="project-task-col-title text-sm text-primary">
                      {task.title}
                    </span>
                    <span className="project-task-col-status">
                      <span
                        className="project-task-status-badge"
                        style={{ backgroundColor: colInfo.color, color: '#fff' }}
                      >
                        {colInfo.title}
                      </span>
                    </span>
                    <span className="project-task-col-assignee">
                      <UserAvatar userId={assigneeId} size={24} showName={false} />
                    </span>
                    <span className="project-task-col-sp text-sm text-secondary">
                      {task.storyPoints || '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onSave={handleCreateTask}
          users={users}
          columns={columns}
        />
      )}

      {/* Task Detail Sidebar */}
      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          columns={columns}
          allTasks={allTasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </>
  );
};

const CreateTaskModal = ({ onClose, onSave, users, columns }) => {
  const [formData, setFormData] = useState({
    title: '',
    storyPoints: '',
    assignee: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave({
        title: formData.title.trim(),
        storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
        assignee: formData.assignee || null
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-header">Nueva Tarea</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Titulo *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nombre de la tarea"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label">Story Points</label>
            <input
              type="number"
              className="input"
              value={formData.storyPoints}
              onChange={e => setFormData({ ...formData, storyPoints: e.target.value })}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="label">Asignar a</label>
            <select
              className="select"
              value={formData.assignee}
              onChange={e => setFormData({ ...formData, assignee: e.target.value })}
            >
              <option value="">Sin asignar</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer flex justify-end gap-sm">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
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

export default ProjectDetail;
