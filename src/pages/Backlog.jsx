import React, { useState, useEffect } from 'react';
import { subscribeToTasks, updateTask, createTask, deleteTask } from '../services/taskService';
import { subscribeToSprints, createSprint, startSprint } from '../services/sprintService';
import Icon from '../components/Icon';
import '../styles/Backlog.css';

const Backlog = () => {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);

  useEffect(() => {
    const unsubscribeTasks = subscribeToTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    const unsubscribeSprints = subscribeToSprints((fetchedSprints) => {
      setSprints(fetchedSprints);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSprints();
    };
  }, []);

  // Filtrar tareas del backlog (sin sprint asignado)
  const backlogTasks = tasks.filter(task => !task.sprintId);

  // Filtrar sprints planificados (no completados)
  const activeSprints = sprints.filter(sprint => sprint.status !== 'completed');

  // Obtener tareas de un sprint específico
  const getSprintTasks = (sprintId) => {
    return tasks.filter(task => task.sprintId === sprintId);
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToSprint = async (e, sprintId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      await updateTask(taskId, { sprintId });
    }
  };

  const handleDropToBacklog = async (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      await updateTask(taskId, { sprintId: null });
    }
  };

  const handleCreateTask = async (taskData) => {
    // Cerrar el modal primero para mejor UX
    setShowTaskModal(false);
    // Crear la tarea después de cerrar el modal
    await createTask(taskData);
  };

  const handleCreateSprint = async (sprintData) => {
    // Cerrar el modal primero para mejor UX
    setShowSprintModal(false);
    // Crear el sprint después de cerrar el modal
    await createSprint(sprintData);
  };

  if (loading) {
    return (
      <div className="backlog-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando backlog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backlog-page">
      {/* Header */}
      <div className="backlog-header">
        <div className="header-left">
          <h2>Backlog</h2>
          <span className="task-count">
            {backlogTasks.length} tareas
          </span>
        </div>
        <div className="header-actions">
          <button className="btn-create" onClick={() => setShowSprintModal(true)}>
            <Icon name="plus" size={18} />
            Crear Sprint
          </button>
          <button className="btn-create" onClick={() => setShowTaskModal(true)}>
            <Icon name="plus" size={18} />
            Crear Tarea
          </button>
        </div>
      </div>

      {/* Sprints activos */}
      {activeSprints.map(sprint => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          tasks={getSprintTasks(sprint.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToSprint(e, sprint.id)}
          onStartSprint={startSprint}
        />
      ))}

      {/* Backlog (tareas sin sprint) */}
      <div
        className="backlog-section"
        onDragOver={handleDragOver}
        onDrop={handleDropToBacklog}
      >
        <div className="section-header">
          <div className="section-title">
            <Icon name="list" size={20} />
            <h3>Backlog</h3>
            <span className="count-badge">{backlogTasks.length}</span>
          </div>
        </div>

        <div className="tasks-table">
          {backlogTasks.length === 0 ? (
            <div className="empty-state">
              <Icon name="inbox" size={48} />
              <p>No hay tareas en el backlog</p>
              <button onClick={() => setShowTaskModal(true)} className="btn-create-small">
                Crear primera tarea
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarea</th>
                  <th style={{ width: '120px' }}>Prioridad</th>
                  <th style={{ width: '100px' }}>Story Points</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {backlogTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onDelete={deleteTask}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales */}
      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {showSprintModal && (
        <SprintModal
          onClose={() => setShowSprintModal(false)}
          onSave={handleCreateSprint}
        />
      )}
    </div>
  );
};

// Componente de Sprint Section
const SprintSection = ({ sprint, tasks, onDragOver, onDrop, onStartSprint }) => {
  const [expanded, setExpanded] = useState(true);

  const handleStartSprint = () => {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    onStartSprint(sprint.id, formatDate(today), formatDate(twoWeeksLater));
  };

  return (
    <div
      className={`sprint-section ${sprint.status}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="section-header">
        <button
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
        </button>
        <div className="section-title">
          <Icon name="zap" size={20} />
          <h3>{sprint.name}</h3>
          <span className={`status-badge ${sprint.status}`}>
            {sprint.status === 'planned' && 'Planificado'}
            {sprint.status === 'active' && 'Activo'}
          </span>
          <span className="count-badge">{tasks.length}</span>
        </div>
        {sprint.status === 'planned' && tasks.length > 0 && (
          <button className="btn-start-sprint" onClick={handleStartSprint}>
            <Icon name="play" size={16} />
            Iniciar Sprint
          </button>
        )}
      </div>

      {expanded && (
        <div className="sprint-tasks">
          {tasks.length === 0 ? (
            <div className="empty-sprint">
              <p>Arrastra tareas aquí para agregarlas al sprint</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarea</th>
                  <th style={{ width: '120px' }}>Prioridad</th>
                  <th style={{ width: '100px' }}>Story Points</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    onDelete={deleteTask}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de fila de tarea
const TaskRow = ({ task, onDragStart, onDelete }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#06d6a0',
      medium: '#ffd166',
      high: '#ef476f',
      critical: '#9d0208'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <tr
      className="task-row"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
    >
      <td>
        <Icon name="grip-vertical" size={16} style={{ opacity: 0.5, cursor: 'grab' }} />
      </td>
      <td>
        <div className="task-title">{task.title || task.name}</div>
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
      </td>
      <td>
        <span
          className="priority-badge"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        >
          {task.priority}
        </span>
      </td>
      <td className="text-center">{task.storyPoints || '-'}</td>
      <td>
        <span className={`status-badge ${task.status}`}>
          {task.status}
        </span>
      </td>
      <td>
        <button
          className="btn-icon"
          onClick={() => onDelete(task.id)}
          title="Eliminar"
        >
          <Icon name="trash" size={16} />
        </button>
      </td>
    </tr>
  );
};

// Modal para crear tarea
const TaskModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    storyPoints: '',
    status: 'pending'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      name: formData.title,
      storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Nueva Tarea</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Prioridad</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            <div className="form-group">
              <label>Story Points</label>
              <input
                type="number"
                value={formData.storyPoints}
                onChange={e => setFormData({ ...formData, storyPoints: e.target.value })}
                min="1"
                max="100"
              />
            </div>
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

// Modal para crear sprint
const SprintModal = ({ onClose, onSave }) => {
  // Calcular fechas sugeridas (hoy y 2 semanas después)
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    startDate: formatDate(today),
    endDate: formatDate(twoWeeksLater)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      status: 'planned'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Nuevo Sprint</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Sprint *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sprint 1"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Objetivo</label>
            <textarea
              value={formData.goal}
              onChange={e => setFormData({ ...formData, goal: e.target.value })}
              placeholder="¿Qué se quiere lograr en este sprint?"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Inicio *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Fecha de Fin *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Crear Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Backlog;
