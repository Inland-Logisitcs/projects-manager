import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  joinSession,
  leaveSession,
  toggleReady,
  presentTask,
  addVote,
  revealVotes,
  saveTaskEstimate,
  completeSession,
  cancelSession,
  subscribeToSession
} from '../../services/planningPokerService';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import Toast from '../common/Toast';
import Confetti from 'react-confetti';
import '../../styles/PlanningPoker.css';

const POKER_VALUES = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', '☕'];

const PlanningPokerRoomModal = ({ sessionId, onClose }) => {
  const { user, userProfile } = useAuth();
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [finalEstimate, setFinalEstimate] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const isModerator = session?.moderatorId === user?.uid;
  const hasJoined = session?.participants?.some(p => p.userId === user?.uid);
  const currentUser = session?.participants?.find(p => p.userId === user?.uid);
  const currentTask = session?.currentTaskIndex !== null && session?.taskDetails ? session.taskDetails[session.currentTaskIndex] : null;
  const currentUserVote = session?.votes?.find(v => v.userId === user?.uid);

  // Suscribirse a cambios en la sesión
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSession(sessionId, (sessionData) => {
      setSession(sessionData);

      // Si la sesión fue cancelada
      if (!sessionData) {
        setToast({ message: 'La sesión fue cancelada', type: 'info' });
        setTimeout(() => onClose(), 2000);
      }
    });

    return () => unsubscribe();
  }, [sessionId, onClose]);

  // Unirse automáticamente si no es el moderador
  useEffect(() => {
    if (session && user && userProfile && !isModerator && !hasJoined) {
      handleJoinSession();
    }
  }, [session, user, userProfile, isModerator, hasJoined]);

  // Detectar consenso
  useEffect(() => {
    if (session?.status === 'revealed' && session.votes.length > 0) {
      const numericVotes = session.votes
        .filter(v => typeof v.vote === 'number')
        .map(v => v.vote);

      if (numericVotes.length > 1) {
        const allSame = numericVotes.every(v => v === numericVotes[0]);
        if (allSame) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
    }
  }, [session?.status, session?.votes]);

  // Resize window
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJoinSession = async () => {
    const result = await joinSession(sessionId, {
      userId: user.uid,
      userName: userProfile.displayName || userProfile.email
    });

    if (!result.success) {
      setToast({ message: result.error || 'Error al unirse', type: 'error' });
    }
  };

  const handleLeaveSession = async () => {
    await leaveSession(sessionId, user.uid);
    onClose();
  };

  const handleToggleReady = async () => {
    await toggleReady(sessionId, user.uid);
  };

  const handlePresentTask = async (index) => {
    setSelectedValue(null);
    setFinalEstimate('');
    await presentTask(sessionId, index);
  };

  const handleVote = async (value) => {
    if (session.status !== 'voting') return;

    setSelectedValue(value);
    const result = await addVote(sessionId, {
      userId: user.uid,
      userName: userProfile.displayName || userProfile.email,
      vote: value
    });

    if (!result.success) {
      setToast({ message: 'Error al registrar voto', type: 'error' });
    }
  };

  const handleReveal = async () => {
    await revealVotes(sessionId);
  };

  const handleSaveEstimate = async () => {
    const estimate = parseFloat(finalEstimate);
    if (isNaN(estimate) || estimate < 0) {
      setToast({ message: 'Ingresa un valor válido', type: 'error' });
      return;
    }

    const result = await saveTaskEstimate(sessionId, estimate);
    if (result.success) {
      setToast({ message: 'Estimación guardada', type: 'success' });
      setFinalEstimate('');
      setSelectedValue(null);
    } else {
      setToast({ message: 'Error al guardar', type: 'error' });
    }
  };

  const handleCompleteSession = async () => {
    await completeSession(sessionId);
    setToast({ message: 'Sesión completada', type: 'success' });
    setTimeout(() => onClose(), 2000);
  };

  const handleCancelSession = async () => {
    await cancelSession(sessionId);
    onClose();
  };

  // Calcular estadísticas
  const getVoteStats = () => {
    if (!session?.votes || session.votes.length === 0) return null;

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

    const allSame = numericVotes.every(v => v === numericVotes[0]);

    return { avg, min, max, median, allSame };
  };

  const stats = session?.status === 'revealed' ? getVoteStats() : null;
  const allParticipantsVoted = session?.participants?.length > 0 &&
    (session.votes?.length || 0) === session.participants.length;

  if (!session) {
    return (
      <div className="modal-overlay">
        <div className="modal-content planning-poker-modal">
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Cargando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={isModerator ? handleCancelSession : handleLeaveSession}>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}

      <div className="modal-content planning-poker-room-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="planning-poker-header">
          <div className="flex items-center gap-base flex-1">
            <Icon name="zap" size={24} />
            <div>
              <h3 className="heading-3 text-primary m-0">Planning Poker</h3>
              <p className="text-sm text-secondary m-0">
                Moderador: {session.moderatorName}
              </p>
            </div>
          </div>
          <button className="btn btn-icon" onClick={isModerator ? handleCancelSession : handleLeaveSession}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="planning-poker-content">
          {/* Sidebar: Lista de tareas */}
          <div className="planning-poker-sidebar">
            <h4 className="heading-4 text-primary mb-base">Tareas ({session.tasks?.length || 0})</h4>
            <div className="task-queue">
              {session.taskDetails?.map((task, index) => {
                const isEstimated = session.taskEstimates[task.id] !== undefined;
                const isCurrent = session.currentTaskIndex === index;

                return (
                  <div
                    key={task.id}
                    className={`task-queue-item ${isCurrent ? 'current' : ''} ${isEstimated ? 'estimated' : ''}`}
                    onClick={() => isModerator && handlePresentTask(index)}
                    style={{ cursor: isModerator ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-center gap-xs flex-1">
                      {isEstimated && <Icon name="check-circle" size={16} className="text-success" />}
                      {isCurrent && <Icon name="play-circle" size={16} className="text-primary" />}
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    {isEstimated && (
                      <span className="badge badge-success">{session.taskEstimates[task.id]} pts</span>
                    )}
                  </div>
                );
              })}
            </div>

            {isModerator && (
              <button
                className="btn btn-success w-full mt-base"
                onClick={handleCompleteSession}
                disabled={Object.keys(session.taskEstimates || {}).length < (session.tasks?.length || 0)}
              >
                <Icon name="check" size={16} />
                Finalizar Sesión
              </button>
            )}
          </div>

          {/* Main: Área de votación */}
          <div className="planning-poker-main">
            {/* Participantes */}
            <div className="participants-section">
              <h4 className="heading-4 text-primary mb-base">
                Participantes ({session.participants?.length || 0})
              </h4>
              <div className="participants-grid">
                {/* Moderador */}
                <div className="participant-card moderator">
                  <UserAvatar userId={session.moderatorId} size={40} showName={false} />
                  <p className="text-sm font-medium text-primary m-0 mt-xs">
                    {session.moderatorName}
                  </p>
                  <span className="badge badge-primary text-xs mt-xs">Moderador</span>
                </div>

                {/* Participantes */}
                {session.participants?.map(participant => {
                  const vote = session.votes?.find(v => v.userId === participant.userId);
                  const hasVoted = !!vote;
                  const isRevealed = session.status === 'revealed';

                  return (
                    <div key={participant.userId} className="participant-card">
                      <UserAvatar userId={participant.userId} size={40} showName={false} />
                      <p className="text-sm font-medium text-primary m-0 mt-xs">
                        {participant.userName}
                      </p>
                      <div className="participant-vote mt-xs">
                        {session.status === 'waiting' ? (
                          participant.isReady ? (
                            <span className="badge badge-success text-xs">Listo</span>
                          ) : (
                            <span className="badge badge-secondary text-xs">Esperando</span>
                          )
                        ) : hasVoted ? (
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

            {/* Área de votación */}
            {session.status === 'waiting' && !currentTask && (
              <div className="empty-state text-center p-3xl">
                <Icon name="users" size={64} />
                <h4 className="heading-4 text-primary mt-base mb-xs">
                  Esperando a que comience
                </h4>
                <p className="text-base text-secondary">
                  {isModerator
                    ? 'Selecciona una tarea de la lista para comenzar'
                    : 'El moderador seleccionará una tarea pronto'}
                </p>
                {!isModerator && hasJoined && (
                  <button
                    className={`btn ${currentUser?.isReady ? 'btn-secondary' : 'btn-primary'} mt-base`}
                    onClick={handleToggleReady}
                  >
                    <Icon name={currentUser?.isReady ? 'x' : 'check'} size={16} />
                    {currentUser?.isReady ? 'No estoy listo' : 'Estoy listo'}
                  </button>
                )}
              </div>
            )}

            {currentTask && (
              <>
                {/* Información de la tarea */}
                <div className="task-presentation p-base border-b-light">
                  <h4 className="heading-3 text-primary mb-sm">{currentTask.title}</h4>
                  {currentTask.description && (
                    <div
                      className="task-description text-sm text-secondary mb-base"
                      dangerouslySetInnerHTML={{ __html: currentTask.description }}
                    />
                  )}
                  {currentTask.attachments && currentTask.attachments.length > 0 && (
                    <div className="task-attachments">
                      <p className="text-sm font-semibold text-primary mb-xs">
                        Archivos adjuntos ({currentTask.attachments.length})
                      </p>
                      <div className="flex flex-wrap gap-xs">
                        {currentTask.attachments.map(att => (
                          <a
                            key={att.url}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge badge-secondary flex items-center gap-xs"
                          >
                            <Icon name="paperclip" size={12} />
                            {att.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Votación */}
                {session.status === 'voting' && (
                  <div className="voting-section p-base">
                    <h4 className="heading-4 text-primary mb-base">Selecciona tu estimación</h4>
                    <div className="poker-cards-grid">
                      {POKER_VALUES.map(value => (
                        <button
                          key={value}
                          className={`poker-card ${currentUserVote?.vote === value ? 'selected' : ''}`}
                          onClick={() => handleVote(value)}
                          disabled={isModerator}
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
                    {isModerator && (
                      <button
                        className="btn btn-primary w-full mt-base"
                        onClick={handleReveal}
                        disabled={(session.votes?.length || 0) === 0}
                      >
                        <Icon name="eye" size={16} />
                        Revelar votos ({session.votes?.length || 0})
                      </button>
                    )}
                    {!isModerator && allParticipantsVoted && (
                      <div className="text-center mt-base">
                        <span className="badge badge-success">Todos votaron - Esperando revelación</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Resultados */}
                {session.status === 'revealed' && stats && (
                  <div className="results-section p-base">
                    <h4 className="heading-4 text-primary mb-base">Resultados</h4>
                    {stats.allSame && (
                      <div className="consensus-message text-center mb-base p-base" style={{ backgroundColor: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-base)' }}>
                        <Icon name="check-circle" size={24} />
                        <p className="font-bold m-0">¡Consenso alcanzado!</p>
                      </div>
                    )}
                    <div className="results-stats mb-base">
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

                    {isModerator && (
                      <div className="form-group">
                        <label className="label">Estimación final (Story Points)</label>
                        <div className="flex gap-sm">
                          <input
                            type="number"
                            className="input flex-1"
                            value={finalEstimate}
                            onChange={e => setFinalEstimate(e.target.value)}
                            placeholder={`Sugerido: ${Math.round(stats.avg)}`}
                            min="0"
                            step="0.5"
                          />
                          <button
                            className="btn btn-success"
                            onClick={handleSaveEstimate}
                            disabled={!finalEstimate}
                          >
                            <Icon name="check" size={16} />
                            Guardar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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

export default PlanningPokerRoomModal;
