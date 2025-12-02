import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import ColumnManager from './ColumnManager';
import TaskDetailSidebar from './TaskDetailSidebar';
import Icon from '../common/Icon';
import Toast from '../common/Toast';
import { subscribeToTasks, createTask as createTaskInDB, updateTask as updateTaskInDB, archiveTask as archiveTaskInDB, countTasksByStatus } from '../../services/taskService';
import {
  subscribeToColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  initializeDefaultColumns
} from '../../services/columnService';
import '../../styles/KanbanBoard.css';

const KanbanBoard = ({ activeSprintId = null }) => {
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimisticUpdates, setOptimisticUpdates] = useState(new Set());
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });

  // Inicializar columnas por defecto y suscribirse a cambios
  useEffect(() => {
    // Inicializar columnas por defecto
    initializeDefaultColumns();

    // Suscribirse a cambios en columnas
    const unsubscribe = subscribeToColumns((fetchedColumns) => {
      setColumns(fetchedColumns);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Suscribirse a cambios en tiempo real de tareas
  useEffect(() => {
    const unsubscribe = subscribeToTasks((fetchedTasks) => {
      // Filtrar solo tareas del sprint activo (si hay uno)
      const filteredTasks = activeSprintId
        ? fetchedTasks.filter(task => task.sprintId === activeSprintId)
        : fetchedTasks.filter(task => !task.sprintId); // Si no hay sprint activo, mostrar tareas sin sprint

      setTasks(prevTasks => {
        // Si hay actualizaciones optimistas pendientes, preservar esos cambios
        if (optimisticUpdates.size > 0) {
          return filteredTasks.map(task => {
            // Si esta tarea tiene una actualización optimista, mantener el estado local
            if (optimisticUpdates.has(task.id)) {
              const localTask = prevTasks.find(t => t.id === task.id);
              return localTask || task;
            }
            return task;
          });
        }
        return filteredTasks;
      });
    });

    return () => unsubscribe();
  }, [activeSprintId, optimisticUpdates]);

  // Sincronizar selectedTask cuando tasks cambian (para actualizaciones en tiempo real)
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  // Detección de colisiones personalizada que prioriza las columnas
  const customCollisionDetection = (args) => {
    // Primero intentar detectar colisiones con las columnas (droppables)
    const pointerCollisions = pointerWithin(args);
    const columnIds = columns.map(c => c.id);
    const columnCollisions = pointerCollisions.filter(collision =>
      columnIds.includes(collision.id)
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
    const { active, over, delta } = event;

    // Si no hay "over" o el delta es muy pequeño, fue un click
    const isClick = !over || (Math.abs(delta.x) < 5 && Math.abs(delta.y) < 5);

    if (isClick) {
      const task = tasks.find(t => t.id === active.id);
      if (task) {
        setSelectedTask(task);
      }
      setActiveTask(null);
      return;
    }

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    const isColumn = columns.some(c => c.id === over.id);

    // Si se soltó sobre una columna
    if (isColumn) {
      const newStatus = over.id;
      const previousStatus = activeTask.status;

      // Marcar esta tarea como optimísticamente actualizada
      setOptimisticUpdates(prev => new Set(prev).add(active.id));

      // OPTIMISTIC UPDATE: Actualizar UI inmediatamente
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === active.id
            ? { ...task, status: newStatus }
            : task
        )
      );

      // Actualizar en Firestore en segundo plano
      const result = await updateTaskInDB(active.id, {
        status: newStatus,
        previousStatus: previousStatus
      });

      // Remover de las actualizaciones optimistas después de un breve delay
      // para dar tiempo a que Firestore se sincronice
      setTimeout(() => {
        setOptimisticUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(active.id);
          return newSet;
        });
      }, 500);

      // Si falla, revertir el cambio optimista
      if (!result.success) {
        console.error('Error al mover tarea:', result.error);
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === active.id
              ? { ...task, status: previousStatus }
              : task
          )
        );
        setOptimisticUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(active.id);
          return newSet;
        });
        setToast({
          isOpen: true,
          message: 'Error al mover la tarea. Por favor, intenta de nuevo.',
          type: 'error'
        });
      }
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
      setToast({
        isOpen: true,
        message: `Error al crear la tarea: ${result.error}`,
        type: 'error'
      });
    }
  };

  const archiveTask = async (taskId) => {
    const result = await archiveTaskInDB(taskId);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al archivar la tarea: ${result.error}`,
        type: 'error'
      });
    }
  };

  const updateTask = async (taskId, updates) => {
    const result = await updateTaskInDB(taskId, updates);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al actualizar la tarea: ${result.error}`,
        type: 'error'
      });
    }
  };

  const handleSaveColumn = async (columnData) => {
    if (columnData.id && columns.some(c => c.id === columnData.id)) {
      // Actualizar columna existente
      const result = await updateColumn(columnData.id, {
        title: columnData.title,
        color: columnData.color
      });

      if (!result.success) {
        setToast({
          isOpen: true,
          message: `Error al actualizar columna: ${result.error}`,
          type: 'error'
        });
      }
    } else {
      // Crear nueva columna
      const result = await createColumn({
        ...columnData,
        order: columns.length
      });

      if (!result.success) {
        setToast({
          isOpen: true,
          message: `Error al crear columna: ${result.error}`,
          type: 'error'
        });
      }
    }
  };

  const handleDeleteColumn = async (columnId) => {
    console.log('🗑️ Intentando eliminar columna:', columnId);

    // Verificar si hay tareas en esta columna (en toda la base de datos, no solo en el sprint activo)
    const taskCount = await countTasksByStatus(columnId);
    console.log('📊 Tareas encontradas con estado', columnId, ':', taskCount);

    if (taskCount > 0) {
      console.log('⚠️ No se puede eliminar: hay tareas en la columna');
      setToast({
        isOpen: true,
        message: `No se puede eliminar la columna "${columns.find(c => c.id === columnId)?.title}" porque tiene ${taskCount} tarea(s). Mueve o elimina las tareas primero.`,
        type: 'error'
      });
      return;
    }

    console.log('✅ Columna vacía, procediendo a eliminar...');
    const result = await deleteColumn(columnId);
    console.log('🔍 Resultado de deleteColumn:', result);

    if (!result.success) {
      console.error('❌ Error al eliminar columna:', result.error);
      setToast({
        isOpen: true,
        message: `Error al eliminar columna: ${result.error}`,
        type: 'error'
      });
    } else {
      console.log('✅ Columna eliminada exitosamente');
    }
  };

  const handleReorderColumns = async (newColumns) => {
    const result = await reorderColumns(newColumns);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al reordenar columnas: ${result.error}`,
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="kanban-board">
        <div className="empty-state flex flex-col items-center justify-center p-4xl text-secondary">
          <div className="spinner"></div>
          <p className="text-base mt-base">Cargando tablero...</p>
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

      <div className="kanban-board">
        <div className="kanban-header flex justify-between items-center mb-xl pb-base border-b-light">
          <div className="flex flex-col gap-sm">
            <h2 className="heading-2 text-primary">Tablero de Proyectos</h2>
            <div className="kanban-stats flex gap-base">
              <span className="stat text-sm text-secondary">
                <strong className="text-primary">{tasks.length}</strong> tareas totales
              </span>
              <span className="stat text-sm text-secondary">
                <strong className="text-primary">{tasks.filter(t => t.status === 'completed').length}</strong> completadas
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary flex items-center gap-xs"
            onClick={() => setShowColumnManager(true)}
            title="Gestionar columnas"
          >
            <Icon name="settings" size={20} />
            <span>Gestionar Columnas</span>
          </button>
        </div>

        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={customCollisionDetection}
        >
          <div className="kanban-columns">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasks.filter(task => task.status === column.id)}
                onAddTask={handleAddTask}
                onDeleteTask={archiveTask}
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
            columnTitle={columns.find(c => c.id === newTaskColumn)?.title}
          />
        )}

        {showColumnManager && (
          <ColumnManager
            columns={columns}
            onClose={() => setShowColumnManager(false)}
            onSave={handleSaveColumn}
            onDelete={handleDeleteColumn}
            onReorder={handleReorderColumns}
          />
        )}

        {selectedTask && (
          <TaskDetailSidebar
            task={selectedTask}
            columns={columns}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>
    </>
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
        <h3 className="modal-header">Nueva Tarea - {columnTitle}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-base">
          <div className="form-group">
            <label className="label">Título *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título de la tarea"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la tarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="label">Prioridad</label>
            <select
              className="select"
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div className="modal-footer flex justify-end gap-sm">
            <button type="button" onClick={onClose} className="btn btn-secondary">
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

export default KanbanBoard;
