import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { subscribeToTasks, createTask as createTaskInDB, updateTask as updateTaskInDB, deleteTask as deleteTaskInDB } from '../services/taskService';
import '../styles/KanbanBoard.css';

const initialColumns = {
  pending: {
    id: 'pending',
    title: 'Pendiente',
    color: '#ffd166'
  },
  'in-progress': {
    id: 'in-progress',
    title: 'En Progreso',
    color: '#118ab2'
  },
  qa: {
    id: 'qa',
    title: 'QA',
    color: '#9d4edd'
  },
  completed: {
    id: 'completed',
    title: 'Completado',
    color: '#06d6a0'
  }
};

const KanbanBoard = ({ activeSprintId = null }) => {
  const [columns] = useState(initialColumns);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState(null);
  const [loading, setLoading] = useState(true);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToTasks((fetchedTasks) => {
      // Filtrar solo tareas del sprint activo (si hay uno)
      const filteredTasks = activeSprintId
        ? fetchedTasks.filter(task => task.sprintId === activeSprintId)
        : fetchedTasks.filter(task => !task.sprintId); // Si no hay sprint activo, mostrar tareas sin sprint

      setTasks(filteredTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeSprintId]);

  // Detección de colisiones personalizada que prioriza las columnas
  const customCollisionDetection = (args) => {
    // Primero intentar detectar colisiones con las columnas (droppables)
    const pointerCollisions = pointerWithin(args);
    const columnCollisions = pointerCollisions.filter(collision =>
      Object.keys(initialColumns).includes(collision.id)
    );

    // Si hay colisión con una columna, usar esa
    if (columnCollisions.length > 0) {
      return columnCollisions;
    }

    // Si no, usar detección por rectángulos para las tarjetas
    return rectIntersection(args);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);

    // Si se soltó sobre una columna
    if (columns[over.id]) {
      // Actualizar en Firestore
      await updateTaskInDB(active.id, { status: over.id });
    }
    // Si se soltó sobre otra tarea (reordenar)
    else {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask && activeTask.status === overTask.status) {
        // Por ahora solo actualizamos el estado local
        // En una implementación futura podríamos agregar un campo 'order' para persistir el orden
        const oldIndex = tasks.findIndex(t => t.id === active.id);
        const newIndex = tasks.findIndex(t => t.id === over.id);
        setTasks(arrayMove(tasks, oldIndex, newIndex));
      }
    }

    setActiveTask(null);
  };

  const handleAddTask = (columnId) => {
    setNewTaskColumn(columnId);
    setShowAddTask(true);
  };

  const createTask = async (taskData) => {
    // Guardar la columna antes de resetearla
    const columnId = newTaskColumn;

    // Cerrar el modal inmediatamente para mejor UX
    setShowAddTask(false);
    setNewTaskColumn(null);

    // Guardar en Firebase (la tarea aparecerá vía sincronización en tiempo real)
    const result = await createTaskInDB({
      ...taskData,
      status: columnId
    });

    if (!result.success) {
      alert('Error al crear la tarea: ' + result.error);
    }
  };

  const deleteTask = async (taskId) => {
    const result = await deleteTaskInDB(taskId);
    if (!result.success) {
      alert('Error al eliminar la tarea: ' + result.error);
    }
  };

  const updateTask = async (taskId, updates) => {
    const result = await updateTaskInDB(taskId, updates);
    if (!result.success) {
      alert('Error al actualizar la tarea: ' + result.error);
    }
  };

  if (loading) {
    return (
      <div className="kanban-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h2>Tablero de Proyectos</h2>
        <div className="kanban-stats">
          <span className="stat">
            <strong>{tasks.length}</strong> tareas totales
          </span>
          <span className="stat">
            <strong>{tasks.filter(t => t.status === 'completed').length}</strong> completadas
          </span>
        </div>
      </div>

      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={customCollisionDetection}
      >
        <div className="kanban-columns">
          {Object.values(columns).map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks.filter(task => task.status === column.id)}
              onAddTask={handleAddTask}
              onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="drag-overlay">
              <KanbanCard task={activeTask} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showAddTask && (
        <TaskModal
          onClose={() => {
            setShowAddTask(false);
            setNewTaskColumn(null);
          }}
          onSave={createTask}
          columnTitle={columns[newTaskColumn]?.title}
        />
      )}
    </div>
  );
};

const TaskModal = ({ onClose, onSave, columnTitle }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
      // El modal se cierra inmediatamente en la función onSave
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Nueva Tarea - {columnTitle}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título de la tarea"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la tarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Prioridad</label>
            <select
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KanbanBoard;
