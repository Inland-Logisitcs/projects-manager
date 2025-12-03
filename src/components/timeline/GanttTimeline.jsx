import React, { useMemo, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { createTask, addTaskDependency, removeTaskDependency } from '../../services/taskService';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import '../../styles/GanttTimeline.css';

const GanttTimeline = ({ projects, tasks = [], onUpdate }) => {
  const [viewMode, setViewMode] = useState(ViewMode.Day);
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

  // Cambiar vista según zoom (simulado)
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
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

          {/* Gantt Chart */}
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
