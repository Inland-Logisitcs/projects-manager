import { useState } from 'react';
import Icon from '../common/Icon';

const DemoUrlModal = ({ isOpen, onConfirm, onCancel }) => {
  const [demoUrl, setDemoUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = demoUrl.trim();

    if (!trimmed) {
      setError('El link de demo es requerido.');
      return;
    }

    if (!validateUrl(trimmed)) {
      setError('Ingresa una URL valida (ej: https://ejemplo.com)');
      return;
    }

    setError('');
    onConfirm(trimmed);
    setDemoUrl('');
  };

  const handleCancel = () => {
    setDemoUrl('');
    setError('');
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <h3 className="modal-header flex items-center gap-sm">
          <Icon name="link" size={20} />
          Link de Demo para QA
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-base">
          <div className="form-group">
            <label className="label">URL de Demo *</label>
            <input
              type="text"
              className="input"
              value={demoUrl}
              onChange={(e) => {
                setDemoUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="https://demo.ejemplo.com/feature"
              autoFocus
            />
            {error && (
              <span className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</span>
            )}
          </div>

          <div className="modal-footer flex justify-end gap-sm">
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Enviar a QA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoUrlModal;
