import { useState, useEffect, useMemo, memo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  joinSession,
  leaveSession,
  toggleReady,
  presentTask,
  addVote,
  revealVotes,
  restartVoting,
  saveTaskEstimate,
  completeSession,
  cancelSession,
  subscribeToSession
} from '../services/planningPokerService';
import Icon from '../components/common/Icon';
import UserAvatar from '../components/common/UserAvatar';
import Toast from '../components/common/Toast';
import Confetti from 'react-confetti';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import '../styles/PlanningPoker.css';

// Componente memorizado para cada participante individual
const ParticipantAvatar = memo(({ userId, userName, vote, sessionStatus, isModerator }) => {
  const hasVoted = !!vote;
  const isRevealed = sessionStatus === 'revealed';

  return (
    <div
      key={userId}
      className={`participant-compact ${isModerator ? 'moderator' : ''}`}
      title={userName}
    >
      <UserAvatar userId={userId} userName={userName} size={32} showName={false} />
      {sessionStatus !== 'waiting' && (
        <div className="participant-vote-badge">
          {hasVoted ? (
            isRevealed ? (
              <span className="vote-compact revealed">{vote.vote}</span>
            ) : (
              <Icon name="check-circle" size={12} className="text-success" />
            )
          ) : (
            <span className="vote-compact pending">-</span>
          )}
        </div>
      )}
    </div>
  );
});

ParticipantAvatar.displayName = 'ParticipantAvatar';

