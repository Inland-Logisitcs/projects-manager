import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUsers } from '../services/userService';
import { subscribeToTasks, subscribeToArchivedTasks } from '../services/taskService';
import { subscribeToColumns } from '../services/columnService';
import { subscribeToHolidays } from '../services/holidayService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/common/Icon';
import '../styles/UserStats.css';

const UserStats = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const filterFrom = searchParams.get('from') || '';
  const filterTo = searchParams.get('to') || '';
  const filterPreset = searchParams.get('periodo') || 'all';

  const toISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const setFilter = (params) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next, { replace: true });
  };

  const applyPreset = (preset) => {
    if (preset === 'all') {
      setFilter({ periodo: 'all', from: '', to: '' });
      return;
    }
    const now = new Date();
    const to = toISODate(now);
    const from = new Date();
    if (preset === '7d') from.setDate(now.getDate() - 7);
    else if (preset === '30d') from.setDate(now.getDate() - 30);
    else if (preset === '90d') from.setDate(now.getDate() - 90);
    setFilter({ periodo: preset, from: toISODate(from), to });
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    let loadCount = 0;
    const checkLoaded = () => {
      loadCount++;
      if (loadCount >= 5) setLoading(false);
    };

    const unsub1 = subscribeToUsers((data) => {
      setUsers(data.filter(u => !u.disabled));
      checkLoaded();
    });
    const unsub2 = subscribeToTasks((data) => {
      setTasks(data);
      checkLoaded();
    });
    const unsub3 = subscribeToArchivedTasks((data) => {
      setArchivedTasks(data);
      checkLoaded();
    });
    const unsub4 = subscribeToColumns((data) => {
      setColumns(data);
      checkLoaded();
    });
    const unsub5 = subscribeToHolidays((data) => {
      setHolidays(data);
      checkLoaded();
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [isAdmin, navigate]);

  const allTasks = useMemo(() => [...tasks, ...archivedTasks], [tasks, archivedTasks]);

  const dateRange = useMemo(() => {
    if (!filterFrom && !filterTo) return null;
    const from = filterFrom ? new Date(filterFrom + 'T00:00:00') : null;
    const to = filterTo ? new Date(filterTo + 'T23:59:59') : null;
    return { from, to };
  }, [filterFrom, filterTo]);

  const getTimestamp = (ts) => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    return new Date(ts);
  };

  // Set de fechas feriadas para busqueda rapida (formato 'YYYY-MM-DD')
  const holidayDates = useMemo(() => {
    return new Set(holidays.map(h => h.date));
  }, [holidays]);

  // Formatea Date a 'YYYY-MM-DD'
  const toDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Cuenta dias laborables entre dos fechas, excluyendo no laborables y feriados
  // Cuenta dias completos: si empezo lunes y termino miercoles = 3 dias
  // Coincide con como el optimizador calcula duracionTotal (SP / capacidad en dias laborables)
  const countWorkingDays = (startDate, endDate, workingDays) => {
    if (!startDate || !endDate || !workingDays || workingDays.length === 0) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return 0;

    let count = 0;
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endNorm = new Date(end);
    endNorm.setHours(0, 0, 0, 0);

    // No incluir el dia de fin (ese dia se movio a QA/completado, no se trabajo)
    while (current < endNorm) {
      const jsDay = current.getDay();
      const workDay = jsDay === 0 ? 7 : jsDay;
      const isHoliday = holidayDates.has(toDateStr(current));
      if (workingDays.includes(workDay) && !isHoliday) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return Math.max(count, 1);
  };

  // Obtiene el tiempo de completado en dias laborables
  // La fecha de fin es cuando llego a QA por primera vez (o completed si nunca paso por QA)
  const getCompletionTime = (task, workingDays) => {
    const history = task.movementHistory || [];
    let startTime = null;
    let endTime = null;

    for (const entry of history) {
      if (entry.type === 'status_change') {
        if (entry.to === 'in-progress' && !startTime) {
          startTime = getTimestamp(entry.timestamp);
        }
        if ((entry.to === 'qa' || entry.to === 'completed') && !endTime) {
          endTime = getTimestamp(entry.timestamp);
        }
      }
    }

    if (startTime && endTime && endTime > startTime) {
      if (workingDays && workingDays.length > 0) {
        return countWorkingDays(startTime, endTime, workingDays);
      }
      // Fallback: dias calendario si no hay workingDays
      return (endTime - startTime) / (1000 * 60 * 60 * 24);
    }
    return null;
  };

  // Duracion estimada: usa datos del optimizador (incluye riesgos) si existen,
  // sino calcula SP / capacidad actual del usuario
  const getExpectedDuration = (task, userCapacity) => {
    if (task.optimizedDuration?.duracionTotal > 0) {
      return task.optimizedDuration.duracionTotal;
    }
    const sp = task.storyPoints;
    const capacity = userCapacity || 1;
    if (sp && sp > 0) {
      return Math.ceil((sp / capacity) * 2) / 2;
    }
    return null;
  };

  const isTaskDelayed = (task, workingDays, userCapacity) => {
    const actualDays = getCompletionTime(task, workingDays);
    if (actualDays === null) return null;
    const expected = getExpectedDuration(task, userCapacity);
    if (!expected || expected <= 0) return null;
    return actualDays > expected;
  };

  const columnMap = useMemo(() => {
    const map = {};
    columns.forEach(c => { map[c.id] = c.title; });
    return map;
  }, [columns]);

  const userStats = useMemo(() => {
    return users.map(user => {
      const userTasks = allTasks.filter(t => t.assignedTo === user.id);

      const filteredTasks = dateRange
        ? userTasks.filter(t => {
            const updated = getTimestamp(t.updatedAt);
            if (!updated) return false;
            if (dateRange.from && updated < dateRange.from) return false;
            if (dateRange.to && updated > dateRange.to) return false;
            return true;
          })
        : userTasks;

      const userWorkingDays = user.workingDays || [1, 2, 3, 4, 5];
      // QA y completed cuentan como completadas
      const completed = filteredTasks.filter(t => t.status === 'completed' || t.status === 'qa' || t.archived);
      const inProgress = filteredTasks.filter(t => t.status === 'in-progress' && !t.archived);
      const pending = filteredTasks.filter(t => t.status === 'pending' && !t.archived);

      const completionTimes = completed
        .map(t => getCompletionTime(t, userWorkingDays))
        .filter(t => t !== null);

      const avgCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : null;

      const userCapacity = user.dailyCapacity || 1;
      const delayedTasks = completed.filter(t => isTaskDelayed(t, userWorkingDays, userCapacity) === true);
      const onTimeTasks = completed.filter(t => isTaskDelayed(t, userWorkingDays, userCapacity) === false);
      const tasksWithEstimate = completed.filter(t => isTaskDelayed(t, userWorkingDays, userCapacity) !== null);

      const totalStoryPoints = completed.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const activeStoryPoints = inProgress.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      return {
        ...user,
        totalAssigned: filteredTasks.length,
        completed: completed.length,
        inProgress: inProgress.length,
        pending: pending.length,
        avgCompletionTime,
        delayedTasks: delayedTasks.length,
        onTimeTasks: onTimeTasks.length,
        tasksWithEstimate: tasksWithEstimate.length,
        delayRate: tasksWithEstimate.length > 0
          ? (delayedTasks.length / tasksWithEstimate.length) * 100
          : null,
        totalStoryPoints,
        activeStoryPoints,
        completedTasksList: completed,
        inProgressTasksList: inProgress,
      };
    }).sort((a, b) => b.completed - a.completed);
  }, [users, allTasks, dateRange]);

  const globalStats = useMemo(() => {
    const totalCompleted = userStats.reduce((s, u) => s + u.completed, 0);
    const totalInProgress = userStats.reduce((s, u) => s + u.inProgress, 0);
    const totalPending = userStats.reduce((s, u) => s + u.pending, 0);
    const totalDelayed = userStats.reduce((s, u) => s + u.delayedTasks, 0);
    const totalWithEstimate = userStats.reduce((s, u) => s + u.tasksWithEstimate, 0);
    const totalSP = userStats.reduce((s, u) => s + u.totalStoryPoints, 0);

    const allAvgTimes = userStats
      .filter(u => u.avgCompletionTime !== null)
      .map(u => u.avgCompletionTime);
    const globalAvgTime = allAvgTimes.length > 0
      ? allAvgTimes.reduce((a, b) => a + b, 0) / allAvgTimes.length
      : null;

    return {
      totalCompleted,
      totalInProgress,
      totalPending,
      totalDelayed,
      totalWithEstimate,
      globalAvgTime,
      totalSP,
      delayRate: totalWithEstimate > 0 ? (totalDelayed / totalWithEstimate) * 100 : null,
    };
  }, [userStats]);

  const formatDays = (days) => {
    if (days === null || days === undefined) return '-';
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours}h`;
    }
    return `${days.toFixed(1)}d`;
  };

  const getDelayColor = (rate) => {
    if (rate === null) return '';
    if (rate <= 20) return 'stat-good';
    if (rate <= 50) return 'stat-warning';
    return 'stat-danger';
  };

  const getCompletionColor = (completed, total) => {
    if (total === 0) return '';
    const rate = (completed / total) * 100;
    if (rate >= 70) return 'stat-good';
    if (rate >= 40) return 'stat-warning';
    return 'stat-danger';
  };

  if (loading) {
    return (
      <div className="page-container page-container-narrow">
        <div className="empty-state">
          <div className="spinner"></div>
          <p className="text-base text-secondary">Cargando estadisticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-container-narrow user-stats-container">
      <div className="page-header">
        <div>
          <h1 className="heading-1 text-primary mb-xs">Estadisticas de Usuarios</h1>
          <p className="text-base text-secondary">
            Rendimiento y metricas del equipo
          </p>
        </div>
        <div className="stats-filter-bar">
          <div className="stats-filter-presets">
            {[
              { id: 'all', label: 'Todo' },
              { id: '7d', label: '7d' },
              { id: '30d', label: '30d' },
              { id: '90d', label: '90d' },
            ].map(p => (
              <button
                key={p.id}
                className={`btn btn-sm ${filterPreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="stats-filter-dates">
            <input
              type="date"
              className="input input-sm"
              value={filterFrom}
              onChange={(e) => setFilter({ from: e.target.value, periodo: 'custom' })}
            />
            <span className="text-xs text-tertiary">a</span>
            <input
              type="date"
              className="input input-sm"
              value={filterTo}
              onChange={(e) => setFilter({ to: e.target.value, periodo: 'custom' })}
            />
          </div>
        </div>
      </div>

      {/* Global summary cards */}
      <div className="stats-summary-grid">
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-completed">
            <Icon name="check" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{globalStats.totalCompleted}</span>
            <span className="stats-summary-label">Completadas</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-progress">
            <Icon name="play" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{globalStats.totalInProgress}</span>
            <span className="stats-summary-label">En Progreso</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-time">
            <Icon name="clock" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{formatDays(globalStats.globalAvgTime)}</span>
            <span className="stats-summary-label">Tiempo Promedio</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className={`stats-summary-icon ${globalStats.delayRate !== null && globalStats.delayRate > 30 ? 'stats-icon-delayed' : 'stats-icon-ontime'}`}>
            <Icon name="alert-triangle" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">
              {globalStats.delayRate !== null ? `${globalStats.delayRate.toFixed(0)}%` : '-'}
            </span>
            <span className="stats-summary-label">Tasa de Retraso</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-sp">
            <Icon name="zap" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{globalStats.totalSP}</span>
            <span className="stats-summary-label">Story Points</span>
          </div>
        </div>
      </div>

      {/* Per-user stats table */}
      <div className="card mt-lg">
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th className="stats-th">Usuario</th>
                <th className="stats-th stats-th-center">Asignadas</th>
                <th className="stats-th stats-th-center">Completadas</th>
                <th className="stats-th stats-th-center">En Progreso</th>
                <th className="stats-th stats-th-center">Pendientes</th>
                <th className="stats-th stats-th-center">Tiempo Prom.</th>
                <th className="stats-th stats-th-center">A Tiempo</th>
                <th className="stats-th stats-th-center">Retrasadas</th>
                <th className="stats-th stats-th-center">SP</th>
                <th className="stats-th stats-th-center" style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {userStats.map(user => {
                const initials = (user.displayName || user.email || '')
                  .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                const completionRate = user.totalAssigned > 0
                  ? ((user.completed / user.totalAssigned) * 100).toFixed(0) : 0;

                return (
                  <tr
                    key={user.id}
                    className="stats-row"
                    onClick={() => navigate(`/user-stats/${user.id}?${searchParams.toString()}`)}
                  >
                    <td className="stats-td">
                      <div className="flex items-center gap-sm">
                        <div className="stats-avatar">{initials}</div>
                        <div>
                          <div className="text-base font-medium text-primary">
                            {user.displayName || user.email}
                          </div>
                          {user.displayName && (
                            <div className="text-xs text-tertiary">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="stats-td stats-td-center">
                      <span className="text-base font-medium">{user.totalAssigned}</span>
                    </td>
                    <td className="stats-td stats-td-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold ${getCompletionColor(user.completed, user.totalAssigned)}`}>
                          {user.completed}
                        </span>
                        <div className="stats-progress-bar">
                          <div
                            className="stats-progress-fill stats-progress-completed"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="stats-td stats-td-center">
                      <span className={`stats-status-count ${user.inProgress > 0 ? 'stats-status-active' : ''}`}>
                        {user.inProgress}
                      </span>
                    </td>
                    <td className="stats-td stats-td-center">
                      <span className="stats-status-count">{user.pending}</span>
                    </td>
                    <td className="stats-td stats-td-center">
                      <span className="text-base">{formatDays(user.avgCompletionTime)}</span>
                    </td>
                    <td className="stats-td stats-td-center">
                      <span className={`stats-badge ${user.onTimeTasks > 0 ? 'stats-badge-success' : ''}`}>
                        {user.onTimeTasks}
                      </span>
                    </td>
                    <td className="stats-td stats-td-center">
                      <span className={`stats-badge ${user.delayedTasks > 0 ? 'stats-badge-danger' : ''}`}>
                        {user.delayedTasks}
                      </span>
                    </td>
                    <td className="stats-td stats-td-center">
                      <span className="text-base font-medium">{user.totalStoryPoints}</span>
                    </td>
                    <td className="stats-td stats-td-center">
                      <Icon name="chevron-right" size={18} className="text-tertiary" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {userStats.length === 0 && (
          <div className="empty-state p-xl">
            <p className="text-base text-secondary">No hay usuarios activos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStats;
