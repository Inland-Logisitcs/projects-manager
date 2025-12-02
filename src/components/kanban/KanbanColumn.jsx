import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ column, tasks, onAddTask, onDeleteTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id
  });

  return (
    <div className={`kanban-column ${isOver ? 'is-over' : ''}`}>
      <div className="column-header" style={{ borderTopColor: column.color }}>
        <div className="column-title">
          <h3>{column.title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
        <button
          className="add-task-btn"
          onClick={() => onAddTask(column.id)}
          title="Agregar tarea"
        >
          +
        </button>
      </div>

      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="column-content">
          {tasks.length === 0 ? (
            <div className="empty-column">
              <p>No hay tareas</p>
              <p className="empty-hint">Arrastra tareas aquí</p>
            </div>
          ) : (
            tasks.map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
