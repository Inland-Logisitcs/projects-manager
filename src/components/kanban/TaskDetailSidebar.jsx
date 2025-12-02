import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import Icon from '../common/Icon';
import RichTextEditor from '../editors/RichTextEditor';
import AttachmentsList from '../files/AttachmentsList';
import UserSelect from '../common/UserSelect';
import UserAvatar from '../common/UserAvatar';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import { updateTask, archiveTask } from '../../services/taskService';
import { cleanupUnusedImages } from '../../utils/imageCleanup';
import '../../styles/TaskDetailSidebar.css';

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const TaskDetailSidebar = ({ task, columns, onClose }) => {
  const sidebarRef = useRef(null);
  const userSelectRef = useRef(null);
  const [description, setDescription] = useState(task.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

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

    // Calcular duración en cada estado
    return history.map((entry, index) => {
      let duration = null;

      if (index === 0) {
        // Es el movimiento más reciente (estado actual), calcular hasta ahora
        const now = new Date();
        const diffMs = now - entry.timestamp;
        duration = formatDuration(diffMs);
      } else {
        // Hay un movimiento anterior (más reciente), calcular duración
        const prevEntry = history[index - 1];
        const diffMs = prevEntry.timestamp - entry.timestamp;
        duration = formatDuration(diffMs);
      }

      return {
        ...entry,
        duration
      };
    });
  }, [task.movementHistory]);

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
          <section className="sidebar-section">
            <h3 className="heading-3 text-primary mb-base">{task.title}</h3>

            <div className="task-meta flex flex-col gap-base">
              <div className="flex items-center gap-sm">
                <span className="text-sm text-secondary font-medium">Estado:</span>
                <span className="text-base text-primary">{getColumnName(task.status)}</span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-sm text-secondary font-medium">Prioridad:</span>
                <span className={`priority-badge priority-${task.priority}`}>
                  {priorityLabels[task.priority]}
                </span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-sm text-secondary font-medium">Asignado a:</span>
                <div className="user-assignment" ref={userSelectRef}>
                  {task.assignedTo ? (
                    <div
                      onClick={() => setShowUserSelect(!showUserSelect)}
                      style={{ cursor: 'pointer' }}
                    >
                      <UserAvatar userId={task.assignedTo} size={28} showName={true} />
                    </div>
                  ) : (
                    <button
                      className="btn-assign-user-sidebar"
                      onClick={() => setShowUserSelect(!showUserSelect)}
                    >
                      <Icon name="user-plus" size={16} />
                      <span>Asignar usuario</span>
                    </button>
                  )}
                  {showUserSelect && (
                    <div className="user-select-dropdown-sidebar">
                      <UserSelect
                        value={task.assignedTo}
                        onChange={async (userId) => {
                          const result = await updateTask(task.id, { assignedTo: userId });
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
              </div>
            </div>

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
                <div className="description-content">
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
            <h4 className="heading-4 text-secondary flex items-center gap-xs mb-base">
              <Icon name="paperclip" size={18} />
              Archivos Adjuntos
            </h4>
            <AttachmentsList
              attachments={task.attachments || []}
              taskId={task.id}
              onAttachmentsChange={handleAttachmentsChange}
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
                  <span className="date-value">{formatDateTime(task.lastStatusChange)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Historial de movimientos */}
          <section className="sidebar-section">
            <h4 className="heading-4 text-secondary flex items-center gap-xs mb-base">
              <Icon name="timeline" size={18} />
              Historial de Movimientos
            </h4>

            {historyWithDuration.length > 0 ? (
              <div className="movement-timeline">
                {historyWithDuration.map((entry, index) => (
                  <div key={index} className="timeline-entry">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <span className="timeline-movement">
                        <strong>{getColumnName(entry.from)}</strong>
                        <Icon name="arrow-right" size={12} />
                        <strong>{getColumnName(entry.to)}</strong>
                      </span>
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
            ) : (
              <div className="empty-history flex flex-col items-center justify-center p-3xl text-secondary text-center">
                <Icon name="empty" size={32} className="mb-base opacity-50" />
                <p className="text-sm m-0">Esta tarea no ha sido movida entre columnas aún.</p>
              </div>
            )}
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
