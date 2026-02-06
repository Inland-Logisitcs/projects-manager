import { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import '../../styles/ProfessionalGanttChart.css';

/**
 * Gantt Chart profesional usando DHTMLX Gantt (GPL Edition)
 */
const ProfessionalGanttChart = ({ solucion, makespan, proyectos, onTaskClick }) => {
  const ganttContainer = useRef(null);

  useEffect(() => {
    if (!ganttContainer.current || !solucion || solucion.length === 0) return;

    // Configuración inicial
    gantt.config.date_format = '%Y-%m-%d %H:%i';
    gantt.config.scale_unit = 'day';
    gantt.config.step = 1;
    gantt.config.duration_unit = 'day';
    gantt.config.work_time = true;
    gantt.config.correct_work_time = false;

    // Configurar formato de fecha personalizado para mostrar "Día X"
    const minDia = solucion && solucion.length > 0
      ? Math.min(...solucion.map(t => t.diaInicio || 0))
      : 0;
    const offset = minDia < 0 ? Math.abs(minDia) : 0;

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    if (minDia < 0) {
      baseDate.setDate(baseDate.getDate() + Math.floor(minDia));
    }

    gantt.templates.scale_cell_class = (date) => {
      const daysDiff = Math.round((date - baseDate) / (1000 * 60 * 60 * 24));
      return daysDiff === Math.round(offset) ? 'today' : '';
    };

    gantt.templates.date_scale = (date) => {
      const daysDiff = Math.round((date - baseDate) / (1000 * 60 * 60 * 24));
      const diaRelativo = daysDiff - Math.round(offset);
      return `Día ${diaRelativo}`;
    };

    // Mostrar el grid de la izquierda
    gantt.config.show_grid = true;
    gantt.config.grid_width = 350;

    // Configurar columnas del grid
    gantt.config.columns = [
      {
        name: 'text',
        label: 'Tarea',
        width: 200,
        tree: true
      },
      {
        name: 'usuario',
        label: 'Usuario',
        width: 100,
        align: 'center'
      },
      {
        name: 'duration',
        label: 'Duración',
        width: 50,
        align: 'center',
        template: (task) => task.duration ? `${task.duration.toFixed(1)}d` : ''
      }
    ];

    // Configurar tooltips
    gantt.templates.tooltip_text = (start, end, task) => {
      if (task.type === 'project') {
        return `<b>${task.text}</b><br/><i>Grupo de usuario</i>`;
      }

      let html = `<b style="font-size: 14px;">${task.text}</b><br/>`;
      html += `<div style="margin-top: 8px;">`;
      html += `<b>👤 Usuario:</b> ${task.usuario}<br/>`;
      html += `<b>📁 Proyecto:</b> ${task.proyectoNombre || 'Sin proyecto'}<br/>`;

      if (task.storyPoints) {
        html += `<b>⚡ Story Points:</b> ${task.storyPoints} SP<br/>`;
      }

      html += `</div>`;

      // Desglose de duración con riesgo
      html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-light);">`;
      html += `<b>🕐 Duración:</b><br/>`;

      const duracionBase = task.duracionBase || task.duration;
      const tiempoRiesgo = task.tiempoRiesgo || 0;
      const duracionAntesCeil = task.duracionAntesCeil || (duracionBase + tiempoRiesgo);
      const tiempoRedondeo = Math.max(0, task.duration - duracionAntesCeil);

      if (tiempoRiesgo > 0 || tiempoRedondeo > 0) {
        // Mostrar desglose completo
        html += `<div style="margin-left: 10px; font-size: 12px;">`;
        html += `${duracionBase.toFixed(1)}d (base)`;

        if (tiempoRiesgo > 0) {
          html += ` + <span style="color: #ef4444;">${tiempoRiesgo.toFixed(1)}d riesgo</span>`;
        }

        if (tiempoRedondeo > 0) {
          html += ` + <span style="color: #f59e0b;">${tiempoRedondeo.toFixed(1)}d redondeo</span>`;
        }

        html += ` = <b>${task.duration.toFixed(1)}d</b>`;
        html += `</div>`;

        // Desglose de riesgos por tipo
        if (tiempoRiesgo > 0 && (task.tiempoRiesgoUsuario > 0 || task.tiempoRiesgoProyecto > 0)) {
          html += `<div style="margin-left: 20px; font-size: 11px; color: #6b7280; margin-top: 4px;">`;
          html += `(`;
          if (task.tiempoRiesgoUsuario > 0) {
            html += `<span style="color: #8b5cf6;">${task.tiempoRiesgoUsuario.toFixed(1)}d usuario</span>`;
          }
          if (task.tiempoRiesgoUsuario > 0 && task.tiempoRiesgoProyecto > 0) {
            html += ` + `;
          }
          if (task.tiempoRiesgoProyecto > 0) {
            html += `<span style="color: #06b6d4;">${task.tiempoRiesgoProyecto.toFixed(1)}d proyecto</span>`;
          }
          html += `)`;
          html += `</div>`;
        }
      } else {
        // Sin riesgo
        html += `<div style="margin-left: 10px;">`;
        html += `<b>${task.duration.toFixed(1)}d</b>`;
        html += `</div>`;
      }

      html += `</div>`;

      // Badges
      if (task.enProgreso || task.forzado) {
        html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-light);">`;
        if (task.enProgreso) {
          html += `<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">⚡ EN PROGRESO</span> `;
        }
        if (task.forzado) {
          html += `<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">📌 FORZADO</span>`;
        }
        html += `</div>`;
      }

      return html;
    };

    // Personalizar el texto de las barras
    gantt.templates.task_text = (start, end, task) => {
      if (task.type === 'project') return task.text;
      return `${task.text} (${task.storyPoints || 0} SP)`;
    };

    // Configurar clases CSS para las barras
    gantt.templates.task_class = (start, end, task) => {
      let classes = [];

      if (task.enProgreso) {
        classes.push('task-in-progress');
      }

      if (task.tiempoRiesgo && task.tiempoRiesgo > 0) {
        classes.push('task-with-risk');
      }

      return classes.join(' ');
    };

    // Agregar HTML personalizado dentro de las barras después de renderizar
    gantt.attachEvent('onGanttRender', () => {
      const taskElements = ganttContainer.current.querySelectorAll('.gantt_task_line');

      taskElements.forEach(elem => {
        // Evitar agregar overlays duplicados
        if (elem.querySelector('.gantt-risk-overlay') || elem.querySelector('.gantt-rounding-overlay')) {
          return;
        }

        const taskId = elem.getAttribute('task_id');
        if (!taskId) return;

        const task = gantt.getTask(taskId);
        if (!task || task.type === 'project') return;

        // Calcular proporciones
        const duracionBase = task.duracionBase || task.duration;
        const tiempoRiesgo = task.tiempoRiesgo || 0;
        const duracionAntesCeil = task.duracionAntesCeil || (duracionBase + tiempoRiesgo);
        const tiempoRedondeo = Math.max(0, task.duration - duracionAntesCeil);

        const proporcionRiesgo = tiempoRiesgo > 0 ? (tiempoRiesgo / task.duration) : 0;
        const proporcionRedondeo = tiempoRedondeo > 0 ? (tiempoRedondeo / task.duration) : 0;

        // Crear overlay de riesgo (diagonal roja)
        if (proporcionRiesgo > 0) {
          const riskOverlay = document.createElement('div');
          riskOverlay.className = 'gantt-risk-overlay';
          riskOverlay.style.width = `${(proporcionRiesgo * 100).toFixed(1)}%`;
          riskOverlay.style.right = `${(proporcionRedondeo * 100).toFixed(1)}%`;
          elem.appendChild(riskOverlay);
        }

        // Crear overlay de redondeo (diagonal naranja)
        if (proporcionRedondeo > 0) {
          const roundingOverlay = document.createElement('div');
          roundingOverlay.className = 'gantt-rounding-overlay';
          roundingOverlay.style.width = `${(proporcionRedondeo * 100).toFixed(1)}%`;
          elem.appendChild(roundingOverlay);
        }
      });
    });

    // Inicializar el Gantt
    gantt.init(ganttContainer.current);

    // Transformar datos al formato de DHTMLX
    const transformData = () => {
      const tasks = { data: [], links: [] };

      // Encontrar el día mínimo para calcular fechas
      const minDia = Math.min(...solucion.map(t => t.diaInicio || 0));
      const baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);

      // Si hay días negativos, ajustar la fecha base
      if (minDia < 0) {
        baseDate.setDate(baseDate.getDate() + Math.floor(minDia));
      }

      // Agrupar tareas por usuario
      const tasksByUser = {};
      solucion.forEach(task => {
        if (!tasksByUser[task.usuario]) {
          tasksByUser[task.usuario] = [];
        }
        tasksByUser[task.usuario].push(task);
      });

      let taskId = 1;
      const taskIdMap = {}; // Mapear IDs originales a IDs de Gantt

      // Crear grupos por usuario
      Object.entries(tasksByUser).forEach(([usuario, userTasks]) => {
        const userId = `user_${taskId++}`;

        // Agregar grupo de usuario
        tasks.data.push({
          id: userId,
          text: `👤 ${usuario}`,
          type: 'project',
          open: true,
          usuario: usuario
        });

        // Agregar tareas del usuario
        userTasks
          .sort((a, b) => a.diaInicio - b.diaInicio)
          .forEach(task => {
            const ganttTaskId = `task_${taskId++}`;
            taskIdMap[task.id] = ganttTaskId;

            // Calcular fechas
            const startDate = new Date(baseDate);
            startDate.setDate(startDate.getDate() + Math.floor(task.diaInicio));

            const endDate = new Date(baseDate);
            endDate.setDate(endDate.getDate() + Math.ceil(task.diaFin));

            // Encontrar color del proyecto
            const proyecto = proyectos.find(p => p.id === task.proyectoId);
            const color = proyecto?.color || '#6B7280';

            tasks.data.push({
              id: ganttTaskId,
              text: task.nombre,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              duration: task.duracion || 1,
              parent: userId,
              usuario: usuario,
              proyectoNombre: task.proyectoNombre,
              storyPoints: task.storyPoints,
              duracionBase: task.duracionBase,
              tiempoRiesgo: task.tiempoRiesgo || 0,
              tiempoRiesgoUsuario: task.tiempoRiesgoUsuario || 0,
              tiempoRiesgoProyecto: task.tiempoRiesgoProyecto || 0,
              enProgreso: task.enProgreso || false,
              color: color,
              progressColor: color,
              originalId: task.id
            });
          });
      });

      // Agregar dependencias
      let linkId = 1;
      solucion.forEach(task => {
        if (task.dependencias && task.dependencias.length > 0) {
          task.dependencias.forEach(depId => {
            const sourceId = taskIdMap[depId];
            const targetId = taskIdMap[task.id];

            if (sourceId && targetId) {
              tasks.links.push({
                id: linkId++,
                source: sourceId,
                target: targetId,
                type: '0' // finish-to-start
              });
            }
          });
        }
      });

      return tasks;
    };

    const data = transformData();
    gantt.parse(data);

    // Ajustar zoom para mostrar todo el timeline
    gantt.config.start_date = gantt.getState().min_date;
    gantt.config.end_date = gantt.getState().max_date;

    // Event handler para clic en tareas
    const onTaskClickHandler = (id, e) => {
      const task = gantt.getTask(id);
      if (task.type !== 'project' && onTaskClick) {
        onTaskClick({ taskId: task.originalId });
      }
      return true;
    };

    gantt.attachEvent('onTaskClick', onTaskClickHandler);

    // Cleanup
    return () => {
      gantt.clearAll();
    };
  }, [solucion, proyectos, makespan, onTaskClick]);

  return (
    <div className="professional-gantt-container">
      <div className="gantt-header flex justify-between items-center mb-base p-base">
        <div>
          <h3 className="heading-3 text-primary">Planificación Optimizada</h3>
          <p className="text-sm text-secondary">
            Duración total: <strong>{makespan.toFixed(1)} días</strong> • {solucion.length} tareas
          </p>
        </div>

        <div className="gantt-legend flex items-center gap-base text-xs">
          <div className="flex items-center gap-xs">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-secondary">En progreso</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6B7280' }} />
            <span className="text-secondary">Pendiente</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-secondary">🔗 Líneas = Dependencias</span>
          </div>
        </div>
      </div>

      <div
        ref={ganttContainer}
        className="gantt-chart"
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
};

export default ProfessionalGanttChart;
