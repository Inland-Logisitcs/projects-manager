import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const priorityColors = {
  low: '#06d6a0',
  medium: '#ffd166',
  high: '#ef476f'
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const KanbanCard = ({ task, isDragging, onDelete, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);

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

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      onDelete(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="card-header">
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColors[task.priority] }}
        >
          {priorityLabels[task.priority]}
        </span>
        <button
          className="card-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          ⋮
        </button>
        {showMenu && (
          <div className="card-menu">
            <button onClick={handleDelete}>Eliminar</button>
          </div>
        )}
      </div>

      <h4 className="card-title">{task.title}</h4>
      {task.description && (
        <p className="card-description">{task.description}</p>
      )}

      <div className="card-footer">
        <span className="card-id">#{task.id}</span>
      </div>
    </div>
  );
};

export default KanbanCard;
