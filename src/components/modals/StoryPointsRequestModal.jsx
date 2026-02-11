import { useState, useEffect } from 'react';
import Icon from '../common/Icon';

const StoryPointsRequestModal = ({ isOpen, onConfirm, onCancel, taskTitle, currentStoryPoints }) => {
  const [requestedStoryPoints, setRequestedStoryPoints] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRequestedStoryPoints(currentStoryPoints !== null && currentStoryPoints !== undefined ? String(currentStoryPoints) : '');
      setReason('');
      setErrors({});
    }
  }, [isOpen, currentStoryPoints]);

  const validate = () => {
    const newErrors = {};
    const numValue = requestedStoryPoints === '' ? null : Number(requestedStoryPoints);

    if (numValue === null || isNaN(numValue) || numValue < 0) {
      newErrors.requestedStoryPoints = 'Ingresa un valor valido';
    } else if (numValue === currentStoryPoints) {
      newErrors.requestedStoryPoints = 'El valor debe ser diferente al actual';
    }

    if (!reason.trim()) {
      newErrors.reason = 'La razon es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await onConfirm({
      requestedStoryPoints: Number(requestedStoryPoints),
      reason: reason.trim()
    });
    setIsSubmitting(false);
  };

  const handleSpChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setRequestedStoryPoints(value);
      if (errors.requestedStoryPoints) {
        setErrors(prev => ({ ...prev, requestedStoryPoints: '' }));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Solicitar cambio de Story Points</h2>
          <button className="modal-close" onClick={onCancel}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="text-sm text-secondary mb-base">
              Tarea: <strong className="text-primary">{taskTitle}</strong>
            </p>

            <div className="form-group">
              <label className="label">SP Actual</label>
              <input
                type="text"
                className="input"
                value={currentStoryPoints !== null && currentStoryPoints !== undefined ? currentStoryPoints : 'Sin asignar'}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="sp-request-value" className="label label-required">Nuevo valor de SP</label>
              <input
                type="text"
                id="sp-request-value"
                className={`input ${errors.requestedStoryPoints ? 'input-error' : ''}`}
                value={requestedStoryPoints}
                onChange={handleSpChange}
                placeholder="Ej: 5"
                disabled={isSubmitting}
                autoFocus
              />
              {errors.requestedStoryPoints && <span className="error-message">{errors.requestedStoryPoints}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sp-request-reason" className="label label-required">Razon del cambio</label>
              <textarea
                id="sp-request-reason"
                className={`textarea ${errors.reason ? 'input-error' : ''}`}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }));
                }}
                placeholder="Explica por que se debe cambiar el valor..."
                rows={3}
                disabled={isSubmitting}
              />
              {errors.reason && <span className="error-message">{errors.reason}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoryPointsRequestModal;
