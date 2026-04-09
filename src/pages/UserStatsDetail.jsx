import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, subscribeToUsers } from '../services/userService';
import { subscribeToTasks, subscribeToArchivedTasks } from '../services/taskService';
import { subscribeToColumns } from '../services/columnService';
import { subscribeToProjects } from '../services/projectService';
import { subscribeToHolidays } from '../services/holidayService';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/common/Icon';
import TaskDetailSidebar from '../components/kanban/TaskDetailSidebar';
import '../styles/UserStats.css';

const UserStatsDetail = () => {
  const { isAdmin, user: authUser } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Leer filtros de URL
  const filterFrom = searchParams.get('from') || '';
  const filterTo = searchParams.get('to') || '';
  const filterPreset = searchParams.get('periodo') || 'all';

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

  const toISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isOwnStats = authUser?.uid === userId;

  useEffect(() => {
    // Permitir acceso si es admin o si ve sus propias stats
    if (!isAdmin && !isOwnStats) {
      navigate('/dashboard');
      return;
    }

    let loadCount = 0;
    const checkLoaded = () => {
      loadCount++;
      if (loadCount >= 5) setLoading(false);
    };

    getUserProfile(userId).then(result => {
      setUser(result.success ? result.user : null);
      checkLoaded();
    });

    const unsub1 = subscribeToTasks((data) => {
      setTasks(data);
      checkLoaded();
    });
    const unsub2 = subscribeToArchivedTasks((data) => {
      setArchivedTasks(data);
      checkLoaded();
    });
    const unsub3 = subscribeToColumns((data) => {
      setColumns(data);
      checkLoaded();
    });
    const unsub4 = subscribeToProjects((data) => {
      setProjects(data);
    });
    const unsub5 = subscribeToHolidays((data) => {
      setHolidays(data);
      checkLoaded();
    });
    const unsub6 = subscribeToUsers((data) => {
      setAllUsers(data);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [isAdmin, navigate, userId]);

  const getTimestamp = (ts) => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    return new Date(ts);
  };

  // Set de fechas feriadas para busqueda rapida
  const holidayDates = useMemo(() => {
    return new Set(holidays.map(h => h.date));
  }, [holidays]);

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

  const getUserWorkingDays = () => user?.workingDays || [1, 2, 3, 4, 5];

  // Tiempo de completado en dias laborables
  // La fecha de fin es cuando llego a QA por primera vez (o completed si nunca paso por QA)
  const getCompletionTime = (task) => {
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
      const workingDays = getUserWorkingDays();
      if (workingDays.length > 0) {
        return countWorkingDays(startTime, endTime, workingDays);
      }
      return (endTime - startTime) / (1000 * 60 * 60 * 24);
    }
    return null;
  };

  // Duracion estimada: usa datos del optimizador (incluye riesgos) si existen,
  // sino calcula SP / capacidad actual del usuario
  const getExpectedDuration = (task) => {
    if (task.optimizedDuration?.duracionTotal > 0) {
      return task.optimizedDuration.duracionTotal;
    }
    const sp = task.storyPoints;
    const capacity = user?.dailyCapacity || 1;
    if (sp && sp > 0) {
      return Math.ceil((sp / capacity) * 2) / 2;
    }
    return null;
  };

  const isTaskDelayed = (task) => {
    const actualDays = getCompletionTime(task);
    if (actualDays === null) return null;
    const expected = getExpectedDuration(task);
    if (!expected || expected <= 0) return null;
    return actualDays > expected;
  };

  // Dias laborables activa (para tareas en progreso)
  const getWorkingDaysActive = (task) => {
    const startEntry = (task.movementHistory || []).find(
      e => e.type === 'status_change' && e.to === 'in-progress'
    );
    const startDate = startEntry ? getTimestamp(startEntry.timestamp) : null;
    if (!startDate) return null;
    return countWorkingDays(startDate, new Date(), getUserWorkingDays());
  };

  // Mapa de usuarios para TaskDetailSidebar
  const usersMap = useMemo(() => {
    const map = {};
    allUsers.forEach(u => { map[u.id] = u; });
    return map;
  }, [allUsers]);

  // Sincronizar selectedTask con datos en tiempo real
  useEffect(() => {
    if (selectedTask) {
      const updated = [...tasks, ...archivedTasks].find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks, archivedTasks]);

  const formatDays = (days) => {
    if (days === null || days === undefined) return '-';
    if (days < 1) return `${Math.round(days * 24)}h`;
    return `${days.toFixed(1)}d`;
  };

  const formatDate = (ts) => {
    const d = getTimestamp(ts);
    if (!d) return '-';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const allTasks = useMemo(() => [...tasks, ...archivedTasks], [tasks, archivedTasks]);

  const dateRange = useMemo(() => {
    if (!filterFrom && !filterTo) return null;
    const from = filterFrom ? new Date(filterFrom + 'T00:00:00') : null;
    const to = filterTo ? new Date(filterTo + 'T23:59:59') : null;
    return { from, to };
  }, [filterFrom, filterTo]);

  const columnMap = useMemo(() => {
    const map = {};
    columns.forEach(c => { map[c.id] = c; });
    return map;
  }, [columns]);

  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  const userTasks = useMemo(() => {
    const assigned = allTasks.filter(t => t.assignedTo === userId);
    if (!dateRange) return assigned;
    return assigned.filter(t => {
      const updated = getTimestamp(t.updatedAt);
      if (!updated) return false;
      if (dateRange.from && updated < dateRange.from) return false;
      if (dateRange.to && updated > dateRange.to) return false;
      return true;
    });
  }, [allTasks, userId, dateRange]);

  const stats = useMemo(() => {
    // QA y completed cuentan como completadas
    const completed = userTasks.filter(t => t.status === 'completed' || t.status === 'qa' || t.archived);
    const inProgress = userTasks.filter(t => t.status === 'in-progress' && !t.archived);
    const pending = userTasks.filter(t => t.status === 'pending' && !t.archived);

    const completionTimes = completed.map(t => getCompletionTime(t)).filter(t => t !== null);
    const avgTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : null;

    const delayed = completed.filter(t => isTaskDelayed(t) === true);
    const onTime = completed.filter(t => isTaskDelayed(t) === false);
    const withEstimate = completed.filter(t => isTaskDelayed(t) !== null);

    const completedSP = completed.reduce((s, t) => s + (t.storyPoints || 0), 0);
    const activeSP = inProgress.reduce((s, t) => s + (t.storyPoints || 0), 0);

    // Group completed by project
    const byProject = {};
    completed.forEach(t => {
      const pid = t.projectId || '_none';
      if (!byProject[pid]) byProject[pid] = [];
      byProject[pid].push(t);
    });

    // Fastest and slowest tasks
    const tasksWithTime = completed
      .map(t => ({ ...t, _completionTime: getCompletionTime(t) }))
      .filter(t => t._completionTime !== null)
      .sort((a, b) => a._completionTime - b._completionTime);

    return {
      completed, inProgress, pending,
      avgTime,
      delayed, onTime, withEstimate,
      delayRate: withEstimate.length > 0 ? (delayed.length / withEstimate.length) * 100 : null,
      completedSP, activeSP,
      byProject,
      fastest: tasksWithTime.slice(0, 3),
      slowest: tasksWithTime.slice(-3).reverse(),
    };
  }, [userTasks]);

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

  if (!user) {
    return (
      <div className="page-container page-container-narrow">
        <div className="empty-state">
          <p className="text-base text-secondary">Usuario no encontrado</p>
          <button className="btn btn-primary mt-base" onClick={() => navigate(`/user-stats?${searchParams.toString()}`)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const initials = (user.displayName || user.email || '')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'en-progreso', label: `En Progreso (${stats.inProgress.length})` },
    { id: 'completadas', label: `Completadas (${stats.completed.length})` },
    { id: 'pendientes', label: `Pendientes (${stats.pending.length})` },
  ];

  return (
    <div className="page-container page-container-narrow user-stats-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-base">
          {isAdmin && (
            <button className="btn btn-icon" onClick={() => navigate(`/user-stats?${searchParams.toString()}`)}>
              <Icon name="arrow-left" size={20} />
            </button>
          )}
          <div className="stats-avatar stats-avatar-lg">{initials}</div>
          <div>
            <h1 className="heading-1 text-primary mb-xs">
              {user.displayName || user.email}
            </h1>
            <p className="text-sm text-secondary">{user.email}</p>
          </div>
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

      {/* Summary cards */}
      <div className="stats-summary-grid stats-summary-grid-4">
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-completed">
            <Icon name="check" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{stats.completed.length}</span>
            <span className="stats-summary-label">Completadas</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-progress">
            <Icon name="play" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{stats.inProgress.length}</span>
            <span className="stats-summary-label">En Progreso</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-time">
            <Icon name="clock" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{formatDays(stats.avgTime)}</span>
            <span className="stats-summary-label">Tiempo Promedio</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className={`stats-summary-icon ${stats.delayRate !== null && stats.delayRate > 30 ? 'stats-icon-delayed' : 'stats-icon-ontime'}`}>
            <Icon name="alert-triangle" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">
              {stats.delayRate !== null ? `${stats.delayRate.toFixed(0)}%` : '-'}
            </span>
            <span className="stats-summary-label">Tasa de Retraso</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-sp">
            <Icon name="zap" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{stats.completedSP}</span>
            <span className="stats-summary-label">SP Completados</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-progress">
            <Icon name="zap" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{stats.activeSP}</span>
            <span className="stats-summary-label">SP Activos</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-completed">
            <Icon name="check-circle" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{stats.onTime.length}</span>
            <span className="stats-summary-label">A Tiempo</span>
          </div>
        </div>
        <div className="stats-summary-card">
          <div className="stats-summary-icon stats-icon-delayed">
            <Icon name="warning" size={24} />
          </div>
          <div className="stats-summary-content">
            <span className="stats-summary-value">{stats.delayed.length}</span>
            <span className="stats-summary-label">Retrasadas</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="stats-tabs mt-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`stats-tab ${activeTab === tab.id ? 'stats-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card stats-tab-content">
        {activeTab === 'resumen' && (
          <ResumenTab
            stats={stats}
            projectMap={projectMap}
            formatDays={formatDays}
            formatDate={formatDate}
            getCompletionTime={getCompletionTime}
            isTaskDelayed={isTaskDelayed}
            getTimestamp={getTimestamp}
          />
        )}
        {activeTab === 'calendario' && (
          <CalendarTab
            tasks={[...stats.completed, ...stats.inProgress]}
            projectMap={projectMap}
            getTimestamp={getTimestamp}
            formatDays={formatDays}
            getCompletionTime={getCompletionTime}
            getExpectedDuration={getExpectedDuration}
            holidayDates={holidayDates}
            holidays={holidays}
            userWorkingDays={getUserWorkingDays()}
          />
        )}
        {activeTab === 'en-progreso' && (
          <TaskListTab
            tasks={stats.inProgress}
            type="in-progress"
            projectMap={projectMap}
            columnMap={columnMap}
            formatDays={formatDays}
            formatDate={formatDate}
            getTimestamp={getTimestamp}
            getWorkingDaysActive={getWorkingDaysActive}
            getExpectedDuration={getExpectedDuration}
            onTaskClick={setSelectedTask}
          />
        )}
        {activeTab === 'completadas' && (
          <TaskListTab
            tasks={stats.completed}
            type="completed"
            projectMap={projectMap}
            columnMap={columnMap}
            formatDays={formatDays}
            formatDate={formatDate}
            getTimestamp={getTimestamp}
            getCompletionTime={getCompletionTime}
            isTaskDelayed={isTaskDelayed}
            getExpectedDuration={getExpectedDuration}
            onTaskClick={setSelectedTask}
          />
        )}
        {activeTab === 'pendientes' && (
          <TaskListTab
            tasks={stats.pending}
            type="pending"
            projectMap={projectMap}
            columnMap={columnMap}
            formatDays={formatDays}
            formatDate={formatDate}
            getTimestamp={getTimestamp}
            onTaskClick={setSelectedTask}
          />
        )}
      </div>

      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          columns={columns}
          allTasks={allTasks}
          onClose={() => setSelectedTask(null)}
          usersMap={usersMap}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

/* ---- Resumen Tab ---- */
const ResumenTab = ({ stats, projectMap, formatDays, formatDate, getCompletionTime, isTaskDelayed, getTimestamp }) => {
  const projectGroups = Object.entries(stats.byProject)
    .map(([pid, tasks]) => ({
      id: pid,
      name: pid === '_none' ? 'Sin proyecto' : (projectMap[pid]?.name || pid),
      color: pid === '_none' ? '#94a3b8' : (projectMap[pid]?.color || '#94a3b8'),
      count: tasks.length,
      sp: tasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
    }))
    .sort((a, b) => b.count - a.count);

  const maxProjectCount = Math.max(...projectGroups.map(p => p.count), 1);

  return (
    <div className="stats-resumen">
      {/* Per-project breakdown */}
      <div className="stats-section">
        <h3 className="text-base font-bold text-primary mb-base">Tareas Completadas por Proyecto</h3>
        {projectGroups.length > 0 ? (
          <div className="stats-project-bars">
            {projectGroups.map(p => (
              <div key={p.id} className="stats-project-row">
                <div className="stats-project-label">
                  <span
                    className="stats-project-dot"
                    style={{ background: p.color }}
                  />
                  <span className="text-sm text-primary">{p.name}</span>
                </div>
                <div className="stats-project-bar-wrapper">
                  <div
                    className="stats-project-bar"
                    style={{
                      width: `${(p.count / maxProjectCount) * 100}%`,
                      background: p.color,
                    }}
                  />
                </div>
                <div className="stats-project-values">
                  <span className="text-sm font-medium">{p.count}</span>
                  <span className="text-xs text-tertiary">{p.sp} SP</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-tertiary">Sin tareas completadas</p>
        )}
      </div>

      {/* Fastest / Slowest */}
      <div className="stats-speed-grid">
        <div className="stats-section">
          <h3 className="text-base font-bold text-primary mb-base">Mas Rapidas</h3>
          {stats.fastest.length > 0 ? (
            <div className="stats-detail-task-list">
              {stats.fastest.map(task => (
                <div key={task.id} className="stats-detail-task stats-task-ontime">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">{task.title}</span>
                    <div className="flex items-center gap-sm">
                      {task.storyPoints > 0 && <span className="stats-sp-badge">{task.storyPoints} SP</span>}
                      <span className="text-xs font-medium stat-good">{formatDays(task._completionTime)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-tertiary">Sin datos</p>
          )}
        </div>
        <div className="stats-section">
          <h3 className="text-base font-bold text-primary mb-base">Mas Lentas</h3>
          {stats.slowest.length > 0 ? (
            <div className="stats-detail-task-list">
              {stats.slowest.map(task => (
                <div key={task.id} className="stats-detail-task stats-task-delayed">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">{task.title}</span>
                    <div className="flex items-center gap-sm">
                      {task.storyPoints > 0 && <span className="stats-sp-badge">{task.storyPoints} SP</span>}
                      <span className="text-xs font-medium stat-danger">{formatDays(task._completionTime)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-tertiary">Sin datos</p>
          )}
        </div>
      </div>

      {/* Delay analysis */}
      {stats.withEstimate.length > 0 && (
        <div className="stats-section">
          <h3 className="text-base font-bold text-primary mb-base">Analisis de Retrasos</h3>
          <div className="stats-delay-bar-container">
            <div className="stats-delay-bar">
              <div
                className="stats-delay-bar-fill stats-delay-bar-ontime"
                style={{ width: `${((stats.onTime.length / stats.withEstimate.length) * 100)}%` }}
              />
              <div
                className="stats-delay-bar-fill stats-delay-bar-late"
                style={{ width: `${((stats.delayed.length / stats.withEstimate.length) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-sm">
              <span className="text-xs text-secondary">
                <span className="stats-legend-dot stats-legend-ontime" />
                A tiempo: {stats.onTime.length} ({((stats.onTime.length / stats.withEstimate.length) * 100).toFixed(0)}%)
              </span>
              <span className="text-xs text-secondary">
                <span className="stats-legend-dot stats-legend-late" />
                Retrasadas: {stats.delayed.length} ({((stats.delayed.length / stats.withEstimate.length) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---- Calendar Tab ---- */
const CalendarTab = ({
  tasks, projectMap, getTimestamp, formatDays,
  getCompletionTime, getExpectedDuration, holidayDates, holidays, userWorkingDays
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Extraer inicio/fin de cada tarea
  const taskRanges = useMemo(() => {
    return tasks.map(task => {
      const history = task.movementHistory || [];
      let start = null;
      let end = null;
      for (const entry of history) {
        if (entry.type === 'status_change') {
          if (entry.to === 'in-progress' && !start) {
            start = getTimestamp(entry.timestamp);
          }
          if ((entry.to === 'qa' || entry.to === 'completed') && !end) {
            end = getTimestamp(entry.timestamp);
          }
        }
      }
      // Para tareas en progreso sin fin, usar hoy
      if (start && !end && task.status === 'in-progress') {
        end = new Date();
      }
      if (!start) return null;

      const project = task.projectId ? projectMap[task.projectId] : null;
      const duration = getCompletionTime(task);
      const expected = getExpectedDuration(task);

      return {
        id: task.id,
        title: task.title,
        start,
        end: end || start,
        color: project?.color || '#118ab2',
        projectName: project?.name || null,
        storyPoints: task.storyPoints,
        status: task.status,
        duration,
        expected,
        isDelayed: duration !== null && expected !== null && duration > expected,
      };
    }).filter(Boolean);
  }, [tasks, projectMap]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Empezar en lunes (lunes=0, domingo=6)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(year, month, 1 - startOffset);

  // Calcular semanas necesarias segun el mes
  const totalCells = startOffset + daysInMonth;
  const numWeeks = Math.ceil(totalCells / 7);

  const weeks = [];
  const current = new Date(calendarStart);
  for (let w = 0; w < numWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const toDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date) => date.getMonth() === month;

  const isNonWorking = (date) => {
    const jsDay = date.getDay();
    const workDay = jsDay === 0 ? 7 : jsDay;
    return !userWorkingDays.includes(workDay);
  };

  const isHoliday = (date) => holidayDates.has(toDateStr(date));

  // Mapa de fecha -> nombre del feriado
  const holidayNameMap = useMemo(() => {
    const map = {};
    (holidays || []).forEach(h => { map[h.date] = h.name; });
    return map;
  }, [holidays]);

  const getHolidayName = (date) => holidayNameMap[toDateStr(date)] || null;

  // Tareas que caen en un dia especifico
  const getTasksForDay = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return taskRanges.filter(t => {
      const tStart = new Date(t.start);
      tStart.setHours(0, 0, 0, 0);
      const tEnd = new Date(t.end);
      tEnd.setHours(23, 59, 59, 999);
      return tStart <= dayEnd && tEnd >= dayStart;
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToday = () => setCurrentMonth(new Date());

  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div className="stats-calendar">
      <div className="stats-calendar-inner">
        <div className="stats-calendar-header">
          <button className="btn btn-icon" onClick={prevMonth}>
            <Icon name="chevron-left" size={20} />
          </button>
          <div className="flex items-center gap-sm">
            <h3 className="text-base font-bold text-primary stats-calendar-month">{monthName}</h3>
            <button className="btn btn-secondary btn-sm" onClick={goToday}>Hoy</button>
          </div>
          <button className="btn btn-icon" onClick={nextMonth}>
            <Icon name="chevron-right" size={20} />
          </button>
        </div>

        <div className="stats-calendar-grid">
          {dayNames.map(d => (
            <div key={d} className="stats-calendar-dayname">{d}</div>
          ))}

          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const nonWorking = isNonWorking(day);
              const holiday = isHoliday(day);
              const dayTasks = (nonWorking || holiday) ? [] : getTasksForDay(day);
              const holidayName = getHolidayName(day);

              return (
                <div
                  key={`${wi}-${di}`}
                  className={[
                    'stats-calendar-day',
                    !isCurrentMonth(day) && 'stats-calendar-day-other',
                    isToday(day) && 'stats-calendar-day-today',
                    nonWorking && 'stats-calendar-day-nonworking',
                    holiday && 'stats-calendar-day-holiday',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="stats-calendar-day-number">{day.getDate()}</span>
                  {holiday && holidayName && (
                    <span className="stats-calendar-holiday-name">{holidayName}</span>
                  )}
                  {nonWorking && !holiday && (
                    <span className="stats-calendar-nonworking-label">No laboral</span>
                  )}
                  <div className="stats-calendar-tasks">
                    {dayTasks.slice(0, 3).map(t => (
                      <div
                        key={t.id}
                        className={`stats-calendar-task${t.isDelayed ? ' stats-calendar-task-delayed' : ''}${t.status === 'in-progress' ? ' stats-calendar-task-active' : ''}`}
                        style={{ borderLeftColor: t.color }}
                        title={`${t.title}${t.projectName ? ` (${t.projectName})` : ''}${t.duration !== null ? ` - ${formatDays(t.duration)}` : ''}${t.expected !== null ? ` / est. ${formatDays(t.expected)}` : ''}`}
                      >
                        <span className="stats-calendar-task-title">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="stats-calendar-more">+{dayTasks.length - 3} mas</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Leyenda */}
        <div className="stats-calendar-legend">
          {Object.values(
            taskRanges.reduce((acc, t) => {
              const key = t.projectName || '_none';
              if (!acc[key]) acc[key] = { name: t.projectName || 'Sin proyecto', color: t.color };
              return acc;
            }, {})
          ).map(p => (
            <div key={p.name} className="stats-calendar-legend-item">
              <span className="stats-project-dot" style={{ background: p.color }} />
              <span className="text-xs text-secondary">{p.name}</span>
            </div>
          ))}
          <div className="stats-calendar-legend-item">
            <span className="stats-legend-swatch stats-legend-nonworking" />
            <span className="text-xs text-secondary">No laboral</span>
          </div>
          <div className="stats-calendar-legend-item">
            <span className="stats-legend-swatch stats-legend-holiday" />
            <span className="text-xs text-secondary">Feriado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---- Task List Tab ---- */
const TaskListTab = ({
  tasks, type, projectMap, columnMap, formatDays, formatDate, getTimestamp,
  getCompletionTime, isTaskDelayed, getWorkingDaysActive, getExpectedDuration, onTaskClick
}) => {
  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const da = getTimestamp(a.updatedAt) || new Date(0);
      const db2 = getTimestamp(b.updatedAt) || new Date(0);
      return db2 - da;
    });
  }, [tasks]);

  if (sorted.length === 0) {
    return (
      <div className="empty-state p-xl">
        <p className="text-base text-secondary">
          {type === 'in-progress' && 'No hay tareas en progreso'}
          {type === 'completed' && 'No hay tareas completadas'}
          {type === 'pending' && 'No hay tareas pendientes'}
        </p>
      </div>
    );
  }

  return (
    <div className="stats-task-table-wrapper">
      <table className="stats-table">
        <thead>
          <tr>
            <th className="stats-th">Tarea</th>
            <th className="stats-th">Proyecto</th>
            <th className="stats-th stats-th-center">SP</th>
            <th className="stats-th stats-th-center">Estado</th>
            <th className="stats-th stats-th-center">Inicio</th>
            {(type === 'completed' || type === 'in-progress') && <th className="stats-th stats-th-center">Fin</th>}
            {type === 'completed' && <th className="stats-th stats-th-center">Duracion</th>}
            {type === 'completed' && <th className="stats-th stats-th-center">Estimado</th>}
            {type === 'completed' && <th className="stats-th stats-th-center">Resultado</th>}
            {type === 'in-progress' && <th className="stats-th stats-th-center">Dias Lab. Activa</th>}
            {type === 'in-progress' && <th className="stats-th stats-th-center">Estimado</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map(task => {
            const project = task.projectId ? projectMap[task.projectId] : null;
            const col = task.status ? columnMap[task.status] : null;
            const actualDays = type === 'completed' && getCompletionTime ? getCompletionTime(task) : null;
            const expected = getExpectedDuration ? getExpectedDuration(task) : null;
            const delayed = type === 'completed' && isTaskDelayed ? isTaskDelayed(task) : null;

            let daysActive = null;
            if (type === 'in-progress' && getWorkingDaysActive) {
              daysActive = getWorkingDaysActive(task);
            }

            const isOverdue = type === 'in-progress' && expected && daysActive && daysActive > expected;

            // Extraer fechas de inicio y fin del movementHistory
            const history = task.movementHistory || [];
            let startDate = null;
            let endDate = null;
            for (const entry of history) {
              if (entry.type === 'status_change') {
                if (entry.to === 'in-progress' && !startDate) {
                  startDate = getTimestamp(entry.timestamp);
                }
                if ((entry.to === 'qa' || entry.to === 'completed') && !endDate) {
                  endDate = getTimestamp(entry.timestamp);
                }
              }
            }

            return (
              <tr
                key={task.id}
                className={`stats-row ${isOverdue ? 'stats-row-overdue' : ''}`}
                onClick={() => onTaskClick && onTaskClick(task)}
              >
                <td className="stats-td">
                  <span className="text-sm font-medium text-primary">{task.title}</span>
                </td>
                <td className="stats-td">
                  {project ? (
                    <div className="flex items-center gap-xs">
                      <span
                        className="stats-project-dot"
                        style={{ background: project.color || '#94a3b8' }}
                      />
                      <span className="text-sm">{project.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-tertiary">-</span>
                  )}
                </td>
                <td className="stats-td stats-td-center">
                  {task.storyPoints ? (
                    <span className="stats-sp-badge">{task.storyPoints}</span>
                  ) : (
                    <span className="text-xs text-tertiary">-</span>
                  )}
                </td>
                <td className="stats-td stats-td-center">
                  {col ? (
                    <span
                      className="stats-status-pill"
                      style={{ background: col.color + '20', color: col.color, borderColor: col.color }}
                    >
                      {col.title}
                    </span>
                  ) : (
                    <span className="text-xs text-tertiary">
                      {task.archived ? 'Archivada' : '-'}
                    </span>
                  )}
                </td>
                <td className="stats-td stats-td-center">
                  <span className="text-xs text-tertiary">{startDate ? formatDate(startDate) : '-'}</span>
                </td>
                {(type === 'completed' || type === 'in-progress') && (
                  <td className="stats-td stats-td-center">
                    <span className="text-xs text-tertiary">
                      {type === 'completed' ? (endDate ? formatDate(endDate) : '-') : '-'}
                    </span>
                  </td>
                )}
                {type === 'completed' && (
                  <td className="stats-td stats-td-center">
                    <span className="text-sm">{formatDays(actualDays)}</span>
                  </td>
                )}
                {type === 'completed' && (
                  <td className="stats-td stats-td-center">
                    <span className="text-sm text-secondary">{formatDays(expected)}</span>
                  </td>
                )}
                {type === 'completed' && (
                  <td className="stats-td stats-td-center">
                    {delayed === true && <span className="stats-delay-tag">Retrasada</span>}
                    {delayed === false && <span className="stats-ontime-tag">A tiempo</span>}
                    {delayed === null && <span className="text-xs text-tertiary">-</span>}
                  </td>
                )}
                {type === 'in-progress' && (
                  <td className="stats-td stats-td-center">
                    <span className={`text-sm font-medium ${isOverdue ? 'stat-danger' : ''}`}>
                      {formatDays(daysActive)}
                    </span>
                  </td>
                )}
                {type === 'in-progress' && (
                  <td className="stats-td stats-td-center">
                    <span className="text-sm text-secondary">{formatDays(expected)}</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserStatsDetail;
