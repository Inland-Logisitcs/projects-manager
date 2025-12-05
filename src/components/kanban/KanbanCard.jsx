import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import UserSelect from '../common/UserSelect';
import StoryPointsSelect from '../common/StoryPointsSelect';
import { updateTask } from '../../services/taskService';

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const KanbanCard = ({ task, isDragging, onDelete }) => {
  const [showUserSelect, setShowUserSelect] = useState(false);
  const userSelectRef = useRef(null);

  // Cerrar menú al hacer click fuera
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1
  };


  // Calcular tiempo en la columna actual
  const getTimeInColumn = () => {
    if (!task.lastStatusChange) return null;

    const now = new Date();
    const changeDate = task.lastStatusChange.toDate ? task.lastStatusChange.toDate() : new Date(task.lastStatusChange);
    const diffMs = now - changeDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '<1m';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };

  const timeInColumn = getTimeInColumn();

  const handleAssignUser = async (userId) => {
    const updates = { assignedTo: userId };

    // Solo incluir previousAssignedTo si tiene un valor válido
    if (task.assignedTo) {
      updates.previousAssignedTo = task.assignedTo;
    }

    await updateTask(task.id, updates);
    setShowUserSelect(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
    >
      {/* Área principal de la tarjeta - draggable */}
      <div
        {...attributes}
        {...listeners}
        className="card-drag-area"
      >
        {/* Título de la tarea */}
        <h4 className="card-title">{task.title}</h4>

        {/* Sección de etiquetas */}
        <div className="card-tags">
          <span className={`priority-badge priority-${task.priority}`}>
            {priorityLabels[task.priority]}
          </span>
        </div>

        {/* Sección de información adicional */}
        <div className="card-info">
          <div className="card-assignee" ref={userSelectRef}>
            {task.assignedTo ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserSelect(!showUserSelect);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                style={{ cursor: 'pointer' }}
              >
                <UserAvatar userId={task.assignedTo} size={28} />
              </div>
            ) : (
              <button
                className="btn-assign-user"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserSelect(!showUserSelect);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <Icon name="user-plus" size={16} />
              </button>
            )}
            {showUserSelect && (
              <div
                className="user-select-dropdown"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <UserSelect
                  value={task.assignedTo}
                  onChange={handleAssignUser}
                  mode="list"
                />
              </div>
            )}
          </div>
          <div className="card-story-points"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            <StoryPointsSelect
              value={task.storyPoints}
              onChange={async (storyPoints) => {
                await updateTask(task.id, { storyPoints });
              }}
              size="small"
            />
          </div>
          {timeInColumn && (
            <span
              className="card-time has-tooltip"
              data-tooltip={`En esta columna desde: ${task.lastStatusChange?.toDate?.().toLocaleString('es-ES') || 'N/A'}`}
            >
              <Icon name="clock" size={14} />
              {timeInColumn}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
