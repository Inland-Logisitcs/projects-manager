import { useState, useRef, useMemo } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import UserSelect from '../common/UserSelect';
import StoryPointsSelect from '../common/StoryPointsSelect';
import { updateTask } from '../../services/taskService';
import { calculateDelay } from '../../utils/delayCalculation';
import { useAuth } from '../../contexts/AuthContext';

const KanbanCard = ({ task, isDragging, onDelete, usersMap, tasksMap, delayViewMode, isAdmin: isAdminProp, onRequestSpChange }) => {
  const { isAdmin: isAdminFromAuth } = useAuth();
  const isAdmin = isAdminProp ?? isAdminFromAuth;
  const [showUserSelect, setShowUserSelect] = useState(false);
  const userSelectRef = useRef(null);

  useClickOutside(userSelectRef, () => setShowUserSelect(false), { enabled: showUserSelect });

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


  // Calcular delay de la tarea
  const user = usersMap?.[task.assignedTo];
  const delayInfo = useMemo(() => {
    return calculateDelay(task, user, delayViewMode);
  }, [task, user, delayViewMode]);

  // Calcular estado de dependencias
  const depStatus = useMemo(() => {
    const deps = task.dependencies;
    if (!deps || deps.length === 0) return null;
    const completed = deps.filter(id => {
      const depTask = tasksMap?.[id];
      // No encontrada = archivada (completada), o columna 'completed'
      return !depTask || depTask.status === 'completed';
    }).length;
    const total = deps.length;
    let color;
    if (completed === total) color = 'green';
    else if (completed === 0) color = 'red';
    else color = 'yellow';
    return { completed, total, color };
  }, [task.dependencies, tasksMap]);

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

        {/* Sección de información adicional */}
        <div className="card-info">
          <div className="card-assignee" ref={userSelectRef}>
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
          <div className="card-info-chips">
            <div
              onPointerDown={(e) => e.stopPropagation()}
            >
              <StoryPointsSelect
                value={task.storyPoints}
                onChange={async (storyPoints) => {
                  await updateTask(task.id, { storyPoints });
                }}
                size="small"
                disabled={!isAdmin}
                onRequestChange={!isAdmin && onRequestSpChange ? () => onRequestSpChange(task) : undefined}
              />
            </div>
            {depStatus && (
              <span
                className={`card-dep-indicator dep-${depStatus.color} has-tooltip`}
                data-tooltip={`Dependencias: ${depStatus.completed}/${depStatus.total} completadas`}
              >
                <Icon name="git-merge" size={11} />
                {depStatus.completed}/{depStatus.total}
              </span>
            )}
            {delayInfo && (
              <span
                className={`card-delay-indicator delay-${delayInfo.status} has-tooltip`}
                data-tooltip={`Esperado: ${delayInfo.expectedDuration.toFixed(1)}d | Transcurrido: ${delayInfo.elapsedWorkingDays.toFixed(1)}d`}
              >
                <Icon name={delayInfo.status === 'on-track' ? 'check-circle' : 'alert-triangle'} size={12} />
                {delayInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
