import React, { useMemo, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { createTask, addTaskDependency, removeTaskDependency } from '../../services/taskService';
import { addProjectDependency, removeProjectDependency } from '../../services/projectService';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import Toast from '../common/Toast';
import '../../styles/GanttTimeline.css';

const GanttTimeline = ({ projects, tasks = [], onUpdate }) => {
  // Inicializar viewMode desde localStorage o usar Day por defecto
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem('gantt-view-mode');
    return savedViewMode || ViewMode.Day;
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [projectToRemove, setProjectToRemove] = useState(null);
  const [creatingTaskForProject, setCreatingTaskForProject] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [selectedTaskForDependency, setSelectedTaskForDependency] = useState(null);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [toast, setToast] = useState(null);
  // Inicializar proyectos expandidos por defecto
  const [expandedProjects, setExpandedProjects] = useState(() => {
    const expanded = {};
    projects.forEach(p => {
      if (p.startDate && p.endDate) {
        expanded[p.id] = true;
      }
    });
    return expanded;
  });
  const dragCounterRef = React.useRef(0);

  // Detectar hover sobre barras del Gantt para mostrar círculo de conexión
  React.useEffect(() => {
    let currentCircle = null;
    let currentBar = null;
    let hideTimeout = null;
    let isDraggingLine = false;
    let dragLine = null;
    let dragStartTask = null;
    let currentMousePosition = { x: 0, y: 0 };

    const handleMouseMove = (e) => {
      // Guardar posición actual del mouse
      currentMousePosition.x = e.clientX;
      currentMousePosition.y = e.clientY;

      // Si estamos arrastrando una línea, actualizarla
      if (isDraggingLine && dragLine && dragStartTask) {
        const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
        const containerRect = ganttContainer.getBoundingClientRect();

        // Actualizar la posición de inicio basándonos en la posición actual de la tarea
        const startBarRect = dragStartTask.getBoundingClientRect();
        const newStartX = startBarRect.right - containerRect.left + ganttContainer.scrollLeft + 4 + 8;
        const newStartY = startBarRect.top - containerRect.top + ganttContainer.scrollTop + startBarRect.height / 2;

        // Calcular posición del mouse relativa al contenedor
        const mouseX = e.clientX - containerRect.left + ganttContainer.scrollLeft;
        const mouseY = e.clientY - containerRect.top + ganttContainer.scrollTop;

        dragLine.line.setAttribute('x1', newStartX);
        dragLine.line.setAttribute('y1', newStartY);
        dragLine.line.setAttribute('x2', mouseX);
        dragLine.line.setAttribute('y2', mouseY);

        return;
      }

      // Si ya hay un círculo y el mouse está sobre él o cerca, no hacer nada
      if (currentCircle) {
        const circleRect = currentCircle.getBoundingClientRect();
        // Aumentar el área de detección a 20px alrededor del círculo
        const isOverCircle = e.clientX >= circleRect.left - 20 &&
                            e.clientX <= circleRect.right + 20 &&
                            e.clientY >= circleRect.top - 20 &&
                            e.clientY <= circleRect.bottom + 20;
        if (isOverCircle) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }
          return;
        }
      }

      // Buscar elemento de barra (g con clase barWrapper)
      let barElement = e.target.closest('g.barWrapper');

      // Si no encontramos con barWrapper, buscar por estructura SVG
      if (!barElement) {
        const svgRect = e.target.closest('rect');
        if (svgRect) {
          const parent = svgRect.parentElement;
          if (parent && parent.tagName === 'g') {
            // Verificar que sea una barra de tarea (no proyecto)
            // Las tareas tienen un height menor (taskHeight=28)
            const rectHeight = parseFloat(svgRect.getAttribute('height') || 0);
            if (rectHeight <= 30) {
              barElement = parent;
            }
          }
        }
      }

      // Si encontramos una nueva barra diferente
      if (barElement && barElement !== currentBar) {
        // Limpiar círculo anterior
        if (currentCircle) {
          currentCircle.remove();
          currentCircle = null;
        }

        // Limpiar tooltips huérfanos al cambiar de barra
        document.querySelectorAll('.gantt-connection-tooltip').forEach(t => {
          t.style.opacity = '0';
          setTimeout(() => t.remove(), 200);
        });

        currentBar = barElement;

        // Obtener el bounding box de la barra
        const barRect = barElement.getBoundingClientRect();

        // Crear círculo de conexión
        const circle = document.createElement('div');
        circle.className = 'gantt-connection-circle';
        circle.setAttribute('title', 'Vincular tareas');

        // Crear tooltip personalizado
        const tooltip = document.createElement('div');
        tooltip.className = 'gantt-connection-tooltip';
        tooltip.textContent = 'Vincular tareas';
        tooltip.style.cssText = `
          position: fixed;
          background-color: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          pointer-events: none;
          z-index: 10001;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease;
        `;

        const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
        const containerRect = ganttContainer.getBoundingClientRect();

        const updateCirclePosition = () => {
          const rect = barElement.getBoundingClientRect();
          const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
          const containerRect = ganttContainer.getBoundingClientRect();

          // Calcular posición relativa al contenedor + scroll
          const relativeLeft = rect.right - containerRect.left + ganttContainer.scrollLeft + 4;
          const relativeTop = rect.top - containerRect.top + ganttContainer.scrollTop + rect.height / 2;

          circle.style.left = `${relativeLeft}px`;
          circle.style.top = `${relativeTop}px`;
        };

        const updateTooltipPosition = () => {
          const circleRect = circle.getBoundingClientRect();
          tooltip.style.left = `${circleRect.right + 8}px`;
          tooltip.style.top = `${circleRect.top + circleRect.height / 2}px`;
          tooltip.style.transform = 'translateY(-50%)';
        };

        // Calcular posición inicial relativa al contenedor + scroll
        const initialLeft = barRect.right - containerRect.left + ganttContainer.scrollLeft + 4;
        const initialTop = barRect.top - containerRect.top + ganttContainer.scrollTop + barRect.height / 2;

        circle.style.cssText = `
          position: absolute;
          left: ${initialLeft}px;
          top: ${initialTop}px;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          background-color: #0099CC;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10000;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease, background-color 0.2s ease;
          pointer-events: auto;
        `;

        // Hover sobre el círculo
        circle.addEventListener('mouseenter', () => {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }
          circle.style.transform = 'translateY(-50%) scale(1.3)';
          circle.style.backgroundColor = '#015E7C';

          // Mostrar tooltip
          document.body.appendChild(tooltip);
          updateTooltipPosition();
          setTimeout(() => {
            tooltip.style.opacity = '1';
          }, 10);
        });

        circle.addEventListener('mouseleave', () => {
          // No ocultar si estamos arrastrando
          if (isDraggingLine) {
            return;
          }

          circle.style.transform = 'translateY(-50%) scale(1)';
          circle.style.backgroundColor = '#0099CC';

          // Ocultar tooltip
          tooltip.style.opacity = '0';
          setTimeout(() => {
            if (tooltip.parentNode) {
              tooltip.remove();
            }
          }, 200);

          // Programar ocultación con más tiempo
          hideTimeout = setTimeout(() => {
            if (currentCircle === circle) {
              circle.remove();
              currentCircle = null;
              currentBar = null;
              if (tooltip.parentNode) {
                tooltip.remove();
              }
            }
          }, 500);
        });

        // Mouse down handler - iniciar arrastre de línea
        circle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          e.preventDefault();

          isDraggingLine = true;

          // Buscar el elemento que tiene el data-task-id
          // Puede ser barElement mismo o un hijo/hermano
          let taskElement = barElement;
          if (!taskElement.hasAttribute('data-task-id')) {
            // Buscar en los hijos
            const childWithId = barElement.querySelector('[data-task-id]');
            if (childWithId) {
              taskElement = childWithId;
            } else {
              // Buscar en el padre
              const parentWithId = barElement.closest('[data-task-id]');
              if (parentWithId) {
                taskElement = parentWithId;
              }
            }
          }

          dragStartTask = taskElement;

          // Obtener el contenedor del Gantt para posicionar el SVG relativo a él
          const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
          const containerRect = ganttContainer.getBoundingClientRect();

          // Crear SVG para la línea - posicionado sobre el contenedor del Gantt
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: visible;
          `;
          svg.classList.add('gantt-connection-line-svg');

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          const circleRect = circle.getBoundingClientRect();
          // Calcular posiciones relativas al contenedor del Gantt
          const startX = circleRect.left - containerRect.left + ganttContainer.scrollLeft + circleRect.width / 2;
          const startY = circleRect.top - containerRect.top + ganttContainer.scrollTop + circleRect.height / 2;

          line.setAttribute('x1', startX);
          line.setAttribute('y1', startY);
          line.setAttribute('x2', startX);
          line.setAttribute('y2', startY);
          line.setAttribute('stroke', '#0099CC');
          line.setAttribute('stroke-width', '3');
          line.setAttribute('stroke-dasharray', '5,5');
          line.setAttribute('opacity', '0.8');

          svg.appendChild(line);
          ganttContainer.appendChild(svg);
          dragLine = { svg, line, startX, startY };
        });

        ganttContainer.appendChild(circle);
        currentCircle = circle;

        // Verificar visibilidad inicial
        updateCirclePosition();

        // Actualizar posición si hay scroll
        ganttContainer.addEventListener('scroll', updateCirclePosition);

      } else if (!barElement && currentBar) {
        // El mouse salió de la barra
        const isOverCircle = currentCircle &&
                            e.clientX >= currentCircle.getBoundingClientRect().left - 20 &&
                            e.clientX <= currentCircle.getBoundingClientRect().right + 20 &&
                            e.clientY >= currentCircle.getBoundingClientRect().top - 20 &&
                            e.clientY <= currentCircle.getBoundingClientRect().bottom + 20;

        // También verificar si está en el área entre la barra y el círculo
        const barRect = currentBar.getBoundingClientRect();
        const isInBetween = e.clientX >= barRect.right &&
                           e.clientX <= barRect.right + 24 &&
                           e.clientY >= barRect.top &&
                           e.clientY <= barRect.bottom;

        if (!isOverCircle && !isInBetween) {
          hideTimeout = setTimeout(() => {
            if (currentCircle) {
              currentCircle.remove();
              currentCircle = null;
              currentBar = null;
            }
            // Limpiar tooltips huérfanos
            document.querySelectorAll('.gantt-connection-tooltip').forEach(t => {
              t.style.opacity = '0';
              setTimeout(() => t.remove(), 200);
            });
          }, 300);
        }
      }
    };

    // Handler para scroll - mantener la línea actualizada cuando se hace scroll
    const handleScroll = () => {
      if (isDraggingLine && dragLine && dragStartTask) {
        const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
        const containerRect = ganttContainer.getBoundingClientRect();

        // Actualizar la posición de inicio basándonos en la posición actual de la tarea
        const startBarRect = dragStartTask.getBoundingClientRect();
        const newStartX = startBarRect.right - containerRect.left + ganttContainer.scrollLeft + 4 + 8;
        const newStartY = startBarRect.top - containerRect.top + ganttContainer.scrollTop + startBarRect.height / 2;

        // Calcular posición del mouse relativa al contenedor
        const mouseX = currentMousePosition.x - containerRect.left + ganttContainer.scrollLeft;
        const mouseY = currentMousePosition.y - containerRect.top + ganttContainer.scrollTop;

        dragLine.line.setAttribute('x1', newStartX);
        dragLine.line.setAttribute('y1', newStartY);
        dragLine.line.setAttribute('x2', mouseX);
        dragLine.line.setAttribute('y2', mouseY);
      }
    };

    // Handler para soltar el mouse
    const handleMouseUp = async (e) => {
      if (isDraggingLine && dragLine) {
        // Buscar si soltamos sobre una barra
        let targetBar = null;
        const svgRect = e.target.closest('rect');
        if (svgRect) {
          const parent = svgRect.parentElement;
          if (parent && parent.tagName === 'g') {
            const rectHeight = parseFloat(svgRect.getAttribute('height') || 0);
            if (rectHeight <= 30) {
              targetBar = parent;
            }
          }
        }

        // Si encontramos una barra de destino diferente a la de origen
        if (targetBar && targetBar !== dragStartTask) {
          // Extraer los IDs de las tareas desde los atributos data-task-id
          const sourceTaskId = dragStartTask.getAttribute('data-task-id');
          const targetTaskId = targetBar.getAttribute('data-task-id');

          // Verificar si son tareas o proyectos
          // Si tienen data-task-id, son tareas. Si no, son proyectos.
          const isSourceTask = sourceTaskId !== null;
          const isTargetTask = targetTaskId !== null;

          // Solo permitir dependencias si ambos son del mismo tipo
          if (isSourceTask !== isTargetTask) {
            setToast({
              message: 'No se puede crear dependencia entre proyecto y tarea',
              type: 'error'
            });

            // Limpiar la línea
            if (dragLine.svg.parentNode) {
              dragLine.svg.remove();
            }
            dragLine = null;
            isDraggingLine = false;
            dragStartTask = null;

            // Limpiar círculo y tooltip
            if (currentCircle) {
              currentCircle.remove();
              currentCircle = null;
              currentBar = null;
            }
            document.querySelectorAll('.gantt-connection-tooltip').forEach(t => t.remove());
            return;
          }

          // Para tareas, usar sourceTaskId y targetTaskId
          // Para proyectos, necesitamos extraer el ID del proyecto desde el nombre de la barra
          let result;

          if (isSourceTask && isTargetTask) {
            // Ambos son tareas
            result = await addTaskDependency(targetTaskId, sourceTaskId);
          } else {
            // Ambos son proyectos - necesitamos obtener los IDs desde los nombres
            // Buscar el texto en el elemento o en sus hijos/hermanos
            let sourceText = dragStartTask.querySelector('text')?.textContent.trim();
            let targetText = targetBar.querySelector('text')?.textContent.trim();

            // Si no se encuentra directamente, buscar en el padre
            if (!sourceText) {
              const sourceParent = dragStartTask.parentElement;
              sourceText = sourceParent?.querySelector('text')?.textContent.trim();
            }

            if (!targetText) {
              const targetParent = targetBar.parentElement;
              targetText = targetParent?.querySelector('text')?.textContent.trim();
            }

            // Buscar los proyectos en ganttTasks por nombre
            const sourceProject = ganttTasks.find(t => t.name === sourceText && t.isProject);
            const targetProject = ganttTasks.find(t => t.name === targetText && t.isProject);

            if (sourceProject && targetProject) {
              const sourceProjectId = sourceProject.id;
              const targetProjectId = targetProject.id;

              result = await addProjectDependency(targetProjectId, sourceProjectId);
            } else {
              setToast({
                message: 'No se pudieron encontrar los proyectos',
                type: 'error'
              });
              result = { success: false };
            }
          }

          if (result && result.success) {
            // Resaltar brevemente ambas barras
            const targetRect = targetBar.querySelector('rect');
            const sourceRect = dragStartTask.querySelector('rect');

            if (targetRect) {
              const originalStroke = targetRect.getAttribute('stroke');
              const originalStrokeWidth = targetRect.getAttribute('stroke-width');
              targetRect.setAttribute('stroke', '#22c55e');
              targetRect.setAttribute('stroke-width', '4');

              setTimeout(() => {
                targetRect.setAttribute('stroke', originalStroke || 'none');
                targetRect.setAttribute('stroke-width', originalStrokeWidth || '0');
              }, 1500);
            }

            if (sourceRect) {
              const originalStroke = sourceRect.getAttribute('stroke');
              const originalStrokeWidth = sourceRect.getAttribute('stroke-width');
              sourceRect.setAttribute('stroke', '#22c55e');
              sourceRect.setAttribute('stroke-width', '4');

              setTimeout(() => {
                sourceRect.setAttribute('stroke', originalStroke || 'none');
                sourceRect.setAttribute('stroke-width', originalStrokeWidth || '0');
              }, 1500);
            }
          } else {
            setToast({
              message: result?.error || 'Error al crear la dependencia',
              type: 'error'
            });
          }
        } else if (targetBar) {
          setToast({
            message: 'No puedes vincular una tarea consigo misma',
            type: 'error'
          });
        }

        // Limpiar la línea
        if (dragLine.svg.parentNode) {
          dragLine.svg.remove();
        }
        dragLine = null;
        isDraggingLine = false;
        dragStartTask = null;

        // Limpiar círculo y tooltip después del arrastre
        if (currentCircle) {
          currentCircle.remove();
          currentCircle = null;
          currentBar = null;
        }

        // Limpiar todos los tooltips que puedan haber quedado
        document.querySelectorAll('.gantt-connection-tooltip').forEach(t => {
          t.style.opacity = '0';
          setTimeout(() => t.remove(), 200);
        });
      }
    };

    // Agregar event listeners
    const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
    if (ganttContainer) {
      ganttContainer.addEventListener('mousemove', handleMouseMove);
      ganttContainer.addEventListener('scroll', handleScroll);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (ganttContainer) {
        ganttContainer.removeEventListener('mousemove', handleMouseMove);
        ganttContainer.removeEventListener('scroll', handleScroll);
      }
      document.removeEventListener('mouseup', handleMouseUp);
      if (currentCircle) {
        currentCircle.remove();
      }
      if (dragLine && dragLine.svg.parentNode) {
        dragLine.svg.remove();
      }
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      // Limpiar todos los tooltips al desmontar
      document.querySelectorAll('.gantt-connection-tooltip').forEach(t => t.remove());
    };
  }, []);

  // Filtrar proyectos con y sin fechas
  // Color según tipo y estado
  const getProjectColor = (project) => {
    // Colores base por tipo
    const typeColors = {
      'ID': {
        base: '#0099CC',        // Azul Sync para ID
        light: '#d4eef5',
        dark: '#007ba3'
      },
      'Functionality': {
        base: '#8b5cf6',        // Morado para Functionality
        light: '#ede9fe',
        dark: '#7c3aed'
      }
    };

    // Obtener colores del tipo
    const colors = typeColors[project.type] || typeColors['ID'];

    // Ajustar opacidad según estado
    if (project.status === 'completed') {
      return colors.dark;
    } else if (project.status === 'on-hold') {
      return '#94A3B8'; // Gris para en pausa
    }

    return colors.base;
  };

  const getTypeColor = (type) => {
    const colors = {
      'ID': '#0099CC',
      'Functionality': '#8b5cf6'
    };
    return colors[type] || '#0099CC';
  };

  const getTypeLabelColor = (type) => {
    const colors = {
      'ID': { bg: '#d4eef5', text: '#014152' },
      'Functionality': { bg: '#ede9fe', text: '#5b21b6' }
    };
    return colors[type] || colors['ID'];
  };

  const { scheduledProjects, unscheduledProjects } = useMemo(() => {
    const scheduled = projects
      .filter(p => p.startDate && p.endDate)
      .sort((a, b) => {
        // Si ambos tienen order, comparar por order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // Si solo uno tiene order, ese va primero
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Si ninguno tiene order, mantener orden original
        return 0;
      });
    const unscheduled = projects.filter(p => !p.startDate || !p.endDate);
    return { scheduledProjects: scheduled, unscheduledProjects: unscheduled };
  }, [projects]);

  // Convertir proyectos y tareas a formato de gantt-task-react con jerarquía
  const ganttTasks = useMemo(() => {
    const result = [];

    scheduledProjects.forEach((project) => {
      // Crear fechas sin problemas de zona horaria
      const [startYear, startMonth, startDay] = project.startDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

      const [endYear, endMonth, endDay] = project.endDate.split('-').map(Number);
      const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

      const projectColor = getProjectColor(project);

      // Obtener tareas del proyecto (TODAS las tareas del proyecto, no solo las que tienen fechas)
      // Ordenar por fecha de creación para que las nuevas aparezcan al final
      const projectTasks = tasks
        .filter(t => t.projectId === project.id && !t.archived)
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateA - dateB;
        });

      // Agregar proyecto como elemento padre
      result.push({
        id: project.id,
        name: project.name,
        start: start,
        end: end,
        progress: project.progress || 0,
        type: 'project', // Tipo proyecto para que sea expandible
        hideChildren: !expandedProjects[project.id], // Control de expansión
        dependencies: project.dependencies || [], // Agregar dependencias del proyecto
        styles: {
          backgroundColor: projectColor,
          backgroundSelectedColor: projectColor,
          progressColor: 'rgba(255, 255, 255, 0.3)',
          progressSelectedColor: 'rgba(255, 255, 255, 0.4)',
        },
        project: project, // Guardar referencia al proyecto original
        isProject: true
      });

      // Agregar tareas hijas
      projectTasks.forEach((task) => {
        // Si la tarea tiene fechas propias, usarlas; si no, usar las del proyecto
        let tStart, tEnd;

        if (task.startDate && task.endDate) {
          const [tStartYear, tStartMonth, tStartDay] = task.startDate.split('-').map(Number);
          tStart = new Date(tStartYear, tStartMonth - 1, tStartDay, 0, 0, 0, 0);

          const [tEndYear, tEndMonth, tEndDay] = task.endDate.split('-').map(Number);
          tEnd = new Date(tEndYear, tEndMonth - 1, tEndDay, 23, 59, 59, 999);
        } else {
          // Usar fechas del proyecto como fallback
          tStart = start;
          tEnd = end;
        }

        // Convertir dependencias a formato de la librería
        const dependencies = (task.dependencies || []).map(depId => `task-${depId}`);

        result.push({
          id: `task-${task.id}`,
          name: task.title,
          start: tStart,
          end: tEnd,
          progress: task.status === 'completed' ? 100 : 0,
          type: 'task',
          project: project.id, // ID del proyecto padre
          dependencies: dependencies, // Array de IDs de tareas de las que depende
          styles: {
            backgroundColor: '#94A3B8',
            backgroundSelectedColor: '#64748b',
            progressColor: 'rgba(255, 255, 255, 0.3)',
            progressSelectedColor: 'rgba(255, 255, 255, 0.4)',
          },
          task: task, // Guardar referencia a la tarea original
          isTask: true
        });
      });
    });

    return result;
  }, [scheduledProjects, tasks, expandedProjects]);

  // Agregar atributo data-task-id a las barras del Gantt después del renderizado
  React.useEffect(() => {
    const addTaskIdsToGanttBars = () => {
      // Esperar a que el Gantt se renderice
      setTimeout(() => {
        const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
        if (!ganttContainer) {
          return;
        }

        // Buscar todos los grupos SVG
        const allGroups = ganttContainer.querySelectorAll('svg g');

        // Buscar TODOS los elementos que tienen un rect con texto (son barras de tareas o proyectos)
        // Filtrar por: debe tener un rect hijo de altura 28-32px (altura de las barras de tareas/proyectos)
        // y debe tener un elemento de texto en el mismo grupo o grupo padre
        const barGroups = Array.from(allGroups).filter(g => {
          const rect = g.querySelector('rect');
          if (!rect) return false;

          const height = parseFloat(rect.getAttribute('height') || 0);
          const width = parseFloat(rect.getAttribute('width') || 0);

          // Altura debe ser entre 28 y 32 (barras de tareas)
          if (height < 28 || height > 32) return false;

          // Ancho debe ser mayor a 0
          if (width <= 0) return false;

          // Debe tener texto en el mismo grupo o en grupos hermanos
          let textElement = g.querySelector('text');
          if (!textElement) {
            // Buscar en el padre
            const parent = g.parentElement;
            if (parent) {
              textElement = parent.querySelector('text');
            }
          }

          return textElement !== null;
        });

        barGroups.forEach((barGroup) => {
          // Buscar el texto dentro del grupo o en hermanos cercanos
          let textElement = barGroup.querySelector('text');

          // Si no hay texto en el grupo, buscar en el padre y hermanos
          if (!textElement && barGroup.parentElement) {
            textElement = barGroup.parentElement.querySelector('text');
          }

          if (!textElement) {
            return;
          }

          const taskName = textElement.textContent.trim();

          // Buscar la tarea correspondiente en ganttTasks
          const ganttTask = ganttTasks.find(t => t.name === taskName);

          if (ganttTask) {
            // Verificar si es una tarea (tiene el prefijo "task-") o un proyecto
            if (ganttTask.isTask || (ganttTask.id && ganttTask.id.startsWith('task-'))) {
              // Extraer el ID real de la tarea (remover el prefijo "task-")
              const taskId = ganttTask.id.replace('task-', '');
              barGroup.setAttribute('data-task-id', taskId);

              // También agregar el ID al rect hijo para que el hover y click lo detecten
              const rect = barGroup.querySelector('rect');
              if (rect) {
                rect.parentElement.setAttribute('data-task-id', taskId);
              }
            }
          }
        });
      }, 1500); // Aumentar a 1.5 segundos para dar más tiempo
    };

    addTaskIdsToGanttBars();
  }, [ganttTasks, expandedProjects]);

  // Detectar hover sobre flechas de dependencia para mostrar botón de eliminar
  React.useEffect(() => {
    let deleteButton = null;
    let currentArrow = null;
    let hideTimeout = null;

    const handleMouseMove = (e) => {
      // No mostrar el botón de eliminar si hay un círculo azul visible
      // (para evitar conflicto con la creación de dependencias)
      const blueCircle = document.querySelector('.gantt-connection-circle');
      if (blueCircle) {
        const circleRect = blueCircle.getBoundingClientRect();
        const distanceToCircle = Math.sqrt(
          Math.pow(e.clientX - (circleRect.left + circleRect.width / 2), 2) +
          Math.pow(e.clientY - (circleRect.top + circleRect.height / 2), 2)
        );

        // Si estamos a menos de 100px del círculo azul, no mostrar el botón de eliminar
        if (distanceToCircle < 100) {
          if (deleteButton && deleteButton.parentNode) {
            deleteButton.remove();
            deleteButton = null;
            currentArrow = null;
          }
          return;
        }
      }

      // Buscar si el mouse está sobre una flecha de dependencia
      // Las flechas están dentro de un grupo g.arrow dentro de g.arrows
      let arrowPath = null;

      if (e.target.tagName === 'path') {
        // Verificar si este path está dentro de un grupo con clase "arrow"
        const arrowGroup = e.target.closest('g.arrow');
        if (arrowGroup) {
          arrowPath = e.target;
        }
      }

      if (!arrowPath) {
        // Si no estamos sobre una flecha y hay un botón visible
        if (deleteButton && currentArrow) {
          // Verificar si el mouse está sobre el botón de eliminar
          const buttonRect = deleteButton.getBoundingClientRect();
          const isOverButton = e.clientX >= buttonRect.left - 10 &&
                              e.clientX <= buttonRect.right + 10 &&
                              e.clientY >= buttonRect.top - 10 &&
                              e.clientY <= buttonRect.bottom + 10;

          if (!isOverButton) {
            // Programar ocultación del botón
            if (!hideTimeout) {
              hideTimeout = setTimeout(() => {
                if (deleteButton && deleteButton.parentNode) {
                  deleteButton.remove();
                }
                deleteButton = null;
                currentArrow = null;
                hideTimeout = null;
              }, 300);
            }
          } else {
            // Cancelar ocultación si el mouse está sobre el botón
            if (hideTimeout) {
              clearTimeout(hideTimeout);
              hideTimeout = null;
            }
          }
        }
        return;
      }

      // Cancelar cualquier timeout de ocultación
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      // Si ya hay un botón en esta flecha, no hacer nada
      if (currentArrow === arrowPath && deleteButton) return;

      // Limpiar botón anterior
      if (deleteButton && deleteButton.parentNode) {
        deleteButton.remove();
      }

      currentArrow = arrowPath;

      // Obtener el contenedor del Gantt para posicionar el botón
      const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
      if (!ganttContainer) return;

      const svgElement = arrowPath.closest('svg');
      if (!svgElement) return;

      const containerRect = ganttContainer.getBoundingClientRect();

      // Posicionar el botón donde está el mouse
      const absoluteX = e.clientX - containerRect.left + ganttContainer.scrollLeft;
      const absoluteY = e.clientY - containerRect.top + ganttContainer.scrollTop;

      // Crear botón de eliminar
      deleteButton = document.createElement('button');
      deleteButton.className = 'gantt-dependency-delete-button';
      deleteButton.innerHTML = '×';
      deleteButton.setAttribute('title', 'Eliminar dependencia');

      deleteButton.style.cssText = `
        position: absolute;
        left: ${absoluteX}px;
        top: ${absoluteY}px;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background-color: #ef4444;
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10000;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        opacity: 0;
        animation: fadeInButton 0.2s ease forwards;
        line-height: 1;
        padding: 0;
      `;

      // Hover effects
      deleteButton.addEventListener('mouseenter', () => {
        deleteButton.style.transform = 'translate(-50%, -50%) scale(1.2)';
        deleteButton.style.backgroundColor = '#dc2626';
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      });

      deleteButton.addEventListener('mouseleave', () => {
        deleteButton.style.transform = 'translate(-50%, -50%) scale(1)';
        deleteButton.style.backgroundColor = '#ef4444';
      });

      // Click handler - extraer IDs de las tareas desde la flecha
      deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();

        // Buscar las tareas conectadas por esta flecha
        // Obtener el grupo g.arrow que contiene este path
        const arrowGroup = arrowPath.closest('g.arrow');

        // Obtener todos los grupos g.arrow para saber el índice
        const allArrowGroups = Array.from(svgElement.querySelectorAll('g.arrow'));
        const arrowIndex = allArrowGroups.indexOf(arrowGroup);

        // Obtener todas las dependencias del ganttTasks en el mismo orden que la librería las renderiza
        const allDependencies = [];
        ganttTasks.forEach(task => {
          if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach(depId => {
              allDependencies.push({
                target: task.id,
                source: depId
              });
            });
          }
        });

        if (arrowIndex >= 0 && arrowIndex < allDependencies.length) {
          const dependency = allDependencies[arrowIndex];

          // Determinar si es una tarea o un proyecto
          const isTask = dependency.target.startsWith('task-');

          let targetId, sourceId;

          if (isTask) {
            targetId = dependency.target.replace('task-', '');
            sourceId = dependency.source.replace('task-', '');
          } else {
            // Es un proyecto
            targetId = dependency.target;
            sourceId = dependency.source;
          }

          // Remover el botón inmediatamente
          if (deleteButton && deleteButton.parentNode) {
            deleteButton.remove();
          }
          deleteButton = null;
          currentArrow = null;

          // Resaltar la flecha en rojo antes de eliminarla
          const pathsInGroup = arrowGroup.querySelectorAll('path');
          pathsInGroup.forEach(p => {
            p.setAttribute('stroke', '#ef4444');
            p.setAttribute('stroke-width', '3');
            p.setAttribute('opacity', '0.8');
          });

          // Llamar al servicio apropiado para eliminar la dependencia
          const result = isTask
            ? await removeTaskDependency(targetId, sourceId)
            : await removeProjectDependency(targetId, sourceId);

          if (!result.success) {
            // Restaurar color original si falló
            pathsInGroup.forEach(p => {
              p.setAttribute('stroke', '#6e6e6e');
              p.setAttribute('stroke-width', '1.5');
              p.setAttribute('opacity', '1');
            });
          }
        }
      });

      ganttContainer.appendChild(deleteButton);

      // Animar entrada
      setTimeout(() => {
        if (deleteButton) {
          deleteButton.style.opacity = '1';
        }
      }, 10);
    };

    const ganttContainer = document.querySelector('.gantt-chart-wrapper-outer');
    if (ganttContainer) {
      ganttContainer.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (ganttContainer) {
        ganttContainer.removeEventListener('mousemove', handleMouseMove);
      }
      if (deleteButton && deleteButton.parentNode) {
        deleteButton.remove();
      }
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [ganttTasks]);

  // Handler para cambio de fechas
  const handleTaskChange = async (task) => {
    const project = scheduledProjects.find(p => p.id === task.id);
    if (!project) return;

    // Formatear las fechas correctamente evitando problemas de zona horaria
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    await onUpdate(project.id, {
      startDate: formatDate(task.start),
      endDate: formatDate(task.end)
    });
  };

  // Handler para cambio de progreso
  const handleProgressChange = async (task) => {
    const project = scheduledProjects.find(p => p.id === task.id);
    if (!project) return;

    await onUpdate(project.id, {
      progress: task.progress
    });
  };

  // Handlers para drag & drop
  const handleDragStart = (project, e) => {
    setDraggedProject(project);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    // Delay para prevenir que el click se dispare después del drag
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    if (!draggedProject) return;

    // Mostrar modal para que el usuario elija las fechas
    setSelectedProject(draggedProject);
    setShowDateModal(true);

    // No resetear draggedProject aún, lo haremos cuando se cierre el modal
  };

  // Cambiar vista según zoom (simulado) y persistir en localStorage
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('gantt-view-mode', mode);
  };

  // Personalizar tooltips
  const TooltipContent = ({ task }) => {
    const project = task.project;
    if (!project) return null;

    return (
      <div className="gantt-tooltip">
        <div className="tooltip-title">
          {project.name}
        </div>
        <div className="tooltip-detail">
          <strong>Tipo:</strong> {project.type}
        </div>
        <div className="tooltip-detail">
          <strong>Estado:</strong> {project.status}
        </div>
        <div className="tooltip-detail">
          <strong>Inicio:</strong> {new Date(project.startDate).toLocaleDateString('es')}
        </div>
        <div className="tooltip-detail">
          <strong>Fin:</strong> {new Date(project.endDate).toLocaleDateString('es')}
        </div>
        {project.progress !== undefined && (
          <div className="tooltip-detail">
            <strong>Progreso:</strong> {project.progress}%
          </div>
        )}
      </div>
    );
  };

  // Header personalizado para la tabla (solo nombre)
  const TaskListHeader = () => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '50px',
        padding: '0 1rem',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: '0.85rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        Proyecto
      </div>
    );
  };

  // Handler para remover proyecto del Gantt (quitar fechas)
  const handleRemoveFromGantt = (project) => {
    setProjectToRemove(project);
    setShowRemoveModal(true);
  };

  const confirmRemoveFromGantt = async () => {
    if (!projectToRemove) return;

    // Eliminar las fechas del proyecto para regresarlo a no iniciados
    await onUpdate(projectToRemove.id, {
      startDate: null,
      endDate: null
    });

    setShowRemoveModal(false);
    setProjectToRemove(null);
  };

  // Handlers para mover proyectos arriba/abajo
  const handleMoveUp = async (currentIndex) => {
    if (currentIndex === 0) return; // Ya está al principio

    const currentProject = scheduledProjects[currentIndex];
    const previousProject = scheduledProjects[currentIndex - 1];

    // Asignar nuevos valores de order basados en el índice
    // El proyecto actual toma el order del anterior
    // El anterior toma el order del actual
    await Promise.all([
      onUpdate(currentProject.id, { order: currentIndex - 1 }),
      onUpdate(previousProject.id, { order: currentIndex })
    ]);
  };

  const handleMoveDown = async (currentIndex) => {
    if (currentIndex === scheduledProjects.length - 1) return; // Ya está al final

    const currentProject = scheduledProjects[currentIndex];
    const nextProject = scheduledProjects[currentIndex + 1];

    // Asignar nuevos valores de order basados en el índice
    // El proyecto actual toma el order del siguiente
    // El siguiente toma el order del actual
    await Promise.all([
      onUpdate(currentProject.id, { order: currentIndex + 1 }),
      onUpdate(nextProject.id, { order: currentIndex })
    ]);
  };

  // Handler para crear tarea inline
  const handleCreateTaskClick = (project) => {
    setCreatingTaskForProject(project.id);
    setNewTaskTitle('');
    // Expandir el proyecto automáticamente
    setExpandedProjects(prev => ({
      ...prev,
      [project.id]: true
    }));
  };

  const handleSaveNewTask = async (projectId) => {
    if (!newTaskTitle.trim()) {
      return;
    }

    const result = await createTask({
      title: newTaskTitle.trim(),
      projectId: projectId,
      // No establecer status - las tareas se crean sin estado
      priority: 'medium'
    });

    if (result.success) {
      // Solo limpiar el input, mantener el modo de creación activo
      setNewTaskTitle('');
    }
  };

  const handleCancelNewTask = () => {
    setCreatingTaskForProject(null);
    setNewTaskTitle('');
  };

  // Dependency management uses modal-based approach
  // The gantt-task-react library automatically shows dependency arrows

  // Fila personalizada para la tabla (solo nombre con fechas integradas)
  const TaskListTable = ({
    tasks: ganttTasks,
    rowHeight,
    rowWidth,
    selectedTaskId,
    setSelectedTask,
    onExpanderClick
  }) => {
    const [hoveredRow, setHoveredRow] = React.useState(null);
    const [openMenuIndex, setOpenMenuIndex] = React.useState(null);
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
    const inputContainerRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const menuButtonRefs = React.useRef({});

    // Detectar clics fuera del input para cerrarlo
    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (creatingTaskForProject && inputContainerRef.current && !inputContainerRef.current.contains(event.target)) {
          handleCancelNewTask();
        }
        if (openMenuIndex !== null && menuRef.current && !menuRef.current.contains(event.target)) {
          setOpenMenuIndex(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [creatingTaskForProject, openMenuIndex]);

    // Determinar si debemos mostrar el input inline después de esta tarea
    const shouldShowInputAfter = (task, index) => {
      // Si no hay un proyecto en modo creación, no mostrar nada
      if (!creatingTaskForProject) return false;

      // Si este es el proyecto que está en modo creación
      if (task.isProject && task.id === creatingTaskForProject) {
        // Buscar la siguiente tarea en ganttTasks
        const nextTask = ganttTasks[index + 1];

        // Mostrar el input si no hay siguiente tarea O la siguiente no es una tarea hija
        return !nextTask || !nextTask.isTask || nextTask.project !== task.id;
      }

      // Si esta es una tarea hija del proyecto en modo creación
      if (task.isTask && task.project === creatingTaskForProject) {
        // Buscar la siguiente tarea en ganttTasks
        const nextTask = ganttTasks[index + 1];

        // Mostrar el input si no hay siguiente tarea O la siguiente no pertenece a este proyecto
        return !nextTask || !nextTask.isTask || nextTask.project !== creatingTaskForProject;
      }

      return false;
    };

    return (
      <div style={{ width: rowWidth }}>
        {ganttTasks.map((task, index) => (
          <React.Fragment key={task.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: rowHeight,
                padding: '0.5rem 1rem',
                borderBottom: task.isProject ? '2px solid var(--border-medium)' : '1px solid var(--border-light)',
                backgroundColor: task.isProject ? 'rgba(1, 94, 124, 0.04)' : 'transparent',
                transition: 'background-color 0.2s ease',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = task.isProject ? 'rgba(1, 94, 124, 0.08)' : 'rgba(1, 94, 124, 0.03)';
                setHoveredRow(index);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = task.isProject ? 'rgba(1, 94, 124, 0.04)' : 'transparent';
                setHoveredRow(null);
              }}
            >
            {/* Indicador de expansión para proyectos */}
            {task.isProject ? (
              tasks.some(t => t.projectId === task.project.id && !t.archived) ? (
              <button
                onClick={() => onExpanderClick(task)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(1, 94, 124, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  transform: task.hideChildren ? 'rotate(0deg)' : 'rotate(0deg)'
                }}
                title={task.hideChildren ? 'Expandir tareas' : 'Colapsar tareas'}
              >
                <Icon
                  name={task.hideChildren ? 'chevron-right' : 'chevron-down'}
                  size={18}
                />
              </button>
              ) : (
                <div style={{ width: '24px', flexShrink: 0 }} />
              )
            ) : null}

            {/* Indentación para tareas hijas */}
            {task.isTask && (
              <div style={{ width: '24px', flexShrink: 0 }} />
            )}

            {/* Información del proyecto o tarea */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Contenedor para proyectos (nombre + barra de progreso en columna) */}
              {task.isProject ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {/* Nombre del proyecto */}
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.01em'
                  }}>
                    {task.name}
                  </div>

                  {/* Barra de progreso solo para proyectos con tareas */}
                  {(() => {
                    const projectTasks = tasks.filter(t => t.projectId === task.project.id && !t.archived);
                    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
                    const totalTasks = projectTasks.length;
                    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return totalTasks > 0 ? (
                      <div style={{
                        width: '150px',
                        height: '4px',
                        backgroundColor: 'var(--border-light)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          backgroundColor: progressPercent === 100 ? 'var(--color-success)' : 'var(--accent-color)',
                          transition: 'width 0.3s ease',
                          borderRadius: '2px'
                        }} />
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                /* Contenedor para tareas (nombre + badges en línea) */
                <>
                  <div style={{
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    flex: 1
                  }}>
                    {task.name}
                  </div>

                  {/* Badge de estado y avatar solo para tareas */}
                  {task.task && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {/* Badge de estado */}
                      {task.task.status && (
                        <span className={`badge badge-status-${task.task.status}`}>
                          {task.task.status === 'pending' && 'Pendiente'}
                          {task.task.status === 'in-progress' && 'En Progreso'}
                          {task.task.status === 'qa' && 'QA'}
                          {task.task.status === 'completed' && 'Completada'}
                        </span>
                      )}

                      {/* Avatar del usuario asignado o placeholder NA */}
                      {task.task.assignedTo ? (
                        <UserAvatar userId={task.task.assignedTo} size={24} />
                      ) : (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--border-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          color: 'var(--text-tertiary)'
                        }}>
                          NA
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Botón para gestionar dependencias en tareas */}
            {task.isTask && (
              <div style={{
                opacity: hoveredRow === index ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: hoveredRow === index ? 'auto' : 'none',
                flexShrink: 0,
                marginRight: '0.5rem'
              }}>
                <button
                  onClick={() => {
                    setSelectedTaskForDependency(task.task);
                    setShowDependencyModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-medium)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    borderRadius: '4px',
                    position: 'relative'
                  }}
                  title="Gestionar dependencias"
                >
                  <Icon name="arrow-right" size={14} />
                  {task.task.dependencies && task.task.dependencies.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-color)',
                      border: '2px solid white',
                      fontSize: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600
                    }}>
                      {task.task.dependencies.length}
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Botón para agregar tarea al proyecto */}
            {task.isProject && (
              <div style={{
                opacity: hoveredRow === index ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: hoveredRow === index ? 'auto' : 'none',
                flexShrink: 0,
                marginRight: '0.5rem'
              }}>
                <button
                  onClick={() => handleCreateTaskClick(task.project)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-medium)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    padding: '0.25rem',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}
                  title="Agregar tarea"
                >
                  +
                </button>
              </div>
            )}

            {/* Menú de opciones para proyectos */}
            {task.isProject && (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  ref={(el) => { menuButtonRefs.current[index] = el; }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (openMenuIndex === index) {
                      setOpenMenuIndex(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom + 4,
                        left: rect.right - 180 // 180px es el minWidth del menú
                      });
                      setOpenMenuIndex(index);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(1, 94, 124, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    borderRadius: '4px',
                    opacity: hoveredRow === index || openMenuIndex === index ? 1 : 0
                  }}
                  title="Opciones"
                >
                  <Icon name="more-vertical" size={18} />
                </button>

                {/* Menú desplegable */}
                {openMenuIndex === index && (
                  <div
                    ref={menuRef}
                    className="gantt-project-menu"
                    style={{
                      position: 'fixed',
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left}px`
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(index);
                        setOpenMenuIndex(null);
                      }}
                      disabled={index === 0}
                    >
                      <Icon name="arrow-up" size={16} />
                      Mover arriba
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(index);
                        setOpenMenuIndex(null);
                      }}
                      disabled={index === ganttTasks.filter(t => t.isProject).length - 1}
                    >
                      <Icon name="arrow-down" size={16} />
                      Mover abajo
                    </button>

                    <div className="menu-divider" />

                    <button
                      className="danger-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromGantt(task.project);
                        setOpenMenuIndex(null);
                      }}
                    >
                      <Icon name="x" size={16} />
                      Quitar del cronograma
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Fila inline para crear nueva tarea - mostrar al final de las tareas del proyecto */}
            {shouldShowInputAfter(task, index) && (
            <div
              ref={inputContainerRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: rowHeight,
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0, 153, 204, 0.05)',
                gap: '0.5rem'
              }}
            >
              {/* Indentación como tarea hija */}
              <div style={{ width: '24px', flexShrink: 0 }} />

              {/* Input para nombre de tarea */}
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => {
                  e.stopPropagation();
                  setNewTaskTitle(e.target.value);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    // Si task es un proyecto, usar task.id; si es una tarea, usar task.project
                    const projectId = task.isProject ? task.id : task.project;
                    handleSaveNewTask(projectId);
                  } else if (e.key === 'Escape') {
                    handleCancelNewTask();
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Escribe y presiona Enter para agregar, Esc para cancelar"
                autoFocus
                style={{
                  flex: 1,
                  border: '1px solid var(--accent-color)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontWeight: 500
                }}
              />
            </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="gantt-container" style={{ position: 'relative' }}>
      {scheduledProjects.length > 0 ? (
        <div
          className={`gantt-wrapper ${isDraggingOver ? 'drag-over' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="gantt-toolbar">
            <div className="toolbar-left">
              <span className="toolbar-title">Cronograma</span>
              <span className="toolbar-count">{scheduledProjects.length} proyectos</span>
              <div className="legend-container flex gap-base items-center">
                <div className="flex items-center gap-xs">
                  <div className="legend-color legend-color-id"></div>
                  <span className="text-xs text-secondary">ID</span>
                </div>
                <div className="flex items-center gap-xs">
                  <div className="legend-color legend-color-functionality"></div>
                  <span className="text-xs text-secondary">Functionality</span>
                </div>
              </div>
            </div>
            <div className="toolbar-right">
              <div className="zoom-control">
                <Icon name="calendar" size={16} />
                <select
                  value={viewMode}
                  onChange={(e) => handleViewModeChange(e.target.value)}
                  className="view-mode-select"
                >
                  <option value={ViewMode.Day}>Vista Día</option>
                  <option value={ViewMode.Week}>Vista Semana</option>
                  <option value={ViewMode.Month}>Vista Mes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gantt Chart con scroll wrapper */}
          <div className="gantt-chart-wrapper-outer">
            <div className="gantt-chart-container">
              {ganttTasks.length > 0 && (
                <Gantt
                  tasks={ganttTasks}
                  viewMode={viewMode}
                  onDateChange={handleTaskChange}
                  onProgressChange={handleProgressChange}
                  onExpanderClick={(task) => {
                    if (task.isProject) {
                      setExpandedProjects(prev => ({
                        ...prev,
                        [task.id]: !prev[task.id]
                      }));
                    }
                  }}
                  listCellWidth="330px"
                  columnWidth={viewMode === ViewMode.Day ? 60 : viewMode === ViewMode.Week ? 250 : 300}
                  rowHeight={50}
                  taskHeight={28}
                  barCornerRadius={6}
                  barProgressColor="rgba(255, 255, 255, 0.3)"
                  barProgressSelectedColor="rgba(255, 255, 0.4)"
                  barBackgroundColor="transparent"
                  barBackgroundSelectedColor="transparent"
                  todayColor="rgba(239, 71, 111, 0.15)"
                  TooltipContent={TooltipContent}
                  TaskListHeader={TaskListHeader}
                  TaskListTable={TaskListTable}
                  locale="es"
                  fontSize="13px"
                  fontFamily="inherit"
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`gantt-drop-zone ${isDraggingOver ? 'drag-over' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Icon name="calendar" size={48} />
          <h3>Arrastra proyectos aquí para programarlos</h3>
          <p>Los proyectos aparecerán en el cronograma con fechas automáticas</p>
        </div>
      )}

      {/* Proyectos no iniciados */}
      {unscheduledProjects.length > 0 && (
        <div className="unscheduled-projects">
          <div className="unscheduled-header">
            <Icon name="folder" size={20} />
            No Iniciados
          </div>
          <p className="unscheduled-hint">
            Proyectos sin fecha de inicio o fin. Arrastra un proyecto al cronograma o haz clic para asignarle fechas.
          </p>
          <div className="unscheduled-list">
            {unscheduledProjects.map(project => (
              <div
                key={project.id}
                className="unscheduled-project"
                draggable={true}
                onDragStart={(e) => handleDragStart(project, e)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  // Solo abrir el modal si no fue un drag
                  if (!isDragging) {
                    setSelectedProject(project);
                    setShowDateModal(true);
                  }
                }}
                style={{ cursor: 'grab' }}
              >
                <div className="unscheduled-info">
                  <div className="unscheduled-name">
                    <Icon name="grip-vertical" size={14} style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                    {project.name}
                  </div>
                  <span
                    className="unscheduled-status"
                    style={{
                      backgroundColor: getTypeLabelColor(project.type).bg,
                      color: getTypeLabelColor(project.type).text
                    }}
                  >
                    {project.type}
                  </span>
                </div>
                {project.description && (
                  <div className="unscheduled-description">{project.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para asignar fechas */}
      {showDateModal && selectedProject && (
        <DateAssignModal
          project={selectedProject}
          onClose={() => {
            setShowDateModal(false);
            setSelectedProject(null);
            setDraggedProject(null);
            setIsDragging(false);
          }}
          onSave={async (dates) => {
            await onUpdate(selectedProject.id, dates);
            setShowDateModal(false);
            setSelectedProject(null);
            setDraggedProject(null);
            setIsDragging(false);
          }}
        />
      )}

      {/* Modal de confirmación para remover del Gantt */}
      {showRemoveModal && projectToRemove && (
        <ConfirmRemoveModal
          project={projectToRemove}
          onClose={() => {
            setShowRemoveModal(false);
            setProjectToRemove(null);
          }}
          onConfirm={confirmRemoveFromGantt}
        />
      )}

      {/* Modal para gestionar dependencias */}
      {showDependencyModal && selectedTaskForDependency && (
        <DependencyModal
          task={selectedTaskForDependency}
          allTasks={tasks}
          onClose={() => {
            setShowDependencyModal(false);
            setSelectedTaskForDependency(null);
          }}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};

// Modal para asignar fechas a proyectos no programados
const DateAssignModal = ({ project, onClose, onSave }) => {
  // Calcular fechas sugeridas: hoy y hoy + 30 días
  const today = new Date();
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 30);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(formatDate(today));
  const [endDate, setEndDate] = useState(formatDate(defaultEnd));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      onSave({ startDate, endDate });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Programar Proyecto</h3>
        <p className="text-base text-secondary mb-base">
          Asigna fechas a <strong>{project.name}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Fecha de Inicio *</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Fecha de Fin *</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Programar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de confirmación para remover proyecto del Gantt
const ConfirmRemoveModal = ({ project, onClose, onConfirm }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>¿Regresar a No Iniciados?</h3>
        <p className="text-base text-secondary mb-base">
          ¿Estás seguro que deseas quitar <strong>{project.name}</strong> del cronograma?
        </p>
        <p className="text-sm text-secondary mb-lg">
          El proyecto regresará al área de "No Iniciados" y se eliminarán sus fechas de inicio y fin.
        </p>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary btn-danger-bg"
          >
            Sí, quitar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para gestionar dependencias de tareas
const DependencyModal = ({ task, allTasks, onClose }) => {
  const [loading, setLoading] = React.useState(false);

  // Filtrar tareas del mismo proyecto (excluyendo la tarea actual)
  const availableTasks = allTasks.filter(t =>
    t.projectId === task.projectId &&
    t.id !== task.id &&
    !t.archived
  );

  const handleAddDependency = async (dependsOnTaskId) => {
    setLoading(true);
    const result = await addTaskDependency(task.id, dependsOnTaskId);
    setLoading(false);

    if (!result.success) {
      console.error('Error al agregar dependencia:', result.error);
    }
  };

  const handleRemoveDependency = async (dependsOnTaskId) => {
    setLoading(true);
    const result = await removeTaskDependency(task.id, dependsOnTaskId);
    setLoading(false);

    if (!result.success) {
      console.error('Error al eliminar dependencia:', result.error);
    }
  };

  const currentDependencies = task.dependencies || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="flex justify-between items-center mb-base">
          <h3 className="heading-3">Gestionar Dependencias</h3>
          <button
            onClick={onClose}
            className="btn btn-icon"
            title="Cerrar"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <p className="text-base text-secondary mb-base">
          Tarea: <strong>{task.title}</strong>
        </p>

        <p className="text-sm text-tertiary mb-lg">
          Las dependencias determinan qué tareas deben completarse antes de que esta pueda comenzar.
          Las líneas se mostrarán automáticamente en el cronograma.
        </p>

        {availableTasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p className="text-secondary">No hay otras tareas en este proyecto</p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div className="flex flex-col gap-sm">
              {availableTasks.map(availableTask => {
                const hasDependency = currentDependencies.includes(availableTask.id);

                return (
                  <div
                    key={availableTask.id}
                    className="flex items-center justify-between p-base border-b-light"
                    style={{
                      backgroundColor: hasDependency ? 'rgba(1, 94, 124, 0.05)' : 'transparent',
                      borderRadius: '4px'
                    }}
                  >
                    <div className="flex flex-col gap-xs" style={{ flex: 1 }}>
                      <div className="flex items-center gap-sm">
                        <span className="text-base">{availableTask.title}</span>
                        {availableTask.status && (
                          <span className={`badge badge-status-${availableTask.status}`}>
                            {availableTask.status === 'pending' && 'Pendiente'}
                            {availableTask.status === 'in-progress' && 'En Progreso'}
                            {availableTask.status === 'qa' && 'QA'}
                            {availableTask.status === 'completed' && 'Completada'}
                          </span>
                        )}
                      </div>
                      {availableTask.assignedTo && (
                        <div className="flex items-center gap-xs">
                          <UserAvatar userId={availableTask.assignedTo} size={20} />
                          <UserAvatar userId={availableTask.assignedTo} size={0} showName={true} />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (hasDependency) {
                          handleRemoveDependency(availableTask.id);
                        } else {
                          handleAddDependency(availableTask.id);
                        }
                      }}
                      disabled={loading}
                      className={`btn ${hasDependency ? 'btn-danger' : 'btn-primary'} btn-sm`}
                      style={{ minWidth: '100px' }}
                    >
                      {hasDependency ? (
                        <>
                          <Icon name="x" size={14} />
                          Quitar
                        </>
                      ) : (
                        <>
                          <Icon name="arrow-right" size={14} />
                          Agregar
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GanttTimeline;
