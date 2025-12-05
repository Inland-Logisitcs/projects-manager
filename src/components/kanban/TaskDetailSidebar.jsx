import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import Icon from '../common/Icon';
import RichTextEditor from '../editors/RichTextEditor';
import AttachmentsList from '../files/AttachmentsList';
import UserSelect from '../common/UserSelect';
import UserAvatar from '../common/UserAvatar';
import StoryPointsSelect from '../common/StoryPointsSelect';
import ProjectSelect from '../common/ProjectSelect';
import TaskComments from './TaskComments';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import { updateTask, archiveTask } from '../../services/taskService';
import { subscribeToUsers } from '../../services/userService';
import { subscribeToProjects } from '../../services/projectService';
import { cleanupUnusedImages } from '../../utils/imageCleanup';
import '../../styles/TaskDetailSidebar.css';

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const TaskDetailSidebar = ({ task, columns, allTasks = [], onClose }) => {
  const sidebarRef = useRef(null);
  const userSelectRef = useRef(null);
  const projectSelectRef = useRef(null);
  const [description, setDescription] = useState(task.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title || '');

  // Cargar usuarios
  useEffect(() => {
    const unsubscribe = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });
    return () => unsubscribe();
  }, []);

  // Cargar proyectos
  useEffect(() => {
    const unsubscribe = subscribeToProjects((fetchedProjects) => {
      setProjects(fetchedProjects);
    });
    return () => unsubscribe();
  }, []);

  // Actualizar descripción cuando cambia la tarea externamente
  useEffect(() => {
    setDescription(task.description || '');
  }, [task.description]);

  // Cerrar sidebar con limpieza
  const handleClose = useCallback(async () => {
    // Si estaba editando y hay cambios sin guardar, limpiar imágenes huérfanas
    if (isEditingDescription && description !== task.description) {
      await cleanupUnusedImages(description, task.description, task.id);
    }
    onClose();
  }, [isEditingDescription, description, task.description, task.id, onClose]);

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

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        handleClose();
      }
    };

    // Pequeño delay para evitar que el click de apertura cierre el sidebar
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClose]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  // Obtener el nombre de la columna por su ID
  const getColumnName = (columnId) => {
    const column = columns.find(c => c.id === columnId);
    return column ? column.title : columnId;
  };

  // Obtener el color de la columna por su ID
  const getColumnColor = (columnId) => {
    const column = columns.find(c => c.id === columnId);
    return column ? column.color : '#3b82f6';
  };

  // Obtener el nombre de usuario por su ID
  const getUserName = (userId) => {
    if (!userId) return 'Sin asignar';
    const user = users.find(u => u.id === userId);
    return user ? (user.displayName || user.email) : 'Usuario desconocido';
  };

  // Obtener el nombre del proyecto por su ID
  const getProjectName = (projectId) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Proyecto desconocido';
  };

  // Obtener las tareas que dependen de esta tarea
  const getDependentTasks = () => {
    if (!task.dependencies || task.dependencies.length === 0) return [];
    return task.dependencies.map(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return depTask || { id: depId, title: 'Tarea no encontrada' };
    });
  };

  // Formatear duración de tiempo
  const formatDuration = (ms) => {
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);

    if (mins < 1) return 'menos de 1 minuto';
    if (mins < 60) return `${mins} minuto${mins !== 1 ? 's' : ''}`;
    if (hours < 24) return `${hours} hora${hours !== 1 ? 's' : ''}`;
    return `${days} día${days !== 1 ? 's' : ''}`;
  };

  // Guardar título editado
  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      const result = await updateTask(task.id, { title: editedTitle.trim() });
      if (!result.success) {
        setToast({ message: 'Error al actualizar título: ' + result.error, type: 'error' });
        setEditedTitle(task.title); // Revertir en caso de error
      }
    } else {
      setEditedTitle(task.title); // Revertir si está vacío o sin cambios
    }
    setIsEditingTitle(false);
  };

  // Manejar tecla Enter o Escape al editar título
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  // Calcular tiempo en cada estado del historial
  const historyWithDuration = useMemo(() => {
    if (!task.movementHistory || task.movementHistory.length === 0) {
      return [];
    }

    const history = [...task.movementHistory].map(entry => ({
      ...entry,
      timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp)
    }));

    // Ordenar por fecha (más reciente primero)
    history.sort((a, b) => b.timestamp - a.timestamp);

    // Calcular duración solo para cambios de estado
    return history.map((entry, index) => {
      let duration = null;

      // Solo calcular duración para cambios de estado
      if (entry.type === 'status_change' || !entry.type) { // !entry.type para mantener compatibilidad con datos antiguos
        if (index === 0) {
          // Es el movimiento más reciente (estado actual), calcular hasta ahora
          const now = new Date();
          const diffMs = now - entry.timestamp;
          duration = formatDuration(diffMs);
        } else {
          // Buscar el siguiente cambio de estado (hacia atrás en el tiempo)
          const nextStatusChange = history.slice(0, index).find(h => h.type === 'status_change' || !h.type);
          if (nextStatusChange) {
            const diffMs = nextStatusChange.timestamp - entry.timestamp;
            duration = formatDuration(diffMs);
          }
        }
      }

      return {
        ...entry,
        duration
      };
    });
  }, [task.movementHistory]);

  // Calcular tiempo en la columna actual
  const timeInCurrentColumn = useMemo(() => {
    if (!task.lastStatusChange) return null;
    const lastChange = task.lastStatusChange.toDate ? task.lastStatusChange.toDate() : new Date(task.lastStatusChange);
    const now = new Date();
    const diffMs = now - lastChange;
    return formatDuration(diffMs);
  }, [task.lastStatusChange]);

  // Formatear fecha y hora
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Guardar descripción
  const handleSaveDescription = async () => {
    setIsSaving(true);

    // Actualizar descripción en Firestore
    // Nota: Las imágenes eliminadas ya fueron limpiadas automáticamente por el editor
    const result = await updateTask(task.id, { description });
    setIsSaving(false);
    if (result.success) {
      setIsEditingDescription(false);
    }
  };

  // Cancelar edición de descripción
  const handleCancelDescription = async () => {
    // Limpiar imágenes que se subieron pero no se guardaron
    await cleanupUnusedImages(description, task.description, task.id);

    setDescription(task.description || '');
    setIsEditingDescription(false);
  };

  // Manejar cambios en adjuntos
  const handleAttachmentsChange = async (newAttachments) => {
    const result = await updateTask(task.id, { attachments: newAttachments });
    if (!result.success) {
      setToast({ message: 'Error al actualizar adjuntos: ' + result.error, type: 'error' });
    }
  };

  // Archivar tarea
  const handleArchiveTask = async () => {
    const result = await archiveTask(task.id);
    if (result.success) {
      setToast({ message: 'Tarea archivada exitosamente', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setToast({ message: 'Error al archivar tarea: ' + result.error, type: 'error' });
    }
    setShowArchiveDialog(false);
  };

  return (
    <div className="sidebar-overlay">
      <div ref={sidebarRef} className="task-sidebar">
        {/* Header */}
        <div className="sidebar-header flex justify-between items-center p-lg border-b-light">
          <div>
            <h2 className="heading-2 text-primary m-0">Detalles de la Tarea</h2>
          </div>
          <div className="flex items-center gap-xs">
            <button
              className="btn btn-icon btn-danger"
              onClick={() => setShowArchiveDialog(true)}
              title="Archivar tarea"
            >
              <Icon name="archive" size={20} />
            </button>
            <button className="btn btn-icon" onClick={handleClose} title="Cerrar (Esc)">
              <Icon name="x" size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="sidebar-content">
          {/* Información principal */}
          <section className="sidebar-section section-header-integrated">
            <div className="task-header-row">
              {isEditingTitle ? (
                <input
                  type="text"
                  className="task-title-input"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                />
              ) : (
                <h2
                  className="task-title-integrated editable-title"
                  onClick={() => setIsEditingTitle(true)}
                  title="Click para editar"
                >
                  {task.title}
                </h2>
              )}
              <div className="task-meta-badges">
                <span
                  className={`priority-badge priority-${task.priority} has-tooltip`}
                  data-tooltip="Prioridad"
                >
                  {priorityLabels[task.priority]}
                </span>
                <span
                  className="status-badge-integrated has-tooltip"
                  data-tooltip="Estado actual"
                  style={{ backgroundColor: getColumnColor(task.status) }}
                >
                  {getColumnName(task.status)}
                </span>
              </div>
            </div>

            <div className="task-assignee-row flex items-center gap-sm" ref={userSelectRef}>
              {task.assignedTo ? (
                <div
                  onClick={() => setShowUserSelect(!showUserSelect)}
                  className="assignee-chip-integrated"
                  title="Cambiar asignación"
                >
                  <UserAvatar userId={task.assignedTo} size={24} showName={true} />
                </div>
              ) : (
                <div
                  className="btn-assign-integrated"
                  onClick={() => setShowUserSelect(!showUserSelect)}
                  title="Asignar a un usuario"
                >
                  <span>Sin asignar</span>
                </div>
              )}
              <StoryPointsSelect
                value={task.storyPoints}
                onChange={async (storyPoints) => {
                  const result = await updateTask(task.id, { storyPoints });
                  if (!result.success) {
                    setToast({ message: 'Error al actualizar story points: ' + result.error, type: 'error' });
                  }
                }}
                size="small"
              />
              {showUserSelect && (
                <div className="user-select-dropdown-sidebar">
                  <UserSelect
                    value={task.assignedTo}
                    onChange={async (userId) => {
                      const result = await updateTask(task.id, {
                        assignedTo: userId,
                        previousAssignedTo: task.assignedTo || null
                      });
                      if (!result.success) {
                        setToast({ message: 'Error al asignar usuario: ' + result.error, type: 'error' });
                      }
                      setShowUserSelect(false);
                    }}
                    mode="list"
                  />
                </div>
              )}
            </div>

            <div className="task-project-row flex items-center gap-sm mt-sm" ref={projectSelectRef}>
              {task.projectId ? (
                <div
                  onClick={() => setShowProjectSelect(!showProjectSelect)}
                  className="assignee-chip-integrated"
                  title="Cambiar proyecto"
                >
                  <Icon name="folder" size={16} className="text-secondary" />
                  <span className="text-sm text-secondary">{getProjectName(task.projectId)}</span>
                </div>
              ) : (
                <div
                  className="btn-assign-integrated"
                  onClick={() => setShowProjectSelect(!showProjectSelect)}
                  title="Asignar a un proyecto"
                >
                  <Icon name="folder" size={16} />
                  <span>Sin proyecto</span>
                </div>
              )}
              {showProjectSelect && (
                <div className="user-select-dropdown-sidebar">
                  <ProjectSelect
                    value={task.projectId}
                    onChange={async (projectId) => {
                      const result = await updateTask(task.id, {
                        projectId: projectId || null
                      });
                      if (!result.success) {
                        setToast({ message: 'Error al asignar proyecto: ' + result.error, type: 'error' });
                      }
                      setShowProjectSelect(false);
                    }}
                    mode="list"
                  />
                </div>
              )}
            </div>

            {/* Dependencias */}
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="dependencies-section mt-base">
                <div className="flex items-center gap-sm mb-sm">
                  <Icon name="arrow-right" size={16} className="text-tertiary" />
                  <span className="text-sm text-tertiary font-medium">Dependencias</span>
                </div>
                <div className="dependencies-list flex flex-col gap-xs">
                  {getDependentTasks().map((depTask) => (
                    <div key={depTask.id} className="dependency-item flex items-center gap-sm p-sm border-b-light">
                      <Icon name="list" size={14} className="text-secondary" />
                      <span className="text-sm text-secondary">{depTask.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="description-section">
              <div className="description-header">
                <h4>Descripción</h4>
                {!isEditingDescription ? (
                  <button
                    className="btn-edit-description"
                    onClick={() => setIsEditingDescription(true)}
                    title="Editar descripción"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                ) : (
                  <div className="description-actions">
                    <button
                      className="btn-save-description"
                      onClick={handleSaveDescription}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      className="btn-cancel-description"
                      onClick={handleCancelDescription}
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              {isEditingDescription ? (
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Escribe una descripción para esta tarea..."
                  taskId={task.id}
                />
              ) : (
                <div
                  className="description-content"
                  onClick={() => setIsEditingDescription(true)}
                  style={{ cursor: 'pointer' }}
                  title="Click para editar"
                >
                  {description ? (
                    <RichTextEditor
                      value={description}
                      readOnly={true}
                      taskId={task.id}
                    />
                  ) : (
                    <p className="no-description">Sin descripción</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Archivos adjuntos */}
          <section className="sidebar-section">
            <div className="flex items-center justify-between mb-base">
              <h4 className="heading-4 text-secondary flex items-center gap-xs m-0">
                <Icon name="paperclip" size={18} />
                Archivos Adjuntos
              </h4>
              <button
                className="btn-add-attachment"
                onClick={() => document.getElementById(`file-input-${task.id}`)?.click()}
                title="Adjuntar archivo"
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
            <AttachmentsList
              attachments={task.attachments || []}
              taskId={task.id}
              onAttachmentsChange={handleAttachmentsChange}
              showUploadButton={false}
              fileInputId={`file-input-${task.id}`}
            />
          </section>

          {/* Fechas */}
          <section className="sidebar-section">
            <h4 className="heading-4 text-secondary mb-base">Información temporal</h4>
            <div className="date-info flex flex-col gap-base">
              <div className="date-item">
                <Icon name="calendar" size={16} />
                <div>
                  <span className="date-label">Creada:</span>
                  <span className="date-value">{formatDateTime(task.createdAt)}</span>
                </div>
              </div>
              <div className="date-item">
                <Icon name="clock" size={16} />
                <div>
                  <span className="date-label">En columna actual desde:</span>
                  <span className="date-value">
                    {formatDateTime(task.lastStatusChange)}
                    {timeInCurrentColumn && <span className="text-tertiary"> ({timeInCurrentColumn})</span>}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Historial de movimientos */}
          <section className="sidebar-section">
            <h4 className="heading-4 text-secondary flex items-center gap-xs mb-base">
              <Icon name="timeline" size={18} />
              Historial de Movimientos
              {historyWithDuration.length > 0 && (
                <span className="history-count">{historyWithDuration.length}</span>
              )}
            </h4>

            {historyWithDuration.length > 0 ? (
              <>
                <div className="movement-timeline">
                  {(showAllHistory ? historyWithDuration : historyWithDuration.slice(0, 5)).map((entry, index) => (
                    <div key={index} className="timeline-entry">
                      <div className="timeline-marker" style={{
                        backgroundColor: entry.type === 'assignment_change' ? '#f59e0b' : '#015E7C'
                      }}></div>
                      <div className="timeline-content">
                        {entry.type === 'assignment_change' ? (
                          <span className="timeline-movement">
                            <Icon name="user" size={12} />
                            <strong>{getUserName(entry.from)}</strong>
                            <Icon name="arrow-right" size={12} />
                            <strong>{getUserName(entry.to)}</strong>
                          </span>
                        ) : entry.from === null && entry.to !== null ? (
                          <span className="timeline-movement">
                            <Icon name="check-circle" size={12} />
                            Registrado en <strong>{getColumnName(entry.to)}</strong>
                          </span>
                        ) : entry.to === null && entry.from !== null ? (
                          <span className="timeline-movement">
                            <Icon name="x-circle" size={12} />
                            Removido de <strong>{getColumnName(entry.from)}</strong>
                          </span>
                        ) : (
                          <span className="timeline-movement">
                            <strong>{getColumnName(entry.from)}</strong>
                            <Icon name="arrow-right" size={12} />
                            <strong>{getColumnName(entry.to)}</strong>
                          </span>
                        )}
                        <div className="timeline-details">
                          <span className="timeline-date">
                            {entry.timestamp.toLocaleDateString('es-ES', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {entry.duration && (
                            <span className="timeline-duration">
                              • {entry.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {historyWithDuration.length > 5 && (
                  <button
                    className="btn-show-more"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                  >
                    <Icon name={showAllHistory ? 'chevron-up' : 'chevron-down'} size={16} />
                    {showAllHistory ? 'Ver menos' : `Ver ${historyWithDuration.length - 5} más`}
                  </button>
                )}
              </>
            ) : (
              <div className="empty-history flex flex-col items-center justify-center p-3xl text-secondary text-center">
                <Icon name="empty" size={32} className="mb-base opacity-50" />
                <p className="text-sm m-0">Esta tarea no ha sido movida entre columnas aún.</p>
              </div>
            )}
          </section>

          {/* Comentarios */}
          <section className="sidebar-section">
            <h4 className="heading-4 text-secondary flex items-center gap-xs mb-base">
              <Icon name="message-square" size={18} />
              Comentarios
              {task.comments && task.comments.length > 0 && (
                <span className="history-count">{task.comments.length}</span>
              )}
            </h4>
            <TaskComments
              taskId={task.id}
              comments={task.comments || []}
            />
          </section>
        </div>

        {/* Diálogo de confirmación de archivado */}
        <ConfirmDialog
          isOpen={showArchiveDialog}
          title="Archivar Tarea"
          message="¿Estás seguro de que deseas archivar esta tarea? Podrás restaurarla desde la sección de tareas archivadas."
          confirmText="Archivar"
          cancelText="Cancelar"
          confirmVariant="danger"
          onConfirm={handleArchiveTask}
          onCancel={() => setShowArchiveDialog(false)}
        />

        {/* Toast para errores */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TaskDetailSidebar;
