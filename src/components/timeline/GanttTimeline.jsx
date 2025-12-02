import React, { useMemo, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import Icon from '../common/Icon';
import '../../styles/GanttTimeline.css';

const GanttTimeline = ({ projects, onUpdate }) => {
  const [viewMode, setViewMode] = useState(ViewMode.Day);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [projectToRemove, setProjectToRemove] = useState(null);
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

  // Convertir proyectos a formato de gantt-task-react
  const tasks = useMemo(() => {
    return scheduledProjects.map((project) => {
      // Crear fechas sin problemas de zona horaria
      // Parsear la fecha manualmente para evitar conversión de zona horaria
      const [startYear, startMonth, startDay] = project.startDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

      const [endYear, endMonth, endDay] = project.endDate.split('-').map(Number);
      const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

      const projectColor = getProjectColor(project);

      return {
        id: project.id,
        name: project.name,
        start: start,
        end: end,
        progress: project.progress || 0,
        type: 'task',
        styles: {
          backgroundColor: projectColor,
          backgroundSelectedColor: projectColor,
          progressColor: 'rgba(255, 255, 255, 0.3)',
          progressSelectedColor: 'rgba(255, 255, 255, 0.4)',
        },
        project: project // Guardar referencia al proyecto original
      };
    });
  }, [scheduledProjects]);

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

  // Fila personalizada para la tabla (solo nombre con fechas integradas)
  const TaskListTable = ({ tasks, rowHeight }) => {
    const [hoveredRow, setHoveredRow] = React.useState(null);

    return (
      <div>
        {tasks.map((task, index) => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: rowHeight,
              padding: '0.5rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              transition: 'background-color 0.2s ease',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(1, 94, 124, 0.03)';
              setHoveredRow(index);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              setHoveredRow(null);
            }}
          >
            {/* Botones de reordenar */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              width: '24px',
              opacity: hoveredRow === index ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: hoveredRow === index ? 'auto' : 'none',
              flexShrink: 0
            }}>
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                onMouseEnter={(e) => {
                  if (index !== 0) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.backgroundColor = 'rgba(1, 94, 124, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onMouseDown={(e) => {
                  if (index !== 0) {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }
                }}
                onMouseUp={(e) => {
                  if (index !== 0) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  color: index === 0 ? 'var(--text-secondary)' : 'var(--primary-color)',
                  fontSize: '0.8rem',
                  padding: '4px',
                  opacity: index === 0 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  borderRadius: '4px'
                }}
                title={index === 0 ? 'Ya está en la primera posición' : 'Mover arriba'}
              >
                ▲
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === tasks.length - 1}
                onMouseEnter={(e) => {
                  if (index !== tasks.length - 1) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.backgroundColor = 'rgba(1, 94, 124, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onMouseDown={(e) => {
                  if (index !== tasks.length - 1) {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }
                }}
                onMouseUp={(e) => {
                  if (index !== tasks.length - 1) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: index === tasks.length - 1 ? 'not-allowed' : 'pointer',
                  color: index === tasks.length - 1 ? 'var(--text-secondary)' : 'var(--primary-color)',
                  fontSize: '0.8rem',
                  padding: '4px',
                  opacity: index === tasks.length - 1 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  borderRadius: '4px'
                }}
                title={index === tasks.length - 1 ? 'Ya está en la última posición' : 'Mover abajo'}
              >
                ▼
              </button>
            </div>

            {/* Información del proyecto */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}>
                {task.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                gap: '0.4rem',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}>
                <span>{task.start.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>→</span>
                <span>{task.end.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
              </div>
            </div>

            {/* Botón para remover del Gantt */}
            <div style={{
              opacity: hoveredRow === index ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: hoveredRow === index ? 'auto' : 'none',
              flexShrink: 0
            }}>
              <button
                onClick={() => handleRemoveFromGantt(task.project)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.backgroundColor = 'var(--color-error)';
                  e.currentTarget.style.borderColor = 'var(--color-error)';
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
                  fontSize: '1.1rem',
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
                title="Quitar del cronograma"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="gantt-container">
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
            {tasks.length > 0 && (
              <Gantt
                tasks={tasks}
                viewMode={viewMode}
                onDateChange={handleTaskChange}
                onProgressChange={handleProgressChange}
                listCellWidth="280px"
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

export default GanttTimeline;
