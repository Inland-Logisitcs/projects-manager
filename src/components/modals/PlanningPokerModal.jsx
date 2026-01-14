import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createPlanningPokerSession,
  addVote,
  revealVotes,
  resetVoting,
  completeSession,
  cancelSession,
  subscribeToSession
} from '../../services/planningPokerService';
import { subscribeToUsers } from '../../services/userService';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import Toast from '../common/Toast';
import '../../styles/PlanningPoker.css';

// Valores de Fibonacci modificados para Planning Poker
const POKER_VALUES = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', '☕'];

const PlanningPokerModal = ({ task, onClose, onComplete }) => {
  const { user, userProfile } = useAuth();
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedValue, setSelectedValue] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalEstimate, setFinalEstimate] = useState('');

  // Cargar usuarios
  useEffect(() => {
    const unsubscribe = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });

    return () => unsubscribe();
  }, []);

  // Crear sesión al montar el componente
  useEffect(() => {
    const initSession = async () => {
      const result = await createPlanningPokerSession({
        taskId: task.id,
        taskTitle: task.title || task.name,
        sprintId: task.sprintId || null,
        createdBy: user.uid
      });

      if (result.success) {
        setSessionId(result.sessionId);
      } else {
        setToast({
          message: 'Error al crear sesión de Planning Poker',
          type: 'error'
        });
      }
      setLoading(false);
    };

    initSession();
  }, [task, user]);

  // Suscribirse a cambios en la sesión
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSession(sessionId, (sessionData) => {
      setSession(sessionData);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Manejar voto
  const handleVote = async (value) => {
    if (!sessionId || !user || !userProfile) return;

    // Si la sesión ya está revelada, no permitir votar
    if (session?.status === 'revealed') {
      setToast({
        message: 'Los votos ya fueron revelados. Reinicia la votación para votar nuevamente.',
        type: 'warning'
      });
      return;
    }

    setSelectedValue(value);

    const result = await addVote(sessionId, {
      userId: user.uid,
      userName: userProfile.displayName || userProfile.email,
      vote: value
    });

    if (!result.success) {
      setToast({
        message: 'Error al registrar voto',
        type: 'error'
      });
    }
  };

  // Revelar votos
  const handleReveal = async () => {
    if (!sessionId) return;

    const result = await revealVotes(sessionId);

    if (!result.success) {
      setToast({
        message: 'Error al revelar votos',
        type: 'error'
      });
    }
  };

  // Reiniciar votación
  const handleReset = async () => {
    if (!sessionId) return;

    setSelectedValue(null);
    const result = await resetVoting(sessionId);

    if (!result.success) {
      setToast({
        message: 'Error al reiniciar votación',
        type: 'error'
      });
    }
  };

  // Completar sesión
  const handleComplete = async () => {
    if (!sessionId) return;

    const estimate = parseInt(finalEstimate);
    if (isNaN(estimate) || estimate < 0) {
      setToast({
        message: 'Ingresa un valor numérico válido',
        type: 'error'
      });
      return;
    }

    const result = await completeSession(sessionId, estimate, task.id);

    if (result.success) {
      setToast({
        message: 'Estimación guardada exitosamente',
        type: 'success'
      });
      setTimeout(() => {
        if (onComplete) onComplete();
        onClose();
      }, 1000);
    } else {
      setToast({
        message: 'Error al completar sesión',
        type: 'error'
      });
    }
  };

  // Cancelar sesión
  const handleCancel = async () => {
    if (sessionId) {
      await cancelSession(sessionId);
    }
    onClose();
  };

  // Calcular estadísticas de los votos
  const getVoteStats = () => {
    if (!session?.votes || session.votes.length === 0) return null;

    // Filtrar votos numéricos (excluir '?' y '☕')
    const numericVotes = session.votes
      .filter(v => typeof v.vote === 'number')
      .map(v => v.vote);

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((acc, val) => acc + val, 0);
    const avg = sum / numericVotes.length;
    const sorted = [...numericVotes].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { avg, min, max, median };
  };

  const stats = session?.status === 'revealed' ? getVoteStats() : null;

  // Obtener el voto del usuario actual
  const currentUserVote = session?.votes?.find(v => v.userId === user?.uid);

  // Verificar si todos los usuarios han votado (solo usuarios activos)
  const allUsersVoted = session?.votes?.length === users.length && users.length > 0;

  if (loading) {
    return (
      <div className="modal-overlay" onClick={handleCancel}>
        <div className="modal-content planning-poker-modal" onClick={e => e.stopPropagation()}>
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Iniciando Planning Poker...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content planning-poker-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="planning-poker-header">
          <div className="flex items-center gap-base flex-1">
            <Icon name="zap" size={24} />
            <div>
              <h3 className="heading-3 text-primary m-0">Planning Poker</h3>
              <p className="text-sm text-secondary m-0">{task.title || task.name}</p>
            </div>
          </div>
          <button className="btn btn-icon" onClick={handleCancel}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Participantes y votos */}
        <div className="planning-poker-participants p-base border-b-light">
          <div className="flex items-center justify-between mb-base">
            <h4 className="heading-4 text-primary m-0">Participantes</h4>
            <span className="text-sm text-secondary">
              {session?.votes?.length || 0} / {users.length} votaron
            </span>
          </div>
          <div className="participants-grid">
            {users.map(u => {
              const vote = session?.votes?.find(v => v.userId === u.id);
              const hasVoted = !!vote;
              const isRevealed = session?.status === 'revealed';

              return (
                <div key={u.id} className="participant-card">
                  <UserAvatar userId={u.id} size={40} showName={false} />
                  <p className="text-sm font-medium text-primary m-0 mt-xs">
                    {u.displayName || u.email}
                  </p>
                  <div className="participant-vote">
                    {hasVoted ? (
                      isRevealed ? (
                        <span className="vote-value revealed">{vote.vote}</span>
                      ) : (
                        <span className="vote-value hidden">
                          <Icon name="check-circle" size={16} />
                        </span>
                      )
                    ) : (
                      <span className="vote-value pending">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tarjetas de votación */}
        {session?.status === 'voting' && (
          <div className="planning-poker-cards p-base">
            <h4 className="heading-4 text-primary mb-base">Selecciona tu estimación</h4>
            <div className="poker-cards-grid">
              {POKER_VALUES.map(value => (
                <button
                  key={value}
                  className={`poker-card ${currentUserVote?.vote === value ? 'selected' : ''}`}
                  onClick={() => handleVote(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            {currentUserVote && (
              <p className="text-sm text-secondary text-center mt-base">
                Tu voto: <strong>{currentUserVote.vote}</strong>
              </p>
            )}
          </div>
        )}

        {/* Resultados */}
        {session?.status === 'revealed' && stats && (
          <div className="planning-poker-results p-base">
            <h4 className="heading-4 text-primary mb-base">Resultados</h4>
            <div className="results-stats">
              <div className="stat-card">
                <span className="stat-label">Promedio</span>
                <span className="stat-value">{stats.avg.toFixed(1)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Mediana</span>
                <span className="stat-value">{stats.median}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Mínimo</span>
                <span className="stat-value">{stats.min}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Máximo</span>
                <span className="stat-value">{stats.max}</span>
              </div>
            </div>

            {/* Input para estimación final */}
            <div className="form-group mt-base">
              <label className="label">Estimación final (Story Points)</label>
              <input
                type="number"
                className="input"
                value={finalEstimate}
                onChange={e => setFinalEstimate(e.target.value)}
                placeholder={`Sugerido: ${Math.round(stats.avg)}`}
                min="0"
              />
            </div>
          </div>
        )}

        {/* Footer con acciones */}
        <div className="planning-poker-footer">
          <div className="flex gap-sm">
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
            {session?.status === 'voting' && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleReveal}
                  disabled={!session?.votes || session.votes.length === 0}
                >
                  <Icon name="eye" size={16} />
                  Revelar Votos
                </button>
                {allUsersVoted && (
                  <button
                    className="btn btn-success"
                    onClick={handleReveal}
                  >
                    <Icon name="check" size={16} />
                    Todos votaron - Revelar
                  </button>
                )}
              </>
            )}
            {session?.status === 'revealed' && (
              <>
                <button className="btn btn-secondary" onClick={handleReset}>
                  <Icon name="refresh-cw" size={16} />
                  Votar de nuevo
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleComplete}
                  disabled={!finalEstimate}
                >
                  <Icon name="check" size={16} />
                  Guardar Estimación
                </button>
              </>
            )}
          </div>
        </div>

        {/* Toast */}
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

export default PlanningPokerModal;
