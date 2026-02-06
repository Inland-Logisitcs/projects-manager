import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import Icon from '../common/Icon';
import '../../styles/GanttChart.css';

/**
 * Componente para visualizar el resultado de la optimización en formato Gantt
 * Usa la librería gantt-task-react para un Gantt moderno y funcional
 */
const GanttChart = ({ solucion, makespan, proyectos, onTaskClick }) => {
  const [viewMode, setViewMode] = useState('user'); // 'user' o 'flat'
  const [hoveredTask, setHoveredTask] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const ganttWrapperRef = useRef(null);

  // Generar color consistente para un proyecto basado en su ID (misma lógica que DependenciesFlow)
  const getProjectColor = useCallback((projectId) => {
    if (!projectId) return '#6B7280'; // Color gris por defecto

    // Paleta de colores suaves y diferenciables
    const colors = [
      '#3B82F6', // Azul
      '#10B981', // Verde
      '#F59E0B', // Naranja
      '#EF4444', // Rojo
      '#8B5CF6', // Púrpura
      '#EC4899', // Rosa
      '#14B8A6', // Teal
      '#F97316', // Naranja oscuro
      '#6366F1', // Índigo
      '#84CC16', // Lima
    ];

    // Generar un índice consistente basado en el projectId
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;

    return colors[index];
  }, []);

  // Formatear duración con decimales (días y horas)
  const formatDuration = useCallback((dias) => {
    if (!dias) return '0 días';

    const diasEnteros = Math.floor(dias);
    const horasDecimal = (dias - diasEnteros) * 24;
    const horas = Math.round(horasDecimal);

    if (horas === 0) {
      return `${diasEnteros} día${diasEnteros !== 1 ? 's' : ''}`;
    } else if (diasEnteros === 0) {
      return `${horas}h`;
    } else {
      return `${diasEnteros}d ${horas}h`;
    }
  }, []);

  // Crear mapa de tareas por ID para acceso rápido en el tooltip
  const taskMap = useMemo(() => {
    const map = {};
    solucion.forEach(tarea => {
      const taskId = `task-${tarea.id || tarea.nombre}`;
      map[taskId] = tarea;
    });
    return map;
  }, [solucion]);

  // Convertir la solución al formato que espera gantt-task-react
  const tasks = useMemo(() => {
    if (!solucion || solucion.length === 0) return [];

    // Constante para conversión de días a milisegundos
    const MS_PER_DAY = 86400000;

    // Encontrar el día de inicio más temprano (puede ser negativo para tareas en progreso)
    const minDiaInicio = Math.min(...solucion.map(t => t.diaInicio || 0));

    // Ajustar el offset: si hay días negativos, vamos a desplazar todas las tareas
    // para que el día más temprano sea 0, y "hoy" será visible como un día positivo
    const offset = minDiaInicio < 0 ? Math.abs(minDiaInicio) : 0;

    // La fecha base del Gantt (día 0 del Gantt)
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    if (viewMode === 'flat') {
      // Vista plana sin agrupación
      return solucion.map((tarea, index) => {
        // Ajustar días sumando el offset para que todos sean >= 0
        const diaInicioAjustado = (tarea.diaInicio || 0) + offset;
        const diaFinAjustado = (tarea.diaFin || 0) + offset;

        // Calcular fechas desde la fecha base
        const start = new Date(baseDate.getTime() + (diaInicioAjustado * MS_PER_DAY));
        // Restar 1ms para que el end sea inclusive (evita redondeo hacia arriba)
        const end = new Date(baseDate.getTime() + (diaFinAjustado * MS_PER_DAY) - 1);

        const proyecto = proyectos.find(p => p.id === tarea.proyectoId);
        const color = getProjectColor(tarea.proyectoId);

        // Calcular estilos para mostrar riesgo visualmente
        const tiempoRiesgo = tarea.tiempoRiesgo || 0;
        const duracionTotal = tarea.duracion || 1;
        const proporcionRiesgo = tiempoRiesgo > 0 ? (tiempoRiesgo / duracionTotal) * 100 : 0;

        // Usar color sólido siempre (el pattern se agregará via CSS overlay)
        const backgroundColor = color;

        return {
          start,
          end,
          name: `${tarea.usuario} - ${tarea.nombre}`,
          id: `task-${tarea.id || index}`,
          type: 'task',
          progress: tarea.enProgreso ? 50 : 0,
          isDisabled: false,
          styles: {
            backgroundColor: backgroundColor,
            backgroundSelectedColor: backgroundColor,
            progressColor: tarea.enProgreso ? '#059669' : '#10B981',
            progressSelectedColor: tarea.enProgreso ? '#047857' : '#059669',
            ...(tarea.enProgreso && {
              border: '2px solid #059669',
              boxShadow: '0 0 0 2px rgba(5, 150, 105, 0.2)'
            }),
            ...(proporcionRiesgo > 0 && {
              boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.3)'
            })
          },
          project: tarea.proyectoNombre || proyecto?.name || 'Sin proyecto',
          user: tarea.usuario,
          storyPoints: tarea.storyPoints,
          duration: tarea.duracion,
          enProgreso: tarea.enProgreso || false,
          tiempoRiesgo: tarea.tiempoRiesgo || 0,
          forzado: tarea.forzado || false,
          taskId: tarea.id, // ID original de la tarea para buscarla
          proporcionRiesgo: proporcionRiesgo // Añadir para poder usar en CSS/overlays
        };
      });
    }

    // Vista agrupada por usuario
    const userGroups = {};
    solucion.forEach(tarea => {
      if (!userGroups[tarea.usuario]) {
        userGroups[tarea.usuario] = [];
      }
      userGroups[tarea.usuario].push(tarea);
    });

    const result = [];

    Object.entries(userGroups).forEach(([usuario, tareas]) => {
      // Calcular el rango de fechas para el grupo de usuario (ya ajustado con offset)
      const minDia = Math.min(...tareas.map(t => (t.diaInicio || 0) + offset));
      const maxDia = Math.max(...tareas.map(t => (t.diaFin || 0) + offset));

      const groupStart = new Date(baseDate.getTime() + (minDia * MS_PER_DAY));
      // Restar 1ms para que el end sea inclusive
      const groupEnd = new Date(baseDate.getTime() + (maxDia * MS_PER_DAY) - 1);

      // Agregar el proyecto (grupo de usuario)
      result.push({
        start: groupStart,
        end: groupEnd,
        name: usuario,
        id: `user-${usuario}`,
        type: 'project',
        progress: 0,
        isDisabled: true,
        hideChildren: false,
        styles: {
          backgroundColor: '#015E7C',
          backgroundSelectedColor: '#014558',
          progressColor: '#015E7C',
          progressSelectedColor: '#014558'
        }
      });

      // Agregar las tareas del usuario
      tareas.forEach((tarea, index) => {
        // Ajustar días sumando el offset para que todos sean >= 0
        const diaInicioAjustado = (tarea.diaInicio || 0) + offset;
        const diaFinAjustado = (tarea.diaFin || 0) + offset;

        const start = new Date(baseDate.getTime() + (diaInicioAjustado * MS_PER_DAY));
        // Restar 1ms para que el end sea inclusive (evita redondeo hacia arriba)
        const end = new Date(baseDate.getTime() + (diaFinAjustado * MS_PER_DAY) - 1);

        // Obtener color del proyecto
        const proyecto = proyectos.find(p => p.id === tarea.proyectoId);
        const color = getProjectColor(tarea.proyectoId);

        // Calcular estilos para mostrar riesgo visualmente
        const tiempoRiesgo = tarea.tiempoRiesgo || 0;
        const duracionTotal = tarea.duracion || 1;
        const proporcionRiesgo = tiempoRiesgo > 0 ? (tiempoRiesgo / duracionTotal) * 100 : 0;

        // Usar color sólido siempre (el pattern se agregará via CSS overlay)
        const backgroundColor = color;

        result.push({
          start,
          end,
          name: tarea.nombre,
          id: `task-${tarea.id || tarea.nombre}`,
          type: 'task',
          project: `user-${usuario}`,
          progress: tarea.enProgreso ? 50 : 0,
          isDisabled: false,
          styles: {
            backgroundColor: backgroundColor,
            backgroundSelectedColor: backgroundColor,
            progressColor: tarea.enProgreso ? '#059669' : '#10B981',
            progressSelectedColor: tarea.enProgreso ? '#047857' : '#059669',
            ...(tarea.enProgreso && {
              border: '2px solid #059669',
              boxShadow: '0 0 0 2px rgba(5, 150, 105, 0.2)'
            }),
            ...(proporcionRiesgo > 0 && {
              boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.3)'
            })
          },
          // Información adicional para tooltip y clicks
          projectName: tarea.proyectoNombre || proyecto?.name || 'Sin proyecto',
          user: tarea.usuario,
          storyPoints: tarea.storyPoints || 0,
          duration: tarea.duracion,
          enProgreso: tarea.enProgreso || false,
          tiempoRiesgo: tarea.tiempoRiesgo || 0,
          forzado: tarea.forzado || false,
          taskId: tarea.id, // ID original de la tarea para buscarla
          proporcionRiesgo: proporcionRiesgo // Añadir para poder usar en CSS/overlays
        });
      });
    });

    return result;
  }, [solucion, proyectos, viewMode, getProjectColor]);

  // Función para renderizar tooltip personalizado
  const handleTooltipContent = (task) => {
    // No mostrar tooltip para grupos de usuario
    if (task.type === 'project') {
      return null;
    }

    // Look up complete task data from taskMap
    const fullTaskData = taskMap[task.id];
    if (!fullTaskData) {
      return null;
    }

    const lines = [
      `📋 ${fullTaskData.nombre || 'Sin nombre'}`,
      `👤 ${fullTaskData.usuario || 'Sin asignar'}`,
      `📁 ${fullTaskData.proyectoNombre || 'Sin proyecto'}`,
    ];

    // Mostrar duración con formato mejorado (días y horas)
    if (fullTaskData.duracion) {
      const duracionBase = fullTaskData.duracionBase || fullTaskData.duracion;
      const tiempoRiesgo = fullTaskData.tiempoRiesgo || 0;

      if (tiempoRiesgo > 0) {
        lines.push(`⏱️ ${formatDuration(duracionBase)} + ${formatDuration(tiempoRiesgo)} riesgo = ${formatDuration(fullTaskData.duracion)}`);
      } else {
        lines.push(`⏱️ ${formatDuration(fullTaskData.duracion)}`);
      }
    }

    if (fullTaskData.storyPoints && fullTaskData.storyPoints > 0) {
      lines.push(`📊 ${fullTaskData.storyPoints} SP`);
    }

    if (fullTaskData.enProgreso) {
      lines.push(`🔄 EN PROGRESO`);

      // Mostrar cuántos días lleva en progreso si está disponible
      if (fullTaskData.diasTranscurridos && fullTaskData.diasTranscurridos > 0) {
        lines.push(`📅 Lleva ${formatDuration(fullTaskData.diasTranscurridos)} en progreso`);
      }
    }

    if (fullTaskData.forzado) {
      lines.push(`🔒 Asignación forzada`);
    }

    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '13px',
        lineHeight: '1.6',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  };

  // Agregar línea vertical de "hoy" manualmente después de que el Gantt se renderice
  useEffect(() => {
    if (!ganttWrapperRef.current || !solucion || solucion.length === 0) return;

    const timer = setTimeout(() => {
      // Buscar el contenedor SVG del Gantt
      const svgContainer = ganttWrapperRef.current.querySelector('svg');
      if (!svgContainer) return;

      // Calcular el offset (cuántos días se desplazó todo)
      const minDiaInicio = Math.min(...solucion.map(t => t.diaInicio || 0));
      const offset = minDiaInicio < 0 ? Math.abs(minDiaInicio) : 0;

      if (offset > 0) {
        // Crear línea vertical para marcar "hoy" (que ahora está en la posición offset)
        const columnWidth = 60;
        const todayX = offset * columnWidth;

        // Buscar si ya existe la línea de "hoy"
        const existingLine = svgContainer.querySelector('[data-today-line]');
        if (existingLine) {
          existingLine.remove();
        }

        // Crear nueva línea de "hoy"
        const todayLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const svgHeight = svgContainer.getBoundingClientRect().height;

        todayLine.setAttribute('x1', todayX.toString());
        todayLine.setAttribute('y1', '0');
        todayLine.setAttribute('x2', todayX.toString());
        todayLine.setAttribute('y2', svgHeight.toString());
        todayLine.setAttribute('stroke', 'rgba(251, 191, 36, 0.6)');
        todayLine.setAttribute('stroke-width', '2');
        todayLine.setAttribute('stroke-dasharray', '5,5');
        todayLine.setAttribute('data-today-line', 'true');
        todayLine.setAttribute('pointer-events', 'none');

        svgContainer.appendChild(todayLine);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [solucion, viewMode]);

  // Agregar overlays de riesgo visuales a las barras del Gantt
  useEffect(() => {
    if (!ganttWrapperRef.current) return;

    // Esperar un tick para que el SVG se renderice
    const timer = setTimeout(() => {
      // Buscar el SVG que contiene las barras de tareas (tiene muchos rects)
      const allSvgs = ganttWrapperRef.current?.querySelectorAll('svg') || [];
      const svgContainer = Array.from(allSvgs).find(svg => {
        const rectCount = svg.querySelectorAll('rect').length;
        return rectCount > 10; // El SVG con barras de tareas tiene muchos rects
      });

      if (!svgContainer) {
        console.log('No se encontró el SVG con barras de tareas');
        return;
      }

      // Obtener todas las barras de tareas (filtrar por tamaño para evitar grid lines)
      const allBars = Array.from(svgContainer.querySelectorAll('rect')).filter(rect => {
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');
        const fill = rect.getAttribute('fill') || '';
        // Filtrar barras de tareas (tienen ancho > 20, altura específica, y fill color)
        return width > 20 && height >= 30 && height <= 60 && fill && fill !== 'transparent' && !fill.includes('url');
      });

      // Obtener solo las tareas (no proyectos)
      const taskList = tasks.filter(t => t.type === 'task' && t.tiempoRiesgo > 0);

      // Log para debugging
      console.log('Tasks with risk:', taskList.length, 'Bars found:', allBars.length);

      // Mapear barras a tareas con riesgo
      allBars.forEach((bar, barIndex) => {
        // Buscar tarea correspondiente - puede no ser 1:1 si hay proyectos colapsados
        const task = taskList.find((t, taskIndex) => {
          // Intentar match por posición o por otros criterios
          return taskIndex === barIndex || bar.getAttribute('data-task-id') === t.id;
        });

        if (!task || !task.tiempoRiesgo || task.tiempoRiesgo <= 0) return;

        const proporcionRiesgo = task.proporcionRiesgo / 100; // Convertir a decimal

        // Obtener dimensiones de la barra
        const barWidth = parseFloat(bar.getAttribute('width') || '0');
        const barX = parseFloat(bar.getAttribute('x') || '0');
        const barY = parseFloat(bar.getAttribute('y') || '0');
        const barHeight = parseFloat(bar.getAttribute('height') || '0');
        const barRx = parseFloat(bar.getAttribute('rx') || '0');

        // Calcular ancho del overlay de riesgo
        const riskWidth = barWidth * proporcionRiesgo;
        const riskX = barX + barWidth - riskWidth;

        // Verificar si ya existe un overlay
        const existingOverlay = bar.parentElement?.querySelector(`[data-risk-overlay="${task.id}"]`);
        if (existingOverlay) {
          existingOverlay.remove();
        }

        // Crear overlay de riesgo con patrón diagonal
        const riskOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        riskOverlay.setAttribute('x', riskX.toString());
        riskOverlay.setAttribute('y', barY.toString());
        riskOverlay.setAttribute('width', riskWidth.toString());
        riskOverlay.setAttribute('height', barHeight.toString());
        riskOverlay.setAttribute('rx', barRx.toString());
        riskOverlay.setAttribute('fill', 'url(#risk-pattern)');
        riskOverlay.setAttribute('data-risk-overlay', task.id || task.name);
        riskOverlay.setAttribute('pointer-events', 'none');
        riskOverlay.style.opacity = '0.7';

        // Insertar el overlay después de la barra
        bar.parentElement?.insertBefore(riskOverlay, bar.nextSibling);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [tasks]);

  // Agregar event listeners para hover en las barras del Gantt
  useEffect(() => {
    if (!ganttWrapperRef.current) return;

    let hideTimeout;
    let lastHoveredTask = null;

    const handleMouseMove = (e) => {
      clearTimeout(hideTimeout);

      // Verificar si estamos sobre un rect del SVG
      if (e.target.tagName === 'rect' || e.target.tagName === 'g') {
        // Buscar todos los rect de barras de tareas
        const svgContainer = ganttWrapperRef.current.querySelector('svg');
        if (!svgContainer) return;

        // Obtener todos los elementos rect que podrían ser barras
        const allBars = Array.from(svgContainer.querySelectorAll('rect')).filter(rect => {
          const width = parseFloat(rect.getAttribute('width') || '0');
          const height = parseFloat(rect.getAttribute('height') || '0');
          // Filtrar solo barras (no grid lines ni otros elementos pequeños)
          return width > 20 && height > 20;
        });

        // Encontrar el rect más cercano al cursor
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        for (const bar of allBars) {
          const bbox = bar.getBoundingClientRect();

          // Verificar si el mouse está dentro del rect
          if (mouseX >= bbox.left && mouseX <= bbox.right &&
              mouseY >= bbox.top && mouseY <= bbox.bottom) {

            // Encontrar el índice del bar en la lista
            const barIndex = allBars.indexOf(bar);

            // Mapear el índice a una tarea
            // Filtrar solo tareas (no proyectos/grupos)
            const taskList = tasks.filter(t => t.type === 'task');

            if (barIndex >= 0 && barIndex < taskList.length) {
              const task = taskList[barIndex];

              // Solo actualizar si cambió la tarea
              if (lastHoveredTask !== task.id) {
                lastHoveredTask = task.id;
                setHoveredTask(task);
                setTooltipPosition({ x: mouseX, y: mouseY });
              }
              return;
            }
          }
        }
      }

      // Si no estamos sobre una barra, ocultar el tooltip
      hideTimeout = setTimeout(() => {
        lastHoveredTask = null;
        setHoveredTask(null);
      }, 100);
    };

    const handleMouseLeave = () => {
      hideTimeout = setTimeout(() => {
        lastHoveredTask = null;
        setHoveredTask(null);
      }, 100);
    };

    const wrapper = ganttWrapperRef.current;
    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(hideTimeout);
      wrapper.removeEventListener('mousemove', handleMouseMove);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [tasks]);

  // Manejar click en tarea
  const handleTaskClick = (task) => {
    // Solo abrir sidebar para tareas, no para grupos de usuario
    if (task.type === 'task' && onTaskClick) {
      onTaskClick(task);
    }
  };

  // Componente personalizado para la cabecera de la tabla (solo nombre)
  const TaskListHeaderDefault = () => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '50px',
        padding: '0 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '2px solid var(--border-medium)',
        fontWeight: 600,
        fontSize: '14px',
        color: 'var(--text-primary)'
      }}>
        Nombre
      </div>
    );
  };

  // Componente personalizado para cada fila de la tabla (solo nombre)
  const TaskListTableDefault = ({ rowHeight, rowWidth, tasks, locale, onExpanderClick }) => {
    return (
      <div style={{ width: rowWidth }}>
        {tasks.map((task, index) => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: `${rowHeight}px`,
              padding: '0 12px',
              backgroundColor: task.type === 'project' ? 'var(--bg-secondary)' : 'white',
              borderBottom: '1px solid var(--border-light)',
              fontWeight: task.type === 'project' ? 600 : 400,
              fontSize: '13px',
              color: 'var(--text-primary)',
              cursor: task.type === 'project' ? 'pointer' : 'default',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            onClick={() => {
              if (task.type === 'project' && onExpanderClick) {
                onExpanderClick(task);
              }
            }}
          >
            {task.type === 'project' && (
              <span style={{ marginRight: '8px' }}>
                {task.hideChildren ? '▶' : '▼'}
              </span>
            )}
            {task.name}
          </div>
        ))}
      </div>
    );
  };

  if (!solucion || solucion.length === 0) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p>No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="modern-gantt-container">
      {/* SVG Pattern Definitions para mostrar tiempo de riesgo */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="risk-pattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="4" />
          </pattern>
          <pattern id="risk-pattern-progress" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(220, 38, 38, 0.5)" strokeWidth="4" />
          </pattern>
        </defs>
      </svg>

      {/* Header con información */}
      <div className="gantt-header-info">
        <div>
          <h3 className="heading-3 text-primary">Planificación Optimizada</h3>
          <p className="text-sm text-secondary">
            Duración total: <strong>{formatDuration(makespan)}</strong> • {solucion.length} tarea{solucion.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-base">
          {/* Toggle de vista */}
          <div className="flex gap-xs">
            <button
              className={`btn btn-sm ${viewMode === 'user' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('user')}
            >
              <Icon name="users" size={16} />
              Por Usuario
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'flat' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('flat')}
            >
              <Icon name="list" size={16} />
              Todas
            </button>
          </div>

          {/* Leyenda */}
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
      <div className="gantt-chart-wrapper" ref={ganttWrapperRef}>
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Day}
          locale="es"
          listCellWidth="200px"
          columnWidth={60}
          rowHeight={50}
          barCornerRadius={4}
          todayColor="transparent"
          onClick={handleTaskClick}
          onDoubleClick={(task) => {}}
          onSelect={(task, isSelected) => {}}
          onExpanderClick={(task) => {}}
          fontSize="13px"
          fontFamily="inherit"
          TaskListHeader={TaskListHeaderDefault}
          TaskListTable={TaskListTableDefault}
          barProgressColor="#10B981"
          barBackgroundColor="#015E7C"
          TooltipContent={() => null}
        />

        {/* Tooltip personalizado */}
        {hoveredTask && (
          <div
            className="gantt-custom-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x + 15}px`,
              top: `${tooltipPosition.y + 15}px`,
              zIndex: 10000,
              pointerEvents: 'none'
            }}
          >
            {handleTooltipContent(hoveredTask)}
          </div>
        )}
      </div>

      {/* Info adicional */}
      <div className="gantt-footer-info">
        <div className="flex items-center gap-base text-xs">
          <div className="flex items-center gap-xs">
            <div className="legend-indicator" style={{ background: '#059669', border: '2px solid #059669' }} />
            <span className="text-secondary">En progreso</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="legend-indicator" style={{ background: '#10B981' }} />
            <span className="text-secondary">Pendiente</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="legend-indicator" style={{ background: 'linear-gradient(to right, #015E7C 70%, rgba(239, 68, 68, 0.3) 70%)', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
            <span className="text-secondary">Tiempo de riesgo (parte derecha más clara)</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-secondary">💡 Haz clic en una tarea para ver detalles</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
