import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToHolidays, createHoliday, deleteHoliday } from '../services/holidayService';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import '../styles/Holidays.css';

const Holidays = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Form state
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    const unsubscribe = subscribeToHolidays((data) => {
      setHolidays(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDate || !newName.trim()) return;

    // Verificar duplicado
    if (holidays.some(h => h.date === newDate)) {
      setToast({ message: 'Ya existe un feriado en esa fecha', type: 'error' });
      return;
    }

    setAdding(true);
    const result = await createHoliday({ date: newDate, name: newName.trim() });
    setAdding(false);

    if (result.success) {
      setToast({ message: 'Feriado agregado', type: 'success' });
      setNewDate('');
      setNewName('');
    } else {
      setToast({ message: 'Error al agregar: ' + result.error, type: 'error' });
    }
  };

  const handleDelete = (holiday) => {
    const dateFormatted = formatDateDisplay(holiday.date);
    setConfirmDialog({
      title: 'Eliminar feriado',
      message: `Eliminar "${holiday.name}" (${dateFormatted})?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await deleteHoliday(holiday.id);
        if (result.success) {
          setToast({ message: 'Feriado eliminado', type: 'success' });
        } else {
          setToast({ message: 'Error al eliminar: ' + result.error, type: 'error' });
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isPast = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date < today;
  };

  // Agrupar por ano
  const groupedByYear = holidays.reduce((acc, h) => {
    const year = h.date.split('-')[0];
    if (!acc[year]) acc[year] = [];
    acc[year].push(h);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="page-container page-container-narrow">
        <div className="empty-state">
          <div className="spinner"></div>
          <p className="text-base text-secondary">Cargando feriados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-container-narrow holidays-container">
      <div className="page-header">
        <div>
          <h1 className="heading-1 text-primary mb-xs">Dias Feriados</h1>
          <p className="text-base text-secondary">
            Los feriados se excluyen del calculo de dias laborables.
            Total: <strong className="text-primary">{holidays.length}</strong>
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="card p-base mb-lg">
        <form className="holidays-add-form" onSubmit={handleAdd}>
          <div className="form-group holidays-form-field">
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group holidays-form-field holidays-form-name">
            <label className="label">Nombre</label>
            <input
              type="text"
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Dia de la Independencia"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-xs holidays-add-btn"
            disabled={adding || !newDate || !newName.trim()}
          >
            <Icon name="plus" size={18} />
            Agregar
          </button>
        </form>
      </div>

      {/* List grouped by year */}
      {years.length === 0 ? (
        <div className="card">
          <div className="empty-state p-xl">
            <Icon name="calendar" size={48} className="text-tertiary" />
            <p className="text-base text-secondary mt-base">No hay feriados registrados</p>
          </div>
        </div>
      ) : (
        years.map(year => (
          <div key={year} className="holidays-year-section">
            <h2 className="heading-2 text-primary mb-sm">{year}</h2>
            <div className="card">
              <div className="holidays-list">
                {groupedByYear[year].map(holiday => (
                  <div
                    key={holiday.id}
                    className={`holidays-item ${isPast(holiday.date) ? 'holidays-item-past' : ''}`}
                  >
                    <div className="holidays-item-date">
                      <span className="holidays-day">
                        {holiday.date.split('-')[2]}
                      </span>
                      <span className="holidays-month">
                        {new Date(holiday.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                    </div>
                    <div className="holidays-item-info">
                      <span className="text-base font-medium text-primary">{holiday.name}</span>
                      <span className="text-xs text-tertiary">
                        {formatDateDisplay(holiday.date)}
                      </span>
                    </div>
                    <button
                      className="btn btn-icon holidays-delete-btn"
                      onClick={() => handleDelete(holiday)}
                      title="Eliminar feriado"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
};

export default Holidays;
