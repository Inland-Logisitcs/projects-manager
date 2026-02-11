import { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import Icon from '../common/Icon';

const KanbanColumn = ({ column, tasks, onAddTask, onDeleteTask, onCreateTask, usersMap, delayViewMode, isAdmin = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id
  });

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const newTaskInputRef = useRef(null);

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
      // Crear tarea en esta columna
      if (onCreateTask) {
        await onCreateTask(trimmedName, column.id);
      }
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

  return (
    <div className={`kanban-column ${isOver ? 'is-over' : ''}`}>
      <div className="column-header" style={{ borderTopColor: column.color }}>
        <div className="column-title">
          <h3>{column.title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
        <button
          className="add-task-btn has-tooltip"
          onClick={handleStartInlineCreate}
          data-tooltip="Agregar tarea rápida"
        >
          +
        </button>
      </div>

      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="column-content">
          {/* Inline task creation */}
          {isCreatingTask && (
            <div className="inline-create-card">
              <input
                ref={newTaskInputRef}
                type="text"
                className="inline-create-input-kanban"
                placeholder="Nombre de la tarea..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={handleInlineInputKeyDown}
                onBlur={handleSaveInlineTask}
                autoFocus
              />
              <div className="inline-create-hint-kanban">
                <span>Enter para crear · Esc para cancelar</span>
              </div>
            </div>
          )}

          {tasks.length === 0 && !isCreatingTask ? (
            <div className="empty-column">
              <p>No hay tareas</p>
              <p className="empty-hint">Arrastra tareas aquí o haz clic en +</p>
            </div>
          ) : (
            tasks.map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                usersMap={usersMap}
                delayViewMode={delayViewMode}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
