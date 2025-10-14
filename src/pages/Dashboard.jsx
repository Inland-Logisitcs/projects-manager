import { useState, useEffect } from 'react';
import { subscribeToSprints, completeSprint } from '../services/sprintService';
import { subscribeToTasks, updateTask, deleteTask } from '../services/taskService';
import KanbanBoard from '../components/KanbanBoard';
import Icon from '../components/Icon';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    const unsubscribeSprints = subscribeToSprints((fetchedSprints) => {
      setSprints(fetchedSprints);
      setLoading(false);
    });

    const unsubscribeTasks = subscribeToTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
    });

    return () => {
      unsubscribeSprints();
      unsubscribeTasks();
    };
  }, []);

  // Obtener sprint activo
  const activeSprint = sprints.find(sprint => sprint.status === 'active');

  const handleCompleteSprint = () => {
    setShowCompleteModal(true);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando tablero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {activeSprint ? (
        <>
          <div className="sprint-header">
            <div className="sprint-title-section">
              <h2>
                <Icon name="zap" size={20} />
                {activeSprint.name}
              </h2>
              {activeSprint.startDate && activeSprint.endDate && (
                <div className="sprint-dates">
                  <Icon name="calendar" size={16} />
                  <span>{new Date(activeSprint.startDate).toLocaleDateString('es')} - {new Date(activeSprint.endDate).toLocaleDateString('es')}</span>
                </div>
              )}
            </div>
            <button className="btn-complete-sprint" onClick={handleCompleteSprint}>
              <Icon name="check-circle" size={18} />
              Completar Sprint
            </button>
          </div>
          <KanbanBoard activeSprintId={activeSprint.id} />
          {showCompleteModal && (
            <CompleteSprintModal
              sprint={activeSprint}
              tasks={tasks.filter(t => t.sprintId === activeSprint.id)}
              onClose={() => setShowCompleteModal(false)}
            />
          )}
        </>
      ) : (
        <div className="empty-state-container">
          <div className="empty-state-content">
            <Icon name="zap" size={80} className="empty-icon" />
            <h2>No hay sprint activo</h2>
            <p>Ve al Backlog para crear un sprint y comenzar a trabajar</p>
            <a href="/backlog" className="btn-create-first">
              <Icon name="list" size={20} />
              Ir al Backlog
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal para completar sprint
const CompleteSprintModal = ({ sprint, tasks, onClose }) => {
  const [step, setStep] = useState('confirm'); // confirm, move-tasks, create-sprint
  const [moveOption, setMoveOption] = useState(null); // 'backlog' o 'new-sprint'
  const [newSprintData, setNewSprintData] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: ''
  });
  const [processing, setProcessing] = useState(false);

  // Separar tareas por estado
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const incompleteTasks = tasks.filter(t => t.status !== 'completed');

  const handleConfirm = () => {
    if (incompleteTasks.length > 0) {
      setStep('move-tasks');
    } else {
      // Si todas están completadas, proceder directamente
      handleComplete();
    }
  };

  const handleMoveOptionSelect = (option) => {
    setMoveOption(option);
    if (option === 'new-sprint') {
      // Sugerir fechas para el nuevo sprint
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);

      setNewSprintData({
        name: `Sprint ${new Date().getTime()}`,
        goal: '',
        startDate: formatDate(today),
        endDate: formatDate(twoWeeksLater)
      });
      setStep('create-sprint');
    } else if (option === 'backlog') {
      // Pasar la opción directamente
      handleComplete(option);
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleComplete = async (targetOption = null) => {
    setProcessing(true);
    // Usar el parámetro si se proporciona, sino usar el estado
    const selectedOption = targetOption || moveOption;

    try {
      // 1. Manejar tareas incompletas según la opción elegida
      if (selectedOption === 'backlog') {
        // Mover al backlog y cambiar status a pending
        for (const task of incompleteTasks) {
          await updateTask(task.id, {
            sprintId: null,
            status: 'pending'
          });
        }
      } else if (selectedOption === 'new-sprint') {
        // Crear nuevo sprint ya iniciado y mover las tareas
        const { createSprint } = await import('../services/sprintService');
        const result = await createSprint({
          ...newSprintData,
          status: 'active' // El nuevo sprint ya está activo
        });

        if (result.success) {
          // Mover tareas incompletas al nuevo sprint (mantienen su estado actual)
          for (const task of incompleteTasks) {
            await updateTask(task.id, {
              sprintId: result.id
            });
          }
        }
      }

      // 2. Archivar SOLO tareas completadas (siempre se archivan)
      for (const task of completedTasks) {
        await updateTask(task.id, {
          archived: true,
          sprintId: sprint.id // Mantener referencia al sprint original
        });
      }

      // 3. Marcar sprint como completado
      const { updateSprint } = await import('../services/sprintService');
      await updateSprint(sprint.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      onClose();
    } catch (error) {
      console.error('Error al completar sprint:', error);
      alert('Error al completar el sprint. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content complete-sprint-modal" onClick={e => e.stopPropagation()}>
        {step === 'confirm' && (
          <>
            <h3>Completar Sprint</h3>
            <div className="sprint-summary">
              <p><strong>{sprint.name}</strong></p>
              <div className="task-summary">
                <div className="summary-item completed">
                  <Icon name="check-circle" size={20} />
                  <span>{completedTasks.length} tareas completadas</span>
                </div>
                {incompleteTasks.length > 0 && (
                  <div className="summary-item incomplete">
                    <Icon name="alert-circle" size={20} />
                    <span>{incompleteTasks.length} tareas sin completar</span>
                  </div>
                )}
              </div>
            </div>
            <p className="modal-description">
              {incompleteTasks.length > 0
                ? 'Las tareas completadas se archivarán. ¿Qué deseas hacer con las tareas sin completar?'
                : 'Todas las tareas están completadas. Se archivarán y el sprint se marcará como finalizado.'
              }
            </p>
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirm} className="btn-primary">
                {incompleteTasks.length > 0 ? 'Continuar' : 'Completar Sprint'}
              </button>
            </div>
          </>
        )}

        {step === 'move-tasks' && (
          <>
            <h3>¿Qué hacer con las tareas sin completar?</h3>
            <p className="modal-description">
              Tienes {incompleteTasks.length} tarea(s) que no se completaron en este sprint.
            </p>
            <div className="move-options">
              <button
                className="move-option-card"
                onClick={() => handleMoveOptionSelect('backlog')}
                disabled={processing}
              >
                <Icon name="list" size={32} />
                <h4>Mover al Backlog</h4>
                <p>Las tareas volverán al backlog con estado "Pendiente"</p>
              </button>
              <button
                className="move-option-card"
                onClick={() => handleMoveOptionSelect('new-sprint')}
                disabled={processing}
              >
                <Icon name="zap" size={32} />
                <h4>Mover a Nuevo Sprint</h4>
                <p>Crear un nuevo sprint y mantener el estado actual de las tareas</p>
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>
                Cancelar
              </button>
            </div>
          </>
        )}

        {step === 'create-sprint' && (
          <>
            <h3>Crear Nuevo Sprint</h3>
            <p className="modal-description">
              Las {incompleteTasks.length} tarea(s) sin completar se moverán al nuevo sprint.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleComplete(); }}>
              <div className="form-group">
                <label>Nombre del Sprint *</label>
                <input
                  type="text"
                  value={newSprintData.name}
                  onChange={e => setNewSprintData({ ...newSprintData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Objetivo</label>
                <textarea
                  value={newSprintData.goal}
                  onChange={e => setNewSprintData({ ...newSprintData, goal: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={newSprintData.startDate}
                    onChange={e => setNewSprintData({ ...newSprintData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de Fin *</label>
                  <input
                    type="date"
                    value={newSprintData.endDate}
                    onChange={e => setNewSprintData({ ...newSprintData, endDate: e.target.value })}
                    required
                    min={newSprintData.startDate}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setStep('move-tasks')}
                  className="btn-secondary"
                  disabled={processing}
                >
                  Atrás
                </button>
                <button type="submit" className="btn-primary" disabled={processing}>
                  {processing ? 'Procesando...' : 'Completar Sprint'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
