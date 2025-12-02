import { useEffect } from 'react';
import '../../styles/Toast.css';

const Toast = ({ message, type = 'error', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type} flex items-center justify-between gap-base p-base px-md`}>
      <span className="text-base font-medium text-inverse">
        {message}
      </span>
      <button className="toast-close flex items-center justify-center" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Toast;
