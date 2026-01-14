import { useState } from 'react';
import Icon from '../common/Icon';

const DEFAULT_POKER_VALUES = [0.5, 1, 1.5, 2, 3, 4, 5, '?', '☕'];

const TaskSelectionModal = ({ tasks, onClose, onConfirm }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [pokerValuesInput, setPokerValuesInput] = useState(DEFAULT_POKER_VALUES.join(', '));

  const handleToggleTask = (taskId, event) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    const isShiftKey = event?.shiftKey || false;

    if (isShiftKey && lastSelectedIndex !== null && lastSelectedIndex !== taskIndex) {
      // Selección de rango con Shift
      const start = Math.min(lastSelectedIndex, taskIndex);
      const end = Math.max(lastSelectedIndex, taskIndex);
      const rangeIds = tasks.slice(start, end + 1).map(t => t.id);

      // Seleccionar todo el rango (agregar a la selección actual)
      setSelectedTaskIds(prev => {
        const newSelection = new Set([...prev, ...rangeIds]);
        return Array.from(newSelection);
      });
      // No actualizar lastSelectedIndex para permitir múltiples rangos
    } else {
      // Click normal - toggle individual
      setSelectedTaskIds(prev =>
        prev.includes(taskId)
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      );
      setLastSelectedIndex(taskIndex);
    }
  };

  const handleToggleAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(t => t.id));
    }
  };

  const handleResetValues = () => {
    setPokerValuesInput(DEFAULT_POKER_VALUES.join(', '));
  };

  const handleConfirm = () => {
    if (selectedTaskIds.length === 0) {
      return;
    }

    // Parsear los valores del mazo desde el input
    const pokerValues = pokerValuesInput
      .split(',')
      .map(v => v.trim())
      .filter(v => v !== '')
      .map(v => isNaN(v) ? v : parseFloat(v));

    const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));
    onConfirm(selectedTasks, pokerValues);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-base pb-base border-b-light" style={{ flexShrink: 0 }}>
          <h3 className="heading-3 text-primary m-0">Seleccionar Tareas para Planning Poker</h3>
          <button className="btn btn-icon" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--space-xs)' }}>

        <div className="mb-base">
          <div
            className="flex items-center bg-secondary border-b-light cursor-pointer"
            style={{ padding: 'var(--space-sm) var(--space-base)' }}
            onClick={handleToggleAll}
          >
            <div style={{
              flexShrink: 0,
              width: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="checkbox"
                checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                onChange={handleToggleAll}
                className="task-checkbox"
                style={{
                  margin: 0,
                  cursor: 'pointer'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <span className="text-sm font-semibold text-primary" style={{ marginLeft: 'var(--space-sm)' }}>
              Seleccionar todas ({selectedTaskIds.length}/{tasks.length})
            </span>
          </div>

          <div className="task-selection-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {tasks.length === 0 ? (
              <div className="empty-state text-center p-3xl">
                <Icon name="inbox" size={48} />
                <p className="text-base text-secondary mt-base">
                  No hay tareas disponibles en el backlog
                </p>
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="task-selection-item"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-base)',
                    borderBottom: '1px solid var(--border-light)',
                    backgroundColor: selectedTaskIds.includes(task.id) ? 'var(--bg-tertiary)' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={(e) => handleToggleTask(task.id, e)}
                >
                  <div style={{
                    flexShrink: 0,
                    width: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    paddingTop: '2px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={(e) => handleToggleTask(task.id, e)}
                      className="task-checkbox"
                      style={{
                        margin: 0,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <p className="text-base font-semibold text-primary m-0" style={{ marginBottom: 'var(--space-xs)' }}>
                      {task.title || task.name}
                    </p>
                    {task.projectId && (
                      <span className="text-xs text-secondary">
                        Proyecto: {task.projectName || task.projectId}
                      </span>
                    )}
                  </div>
                  {task.storyPoints && (
                    <span className="badge badge-primary" style={{ flexShrink: 0 }}>
                      {task.storyPoints} pts
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Configuración del mazo */}
        <div className="mb-base">
          <div className="flex items-center justify-between mb-sm">
            <h4 className="heading-4 text-primary m-0">Mazo de cartas</h4>
            <button className="btn btn-secondary btn-sm" onClick={handleResetValues}>
              <Icon name="refresh-cw" size={14} />
              Restablecer
            </button>
          </div>

          <div className="form-group">
            <label className="label text-sm text-secondary">
              Valores separados por comas (ej: 0.5, 1, 1.5, 2, 3, 4, 5, ?, ☕)
            </label>
            <input
              type="text"
              className="input"
              value={pokerValuesInput}
              onChange={(e) => setPokerValuesInput(e.target.value)}
              placeholder="0.5, 1, 1.5, 2, 3, 4, 5, ?, ☕"
            />
          </div>
        </div>

        </div>

        <div className="flex items-center justify-end gap-sm pt-base border-t-light" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selectedTaskIds.length === 0 || !pokerValuesInput.trim()}
          >
            <Icon name="play" size={16} />
            Iniciar Planning Poker ({selectedTaskIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskSelectionModal;
