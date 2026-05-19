import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { optimizerApi } from '../../services/optimizerApi';
import { updateProject, updateProjectsOrder } from '../../services/projectService';
import { calcularPosicionesParaGantt, diaRelativoAFecha } from '../../utils/schedulerUtils';
import Icon from '../common/Icon';
import Toast from '../common/Toast';
import '../../styles/SimulationTab.css';

const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const SortableProjectCard = ({ project, index, color, sp, count, hasUsers, selectedUserIds, users, onToggleUser, totalProjects }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: color }}
      className={`sim-project-card ${!hasUsers ? 'sim-project-card-warning' : ''}`}
    >
      <div className="sim-project-card-header">
        <div className="sim-priority-controls">
          <span className="sim-priority-badge" style={{ background: color }}>
            {index + 1}
          </span>
          <button
            className="sim-drag-handle"
            {...attributes}
            {...listeners}
            title="Arrastrar para reordenar"
          >
            <Icon name="grip-vertical" size={16} />
          </button>
        </div>

        <div className="sim-project-info">
          <span className="text-base font-medium text-primary">{project.name}</span>
          <div className="flex items-center gap-sm mt-xs">
            <span className="badge badge-secondary flex items-center gap-xs">
              <Icon name="star" size={12} />
              {sp} SP
            </span>
            <span className="badge badge-secondary flex items-center gap-xs">
              <Icon name="check-square" size={12} />
              {count} tareas
            </span>
            {!hasUsers && (
              <span className="badge badge-warning flex items-center gap-xs">
                <Icon name="alert-triangle" size={12} />
                Sin usuarios
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="sim-user-selection">
        <span className="text-xs text-tertiary mb-xs">Usuarios asignados:</span>
        <div className="sim-user-chips">
          {users.map(user => {
            const isSelected = selectedUserIds.includes(user.id);
            return (
              <button
                key={user.id}
                className={`sim-user-chip ${isSelected ? 'active' : ''}`}
                style={isSelected ? { borderColor: color, background: color + '20', color: color } : {}}
                onClick={() => onToggleUser(project.id, user.id)}
                title={isSelected ? 'Quitar usuario' : 'Agregar usuario'}
              >
                <span className="sim-user-chip-avatar">
                  {(user.displayName || user.nombre || user.email || '?')[0].toUpperCase()}
                </span>
                <span className="sim-user-chip-name">
                  {user.displayName || user.nombre || user.email}
                </span>
                {isSelected && <Icon name="check" size={12} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const contarDiasHabiles = (diaInicioCalendario, diaFinCalendario) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let count = 0;
  const inicio = Math.ceil(Math.max(diaInicioCalendario, 0));
  const fin = Math.ceil(diaFinCalendario);
  for (let d = inicio; d < fin; d++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + d);
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) count++;
  }
  return count;
};

const mergeIntervals = (tasks) => {
  if (tasks.length === 0) return [];
  const intervals = tasks
    .map(t => ({ start: Math.max(t.diaInicio, 0), end: t.diaFin }))
    .sort((a, b) => a.start - b.start);
  const merged = [{ ...intervals[0] }];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i].start <= last.end) {
      last.end = Math.max(last.end, intervals[i].end);
    } else {
      merged.push({ ...intervals[i] });
    }
  }
  return merged;
};

const SimulationTab = ({ proyectos, tareas, users: allUsers, projectRisks = {} }) => {
  const users = allUsers.filter(u => !u.disabled);

  const [projectOrder, setProjectOrder] = useState(() =>
    [...proyectos].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)).map(p => p.id)
  );
  const [projectUsers, setProjectUsers] = useState(() => {
    const activeUsers = allUsers.filter(u => !u.disabled);
    const initial = {};
    proyectos.forEach(p => {
      if (p.simulationUsers != null) {
        initial[p.id] = p.simulationUsers;
      } else {
        initial[p.id] = activeUsers
          .filter(u => (u.projectsAssigned || []).includes(p.id))
          .map(u => u.id);
      }
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('lastSimulation');
      return saved ? JSON.parse(saved).result : null;
    } catch { return null; }
  });
  const [lastSimulationDate, setLastSimulationDate] = useState(() => {
    try {
      const saved = localStorage.getItem('lastSimulation');
      return saved ? JSON.parse(saved).timestamp : null;
    } catch { return null; }
  });
  const [viewMode, setViewMode] = useState('optimistic');
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const pendingTasks = useMemo(() =>
    tareas.filter(t =>
      !t.archived &&
      t.status !== 'completed' &&
      t.status !== 'qa' &&
      t.status !== 'in-progress' &&
      (t.projectId || t.proyectoId)
    ), [tareas]
  );

  const inProgressTasks = useMemo(() =>
    tareas.filter(t => !t.archived && t.status === 'in-progress'),
    [tareas]
  );

  const projectsWithTasks = useMemo(() => {
    const withTasks = new Set(pendingTasks.map(t => t.projectId || t.proyectoId));
    return proyectos.filter(p => withTasks.has(p.id));
  }, [proyectos, pendingTasks]);

  const spByProject = useMemo(() => {
    const map = {};
    pendingTasks.forEach(t => {
      const pid = t.projectId || t.proyectoId;
      const sp = Number(t.storyPoints) > 0 ? Number(t.storyPoints) : (Number(t.preliminaryStoryPoints) || 3);
      if (pid) map[pid] = (map[pid] || 0) + sp;
    });
    return map;
  }, [pendingTasks]);

  const taskCountByProject = useMemo(() => {
    const map = {};
    pendingTasks.forEach(t => {
      const pid = t.projectId || t.proyectoId;
      if (pid) map[pid] = (map[pid] || 0) + 1;
    });
    return map;
  }, [pendingTasks]);

  const orderedProjects = useMemo(() => {
    const inOrder = projectOrder
      .map(id => projectsWithTasks.find(p => p.id === id))
      .filter(Boolean);
    const rest = projectsWithTasks.filter(p => !projectOrder.includes(p.id));
    return [...inOrder, ...rest];
  }, [projectOrder, projectsWithTasks]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = orderedProjects.map(p => p.id);
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const newIds = arrayMove(ids, oldIndex, newIndex);
    setProjectOrder(newIds);
    updateProjectsOrder(newIds.map((id, index) => ({ id, priority: index })));
  };

  const toggleUser = (projectId, userId) => {
    setProjectUsers(prev => {
      const current = prev[projectId] || [];
      const next = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      updateProject(projectId, { simulationUsers: next });
      return { ...prev, [projectId]: next };
    });
  };

  const runSimulation = async () => {
    const configuredProjects = orderedProjects.filter(p =>
      (projectUsers[p.id] || []).length > 0
    );

    if (configuredProjects.length === 0) {
      setToast({ isOpen: true, message: 'Configura al menos un proyecto con usuarios asignados.', type: 'error' });
      return;
    }

    if (pendingTasks.length === 0) {
      setToast({ isOpen: true, message: 'No hay tareas pendientes para simular.', type: 'error' });
      return;
    }

    setLoading(true);
    setResult(null);

    const simProyectos = configuredProjects.map((p, index) => ({
      ...p,
      priority: index
    }));

    const userProjectMap = {};
    configuredProjects.forEach(p => {
      (projectUsers[p.id] || []).forEach(uid => {
        if (!userProjectMap[uid]) userProjectMap[uid] = [];
        userProjectMap[uid].push(p.id);
      });
    });

    const simUsers = users
      .filter(u => userProjectMap[u.id])
      .map(u => ({
        ...u,
        projectsAssigned: userProjectMap[u.id] || []
      }));

    if (simUsers.length === 0) {
      setLoading(false);
      setToast({ isOpen: true, message: 'No hay usuarios configurados para la simulacion.', type: 'error' });
      return;
    }

    const configuredProjectIds = new Set(configuredProjects.map(p => p.id));
    const tasksForSim = pendingTasks.filter(t =>
      configuredProjectIds.has(t.projectId || t.proyectoId)
    );

    if (tasksForSim.length === 0) {
      setLoading(false);
      setToast({ isOpen: true, message: 'Los proyectos configurados no tienen tareas pendientes.', type: 'error' });
      return;
    }

    const allRisks = Object.values(projectRisks).flat();

    const response = await optimizerApi.optimize({
      proyectos: simProyectos,
      usuarios: simUsers,
      tareas: tasksForSim,
      factoresRiesgo: allRisks,
      tareasEnProgreso: inProgressTasks,
      tiempoLimite: 60
    });

    setLoading(false);

    if (response.success) {
      const newResult = { raw: response.data, simProyectos, simUsers, allRisks };
      const timestamp = new Date().toISOString();
      try {
        localStorage.setItem('lastSimulation', JSON.stringify({ result: newResult, timestamp }));
      } catch { /* storage full, ignore */ }
      setResult(newResult);
      setLastSimulationDate(timestamp);
      setViewMode('optimistic');
    } else {
      setToast({ isOpen: true, message: response.error || 'Error al ejecutar la simulacion.', type: 'error' });
    }
  };

  const ganttTasks = useMemo(() => {
    if (!result) return [];
    return calcularPosicionesParaGantt({
      tareasOptimizador: result.raw.solucion || [],
      tareasEnProgreso: inProgressTasks,
      tareasYaOptimizadas: [],
      usuarios: result.simUsers,
      factoresRiesgo: result.allRisks,
      proyectos: result.simProyectos,
      optimista: viewMode === 'optimistic'
    });
  }, [result, viewMode, inProgressTasks]);

  const projectGanttData = useMemo(() => {
    if (!result) return [];
    const byProject = {};
    ganttTasks.forEach(t => {
      if (!byProject[t.proyectoId]) byProject[t.proyectoId] = [];
      byProject[t.proyectoId].push(t);
    });

    return result.simProyectos.map((p, index) => {
      const tasks = byProject[p.id] || [];
      if (tasks.length === 0) return null;
      const diaInicio = Math.min(...tasks.map(t => t.diaInicio));
      const diaFin = Math.max(...tasks.map(t => t.diaFin));
      const color = PROJECT_COLORS[index % PROJECT_COLORS.length];
      const activeIntervals = mergeIntervals(tasks);
      const userRows = {};
      tasks.forEach(t => {
        if (!userRows[t.usuarioId]) userRows[t.usuarioId] = { usuario: t.usuario, tasks: [] };
        userRows[t.usuarioId].tasks.push(t);
      });
      const diasCalendario = Math.ceil(diaFin) - Math.ceil(Math.max(diaInicio, 0));
      const diasTrabajados = activeIntervals.reduce((sum, iv) => sum + contarDiasHabiles(iv.start, iv.end), 0);
      const hayEsperas = activeIntervals.length > 1;
      return { project: p, diaInicio, diaFin, color, tasks, userRows, index, activeIntervals, diasCalendario, diasTrabajados, hayEsperas };
    }).filter(Boolean);
  }, [result, ganttTasks]);

  const userGanttData = useMemo(() => {
    if (!result) return [];
    const byUser = {};
    const projectColorMap = {};
    result.simProyectos.forEach((p, i) => {
      projectColorMap[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length];
    });
    ganttTasks.forEach(t => {
      if (!byUser[t.usuarioId]) byUser[t.usuarioId] = { usuario: t.usuario, tasks: [] };
      byUser[t.usuarioId].tasks.push({ ...t, color: projectColorMap[t.proyectoId] || '#6366F1' });
    });
    return Object.values(byUser).map(({ usuario, tasks }) => ({
      usuario,
      tasks: tasks.sort((a, b) => a.diaInicio - b.diaInicio)
    }));
  }, [result, ganttTasks]);

  const globalDiaFin = useMemo(() => {
    if (projectGanttData.length === 0) return 30;
    return Math.ceil(Math.max(...projectGanttData.map(d => d.diaFin))) + 1;
  }, [projectGanttData]);

  const dayLabels = useMemo(() => {
    const labels = [];
    for (let d = 0; d <= globalDiaFin; d += 5) {
      labels.push(d);
    }
    if (labels[labels.length - 1] !== globalDiaFin) labels.push(globalDiaFin);
    return labels;
  }, [globalDiaFin]);

  if (projectsWithTasks.length === 0) {
    return (
      <div className="sim-empty">
        <Icon name="bar-chart-2" size={48} />
        <p>No hay tareas pendientes con proyecto asignado para simular.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="sim-results">
        {toast.isOpen && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ isOpen: false, message: '', type: 'error' })} />
        )}

        <div className="sim-results-header">
          <div className="flex items-center gap-base flex-wrap">
            <div>
              <h2 className="heading-2 text-primary">Resultados de Simulacion</h2>
              {lastSimulationDate && (
                <span className="text-xs text-tertiary">
                  Ejecutada el {new Date(lastSimulationDate).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <div className="sim-view-toggle">
              <button
                className={`sim-view-btn ${viewMode === 'optimistic' ? 'active' : ''}`}
                onClick={() => setViewMode('optimistic')}
              >
                <Icon name="zap" size={14} />
                Optimista
              </button>
              <button
                className={`sim-view-btn ${viewMode === 'risk' ? 'active' : ''}`}
                onClick={() => setViewMode('risk')}
              >
                <Icon name="alert-triangle" size={14} />
                Con Riesgo
              </button>
            </div>
          </div>
          <button className="btn btn-secondary flex items-center gap-xs" onClick={() => setResult(null)}>
            <Icon name="settings" size={16} />
            Reconfigurar
          </button>
        </div>


        <div className="sim-summary-cards">
          {projectGanttData.map(({ project, diaInicio, diaFin, color, diasTrabajados, diasCalendario, hayEsperas }) => (
            <div key={project.id} className="sim-summary-card" style={{ borderLeftColor: color }}>
              <div className="sim-summary-card-header">
                <span className="sim-summary-color-dot" style={{ background: color }} />
                <span className="text-base font-medium text-primary">{project.name}</span>
              </div>
              <div className="sim-summary-stats">
                <span className="text-sm text-secondary">
                  <Icon name="check-square" size={14} />
                  {taskCountByProject[project.id] || 0} tareas
                </span>
                <span className="text-sm text-secondary">
                  <Icon name="star" size={14} />
                  {spByProject[project.id] || 0} SP
                </span>
                <span className="text-sm font-medium text-primary">
                  <Icon name="calendar" size={14} />
                  Fin: {diaRelativoAFecha(diaFin)}
                </span>
                <span className="text-xs text-tertiary">
                  {diasTrabajados} háb.{hayEsperas ? ` / ${diasCalendario} cal.` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="sim-gantt-container">
          <h3 className="heading-3 text-primary mb-sm">Linea de Tiempo</h3>

          <div className="sim-gantt">
            <div className="sim-gantt-labels">
              <div className="sim-gantt-header-label" />
              {projectGanttData.map(({ project, diasTrabajados, diasCalendario, hayEsperas }) => (
                <div key={project.id} className="sim-gantt-row-label">
                  <span className="text-sm text-primary font-medium truncate">{project.name}</span>
                  {hayEsperas ? (
                    <span className="text-xs text-tertiary">{diasTrabajados} háb. / {diasCalendario} cal.</span>
                  ) : (
                    <span className="text-xs text-tertiary">{diasTrabajados} días háb.</span>
                  )}
                </div>
              ))}
            </div>

            <div className="sim-gantt-chart">
              <div className="sim-gantt-header-row">
                {dayLabels.map(day => (
                  <div
                    key={day}
                    className="sim-gantt-day-label"
                    style={{ left: `${(day / globalDiaFin) * 100}%` }}
                  >
                    {day === 0 ? 'Hoy' : `Dia ${day}`}
                    <div className="sim-gantt-day-tick" />
                  </div>
                ))}
              </div>

              {projectGanttData.map(({ project, diaInicio, diaFin, color, activeIntervals }) => {
                const spanLeft = `${(Math.max(diaInicio, 0) / globalDiaFin) * 100}%`;
                const spanWidth = `${((diaFin - Math.max(diaInicio, 0)) / globalDiaFin) * 100}%`;
                const diasHabiles = contarDiasHabiles(diaInicio, diaFin);
                const diasCalendario = Math.ceil(diaFin) - Math.ceil(Math.max(diaInicio, 0));
                const diasTrabajados = activeIntervals.reduce((sum, iv) => sum + contarDiasHabiles(iv.start, iv.end), 0);
                const hayEsperas = activeIntervals.length > 1;
                return (
                  <div key={project.id} className="sim-gantt-project-group">
                    <div className="sim-gantt-row">
                      {/* Línea de span total (fondo) */}
                      <div
                        className="sim-gantt-span-line"
                        style={{ left: spanLeft, width: spanWidth, background: color }}
                        title={`Span total: ${diasCalendario} días calendario`}
                      />
                      {/* Segmentos activos */}
                      {activeIntervals.map((iv, i) => {
                        const segLeft = `${(iv.start / globalDiaFin) * 100}%`;
                        const segWidth = `${((iv.end - iv.start) / globalDiaFin) * 100}%`;
                        return (
                          <div
                            key={i}
                            className="sim-gantt-bar"
                            style={{ left: segLeft, width: segWidth, background: color }}
                            title={`${project.name} — trabajo activo: ${contarDiasHabiles(iv.start, iv.end)} días hábiles`}
                          >
                            {i === 0 && (
                              <span className="sim-gantt-bar-label">{project.name}</span>
                            )}
                          </div>
                        );
                      })}
                      {/* Marcador de fin */}
                      <div
                        className="sim-gantt-end-marker"
                        style={{ left: `calc(${spanLeft} + ${spanWidth})` }}
                      >
                        <div className="sim-gantt-end-tick" style={{ background: color }} />
                        <span className="sim-gantt-end-label">{diaRelativoAFecha(diaFin)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="sim-gantt-today-line" />
            </div>
          </div>
        </div>

        <div className="sim-gantt-container mt-base">
          <h3 className="heading-3 text-primary mb-sm">Carga por Persona</h3>
          <p className="text-xs text-tertiary mb-base">Muestra el trabajo de cada persona en orden secuencial. Una persona hace una tarea a la vez aunque sean de proyectos distintos.</p>

          <div className="sim-gantt">
            <div className="sim-gantt-labels">
              <div className="sim-gantt-header-label" />
              {userGanttData.map(({ usuario }) => (
                <div key={usuario} className="sim-gantt-row-label">
                  <span className="text-sm text-primary font-medium truncate">{usuario}</span>
                </div>
              ))}
            </div>

            <div className="sim-gantt-chart">
              <div className="sim-gantt-header-row">
                {dayLabels.map(day => (
                  <div
                    key={day}
                    className="sim-gantt-day-label"
                    style={{ left: `${(day / globalDiaFin) * 100}%` }}
                  >
                    {day === 0 ? 'Hoy' : `Dia ${day}`}
                    <div className="sim-gantt-day-tick" />
                  </div>
                ))}
              </div>

              {userGanttData.map(({ usuario, tasks }) => (
                <div key={usuario} className="sim-gantt-project-group">
                  <div className="sim-gantt-row">
                    {tasks.map(task => {
                      const tLeft = `${(Math.max(task.diaInicio, 0) / globalDiaFin) * 100}%`;
                      const tWidth = `${((task.diaFin - Math.max(task.diaInicio, 0)) / globalDiaFin) * 100}%`;
                      return (
                        <div
                          key={task.id}
                          className="sim-gantt-bar"
                          style={{ left: tLeft, width: tWidth, background: task.color }}
                          title={`[${task.proyectoNombre}] ${task.nombre} (${task.storyPoints} SP)`}
                        >
                          <span className="sim-gantt-bar-label">{task.nombre}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="sim-gantt-today-line" />
            </div>
          </div>

          <div className="sim-user-legend mt-sm">
            {result.simProyectos.map((p, i) => (
              <span key={p.id} className="sim-legend-item">
                <span className="sim-legend-dot" style={{ background: PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
                <span className="text-xs text-secondary">{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sim-setup">
      {toast.isOpen && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ isOpen: false, message: '', type: 'error' })} />
      )}

      <div className="sim-setup-header">
        <div>
          <h2 className="heading-2 text-primary">Simulacion de Capacidad</h2>
          <p className="text-sm text-secondary mt-xs">
            Configura la prioridad de proyectos y los usuarios asignados para simular el plan de ejecucion.
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-sm"
          onClick={runSimulation}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner-sm" />
              Simulando...
            </>
          ) : (
            <>
              <Icon name="play" size={16} />
              Ejecutar Simulacion
            </>
          )}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="sim-projects-list">
            {orderedProjects.map((project, index) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                index={index}
                color={PROJECT_COLORS[index % PROJECT_COLORS.length]}
                sp={spByProject[project.id] || 0}
                count={taskCountByProject[project.id] || 0}
                hasUsers={(projectUsers[project.id] || []).length > 0}
                selectedUserIds={projectUsers[project.id] || []}
                users={users}
                onToggleUser={toggleUser}
                totalProjects={orderedProjects.length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SimulationTab;
