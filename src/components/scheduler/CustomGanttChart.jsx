import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import Icon from '../common/Icon';
import '../../styles/CustomGanttChart.css';

/**
 * Gantt Chart personalizado con soporte completo para decimales
 * Diseñado específicamente para el optimizador de tareas
 */
const CustomGanttChart = ({ solucion, makespan, proyectos, usuarios, onTaskClick }) => {
  const [hoveredTask, setHoveredTask] = useState(null);
  const ganttRef = useRef(null);
  const [hoveredDependency, setHoveredDependency] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [labelTooltipPosition, setLabelTooltipPosition] = useState({ x: 0, y: 0 });

  // Generar color consistente para un proyecto
  const getProjectColor = useCallback((projectId) => {
    if (!projectId) return '#6B7280';

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
    ];

    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Formatear duración con decimales
  const formatDuration = useCallback((dias, decimals = 1) => {
    if (!dias) return '0d';
    return `${dias.toFixed(decimals)}d`;
  }, []);

  // Formatear fecha para los headers del Gantt
  const formatearFecha = useCallback((diasDesdeHoy) => {
    const hoy = new Date();
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diasDesdeHoy);

    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });

    return `${dia} ${mes}`;
  }, []);

  // Verificar si un día es fin de semana (sábado=6, domingo=0)
  const esFinDeSemana = useCallback((diasDesdeHoy) => {
    const hoy = new Date();
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diasDesdeHoy);
    const diaSemana = fecha.getDay();
    return diaSemana === 0 || diaSemana === 6;
  }, []);

  // Verificar si un día es laborable para un usuario específico
  // Usa el sistema de "casillas": cada 0.5 días = 1 casilla
  // Ambas casillas del mismo día (AM y PM) tienen el mismo estado de laborable
  const esDiaLaborable = useCallback((diasDesdeHoy, diasLaborablesUsuario) => {
    if (!diasLaborablesUsuario || diasLaborablesUsuario.length === 0) {
      return true; // Si no hay configuración, asumir que todos los días son laborables
    }

    // With snapped diaInicio (always on 0.5-day grid), Math.floor gives the correct day index
    const indiceDia = Math.floor(diasDesdeHoy);

    // Calcular el día de la semana usando el mismo método que esFinDeSemana
    const hoy = new Date();
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + indiceDia);
    const diaSemana = fecha.getDay();

    // Convertir: domingo=0 -> 7, lunes=1 -> 1, etc.
    const diaNumero = diaSemana === 0 ? 7 : diaSemana;

    return diasLaborablesUsuario.includes(diaNumero);
  }, []);

  const calcularSegmentosTarea = useCallback((task) => {
    const segmentos = [];
    const diaInicio = task.diaInicio;
    const diaFin = task.diaFin;

    // Obtener días laborables del usuario asignado
    const usuario = usuarios?.find(u => u.id === task.usuarioId);
    const diasLaborablesUsuario = usuario?.workingDays || [1, 2, 3, 4, 5];

    // Presupuestos en medios dias de trabajo
    // Redondeo se suma al riesgo (las tareas siempre se redondean a 0.5)
    const medioDiasBase = Math.round((task.duracionBase || 0) * 2);
    const medioDiasRiesgo = Math.round(((task.tiempoRiesgo || 0) + (task.tiempoRedondeo || 0)) * 2);

    let medioDiasTrabajados = 0;

    // Recorrer en incrementos de 0.5 dias
    let diaActual = Math.floor(diaInicio * 2) / 2;
    if (diaActual < diaInicio) diaActual += 0.5;

    let segmentoActual = null;

    // Fragmento inicial si no alineado
    if (diaInicio < diaActual && diaInicio < diaFin) {
      const esLaborable = esDiaLaborable(diaInicio, diasLaborablesUsuario);
      let tipo;
      if (!esLaborable) {
        tipo = 'no-laborable';
      } else if (medioDiasTrabajados < medioDiasBase) {
        tipo = 'base';
        medioDiasTrabajados++;
      } else {
        tipo = 'riesgo';
        medioDiasTrabajados++;
      }
      segmentoActual = { inicio: diaInicio, fin: Math.min(diaActual, diaFin), tipo };
    }

    while (diaActual < diaFin) {
      const esLaborable = esDiaLaborable(diaActual, diasLaborablesUsuario);
      let tipo;
      if (!esLaborable) {
        tipo = 'no-laborable';
      } else if (medioDiasTrabajados < medioDiasBase) {
        tipo = 'base';
        medioDiasTrabajados++;
      } else {
        tipo = 'riesgo';
        medioDiasTrabajados++;
      }

      if (!segmentoActual || segmentoActual.tipo !== tipo) {
        if (segmentoActual) segmentos.push(segmentoActual);
        segmentoActual = { inicio: diaActual, fin: Math.min(diaActual + 0.5, diaFin), tipo };
      } else {
        segmentoActual.fin = Math.min(diaActual + 0.5, diaFin);
      }

      diaActual += 0.5;
    }

    if (segmentoActual) segmentos.push(segmentoActual);

    return { segmentos, diaFinRecalculado: diaFin };
  }, [esDiaLaborable, usuarios]);

  // Verificar si hay tareas para mostrar
  if (!solucion || solucion.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="calendar" size={48} />
        <p className="heading-3 text-primary">No hay tareas optimizadas</p>
        <p className="text-base text-secondary">
          Ejecuta el optimizador para generar una planificación.
        </p>
      </div>
    );
  }

  // Manejar resize de ventana para recalcular ancho
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // === CONFIGURACIÓN DE CUADRÍCULA ===
  // Cada celda = 0.5 días, cada columna visible (día) = 2 celdas
  const CELL_WIDTH = 30; // px por celda (0.5 días)
  const CELLS_PER_DAY = 2; // 2 celdas = 1 día completo
  const DAY_WIDTH = CELL_WIDTH * CELLS_PER_DAY; // 60px por día
  const rowHeight = 50;
  const labelWidth = 200;

  // Calcular el día de inicio más temprano (puede ser negativo para tareas en progreso)
  const minDiaInicio = solucion && solucion.length > 0
    ? Math.min(...solucion.map(t => t.diaInicio || 0))
    : 0;

  // Calcular offset en días (para tareas en progreso que empiezan en negativo)
  const offset = minDiaInicio < 0 ? Math.ceil(Math.abs(minDiaInicio)) : 0;

  // Calcular días totales necesarios
  const ganttWrapperWidth = ganttRef.current?.offsetWidth || viewportWidth;
  const minTimelineWidth = ganttWrapperWidth - labelWidth;
  const daysFromTasks = Math.ceil(makespan + offset) + 1;
  const daysToFillViewport = Math.ceil(minTimelineWidth / DAY_WIDTH);
  const totalDays = Math.max(daysFromTasks, daysToFillViewport);

  // Total de celdas en el Gantt (cada celda = 0.5 días)
  const totalCells = totalDays * CELLS_PER_DAY;

  // Generar estructura de datos agrupados por usuario
  const ganttData = useCallback(() => {
    if (!solucion || solucion.length === 0) return [];

    // Vista agrupada por usuario
    const groups = {};
    solucion.forEach(tarea => {
      if (!groups[tarea.usuario]) {
        groups[tarea.usuario] = [];
      }
      groups[tarea.usuario].push({
        id: tarea.id,
        name: tarea.nombre,
        usuario: tarea.usuario,
        usuarioId: tarea.usuarioId,
        diaInicio: tarea.diaInicio,
        diaFin: tarea.diaFin,
        duracion: tarea.duracion,
        duracionBase: tarea.duracionBase,
        tiempoRiesgo: tarea.tiempoRiesgo || 0,
        proyectoId: tarea.proyectoId,
        proyectoNombre: tarea.proyectoNombre,
        storyPoints: tarea.storyPoints,
        enProgreso: tarea.enProgreso,
        forzado: tarea.forzado,
        dependencias: tarea.dependencias || [],
        type: 'task'
      });
    });

    const result = [];
    Object.entries(groups).forEach(([usuario, tareas]) => {
      // Ordenar tareas por diaInicio para que se muestren en orden cronológico
      const tareasOrdenadas = [...tareas].sort((a, b) => a.diaInicio - b.diaInicio);

      result.push({
        id: `user-${usuario}`,
        name: usuario,
        type: 'group',
        tasks: tareasOrdenadas
      });
    });

    return result;
  }, [solucion, usuarios]);

  const data = useMemo(() => ganttData(), [ganttData]);

  // Componente memoizado para barras de tareas (optimización de rendimiento)
  const TaskBar = useMemo(() => memo(({ task }) => {
    const resultadoSegmentos = calcularSegmentosTarea(task);
    const segmentos = resultadoSegmentos.segmentos;
    const diaFin = resultadoSegmentos.diaFinRecalculado;

    // === POSICIONAMIENTO BASADO EN CUADRÍCULA ===
    const diaInicioConOffset = task.diaInicio + offset;
    const duracionEnDias = diaFin - task.diaInicio;

    const celdaInicio = Math.round(diaInicioConOffset * CELLS_PER_DAY);
    const celdasDuracion = Math.ceil(duracionEnDias * CELLS_PER_DAY);

    const x = celdaInicio * CELL_WIDTH;
    const width = Math.max(celdasDuracion * CELL_WIDTH, CELL_WIDTH);

    const color = getProjectColor(task.proyectoId);

    return (
      <div
        className={`gantt-task-bar ${task.enProgreso ? 'in-progress' : ''} ${hoveredTask === task.id ? 'hovered' : ''}`}
        style={{
          left: `${x}px`,
          width: `${width}px`,
          backgroundColor: 'transparent',
        }}
        onMouseEnter={() => setHoveredTask(task.id)}
        onMouseLeave={() => setHoveredTask(null)}
        onClick={() => {
          setHoveredTask(null);
          if (onTaskClick) {
            onTaskClick({ taskId: task.id });
          }
        }}
      >
        {segmentos.map((segmento, idx) => {
          const segmentoInicioConOffset = segmento.inicio + offset;
          const segmentoDuracion = segmento.fin - segmento.inicio;

          const segmentoCeldaInicio = Math.round(segmentoInicioConOffset * CELLS_PER_DAY);
          const segmentoCeldasDuracion = Math.ceil(segmentoDuracion * CELLS_PER_DAY);

          const segmentoX = (segmentoCeldaInicio - celdaInicio) * CELL_WIDTH;
          const segmentoWidth = Math.max(segmentoCeldasDuracion * CELL_WIDTH, 1);

          const isWorkSegment = segmento.tipo !== 'no-laborable';

          return (
            <div
              key={idx}
              className={`gantt-task-segment ${segmento.tipo}`}
              style={{
                position: 'absolute',
                left: `${segmentoX}px`,
                width: `${segmentoWidth}px`,
                height: '100%',
                backgroundColor: isWorkSegment ? color : undefined,
              }}
            />
          );
        })}

        <span className="gantt-task-label">
          {task.name}
          {task.storyPoints > 0 && ` (${task.storyPoints} SP)`}
        </span>

        {task.enProgreso && (
          <div className="gantt-progress-indicator" />
        )}
      </div>
    );
  }), [hoveredTask, offset, CELL_WIDTH, CELLS_PER_DAY, getProjectColor, onTaskClick, calcularSegmentosTarea]);

  // Función para obtener la posición Y de una tarea en el Gantt
  const getTaskYPosition = useCallback((taskId) => {
    let yPosition = 0; // Empezar desde 0 (el header está fuera del área de dibujo SVG)

    for (const item of data) {
      if (item.type === 'group') {
        // Fila del grupo
        yPosition += rowHeight; // Sumar la altura de la fila del grupo

        // Filas de tareas del grupo
        for (const task of item.tasks) {
          if (task.id === taskId) return yPosition;
          yPosition += rowHeight;
        }
      } else {
        // Vista flat
        if (item.id === taskId) return yPosition;
        yPosition += rowHeight;
      }
    }
    return null;
  }, [data, rowHeight]);

  // Renderizar líneas de dependencias
  const renderDependencyLines = useCallback(() => {
    const lines = [];
    const allTasks = data.flatMap(item => item.type === 'group' ? item.tasks : [item]);

    allTasks.forEach(task => {
      const dependencias = task.dependencias || [];

      dependencias.forEach(depId => {
        const depTask = allTasks.find(t => t.id === depId);
        if (!depTask) return;

        const fromY = getTaskYPosition(depId);
        const toY = getTaskYPosition(task.id);

        if (fromY === null || toY === null) return;

        // Ajustar posiciones X basadas en cuadrícula
        const fromCelda = Math.round((depTask.diaFin + offset) * CELLS_PER_DAY);
        const toCelda = Math.round((task.diaInicio + offset) * CELLS_PER_DAY);
        const fromX = fromCelda * CELL_WIDTH;
        const toX = toCelda * CELL_WIDTH;
        // Ajustar la posición Y para que esté en el centro de la barra de tarea (no del row completo)
        // Las barras tienen top: 10px y height efectiva de ~36px (incluye padding/contenido)
        // El centro visual está aproximadamente a 10 + 18 = 28px desde el inicio del row
        const taskBarCenterOffset = 28;
        const fromCenterY = fromY + taskBarCenterOffset;
        const toCenterY = toY + taskBarCenterOffset;

        const isHovered = hoveredTask === task.id || hoveredTask === depId ||
                         hoveredDependency === `${depId}-${task.id}`;

        // Crear path SVG con línea quebrada (línea recta horizontal desde fin de depTask,
        // luego vertical, luego horizontal hasta inicio de task)
        const midX = fromX + (toX - fromX) / 2;
        const path = `M ${fromX} ${fromCenterY} L ${midX} ${fromCenterY} L ${midX} ${toCenterY} L ${toX} ${toCenterY}`;

        lines.push(
          <g
            key={`dep-${depId}-${task.id}`}
            onMouseEnter={() => setHoveredDependency(`${depId}-${task.id}`)}
            onMouseLeave={() => setHoveredDependency(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Línea invisible más gruesa para hover */}
            <path
              d={path}
              stroke="transparent"
              strokeWidth="10"
              fill="none"
            />
            {/* Línea visible */}
            <path
              d={path}
              stroke={isHovered ? '#3b82f6' : 'rgba(100, 116, 139, 0.4)'}
              strokeWidth={isHovered ? '2.5' : '2'}
              fill="none"
              strokeDasharray={isHovered ? '0' : '4 2'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {/* Flecha al final */}
            <polygon
              points={`${toX},${toCenterY} ${toX - 6},${toCenterY - 4} ${toX - 6},${toCenterY + 4}`}
              fill={isHovered ? '#3b82f6' : 'rgba(100, 116, 139, 0.5)'}
              style={{ transition: 'all 0.2s ease' }}
            />
          </g>
        );
      });
    });

    return lines;
  }, [data, CELL_WIDTH, CELLS_PER_DAY, rowHeight, hoveredTask, hoveredDependency, getTaskYPosition, offset]);

  return (
    <div className="custom-gantt-container">
      {/* Header */}
      <div className="gantt-header">
        <div>
          <h3 className="heading-3 text-primary">Planificación Optimizada</h3>
          <p className="text-sm text-secondary">
            Duración total: <strong>{formatDuration(makespan || 3.5)}</strong> • {solucion.length} tarea{solucion.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-base">
          {/* Leyenda de proyectos */}
          <div className="gantt-legend-compact">
            {proyectos.slice(0, 4).map(proyecto => (
              <div key={proyecto.id} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: getProjectColor(proyecto.id) }}
                />
                <span className="text-xs text-secondary">{proyecto.name || proyecto.nombre}</span>
              </div>
            ))}
            {proyectos.length > 4 && (
              <span className="text-xs text-tertiary">+{proyectos.length - 4} más</span>
            )}
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="gantt-wrapper" ref={ganttRef}>
        <div className="gantt-content">
          {/* Columna de labels */}
          <div className="gantt-labels" style={{ width: `${labelWidth}px` }}>
            <div className="gantt-labels-header">
              <span className="text-sm font-medium text-primary">Nombre</span>
            </div>
            {data.map((item) => (
              <div key={item.id}>
                {item.type === 'group' ? (
                  <>
                    <div
                      className="gantt-label-row group-label"
                      onMouseEnter={(e) => {
                        setHoveredLabel({ type: 'user', name: item.name });
                        const rect = e.currentTarget.getBoundingClientRect();
                        setLabelTooltipPosition({ x: rect.right + 10, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredLabel(null)}
                    >
                      <Icon name="user" size={16} />
                      <span className="font-medium text-primary">{item.name}</span>
                    </div>
                    {item.tasks.map(task => (
                      <div
                        key={task.id}
                        className="gantt-label-row task-label"
                        onMouseEnter={(e) => {
                          setHoveredLabel({ type: 'task', name: task.name });
                          const rect = e.currentTarget.getBoundingClientRect();
                          setLabelTooltipPosition({ x: rect.right + 10, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredLabel(null)}
                      >
                        <span className="text-sm text-secondary">{task.name}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div
                    className="gantt-label-row task-label"
                    onMouseEnter={(e) => {
                      setHoveredLabel({ type: 'task', name: item.name });
                      const rect = e.currentTarget.getBoundingClientRect();
                      setLabelTooltipPosition({ x: rect.right + 10, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredLabel(null)}
                  >
                    <span className="text-sm text-secondary">{item.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Área del timeline */}
          <div className="gantt-timeline-wrapper">
            {/* Header de días - cada columna representa 1 día completo (2 celdas) */}
            <div className="gantt-timeline-header" style={{ width: `${totalDays * DAY_WIDTH}px` }}>
              {Array.from({ length: totalDays }, (_, i) => {
                // Calcular el día real: si hay offset, los primeros días serán negativos
                const diaReal = i - offset;
                const isToday = diaReal === 0; // Marcar el día 0 como "hoy"
                const isWeekend = esFinDeSemana(diaReal);
                const fechaFormateada = formatearFecha(diaReal);

                return (
                  <div
                    key={i}
                    className={`gantt-day-header ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                    style={{ width: `${DAY_WIDTH}px` }}
                  >
                    <span className={`${isToday ? 'text-warning font-bold' : isWeekend ? 'text-tertiary' : 'text-secondary'}`}>
                      {fechaFormateada}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid y barras */}
            <div className="gantt-timeline" style={{ width: `${totalDays * DAY_WIDTH}px`, position: 'relative' }}>
              {/* Grid de fondo - Mostrar celdas individuales (0.5 días cada una) */}
              <div className="gantt-grid">
                {Array.from({ length: totalCells }, (_, i) => {
                  // Cada 2 celdas = 1 día
                  const dayIndex = Math.floor(i / CELLS_PER_DAY);
                  const diaReal = dayIndex - offset;
                  const isToday = dayIndex === offset;
                  const isWeekend = esFinDeSemana(diaReal);
                  const isHalfDay = i % CELLS_PER_DAY === 1; // Segunda celda del día (AM/PM)

                  return (
                    <div
                      key={i}
                      className={`gantt-grid-cell ${isToday ? 'today-cell' : ''} ${isWeekend ? 'weekend-cell' : ''} ${isHalfDay ? 'half-day' : ''}`}
                      style={{
                        left: `${i * CELL_WIDTH}px`,
                        width: `${CELL_WIDTH}px`
                      }}
                    />
                  );
                })}
              </div>

              {/* Marcador vertical "HOY" */}
              <div
                className="gantt-today-marker"
                style={{ left: `${offset * DAY_WIDTH}px` }}
              >
                <div className="gantt-today-label">HOY</div>
                <div className="gantt-today-line" />
              </div>

              {/* Líneas de dependencias (SVG) */}
              <svg
                className="gantt-dependencies"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <g style={{ pointerEvents: 'auto' }}>
                  {renderDependencyLines()}
                </g>
              </svg>

              {/* Barras de tareas */}
              <div className="gantt-tasks">
                {data.map((item) => (
                  <div key={item.id}>
                    {item.type === 'group' ? (
                      <>
                        {/* Fila del grupo */}
                        <div
                          className="gantt-task-row group-row"
                          style={{ height: `${rowHeight}px` }}
                        />
                        {/* Filas de tareas del grupo */}
                        {item.tasks.map(task => (
                          <div
                            key={task.id}
                            className="gantt-task-row"
                            style={{ height: `${rowHeight}px` }}
                          >
                            <TaskBar task={task} />
                          </div>
                        ))}
                      </>
                    ) : (
                      <div
                        className="gantt-task-row"
                        style={{ height: `${rowHeight}px` }}
                      >
                        <TaskBar task={item} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip para labels */}
      {hoveredLabel && (
        <div
          className="gantt-label-tooltip"
          style={{
            position: 'fixed',
            left: `${labelTooltipPosition.x}px`,
            top: `${labelTooltipPosition.y}px`,
          }}
        >
          {hoveredLabel.name}
        </div>
      )}

      {/* Tooltip */}
      {hoveredTask && (() => {
        const task = solucion.find(t => t.id === hoveredTask);
        if (!task) return null;

        const duracionBase = task.duracionBase || 0;
        const tiempoRiesgoTotal = (task.tiempoRiesgo || 0) + (task.tiempoRedondeo || 0);
        const duracionTotal = duracionBase + tiempoRiesgoTotal;

        return (
          <div className="gantt-tooltip">
            <div className="gantt-tooltip-title">{task.nombre}</div>
            <div className="gantt-tooltip-item">
              <Icon name="user" size={14} />
              <span>{task.usuario}</span>
            </div>
            <div className="gantt-tooltip-item">
              <Icon name="folder" size={14} />
              <span>{task.proyectoNombre}</span>
            </div>
            <div className="gantt-tooltip-item">
              <Icon name="clock" size={14} />
              {tiempoRiesgoTotal > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div>
                    {formatDuration(duracionBase)} + {formatDuration(tiempoRiesgoTotal)} <span style={{ color: '#ef4444' }}>riesgo</span> = {formatDuration(duracionTotal)}
                  </div>
                  {(task.tiempoRiesgoUsuario > 0 || task.tiempoRiesgoProyecto > 0) && (
                    <div style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}>
                      (
                      {task.tiempoRiesgoUsuario > 0 && <span>{formatDuration(task.tiempoRiesgoUsuario)} <span style={{ color: '#8b5cf6' }}>usuario</span></span>}
                      {task.tiempoRiesgoUsuario > 0 && task.tiempoRiesgoProyecto > 0 && <span> + </span>}
                      {task.tiempoRiesgoProyecto > 0 && <span>{formatDuration(task.tiempoRiesgoProyecto)} <span style={{ color: '#06b6d4' }}>proyecto</span></span>}
                      )
                    </div>
                  )}
                </div>
              ) : (
                <span>{formatDuration(duracionTotal)}</span>
              )}
            </div>
            {task.storyPoints > 0 && (
              <div className="gantt-tooltip-item">
                <Icon name="zap" size={14} />
                <span>{task.storyPoints} SP</span>
              </div>
            )}
            {task.enProgreso && (
              <div className="gantt-tooltip-badge">En progreso</div>
            )}
            {task.forzado && (
              <div className="gantt-tooltip-badge">Asignacion forzada</div>
            )}
          </div>
        );
      })()}

      {/* Leyenda inferior */}
      <div className="gantt-legend">
        <div className="flex items-center gap-base flex-wrap">
          <div className="flex items-center gap-xs">
            <div className="legend-indicator in-progress" />
            <span className="text-secondary">En progreso</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="legend-indicator" />
            <span className="text-secondary">Pendiente</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="legend-indicator with-non-working" />
            <span className="text-secondary">Días no laborables</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="legend-indicator with-risk" />
            <span className="text-secondary">Tiempo de riesgo</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-secondary">Haz clic en una tarea para ver detalles</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomGanttChart;
