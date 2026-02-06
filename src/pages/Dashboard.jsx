import { useState, useEffect } from 'react';
import { subscribeToSprints } from '../services/sprintService';
import { subscribeToTasks, updateTask } from '../services/taskService';
import { subscribeToUsers } from '../services/userService';
import { getSprintCapacityInfo } from '../services/capacityService';
import KanbanBoard from '../components/kanban/KanbanBoard';
import Toast from '../components/common/Toast';
import Icon from '../components/common/Icon';
import CapacityDetailModal from '../components/modals/CapacityDetailModal';
import StandupModal from '../components/standup/StandupModal';
import '../styles/Dashboard.css';
import '../styles/Standup.css';

const Dashboard = () => {
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showStandupModal, setShowStandupModal] = useState(false);

  useEffect(() => {
    const unsubscribeSprints = subscribeToSprints((fetchedSprints) => {
      setSprints(fetchedSprints);
      setLoading(false);
    });

    const unsubscribeTasks = subscribeToTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
    });

    const unsubscribeUsers = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });

    return () => {
      unsubscribeSprints();
      unsubscribeTasks();
      unsubscribeUsers();
    };
  }, []);

  // Obtener sprint activo
  const activeSprint = sprints.find(sprint => sprint.status === 'active');

  // Calcular información de capacidad para el sprint activo
  const sprintTasks = activeSprint ? tasks.filter(t => t.sprintId === activeSprint.id && !t.archived) : [];
  const capacityInfo = activeSprint ? getSprintCapacityInfo(activeSprint, sprintTasks, users, true) : null;

  const handleCompleteSprint = () => {
    setShowCompleteModal(true);
  };

  const getCapacityColor = () => {
    if (!capacityInfo) return '#10B981';
    if (capacityInfo.percentage >= 100) return '#EF4444';
    if (capacityInfo.percentage >= 80) return '#F59E0B';
    return '#10B981';
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="empty-state">
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
          <div className="sprint-header flex justify-between items-center pb-lg mb-md">
            <div className="sprint-info">
              <h2 className="heading-2 text-primary flex items-center gap-sm">
                <Icon name="zap" size={20} />
                {activeSprint.name}
              </h2>
              {activeSprint.startDate && activeSprint.endDate && (
                <div className="sprint-dates flex items-center gap-xs text-sm text-secondary">
                  <Icon name="calendar" size={16} />
                  <span className="font-medium">
                    <span className="date-full">{new Date(activeSprint.startDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })} - {new Date(activeSprint.endDate).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="date-compact">{new Date(activeSprint.startDate).toLocaleDateString('es', { day: 'numeric', month: 'numeric' })} - {new Date(activeSprint.endDate).toLocaleDateString('es', { day: 'numeric', month: 'numeric' })}</span>
                  </span>
                </div>
              )}
              {capacityInfo && capacityInfo.capacity > 0 && (
                <div
                  className="sprint-capacity flex items-center gap-xs text-sm has-tooltip"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowCapacityModal(true)}
                  data-tooltip={`Capacidad restante: ${capacityInfo.capacity} pts | Pendiente: ${capacityInfo.assignedPoints} pts | Completado: ${capacityInfo.completedPoints} pts | Click para ver detalles`}
                >
                  <Icon name="users" size={16} />
                  <span className="capacity-text font-semibold" style={{ color: getCapacityColor() }}>
                    {capacityInfo.assignedPoints}/{capacityInfo.capacity} pts
                  </span>
                  <div className="capacity-bar" style={{ width: '60px', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(capacityInfo.percentage, 100)}%`,
                        height: '100%',
                        backgroundColor: getCapacityColor(),
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <span className="capacity-percentage text-xs text-secondary">{capacityInfo.percentage}%</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-sm">
              <button className="btn btn-secondary flex items-center gap-xs" onClick={() => setShowStandupModal(true)}>
                <Icon name="users" size={18} />
                Daily Standup
              </button>
              <button className="btn btn-primary flex items-center gap-xs" onClick={handleCompleteSprint}>
                <Icon name="check-circle" size={18} />
                Completar Sprint
              </button>
            </div>
          </div>
          <KanbanBoard activeSprintId={activeSprint.id} />
          {showCompleteModal && (
            <CompleteSprintModal
              sprint={activeSprint}
              tasks={tasks.filter(t => t.sprintId === activeSprint.id)}
              onClose={() => setShowCompleteModal(false)}
            />
          )}
          {showCapacityModal && (
            <CapacityDetailModal
              isOpen={showCapacityModal}
              onClose={() => setShowCapacityModal(false)}
              sprint={activeSprint}
              users={users}
              tasks={sprintTasks}
            />
          )}
          {showStandupModal && (
            <StandupModal
              isOpen={showStandupModal}
              onClose={() => setShowStandupModal(false)}
              sprint={activeSprint}
              users={users}
              tasks={tasks}
            />
          )}
        </>
      ) : (
        <div className="dashboard-empty-container flex items-center justify-center">
          <div className="text-center p-3xl">
            <Icon name="zap" size={80} className="dashboard-empty-icon" />
            <h2 className="heading-2 text-primary mb-sm">No hay sprint activo</h2>
            <p className="text-base text-secondary mb-xl">Ve al Backlog para crear un sprint y comenzar a trabajar</p>
            <a href="/backlog" className="btn btn-primary btn-lg flex items-center gap-sm" style={{display: 'inline-flex'}}>
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
  const [toast, setToast] = useState(null);

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
        // Mover al backlog y eliminar el estado (queda en null)
        const { moveTaskToSprint } = await import('../services/taskService');
        for (const task of incompleteTasks) {
          await moveTaskToSprint(task.id, null, false);
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
      setToast({ message: 'Error al completar el sprint. Inténtalo de nuevo.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content complete-sprint-modal" onClick={e => e.stopPropagation()}>
        {step === 'confirm' && (
          <>
            <h3 className="modal-header">Completar Sprint</h3>
            <div className="sprint-summary">
              <p className="mb-base text-lg"><strong>{sprint.name}</strong></p>
              <div className="flex flex-col gap-sm">
                <div className="summary-item summary-item-completed flex items-center gap-sm p-sm text-base font-medium">
                  <Icon name="check-circle" size={20} />
                  <span>{completedTasks.length} tareas completadas</span>
                </div>
                {incompleteTasks.length > 0 && (
                  <div className="summary-item summary-item-incomplete flex items-center gap-sm p-sm text-base font-medium">
                    <Icon name="alert-circle" size={20} />
                    <span>{incompleteTasks.length} tareas sin completar</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-base text-secondary mb-lg" style={{lineHeight: '1.6'}}>
              {incompleteTasks.length > 0
                ? 'Las tareas completadas se archivarán. ¿Qué deseas hacer con las tareas sin completar?'
                : 'Todas las tareas están completadas. Se archivarán y el sprint se marcará como finalizado.'
              }
            </p>
            <div className="modal-footer flex justify-end gap-sm">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirm} className="btn btn-primary">
                {incompleteTasks.length > 0 ? 'Continuar' : 'Completar Sprint'}
              </button>
            </div>
          </>
        )}

        {step === 'move-tasks' && (
          <>
            <h3 className="modal-header">¿Qué hacer con las tareas sin completar?</h3>
            <p className="text-base text-secondary mb-lg">
              Tienes {incompleteTasks.length} tarea(s) que no se completaron en este sprint.
            </p>
            <div className="move-options grid gap-base mb-lg">
              <button
                className="move-option-card"
                onClick={() => handleMoveOptionSelect('backlog')}
                disabled={processing}
              >
                <Icon name="list" size={32} />
                <h4 className="text-base font-semibold text-primary mb-xs">Mover al Backlog</h4>
                <p className="text-sm text-secondary">Las tareas volverán al backlog con estado "Pendiente"</p>
              </button>
              <button
                className="move-option-card"
                onClick={() => handleMoveOptionSelect('new-sprint')}
                disabled={processing}
              >
                <Icon name="zap" size={32} />
                <h4 className="text-base font-semibold text-primary mb-xs">Mover a Nuevo Sprint</h4>
                <p className="text-sm text-secondary">Crear un nuevo sprint y mantener el estado actual de las tareas</p>
              </button>
            </div>
            <div className="modal-footer flex justify-end gap-sm">
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={processing}>
                Cancelar
              </button>
            </div>
          </>
        )}

        {step === 'create-sprint' && (
          <>
            <h3 className="modal-header">Crear Nuevo Sprint</h3>
            <p className="text-base text-secondary mb-lg">
              Las {incompleteTasks.length} tarea(s) sin completar se moverán al nuevo sprint.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleComplete(); }} className="flex flex-col gap-base">
              <div className="form-group">
                <label className="label">Nombre del Sprint *</label>
                <input
                  type="text"
                  className="input"
                  value={newSprintData.name}
                  onChange={e => setNewSprintData({ ...newSprintData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="label">Objetivo</label>
                <textarea
                  className="textarea"
                  value={newSprintData.goal}
                  onChange={e => setNewSprintData({ ...newSprintData, goal: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="dashboard-form-row grid gap-base">
                <div className="form-group">
                  <label className="label">Fecha de Inicio *</label>
                  <input
                    type="date"
                    className="input"
                    value={newSprintData.startDate}
                    onChange={e => setNewSprintData({ ...newSprintData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Fecha de Fin *</label>
                  <input
                    type="date"
                    className="input"
                    value={newSprintData.endDate}
                    onChange={e => setNewSprintData({ ...newSprintData, endDate: e.target.value })}
                    required
                    min={newSprintData.startDate}
                  />
                </div>
              </div>
              <div className="modal-footer flex justify-end gap-sm">
                <button
                  type="button"
                  onClick={() => setStep('move-tasks')}
                  className="btn btn-secondary"
                  disabled={processing}
                >
                  Atrás
                </button>
                <button type="submit" className="btn btn-primary" disabled={processing}>
                  {processing ? 'Procesando...' : 'Completar Sprint'}
                </button>
              </div>
            </form>
          </>
        )}

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

export default Dashboard;
