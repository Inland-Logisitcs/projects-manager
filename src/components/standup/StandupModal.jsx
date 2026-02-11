import { useState, useEffect, useMemo } from 'react';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import { calculateDelay } from '../../utils/delayCalculation';

const StandupModal = ({ isOpen, onClose, sprint, users, tasks }) => {
  const [step, setStep] = useState('select'); // 'select', 'shuffle', 'presenting'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [shuffledUsers, setShuffledUsers] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleHighlight, setShuffleHighlight] = useState(null);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedUserIds([]);
      setShuffledUsers([]);
      setCurrentUserIndex(0);
      setIsShuffling(false);
      setShuffleHighlight(null);
    }
  }, [isOpen]);

  // Obtener usuarios habilitados
  const enabledUsers = useMemo(() => {
    return users.filter(u => !u.disabled).sort((a, b) => {
      const nameA = a.displayName || a.email;
      const nameB = b.displayName || b.email;
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  // Mapa de usuarios por ID para calcular delay
  const usersMap = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.id] = u; });
    return map;
  }, [users]);

  // Seleccionar todos los usuarios por defecto al abrir
  useEffect(() => {
    if (isOpen && enabledUsers.length > 0 && selectedUserIds.length === 0) {
      setSelectedUserIds(enabledUsers.map(u => u.id));
    }
  }, [isOpen, enabledUsers]);

  const toggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selectedUserIds.length === enabledUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(enabledUsers.map(u => u.id));
    }
  };

  // Función para mezclar array (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startShuffle = () => {
    if (selectedUserIds.length === 0) return;

    setStep('shuffle');
    setIsShuffling(true);

    const selectedUsers = enabledUsers.filter(u => selectedUserIds.includes(u.id));

    // Generar el orden final antes de empezar la animación
    const finalOrder = shuffleArray(selectedUsers);
    const firstUserIndex = selectedUsers.findIndex(u => u.id === finalOrder[0].id);

    let iterations = 0;
    const maxIterations = 12;

    const shuffleInterval = setInterval(() => {
      // En las últimas 3 iteraciones, mostrar el usuario que va a quedar primero
      if (iterations >= maxIterations - 3) {
        setShuffleHighlight(firstUserIndex);
      } else {
        const randomIndex = Math.floor(Math.random() * selectedUsers.length);
        setShuffleHighlight(randomIndex);
      }
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(shuffleInterval);
        setShuffledUsers(finalOrder);
        setIsShuffling(false);
        setTimeout(() => {
          setStep('presenting');
          setCurrentUserIndex(0);
        }, 300);
      }
    }, 80);
  };

  // Calcular tiempo en columna (misma lógica que KanbanCard)
  const getTimeInColumn = (task) => {
    if (!task.lastStatusChange) return null;

    const now = new Date();
    const changeDate = task.lastStatusChange.toDate ? task.lastStatusChange.toDate() : new Date(task.lastStatusChange);
    const diffMs = now - changeDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '<1m';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };

  // Calcular delay de una tarea
  const getDelayInfo = (task) => {
    const user = usersMap[task.assignedTo];
    return calculateDelay(task, user, 'optimistic');
  };

  // Calcular datos del burndown chart
  const getBurndownData = () => {
    if (!sprint || !sprint.startDate || !sprint.endDate) return null;

    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id && !t.archived);
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = sprintTasks.filter(t => t.status === 'completed' || t.status === 'qa').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.min(Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)), totalDays);

    return {
      totalPoints,
      completedPoints,
      remainingPoints,
      totalDays,
      daysPassed,
      percentageComplete: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
    };
  };

  const burndownData = getBurndownData();

  // Obtener tareas del usuario para el standup
  const getUserStandupData = (userId) => {
    const userTasks = tasks.filter(t =>
      t.assignedTo === userId &&
      !t.archived &&
      t.sprintId === sprint?.id
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Qué hice ayer - Tareas movidas a QA o completadas ayer
    const completedYesterday = userTasks.filter(t => {
      if (!t.lastStatusChange) return false;
      if (t.status !== 'qa' && t.status !== 'completed') return false;
      const changeDate = t.lastStatusChange.toDate ? t.lastStatusChange.toDate() : new Date(t.lastStatusChange);
      changeDate.setHours(0, 0, 0, 0);
      return changeDate >= yesterday && changeDate < today;
    });

    // 2. Qué estoy haciendo ahora - Tareas en progreso
    const inProgressTasks = userTasks.filter(t =>
      t.status === 'in-progress' &&
      !completedYesterday.find(ct => ct.id === t.id)
    );

    // 3. Qué haré después - Tareas pendientes
    const pendingTasks = userTasks.filter(t =>
      t.status === 'pending' &&
      !completedYesterday.find(ct => ct.id === t.id) &&
      !inProgressTasks.find(it => it.id === t.id)
    );

    return {
      completed: completedYesterday,
      inProgress: inProgressTasks,
      pending: pendingTasks
    };
  };

  const currentUser = shuffledUsers[currentUserIndex];
  const currentUserData = currentUser ? getUserStandupData(currentUser.id) : null;

  const goToNextUser = () => {
    if (currentUserIndex < shuffledUsers.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
    } else {
      // Si es el último usuario, ir al burndown chart
      setStep('burndown');
    }
  };

  const goToPreviousUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
    }
  };

  const restartStandup = () => {
    setStep('select');
    setCurrentUserIndex(0);
    setShuffledUsers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-sm">
            <Icon name="users" size={24} style={{ color: '#015E7C' }} />
            <h2 className="modal-title">Daily Standup</h2>
            {sprint && <span className="text-sm text-secondary">- {sprint.name}</span>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* STEP 1: Selección de participantes */}
          {step === 'select' && (
            <div className="standup-select">
              <div className="mb-lg">
                <div className="flex justify-between items-center mb-base">
                  <h3 className="text-lg font-semibold text-primary">Selecciona los participantes</h3>
                  <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
                    {selectedUserIds.length === enabledUsers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-base">
                  {enabledUsers.map(user => (
                    <div
                      key={user.id}
                      className={`standup-user-card ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                      onClick={() => toggleUser(user.id)}
                    >
                      <div className="flex items-center gap-sm">
                        <div className="standup-checkbox">
                          {selectedUserIds.includes(user.id) && (
                            <Icon name="check" size={16} style={{ color: 'white' }} />
                          )}
                        </div>
                        <UserAvatar userId={user.id} size={40} showName={false} />
                        <span className="text-sm font-medium text-primary">
                          {user.displayName || user.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedUserIds.length === 0 && (
                <p className="text-sm text-secondary text-center mb-base">
                  Selecciona al menos un participante para comenzar
                </p>
              )}
            </div>
          )}

          {/* STEP 2: Animación de mezcla */}
          {step === 'shuffle' && (
            <div className="standup-shuffle">
              <div className="text-center mb-xl">
                <h3 className="text-2xl font-bold text-primary mb-sm">Mezclando orden...</h3>
                <p className="text-base text-secondary">Preparando el orden de presentación</p>
              </div>

              <div className="shuffle-container">
                {enabledUsers
                  .filter(u => selectedUserIds.includes(u.id))
                  .map((user, index) => (
                    <div
                      key={user.id}
                      className={`shuffle-user ${shuffleHighlight === index ? 'highlighted' : ''}`}
                    >
                      <UserAvatar userId={user.id} size={60} showName={false} />
                      <span className="text-sm font-medium text-primary mt-sm">
                        {user.displayName || user.email}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* STEP 3: Presentación */}
          {step === 'presenting' && currentUser && currentUserData && (
            <div className="standup-presenting">
              <div className="standup-current-user-compact mb-base">
                <UserAvatar userId={currentUser.id} size={48} showName={false} />
                <h3 className="text-lg font-bold text-primary">
                  {currentUser.displayName || currentUser.email}
                </h3>
              </div>

              <div className="standup-sections-modern">
                {/* 1. Qué hice */}
                <div className="standup-card standup-card-completed">
                  <div className="standup-card-header-compact">
                    <Icon name="check-circle" size={20} />
                    <h4 className="standup-card-title">Qué hice</h4>
                  </div>
                  <div className="standup-card-body">
                    {currentUserData.completed.length > 0 ? (
                      currentUserData.completed.map(task => {
                        const delayInfo = getDelayInfo(task);
                        return (
                          <div key={task.id} className="standup-task-compact">
                            <div className="standup-task-indicator standup-indicator-completed"></div>
                            <div className="standup-task-content">
                              <span className="standup-task-name">{task.title}</span>
                              <div className="standup-task-meta">
                                {delayInfo && (
                                  <span className={`standup-delay-badge standup-delay-${delayInfo.status}`}>
                                    {delayInfo.label}
                                  </span>
                                )}
                                {getTimeInColumn(task) && (
                                  <span className="standup-task-time">{getTimeInColumn(task)}</span>
                                )}
                                {task.storyPoints && (
                                  <span className="standup-task-points">{task.storyPoints} pts</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="standup-empty-message">Sin tareas completadas ayer</p>
                    )}
                  </div>
                </div>

                {/* 2. Qué estoy haciendo */}
                <div className="standup-card standup-card-progress">
                  <div className="standup-card-header-compact">
                    <Icon name="play" size={20} />
                    <h4 className="standup-card-title">Qué estoy haciendo</h4>
                  </div>
                  <div className="standup-card-body">
                    {currentUserData.inProgress.length > 0 ? (
                      currentUserData.inProgress.map(task => {
                        const delayInfo = getDelayInfo(task);
                        return (
                          <div key={task.id} className="standup-task-compact">
                            <div className="standup-task-indicator standup-indicator-progress"></div>
                            <div className="standup-task-content">
                              <span className="standup-task-name">{task.title}</span>
                              <div className="standup-task-meta">
                                {delayInfo && (
                                  <span className={`standup-delay-badge standup-delay-${delayInfo.status}`}>
                                    {delayInfo.label}
                                  </span>
                                )}
                                {getTimeInColumn(task) && (
                                  <span className="standup-task-time">{getTimeInColumn(task)}</span>
                                )}
                                {task.storyPoints && (
                                  <span className="standup-task-points">{task.storyPoints} pts</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="standup-empty-message">Sin tareas en progreso</p>
                    )}
                  </div>
                </div>

                {/* 3. Qué haré después */}
                <div className="standup-card standup-card-pending">
                  <div className="standup-card-header-compact">
                    <Icon name="arrow-right" size={20} />
                    <h4 className="standup-card-title">Qué haré después</h4>
                  </div>
                  <div className="standup-card-body">
                    {currentUserData.pending.length > 0 ? (
                      currentUserData.pending.map(task => (
                        <div key={task.id} className="standup-task-compact">
                          <div className="standup-task-indicator standup-indicator-pending"></div>
                          <div className="standup-task-content">
                            <span className="standup-task-name">{task.title}</span>
                            <div className="standup-task-meta">
                              {getTimeInColumn(task) && (
                                <span className="standup-task-time">{getTimeInColumn(task)}</span>
                              )}
                              {task.storyPoints && (
                                <span className="standup-task-points">{task.storyPoints} pts</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="standup-empty-message">Sin tareas pendientes</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Burndown Chart (página final) */}
          {step === 'burndown' && burndownData && (
            <div className="standup-burndown-page">
              <div className="standup-burndown">
                <div className="standup-burndown-header mb-base">
                  <div className="flex justify-around items-center gap-sm">
                    <div className="burndown-stat">
                      <span className="burndown-stat-label">Total</span>
                      <span className="burndown-stat-value text-base">{burndownData.totalPoints} pts</span>
                    </div>
                    <div className="burndown-stat">
                      <span className="burndown-stat-label">Completado</span>
                      <span className="burndown-stat-value text-base" style={{ color: '#10B981' }}>{burndownData.completedPoints} pts</span>
                    </div>
                    <div className="burndown-stat">
                      <span className="burndown-stat-label">Pendiente</span>
                      <span className="burndown-stat-value text-base" style={{ color: '#F59E0B' }}>{burndownData.remainingPoints} pts</span>
                    </div>
                  </div>
                </div>

                <div className="standup-burndown-chart">
                  {burndownData.totalDays > 0 && burndownData.totalPoints > 0 ? (
                    <svg className="burndown-chart-svg" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                      {/* Grid lines */}
                      <g className="grid-lines">
                        {[0, 1, 2, 3, 4].map((i) => {
                          const y = 30 + (i * 30);
                          return (
                            <line
                              key={`grid-h-${i}`}
                              x1="60"
                              y1={y}
                              x2="580"
                              y2={y}
                              stroke="#E5E7EB"
                              strokeWidth="1"
                              strokeDasharray="4,4"
                            />
                          );
                        })}
                        {[0, 1, 2, 3, 4].map((i) => {
                          const x = 60 + (i * 130);
                          return (
                            <line
                              key={`grid-v-${i}`}
                              x1={x}
                              y1="30"
                              x2={x}
                              y2="150"
                              stroke="#E5E7EB"
                              strokeWidth="1"
                              strokeDasharray="4,4"
                            />
                          );
                        })}
                      </g>

                      {/* Y-axis labels */}
                      <g className="y-axis-labels">
                        {[0, 1, 2, 3, 4].map((i) => {
                          const y = 30 + (i * 30);
                          const value = Math.round(burndownData.totalPoints * (1 - i / 4));
                          return (
                            <text
                              key={`y-label-${i}`}
                              x="50"
                              y={y + 4}
                              textAnchor="end"
                              fontSize="11"
                              fill="#6B7280"
                            >
                              {value}
                            </text>
                          );
                        })}
                      </g>

                      {/* X-axis labels */}
                      <g className="x-axis-labels">
                        {[0, 1, 2, 3, 4].map((i) => {
                          const x = 60 + (i * 130);
                          const day = Math.round(burndownData.totalDays * i / 4);
                          return (
                            <text
                              key={`x-label-${i}`}
                              x={x}
                              y="170"
                              textAnchor="middle"
                              fontSize="11"
                              fill="#6B7280"
                            >
                              Día {day}
                            </text>
                          );
                        })}
                      </g>

                      {/* Ideal burndown line */}
                      <line
                        x1="60"
                        y1="30"
                        x2="580"
                        y2="150"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeDasharray="6,4"
                      />

                      {/* Actual burndown line */}
                      <polyline
                        points={`60,30 ${60 + (burndownData.daysPassed / Math.max(burndownData.totalDays, 1)) * 520},${30 + (burndownData.remainingPoints / Math.max(burndownData.totalPoints, 1)) * 120}`}
                        fill="none"
                        stroke="#015E7C"
                        strokeWidth="3"
                      />

                      {/* Current point marker */}
                      <circle
                        cx={60 + (burndownData.daysPassed / Math.max(burndownData.totalDays, 1)) * 520}
                        cy={30 + (burndownData.remainingPoints / Math.max(burndownData.totalPoints, 1)) * 120}
                        r="5"
                        fill="#015E7C"
                        stroke="white"
                        strokeWidth="2"
                      />

                      {/* Axis titles */}
                      <text x="18" y="90" transform="rotate(-90 18 90)" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="600">
                        Puntos
                      </text>
                      <text x="320" y="190" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="600">
                        Días del Sprint
                      </text>
                    </svg>
                  ) : (
                    <div className="text-center p-3xl text-secondary">
                      <Icon name="chart" size={48} style={{ opacity: 0.3 }} />
                      <p className="mt-base text-base">No hay suficientes datos para mostrar el burndown chart</p>
                    </div>
                  )}

                  <div className="burndown-legend flex justify-center gap-base mt-sm">
                    <div className="flex items-center gap-xs">
                      <div style={{ width: '20px', height: '2px', background: '#9CA3AF', borderRadius: '2px', opacity: 0.8 }}></div>
                      <span className="text-xs text-secondary">Ideal</span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <div style={{ width: '20px', height: '2px', background: '#015E7C', borderRadius: '2px' }}></div>
                      <span className="text-xs text-secondary">Real</span>
                    </div>
                  </div>

                  <div className="burndown-timeline mt-base">
                    <div className="burndown-timeline-item">
                      <Icon name="calendar" size={16} />
                      <span className="text-sm text-secondary">Día {burndownData.daysPassed} de {burndownData.totalDays}</span>
                    </div>
                    <div className="burndown-timeline-item">
                      <Icon name="clock" size={16} />
                      <span className="text-sm text-secondary">
                        {burndownData.totalDays - burndownData.daysPassed} día{burndownData.totalDays - burndownData.daysPassed !== 1 ? 's' : ''} restante{burndownData.totalDays - burndownData.daysPassed !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="burndown-summary mt-base p-base bg-secondary" style={{ borderRadius: 'var(--radius-base)' }}>
                  <h4 className="text-sm font-bold text-primary mb-sm">Resumen</h4>
                  <div className="text-xs text-secondary" style={{ lineHeight: '1.6' }}>
                    <p className="mb-xs">
                      El equipo ha completado <strong style={{ color: '#10B981' }}>{burndownData.completedPoints} de {burndownData.totalPoints} puntos</strong> ({burndownData.percentageComplete}% del sprint).
                    </p>
                    <p>
                      Quedan <strong style={{ color: '#F59E0B' }}>{burndownData.remainingPoints} puntos</strong> por completar en los próximos {burndownData.totalDays - burndownData.daysPassed} día{burndownData.totalDays - burndownData.daysPassed !== 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'select' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="btn btn-primary flex items-center gap-xs"
                onClick={startShuffle}
                disabled={selectedUserIds.length === 0}
              >
                <Icon name="shuffle" size={18} />
                Comenzar Standup ({selectedUserIds.length} participantes)
              </button>
            </>
          )}

          {step === 'presenting' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={goToPreviousUser}
                disabled={currentUserIndex === 0}
              >
                <Icon name="arrow-left" size={18} />
                Anterior
              </button>
              <button className="btn btn-secondary" onClick={restartStandup}>
                <Icon name="refresh-cw" size={18} />
                Reiniciar
              </button>
              {currentUserIndex < shuffledUsers.length - 1 ? (
                <button className="btn btn-primary" onClick={goToNextUser}>
                  Siguiente
                  <Icon name="arrow-right" size={18} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={goToNextUser}>
                  <Icon name="chart" size={18} />
                  Ver Burndown
                </button>
              )}
            </>
          )}

          {step === 'burndown' && (
            <>
              <button className="btn btn-secondary" onClick={restartStandup}>
                <Icon name="refresh-cw" size={18} />
                Reiniciar
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                <Icon name="check" size={18} />
                Finalizar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandupModal;