const PlanningPoker = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const { user, userProfile } = useAuth();
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [finalEstimate, setFinalEstimate] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showTaskList, setShowTaskList] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isEditingVote, setIsEditingVote] = useState(false);
  const hasJoinedRef = useRef(false);
  const cleanupTimerRef = useRef(null);


  const isModerator = session?.moderatorId === user?.uid;
  const hasJoined = session?.participants?.some(p => p.userId === user?.uid);
  const currentUser = session?.participants?.find(p => p.userId === user?.uid);
  const currentTask = session?.currentTaskIndex !== null && session?.taskDetails ? session.taskDetails[session.currentTaskIndex] : null;
  const currentUserVote = session?.votes?.find(v => v.userId === user?.uid);

  // Memorizar la lista de participantes para evitar re-renders
  const participantsList = useMemo(() => {
    if (!session?.participants) return [];
    return [...session.participants];
  }, [JSON.stringify(session?.participants?.map(p => p.userId).sort())]);

  // Memorizar votos para evitar re-renders
  const votesList = useMemo(() => {
    if (!session?.votes) return [];
    return [...session.votes];
  }, [JSON.stringify(session?.votes?.map(v => `${v.userId}:${v.vote}`).sort())]);

  // Suscribirse a cambios en la sesión
  useEffect(() => {
    if (!sessionId) {
      navigate('/backlog');
      return;
    }

    const unsubscribe = subscribeToSession(sessionId, (sessionData) => {
      setSession(sessionData);

      // Si la sesión fue cancelada
      if (!sessionData) {
        setToast({ message: 'La sesión fue cancelada', type: 'info' });
        setTimeout(() => navigate('/backlog'), 2000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, navigate]);

  // Resetear hasJoinedRef cuando cambia la sesión
  useEffect(() => {
    hasJoinedRef.current = false;
  }, [sessionId]);

  // Unirse automáticamente si no es el moderador
  useEffect(() => {
    if (session && user && userProfile && !isModerator && !hasJoined && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      handleJoinSession();
    }
  }, [session, user, userProfile, isModerator, hasJoined]);

  // Desconectar al usuario cuando sale de la página
  useEffect(() => {
    // Limpiar cualquier timer pendiente
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    // Guardar referencias para el cleanup
    const currentSessionId = sessionId;
    const currentUserId = user?.uid;
    const currentIsModerator = session?.moderatorId === user?.uid;

    return () => {
      // Cleanup: desconectar al usuario cuando el componente se desmonta
      // Usar un timer para evitar que Strict Mode cause desconexiones prematuras
      cleanupTimerRef.current = setTimeout(() => {
        if (currentSessionId && currentUserId && !currentIsModerator) {
          leaveSession(currentSessionId, currentUserId);
        }
        cleanupTimerRef.current = null;
      }, 500); // Timer de 500ms para mayor estabilidad
    };
  }, [sessionId, user?.uid]);

  // Detectar consenso
  useEffect(() => {
    if (session?.status === 'revealed' && session.votes?.length > 0) {
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

  // Revelar automáticamente cuando todos voten
  useEffect(() => {
    if (session?.status === 'voting' && session.votes?.length > 0) {
      // Total de participantes = participantes + moderador
      const totalParticipants = (session.participants?.length || 0) + 1;
      const totalVotes = session.votes.length;

      // Si todos votaron, revelar automáticamente
      if (totalVotes === totalParticipants) {
        revealVotes(sessionId);
      }
    }
  }, [session?.status, session?.votes?.length, session?.participants?.length, sessionId]);

  // Colocar promedio en el input cuando se revelan los votos
  useEffect(() => {
    if (session?.status === 'revealed' && session.votes?.length > 0) {
      const numericVotes = session.votes
        .filter(v => typeof v.vote === 'number')
        .map(v => v.vote);

      if (numericVotes.length > 0) {
        const sum = numericVotes.reduce((acc, val) => acc + val, 0);
        const avg = sum / numericVotes.length;
        // Redondear a 1 decimal
        setFinalEstimate(avg.toFixed(1));
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
    if (!isModerator) {
      await leaveSession(sessionId, user.uid);
    }
    navigate('/backlog');
  };

  const handleToggleReady = async () => {
    await toggleReady(sessionId, user.uid);
  };

  const handlePresentTask = async (index) => {
    setSelectedValue(null);
    setFinalEstimate('');
    setShowTaskList(false); // Cerrar sidebar en móvil
    await presentTask(sessionId, index);
  };

  const handleVote = async (value) => {
    if (session.status !== 'voting') return;

    setSelectedValue(value);
    const result = await addVote(sessionId, {
      userId: user.uid,
      userName: userProfile.displayName || userProfile.email || session.moderatorName,
      vote: value
    });

    if (!result.success) {
      setToast({ message: 'Error al registrar voto', type: 'error' });
    }
  };

  const handleOpenVotingModal = () => {
    setShowVotingModal(true);
    setIsEditingVote(false);
    // Encontrar el índice de la carta ya seleccionada, o empezar en 0
    const currentIndex = session.pokerValues?.findIndex(v => v === selectedValue) ?? 0;
    setSelectedCardIndex(currentIndex >= 0 ? currentIndex : 0);
  };

  const handleConfirmVote = async () => {
    const selectedValue = session.pokerValues[selectedCardIndex];
    await handleVote(selectedValue);
    setIsEditingVote(false);
    // No cerrar el modal, mantenerlo abierto
  };

  const handleStartEditingVote = () => {
    setIsEditingVote(true);
  };

  const handleNextCard = () => {
    if (currentUserVote && !isEditingVote) return;
    if (selectedCardIndex < session.pokerValues.length - 1) {
      setSlideDirection('next');
      setTimeout(() => setSlideDirection(null), 300);
      setSelectedCardIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentUserVote && !isEditingVote) return;
    if (selectedCardIndex > 0) {
      setSlideDirection('prev');
      setTimeout(() => setSlideDirection(null), 300);
      setSelectedCardIndex((prev) => prev - 1);
    }
  };

  // Soporte para swipe
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    if (currentUserVote && !isEditingVote) {
      touchStartRef.current = null;
      return;
    }

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    // Si deslizó más de 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Deslizó hacia la izquierda -> siguiente
        handleNextCard();
      } else {
        // Deslizó hacia la derecha -> anterior
        handlePrevCard();
      }
    }

    touchStartRef.current = null;
  };

  const handleReveal = async () => {
    await revealVotes(sessionId);
  };

  const handleRestartVoting = async () => {
    setSelectedValue(null);
    setFinalEstimate('');
    await restartVoting(sessionId);
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

      // Buscar la siguiente tarea sin estimación
      const nextTaskIndex = session.taskDetails?.findIndex((task, index) => {
        return session.taskEstimates?.[task.id] === undefined && index !== session.currentTaskIndex;
      });

      // Si hay una siguiente tarea, presentarla automáticamente
      if (nextTaskIndex !== undefined && nextTaskIndex !== -1) {
        setTimeout(() => {
          handlePresentTask(nextTaskIndex);
        }, 500);
      }
    } else {
      setToast({ message: 'Error al guardar', type: 'error' });
    }
  };

  const handleCompleteSession = async () => {
    const result = await completeSession(sessionId);
    if (result.success) {
      setToast({ message: 'Sesión completada exitosamente', type: 'success' });
      setTimeout(() => navigate('/backlog'), 2000);
    } else {
      setToast({ message: 'Error al completar sesión', type: 'error' });
    }
  };

  const handleCancelSession = async () => {
    await cancelSession(sessionId);
    navigate('/backlog');
  };

  // Calcular estadísticas
  const getVoteStats = () => {
    if (!session?.votes || session.votes.length === 0) return null;

    const numericVotes = session.votes
      .filter(v => v && v.vote !== null && v.vote !== undefined && !isNaN(parseFloat(v.vote)))
      .map(v => parseFloat(v.vote));

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((acc, val) => acc + val, 0);
    const average = Number((sum / numericVotes.length).toFixed(1));
    const sorted = [...numericVotes].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Calcular la moda (valor más frecuente)
    const frequency = {};
    numericVotes.forEach(vote => {
      frequency[vote] = (frequency[vote] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(frequency));
    const modes = Object.keys(frequency).filter(key => frequency[key] === maxFreq);
    const mode = modes.length > 0 ? modes[0] : numericVotes[0];

    const allSame = numericVotes.every(v => v === numericVotes[0]);

    return { average, min, max, mode, allSame };
  };

  const stats = session?.status === 'revealed' ? getVoteStats() : null;
  const allParticipantsVoted = session?.participants?.length > 0 &&
    (session.votes?.length || 0) === session.participants.length;

  if (!session) {
    return (
      <div className="planning-poker-page">
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-poker-page">
      {showConfetti && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
        </div>
      )}

      {/* Header */}
      <div className="planning-poker-header">
        <button className="btn btn-secondary flex items-center gap-xs" onClick={handleLeaveSession}>
          <Icon name="arrow-left" size={18} />
          <span className="btn-text-mobile-hidden">Volver al Backlog</span>
        </button>
        <div className="flex items-center gap-base flex-1">
          <Icon name="zap" size={24} />
          <div>
            <h2 className="heading-2 text-primary m-0">Planning Poker</h2>
            <p className="text-sm text-secondary m-0">
              Moderador: {session.moderatorName}
            </p>
          </div>
        </div>
        {isModerator && (
          <button className="btn btn-danger flex items-center gap-xs" onClick={handleCancelSession}>
            <Icon name="x" size={18} />
            <span className="btn-text-mobile-hidden">Cancelar Sesión</span>
          </button>
        )}
      </div>

      <div className="planning-poker-content">
        {/* Toggle button for mobile */}
        <button
          className="task-list-toggle-mobile"
          onClick={() => setShowTaskList(!showTaskList)}
        >
          <Icon name={showTaskList ? 'x' : 'list'} size={18} />
          <span>{showTaskList ? 'Cerrar' : 'Tareas'} ({session.tasks?.length || 0})</span>
        </button>

        {/* Sidebar: Lista de tareas */}
        <div className={`planning-poker-sidebar ${showTaskList ? 'show-mobile' : ''}`}>
          <div className="flex items-center justify-between mb-base">
            <h4 className="heading-4 text-primary m-0">Tareas ({session.tasks?.length || 0})</h4>
            {isModerator && !currentTask && (
              <span className="badge badge-warning text-xs">Selecciona una</span>
            )}
          </div>
          <div className="task-queue">
            {session.taskDetails?.map((task, index) => {
              const isEstimated = session.taskEstimates?.[task.id] !== undefined;
              const isCurrent = session.currentTaskIndex === index;

              return (
                <div
                  key={task.id}
                  className={`task-queue-item ${isCurrent ? 'current' : ''} ${isEstimated ? 'estimated' : ''}`}
                  onClick={() => isModerator && !isEstimated && handlePresentTask(index)}
                  style={{
                    cursor: isModerator && !isEstimated ? 'pointer' : 'default',
                    opacity: isEstimated ? 0.6 : 1
                  }}
                  title={isModerator && !isEstimated ? 'Click para presentar esta tarea' : ''}
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
              {/* Área scrollable con información de la tarea */}
              <div className="planning-poker-scrollable">
                {/* Información de la tarea - Estilo similar a TaskDetailSidebar */}
                <div className="poker-task-section">
                  <div className="flex items-center justify-between mb-base">
                    <h3 className="poker-task-title">{currentTask.title}</h3>
                    {session.status === 'revealed' && (
                      <span className="badge badge-primary">Revelado</span>
                    )}
                  </div>
                  {currentTask.description && (
                    <div>
                      <h4 className="poker-section-label">Descripción</h4>
                      <div
                        className="poker-task-description"
                        dangerouslySetInnerHTML={{ __html: currentTask.description }}
                      />
                    </div>
                  )}
                  {currentTask.attachments && currentTask.attachments.length > 0 && (
                    <div className="mt-base">
                      <h4 className="poker-section-label">
                        Archivos adjuntos ({currentTask.attachments.length})
                      </h4>
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

                {/* Resultados */}
                {session.status === 'revealed' && stats && (
                  <div className="results-section">
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
                        <span className="stat-value">{stats.average}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Moda</span>
                        <span className="stat-value">{stats.mode}</span>
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
                            className="btn btn-secondary"
                            onClick={handleRestartVoting}
                          >
                            <Icon name="rotate-ccw" size={16} />
                            Reiniciar
                          </button>
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
              </div>

              {/* Mazo de cartas - FIJO arriba del footer (DESKTOP) */}
              {session.status === 'voting' && (
                <div className="poker-deck-fixed poker-deck-desktop">
                  <h4 className="heading-4 text-primary mb-base">Selecciona tu estimación</h4>
                  <div className="poker-cards-grid">
                    {(session.pokerValues || []).map(value => (
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
                    <p className="text-sm text-secondary text-center mt-sm">
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
                    <div className="text-center mt-sm">
                      <span className="badge badge-success">Todos votaron - Esperando revelación</span>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de votar para MÓVIL */}
              {session.status === 'voting' && (
                <div className="poker-vote-button-mobile">
                  {isModerator ? (
                    <div className="flex gap-xs">
                      <button className="btn btn-primary btn-lg flex-1" onClick={handleOpenVotingModal}>
                        <Icon name="credit-card" size={20} />
                        {currentUserVote ? `Cambiar (${currentUserVote.vote})` : 'Votar'}
                      </button>
                      <button
                        className="btn btn-secondary btn-lg"
                        onClick={handleReveal}
                        disabled={(session.votes?.length || 0) === 0}
                      >
                        <Icon name="eye" size={16} />
                        Revelar ({session.votes?.length || 0})
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-lg w-full" onClick={handleOpenVotingModal}>
                      <Icon name="credit-card" size={20} />
                      {currentUserVote ? `Cambiar voto (${currentUserVote.vote})` : 'Votar'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Participantes Compactos - Footer */}
          <div className="participants-footer">
            <div className="flex items-center gap-sm">
              <Icon name="users" size={16} className="text-secondary" />
              <span className="text-xs text-secondary font-medium">
                Participantes ({(session.participants?.length || 0) + 1}):
              </span>
            </div>
            <TransitionGroup className="participants-compact-list">
              {/* Moderador */}
              <CSSTransition
                key={`mod-${session.moderatorId}`}
                timeout={300}
                classNames="participant-fade"
              >
                <ParticipantAvatar
                  userId={session.moderatorId}
                  userName={session.moderatorName}
                  vote={votesList.find(v => v.userId === session.moderatorId)}
                  sessionStatus={session.status}
                  isModerator={true}
                />
              </CSSTransition>

              {/* Participantes */}
              {participantsList.map(participant => (
                <CSSTransition
                  key={participant.userId}
                  timeout={300}
                  classNames="participant-fade"
                >
                  <ParticipantAvatar
                    userId={participant.userId}
                    userName={participant.userName}
                    vote={votesList.find(v => v.userId === participant.userId)}
                    sessionStatus={session.status}
                    isModerator={false}
                  />
                </CSSTransition>
              ))}
            </TransitionGroup>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de votación para móvil */}
      {showVotingModal && session.pokerValues && (
        <div className="voting-modal-overlay" onClick={() => setShowVotingModal(false)}>
          <div className="voting-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="voting-modal-close" onClick={() => setShowVotingModal(false)}>
              <Icon name="x" size={24} />
            </button>

            {session.status === 'voting' && (
              <>
                <h3 className="voting-modal-title">
                  {currentUserVote && !isEditingVote ? `Tu voto: ${currentUserVote.vote}` : 'Selecciona tu estimación'}
                </h3>

                {currentUserVote && !isEditingVote && (
                  <div className="voting-waiting-badge">
                    <Icon name="clock" size={16} />
                    <span>Esperando... ({session.votes?.length || 0}/{session.participants?.length || 0})</span>
                  </div>
                )}

                <div className="voting-modal-card-container">
                  <button
                    className="voting-nav-button voting-nav-left"
                    onClick={handlePrevCard}
                    disabled={selectedCardIndex === 0 || (currentUserVote && !isEditingVote)}
                  >
                    <Icon name="chevron-left" size={32} />
                  </button>

                  <div
                    className={`voting-card-large ${currentUserVote && !isEditingVote ? 'locked' : ''} ${slideDirection === 'next' ? 'slide-next' : slideDirection === 'prev' ? 'slide-prev' : ''}`}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    key={selectedCardIndex}
                  >
                    {currentUserVote && !isEditingVote ? currentUserVote.vote : session.pokerValues[selectedCardIndex]}
                  </div>

                  <button
                    className="voting-nav-button voting-nav-right"
                    onClick={handleNextCard}
                    disabled={selectedCardIndex === session.pokerValues.length - 1 || (currentUserVote && !isEditingVote)}
                  >
                    <Icon name="chevron-right" size={32} />
                  </button>
                </div>

                {(!currentUserVote || isEditingVote) && (
                  <div className="voting-modal-indicator">
                    {session.pokerValues.map((value, index) => (
                      <span
                        key={value}
                        className={`voting-dot ${index === selectedCardIndex ? 'active' : ''}`}
                        onClick={() => setSelectedCardIndex(index)}
                      />
                    ))}
                  </div>
                )}

                {currentUserVote && !isEditingVote ? (
                  <button className="btn btn-primary btn-lg w-full" onClick={handleStartEditingVote}>
                    <Icon name="edit" size={20} />
                    Cambiar voto
                  </button>
                ) : (
                  <button className="btn btn-success btn-lg w-full" onClick={handleConfirmVote}>
                    <Icon name="check" size={20} />
                    Confirmar voto: {session.pokerValues[selectedCardIndex]}
                  </button>
                )}
              </>
            )}

            {session.status === 'revealed' && stats && (
              <div className="voting-modal-results">
                <h3 className="voting-modal-title mb-base">Resultados</h3>

                {stats.allSame && (
                  <div className="consensus-message text-center mb-base p-base" style={{ backgroundColor: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-base)' }}>
                    <Icon name="check-circle" size={24} />
                    <p className="text-base font-bold m-0">¡Consenso alcanzado!</p>
                    <p className="text-lg font-bold m-0 mt-xs">{stats.mode}</p>
                  </div>
                )}

                <div className="voting-results-stats">
                  <div className="stat-card">
                    <span className="stat-label">Promedio</span>
                    <span className="stat-value">{stats.average}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Moda</span>
                    <span className="stat-value">{stats.mode}</span>
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

                <div className="voting-results-votes">
                  <h4 className="text-sm text-secondary font-medium mb-sm">Votos individuales</h4>
                  <div className="votes-list">
                    {session.votes?.map(vote => (
                      <div key={vote.userId} className="vote-item flex items-center justify-between p-sm">
                        <span className="text-base">{vote.userName}</span>
                        <span className="badge badge-primary">{vote.vote}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isModerator && (
                  <div className="flex flex-col gap-xs mt-base">
                    <button className="btn btn-primary btn-lg w-full" onClick={() => setShowVotingModal(false)}>
                      <Icon name="check" size={20} />
                      Cerrar
                    </button>
                    <button className="btn btn-secondary btn-lg w-full" onClick={handleRestartVoting}>
                      <Icon name="refresh-cw" size={20} />
                      Votar de nuevo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningPoker;
