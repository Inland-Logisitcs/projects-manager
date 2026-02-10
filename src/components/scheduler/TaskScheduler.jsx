import { useState, useEffect } from 'react';
import { useOptimizer } from '../../hooks/useOptimizer';
import { subscribeToUsers } from '../../services/userService';
import { saveOptimization, clearOptimizationDetails } from '../../services/taskService';
import Icon from '../common/Icon';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import CustomGanttChart from './CustomGanttChart';
import TaskDetailSidebar from '../kanban/TaskDetailSidebar';
import '../../styles/TaskScheduler.css';

/**
 * Avanza desde un día calendario de inicio contando N días de trabajo,
 * saltando días no laborables. Retorna el día calendario donde termina.
 *
 * @param {number} diaInicio - Día calendario de inicio (puede ser negativo)
 * @param {number} diasTrabajo - Días de trabajo efectivo (ej: 2.5)
 * @param {number[]} diasLaborables - Días laborables [1=Lun..7=Dom]
 * @returns {number} Día calendario de fin
 */
const avanzarDiasLaborables = (diaInicio, diasTrabajo, diasLaborables) => {
  if (!diasLaborables || diasLaborables.length === 0 || diasLaborables.length === 7) {
    return diaInicio + diasTrabajo;
  }

  const diasLabSet = new Set(diasLaborables);
  const unidadesTrabajo = Math.ceil(diasTrabajo * 2); // Convertir a medios días

  if (unidadesTrabajo <= 0) return diaInicio;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Normalizar diaInicio a medios días enteros
  let diasCompletosInicio;
  let enMedioDia;

  if (diaInicio < 0 && diaInicio > -1) {
    diasCompletosInicio = 0;
    enMedioDia = false;
  } else {
    diasCompletosInicio = Math.floor(diaInicio);
    enMedioDia = (diaInicio - diasCompletosInicio) >= 0.5;
  }

  const fechaActual = new Date(hoy);
  fechaActual.setDate(hoy.getDate() + diasCompletosInicio);

  let medioDiasTrabajados = 0;

  while (medioDiasTrabajados < unidadesTrabajo) {
    const diaSemanaJS = fechaActual.getDay();
    const diaSemana = diaSemanaJS === 0 ? 7 : diaSemanaJS;

    if (diasLabSet.has(diaSemana)) {
      medioDiasTrabajados += 1;

      if (medioDiasTrabajados >= unidadesTrabajo) {
        const msDesdeHoy = fechaActual - hoy;
        const diasDesdeHoy = Math.round(msDesdeHoy / (1000 * 60 * 60 * 24));
        const unidadesDesdeHoy = diasDesdeHoy * 2 + (enMedioDia ? 1 : 0);
        return (unidadesDesdeHoy + 1) / 2.0;
      }
    }

    if (enMedioDia) {
      fechaActual.setDate(fechaActual.getDate() + 1);
      enMedioDia = false;
    } else {
      enMedioDia = true;
    }
  }

  return diaInicio + diasTrabajo; // Fallback
};

/**
 * Calcula duracion total de una tarea incluyendo riesgos y redondeo a 0.5 dias.
 *
 * @param {Object} tarea - Tarea con storyPoints, id, projectId, assignedTo
 * @param {Object} usuario - Usuario con dailyCapacity/capacidadDiaria
 * @param {Array} factoresRiesgo - Factores de riesgo del sistema
 * @returns {Object} { duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, tiempoRedondeo, duracionTotal }
 */
const calcularDuracionConRiesgos = (tarea, usuario, factoresRiesgo) => {
  const capacidad = usuario?.dailyCapacity || usuario?.capacidadDiaria || 1;
  const storyPoints = tarea.storyPoints || 0;
  const duracionBase = storyPoints / capacidad;

  let porcentajeUsuario = 0;
  let porcentajeProyecto = 0;
  let diasExtra = 0;

  factoresRiesgo.forEach(riesgo => {
    if (riesgo.usuarioId === tarea.assignedTo && riesgo.tareaId === tarea.id) {
      porcentajeUsuario = riesgo.porcentajeExtra || 0;
      diasExtra += riesgo.diasExtra || 0;
    } else if (riesgo.usuarioId === tarea.assignedTo && riesgo.proyectoId === (tarea.projectId || tarea.proyectoId)) {
      porcentajeUsuario = riesgo.porcentajeExtra || 0;
      diasExtra += riesgo.diasExtra || 0;
    } else if (!riesgo.usuarioId && riesgo.tareaId === tarea.id) {
      porcentajeProyecto = riesgo.porcentajeExtra || 0;
      diasExtra += riesgo.diasExtra || 0;
    } else if (!riesgo.usuarioId && riesgo.proyectoId === (tarea.projectId || tarea.proyectoId)) {
      porcentajeProyecto = riesgo.porcentajeExtra || 0;
      diasExtra += riesgo.diasExtra || 0;
    }
  });

  const riesgoUsuarioEnSP = storyPoints * porcentajeUsuario;
  const riesgoProyectoEnSP = storyPoints * porcentajeProyecto;
  const tiempoRiesgoUsuario = riesgoUsuarioEnSP / capacidad;
  const tiempoRiesgoProyecto = riesgoProyectoEnSP / capacidad;
  const tiempoRiesgoTotal = tiempoRiesgoUsuario + tiempoRiesgoProyecto + diasExtra;

  const duracionSinRedondeo = duracionBase + tiempoRiesgoTotal;
  const duracionTotal = Math.ceil(duracionSinRedondeo * 2) / 2;
  const tiempoRedondeo = duracionTotal - duracionSinRedondeo;

  return {
    duracionBase,
    tiempoRiesgo: tiempoRiesgoTotal,
    tiempoRiesgoUsuario,
    tiempoRiesgoProyecto,
    tiempoRedondeo,
    duracionTotal
  };
};

/**
 * Calcula posiciones calendario para todas las tareas del Gantt.
 * Fuente unica de verdad para posiciones: tareas en progreso, ya optimizadas, y nuevas.
 *
 * @param {Object} params
 * @param {Array} params.tareasOptimizador - Tareas nuevas del optimizador (con ordenGlobal, usuarioId)
 * @param {Array} params.tareasEnProgreso - Tareas en progreso (raw de Firebase)
 * @param {Array} params.tareasYaOptimizadas - Tareas ya optimizadas (raw de Firebase)
 * @param {Array} params.usuarios - Usuarios del sistema
 * @param {Array} params.factoresRiesgo - Factores de riesgo
 * @param {Array} params.proyectos - Proyectos
 * @param {Function} params.calcularRiesgos - Funcion calcularDuracionConRiesgos
 * @returns {Array} Tareas con posiciones para el Gantt
 */
const calcularPosicionesParaGantt = ({
  tareasOptimizador = [],
  tareasEnProgreso = [],
  tareasYaOptimizadas = [],
  usuarios,
  factoresRiesgo,
  proyectos,
  calcularRiesgos
}) => {
  const resultado = [];
  // Track posicion disponible por usuario (dia calendario donde puede empezar la siguiente tarea)
  const posicionUsuario = {};

  // Helper para obtener datos del usuario
  const getUsuario = (userId) => usuarios.find(u => u.id === userId);
  const getDiasLab = (userId) => {
    const u = getUsuario(userId);
    return u?.workingDays || [1, 2, 3, 4, 5];
  };
  const getNombreUsuario = (userId) => {
    const u = getUsuario(userId);
    return u?.displayName || u?.nombre || 'Sin asignar';
  };
  const getNombreProyecto = (proyectoId) =>
    proyectos.find(p => p.id === proyectoId)?.name || 'Sin proyecto';

  // 1. Tareas en progreso
  tareasEnProgreso.forEach(t => {
    const usuario = getUsuario(t.assignedTo);
    if (!usuario) return;

    // Usar optimizedDuration guardada si existe, sino recalcular
    let riesgos;
    if (t.optimizedDuration) {
      riesgos = {
        duracionBase: t.optimizedDuration.duracionBase || 0,
        tiempoRiesgo: t.optimizedDuration.tiempoRiesgo || 0,
        tiempoRiesgoUsuario: t.optimizedDuration.tiempoRiesgoUsuario || 0,
        tiempoRiesgoProyecto: t.optimizedDuration.tiempoRiesgoProyecto || 0,
        tiempoRedondeo: t.optimizedDuration.tiempoRedondeo || 0,
        duracionTotal: t.optimizedDuration.duracionTotal || 0
      };
    } else {
      riesgos = calcularRiesgos(t, usuario, factoresRiesgo);
    }
    const diasLab = getDiasLab(t.assignedTo);

    let diasTranscurridos = 0;
    // Buscar la ultima transicion pending -> in-progress en movementHistory
    let fechaInicioTrabajo = null;
    if (t.movementHistory && t.movementHistory.length > 0) {
      for (let i = t.movementHistory.length - 1; i >= 0; i--) {
        const mov = t.movementHistory[i];
        if (mov.type === 'status_change' && mov.from === 'pending' && mov.to === 'in-progress') {
          const ts = mov.timestamp;
          fechaInicioTrabajo = ts?.toDate ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
          break;
        }
      }
    }
    // Fallback a lastStatusChange si no se encuentra la transicion especifica
    if (!fechaInicioTrabajo && t.lastStatusChange) {
      fechaInicioTrabajo = t.lastStatusChange.toDate ? t.lastStatusChange.toDate() : new Date(t.lastStatusChange);
    }
    if (fechaInicioTrabajo) {
      diasTranscurridos = (new Date() - fechaInicioTrabajo) / (1000 * 60 * 60 * 24);
    }

    // Snap to 0.5-day grid for consistent segment rendering in the Gantt
    const diaInicio = Math.round(-diasTranscurridos * 2) / 2;
    const diaFin = avanzarDiasLaborables(diaInicio, riesgos.duracionTotal, diasLab);

    resultado.push({
      id: t.id,
      nombre: t.title || t.nombre,
      usuario: getNombreUsuario(t.assignedTo),
      usuarioId: t.assignedTo,
      proyectoId: t.projectId || t.proyectoId,
      proyectoNombre: getNombreProyecto(t.projectId || t.proyectoId),
      diaInicio,
      diaFin,
      duracionBase: riesgos.duracionBase,
      tiempoRiesgo: riesgos.tiempoRiesgo,
      tiempoRiesgoUsuario: riesgos.tiempoRiesgoUsuario,
      tiempoRiesgoProyecto: riesgos.tiempoRiesgoProyecto,
      tiempoRedondeo: riesgos.tiempoRedondeo,
      storyPoints: t.storyPoints,
      enProgreso: true,
      forzado: false,
      dependencias: t.dependencies || [],
      diasTranscurridos
    });

    // Actualizar posicion del usuario
    posicionUsuario[t.assignedTo] = Math.max(posicionUsuario[t.assignedTo] || 0, diaFin);
  });

  // 2. Tareas ya optimizadas (ordenadas por planningOrder dentro de cada usuario)
  const yaOptPorUsuario = {};
  tareasYaOptimizadas.forEach(t => {
    if (!yaOptPorUsuario[t.assignedTo]) yaOptPorUsuario[t.assignedTo] = [];
    yaOptPorUsuario[t.assignedTo].push(t);
  });
  Object.values(yaOptPorUsuario).forEach(arr => arr.sort((a, b) => a.planningOrder - b.planningOrder));

  Object.entries(yaOptPorUsuario).forEach(([userId, tareas]) => {
    const usuario = getUsuario(userId);
    if (!usuario) return;
    const diasLab = getDiasLab(userId);

    tareas.forEach(t => {
      let duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, tiempoRedondeo, duracionTotal;

      if (t.optimizedDuration) {
        duracionBase = t.optimizedDuration.duracionBase || 0;
        tiempoRiesgo = t.optimizedDuration.tiempoRiesgo || 0;
        tiempoRiesgoUsuario = t.optimizedDuration.tiempoRiesgoUsuario || 0;
        tiempoRiesgoProyecto = t.optimizedDuration.tiempoRiesgoProyecto || 0;
        tiempoRedondeo = t.optimizedDuration.tiempoRedondeo || 0;
        duracionTotal = t.optimizedDuration.duracionTotal || duracionBase + tiempoRiesgo + tiempoRedondeo;
      } else {
        const riesgos = calcularRiesgos(t, usuario, factoresRiesgo);
        duracionBase = riesgos.duracionBase;
        tiempoRiesgo = riesgos.tiempoRiesgo;
        tiempoRiesgoUsuario = riesgos.tiempoRiesgoUsuario;
        tiempoRiesgoProyecto = riesgos.tiempoRiesgoProyecto;
        tiempoRedondeo = riesgos.tiempoRedondeo;
        duracionTotal = riesgos.duracionTotal;
      }

      const diaInicio = Math.max(posicionUsuario[userId] || 0, 0);
      const diaFin = avanzarDiasLaborables(diaInicio, duracionTotal, diasLab);

      resultado.push({
        id: t.id,
        nombre: t.title || t.nombre,
        usuario: getNombreUsuario(userId),
        usuarioId: userId,
        proyectoId: t.projectId || t.proyectoId,
        proyectoNombre: getNombreProyecto(t.projectId || t.proyectoId),
        diaInicio,
        diaFin,
        duracionBase,
        tiempoRiesgo,
        tiempoRiesgoUsuario,
        tiempoRiesgoProyecto,
        tiempoRedondeo,
        storyPoints: t.storyPoints,
        enProgreso: false,
        forzado: true,
        dependencias: t.dependencies || [],
        planningOrder: t.planningOrder
      });

      posicionUsuario[userId] = diaFin;
    });
  });

  // 3. Tareas nuevas del optimizador (ordenadas por ordenGlobal para respetar dependencias)
  const tareasOrdenadas = [...tareasOptimizador].sort((a, b) => (a.ordenGlobal || 0) - (b.ordenGlobal || 0));

  // Mapa de diaFin por taskId para resolver dependencias
  const finPorTarea = {};
  resultado.forEach(t => { finPorTarea[t.id] = t.diaFin; });

  tareasOrdenadas.forEach(t => {
    const usuario = getUsuario(t.usuarioId);
    if (!usuario) return;
    const diasLab = getDiasLab(t.usuarioId);

    const riesgos = calcularRiesgos(
      { ...t, assignedTo: t.usuarioId, projectId: t.proyectoId },
      usuario,
      factoresRiesgo
    );

    // diaInicio = max(posicionUsuario, max(diaFin de dependencias))
    let diaInicio = posicionUsuario[t.usuarioId] || 0;
    if (t.dependencias && t.dependencias.length > 0) {
      t.dependencias.forEach(depId => {
        if (finPorTarea[depId] !== undefined) {
          diaInicio = Math.max(diaInicio, finPorTarea[depId]);
        }
      });
    }

    const diaFin = avanzarDiasLaborables(diaInicio, riesgos.duracionTotal, diasLab);

    const tareaGantt = {
      id: t.id || t.taskId,
      nombre: t.nombre,
      usuario: getNombreUsuario(t.usuarioId),
      usuarioId: t.usuarioId,
      proyectoId: t.proyectoId,
      proyectoNombre: t.proyectoNombre || getNombreProyecto(t.proyectoId),
      diaInicio,
      diaFin,
      duracionBase: riesgos.duracionBase,
      tiempoRiesgo: riesgos.tiempoRiesgo,
      tiempoRiesgoUsuario: riesgos.tiempoRiesgoUsuario,
      tiempoRiesgoProyecto: riesgos.tiempoRiesgoProyecto,
      tiempoRedondeo: riesgos.tiempoRedondeo,
      storyPoints: t.storyPoints,
      enProgreso: false,
      forzado: t.forzado || false,
      dependencias: t.dependencias || []
    };

    resultado.push(tareaGantt);
    finPorTarea[tareaGantt.id] = diaFin;
    posicionUsuario[t.usuarioId] = diaFin;
  });

  return resultado;
};

/**
 * Componente principal del planificador/optimizador de tareas
 */
const TaskScheduler = ({ proyectos, tareas, columns = [], projectRisks = {} }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProyectos, setSelectedProyectos] = useState([]); // Proyectos seleccionados para optimizar
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });
  const [tareasDoing, setTareasDoing] = useState([]); // Tareas en progreso
  const [tareasPlaneadas, setTareasPlaneadas] = useState([]); // Tareas con planningOrder
  const [selectedTask, setSelectedTask] = useState(null); // Tarea seleccionada para el sidebar
  const [saving, setSaving] = useState(false); // Estado de guardado
  const [showSaveConfirm, setShowSaveConfirm] = useState(false); // Mostrar confirmación de guardado
  const [showClearConfirm, setShowClearConfirm] = useState(false); // Mostrar confirmación de limpieza
  const [clearing, setClearing] = useState(false); // Estado de limpieza

  const { optimizar, loading, error, resultado, limpiar } = useOptimizer();

  // Inicializar proyectos seleccionados cuando cambien los proyectos
  useEffect(() => {
    if (proyectos && proyectos.length > 0) {
      setSelectedProyectos(proyectos.map(p => p.id));
    }
  }, [proyectos]);

  // Suscribirse a usuarios
  useEffect(() => {
    const unsubscribe = subscribeToUsers((fetchedUsers) => {
      // Filtrar solo usuarios activos
      const activeUsers = fetchedUsers.filter(u => !u.disabled);
      setUsuarios(activeUsers);
    });

    return () => unsubscribe();
  }, []);

  // Calcular tareas planeadas (con assignedTo y planningOrder definido)
  useEffect(() => {
    if (!tareas || tareas.length === 0 || !usuarios || usuarios.length === 0) {
      setTareasPlaneadas([]);
      return;
    }

    // Filtrar tareas que tienen assignedTo y planningOrder definido
    const tareasConPlanificacion = tareas.filter(t =>
      t.assignedTo &&
      typeof t.planningOrder === 'number' &&
      !t.archived
    );

    if (tareasConPlanificacion.length === 0) {
      setTareasPlaneadas([]);
      return;
    }

    const enProgreso = tareasConPlanificacion.filter(t => t.status === 'in-progress');
    const pendientes = tareasConPlanificacion.filter(t => t.status !== 'in-progress');

    const tareasGantt = calcularPosicionesParaGantt({
      tareasOptimizador: [],
      tareasEnProgreso: enProgreso,
      tareasYaOptimizadas: pendientes,
      usuarios,
      factoresRiesgo: [],
      proyectos,
      calcularRiesgos: calcularDuracionConRiesgos
    });

    setTareasPlaneadas(tareasGantt);
  }, [tareas, usuarios, proyectos]);

  // Validar datos antes de optimizar
  const validarDatos = () => {
    if (!usuarios || usuarios.length === 0) {
      return 'No hay usuarios disponibles. Crea usuarios en la página de administración.';
    }

    // Filtrar tareas con story points y que no estén terminadas
    const tareasValidas = tareas.filter(t => {
      const tieneStoryPoints = t.storyPoints && t.storyPoints > 0;
      const estadoValido = t.status !== 'qa' && t.status !== 'completed';
      return tieneStoryPoints && estadoValido;
    });

    if (tareasValidas.length === 0) {
      return 'No hay tareas pendientes para optimizar. Las tareas deben tener story points y no estar terminadas (QA/Completadas).';
    }

    return null;
  };

  const handleOptimizar = async () => {
    const errorValidacion = validarDatos();
    if (errorValidacion) {
      setToast({ isOpen: true, message: errorValidacion, type: 'error' });
      return;
    }

    if (selectedProyectos.length === 0) {
      setToast({ isOpen: true, message: 'Debes seleccionar al menos un proyecto para optimizar', type: 'error' });
      return;
    }

    // Separar tareas en doing y pendientes, filtrando por proyectos seleccionados
    const tareasDoingRaw = tareas.filter(t =>
      t.status === 'in-progress' &&
      t.storyPoints && t.storyPoints > 0 &&
      selectedProyectos.includes(t.projectId || t.proyectoId)
    );

    const todasLasPendientes = tareas.filter(t => {
      const tieneStoryPoints = t.storyPoints && t.storyPoints > 0;
      const estadoValido = t.status !== 'qa' && t.status !== 'completed' && t.status !== 'in-progress';
      return tieneStoryPoints && estadoValido && selectedProyectos.includes(t.projectId || t.proyectoId);
    });

    const tareasYaOptimizadas = todasLasPendientes.filter(t =>
      t.assignedTo && typeof t.planningOrder === 'number'
    );
    const tareasPendientes = todasLasPendientes.filter(t =>
      !t.assignedTo || typeof t.planningOrder !== 'number'
    );

    // Combinar factores de riesgo
    const todosLosRiesgos = [];
    selectedProyectos.forEach(pid => {
      todosLosRiesgos.push(...(projectRisks[pid] || []));
    });

    // Info toast
    const mensajes = [];
    if (selectedProyectos.length < proyectos.length) {
      mensajes.push(`Proyectos: ${proyectos.filter(p => selectedProyectos.includes(p.id)).map(p => p.name).join(', ')}`);
    }
    if (tareasDoingRaw.length > 0) mensajes.push(`${tareasDoingRaw.length} tarea(s) en progreso`);
    if (tareasYaOptimizadas.length > 0) mensajes.push(`${tareasYaOptimizadas.length} tarea(s) ya optimizadas`);
    if (todosLosRiesgos.length > 0) mensajes.push(`${todosLosRiesgos.length} factor(es) de riesgo`);
    if (mensajes.length > 0) {
      setToast({ isOpen: true, message: `Optimizando: ${mensajes.join(' - ')}`, type: 'info' });
    }

    limpiar();

    // Preparar restricciones para el optimizador
    const tareasEnProgresoInvalidas = [];
    const tareasEnProgreso = tareasDoingRaw.map(t => {
      const usuario = usuarios.find(u => u.id === t.assignedTo);
      const { duracionTotal } = calcularDuracionConRiesgos(t, usuario, todosLosRiesgos);
      const dependencias = t.dependencies || [];

      // Buscar la ultima transicion pending -> in-progress en movementHistory
      let fechaInicioTrabajo = null;
      if (t.movementHistory && t.movementHistory.length > 0) {
        for (let i = t.movementHistory.length - 1; i >= 0; i--) {
          const mov = t.movementHistory[i];
          if (mov.type === 'status_change' && mov.from === 'pending' && mov.to === 'in-progress') {
            const ts = mov.timestamp;
            fechaInicioTrabajo = ts?.toDate ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
            break;
          }
        }
      }
      if (!fechaInicioTrabajo && t.lastStatusChange) {
        fechaInicioTrabajo = t.lastStatusChange.toDate ? t.lastStatusChange.toDate() : new Date(t.lastStatusChange);
      }

      let diasTranscurridos = 0;
      if (fechaInicioTrabajo) {
        diasTranscurridos = (new Date() - fechaInicioTrabajo) / (1000 * 60 * 60 * 24);
      }

      const duracionRestante = Math.max(0, duracionTotal - diasTranscurridos);

      // Verificar inconsistencias
      const depsPendientes = dependencias.filter(depId => tareasPendientes.some(tp => tp.id === depId));
      if (depsPendientes.length > 0) {
        tareasEnProgresoInvalidas.push({
          tarea: t.title || t.nombre,
          dependencias: depsPendientes.map(depId => {
            const dep = tareasPendientes.find(tp => tp.id === depId);
            return dep?.title || dep?.nombre || depId;
          })
        });
      }

      return { id: t.id, usuarioId: t.assignedTo, duracion: duracionRestante, dependencias };
    });

    const tareasOptimizadasParaAlgoritmo = tareasYaOptimizadas.map(t => {
      const usuario = usuarios.find(u => u.id === t.assignedTo);
      let duracion;
      if (t.optimizedDuration?.duracionTotal) {
        duracion = t.optimizedDuration.duracionTotal;
      } else {
        duracion = calcularDuracionConRiesgos(t, usuario, todosLosRiesgos).duracionTotal;
      }
      return { id: t.id, usuarioId: t.assignedTo, duracion, dependencias: t.dependencies || [] };
    });

    // Advertencia de inconsistencias (reemplaza alert con Toast)
    if (tareasEnProgresoInvalidas.length > 0) {
      const detalles = tareasEnProgresoInvalidas.map(item =>
        `"${item.tarea}" depende de: ${item.dependencias.join(', ')}`
      ).join('; ');
      setToast({
        isOpen: true,
        message: `Advertencia: ${tareasEnProgresoInvalidas.length} tarea(s) en progreso con dependencias pendientes: ${detalles}`,
        type: 'warning'
      });
    }

    const todasLasRestricciones = [...tareasEnProgreso, ...tareasOptimizadasParaAlgoritmo];

    const resultado = await optimizar({
      proyectos, usuarios,
      tareas: tareasPendientes,
      factoresRiesgo: todosLosRiesgos,
      tareasEnProgreso: todasLasRestricciones,
      tiempoLimite: 60
    });

    if (resultado) {
      // Calcular posiciones en el frontend (unica fuente de verdad)
      const todasLasTareasGantt = calcularPosicionesParaGantt({
        tareasOptimizador: resultado.solucion,
        tareasEnProgreso: tareasDoingRaw,
        tareasYaOptimizadas,
        usuarios,
        factoresRiesgo: todosLosRiesgos,
        proyectos,
        calcularRiesgos: calcularDuracionConRiesgos
      });

      setTareasDoing(todasLasTareasGantt);
      setShowProjectModal(false);

      let mensaje = `Optimizacion completada: ${resultado.makespan} dias`;
      const detalles = [];
      if (tareasDoingRaw.length > 0) detalles.push(`${tareasDoingRaw.length} en progreso`);
      if (tareasYaOptimizadas.length > 0) detalles.push(`${tareasYaOptimizadas.length} ya optimizadas`);
      if (detalles.length > 0) mensaje += ` (${detalles.join(', ')})`;

      setToast({ isOpen: true, message: mensaje, type: 'success' });
    }
  };

  // Función para limpiar los detalles de optimización
  const handleClearOptimizationDetails = async () => {
    setClearing(true);

    try {
      const result = await clearOptimizationDetails();

      if (result.success) {
        setToast({
          isOpen: true,
          message: `Detalles de optimización limpiados: ${result.stats.success} tarea${result.stats.success !== 1 ? 's' : ''} actualizada${result.stats.success !== 1 ? 's' : ''}`,
          type: 'success'
        });
      } else if (result.partial) {
        setToast({
          isOpen: true,
          message: `Limpieza parcial: ${result.stats.success} éxitos, ${result.stats.errors} errores`,
          type: 'warning'
        });
      } else {
        setToast({
          isOpen: true,
          message: result.message || `Error: ${result.error}`,
          type: result.message ? 'info' : 'error'
        });
      }
    } catch (error) {
      console.error('Error al limpiar optimización:', error);
      setToast({
        isOpen: true,
        message: `Error inesperado: ${error.message}`,
        type: 'error'
      });
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  // Función para guardar la optimización
  const handleSaveOptimization = async () => {
    if (!resultado || !resultado.solucion || resultado.solucion.length === 0) {
      setToast({
        isOpen: true,
        message: 'No hay resultado de optimización para guardar',
        type: 'error'
      });
      return;
    }

    setSaving(true);

    try {
      // Preparar datos de asignación
      // Agrupar tareas por usuario para asignar planningOrder secuencial
      // IMPORTANTE: Incluir tareas en progreso, ya optimizadas, y nuevas optimizadas
      // tareasDoing ya incluye tanto las en progreso como las ya optimizadas y las nuevas ajustadas
      const todasLasTareasGantt = tareasDoing;

      const tareasPorUsuario = {};
      todasLasTareasGantt.forEach(tarea => {
        if (!tareasPorUsuario[tarea.usuario]) {
          tareasPorUsuario[tarea.usuario] = [];
        }
        tareasPorUsuario[tarea.usuario].push(tarea);
      });

      // Ordenar tareas de cada usuario por diaInicio
      Object.keys(tareasPorUsuario).forEach(usuario => {
        tareasPorUsuario[usuario].sort((a, b) => a.diaInicio - b.diaInicio);
      });

      // Crear array de asignaciones con planningOrder y datos de riesgo/redondeo
      const assignmentsData = [];
      Object.entries(tareasPorUsuario).forEach(([usuarioNombre, tareasUsuario]) => {
        // Encontrar el ID del usuario por su nombre
        const usuario = usuarios.find(u =>
          (u.displayName || u.nombre) === usuarioNombre
        );

        if (!usuario) {
          console.warn(`No se encontró usuario con nombre: ${usuarioNombre}`);
          return;
        }

        tareasUsuario.forEach((tarea, index) => {
          const duracionBase = tarea.duracionBase || 0;
          const tiempoRiesgo = tarea.tiempoRiesgo || 0;
          const tiempoRedondeo = tarea.tiempoRedondeo || 0;
          const duracionTotal = duracionBase + tiempoRiesgo + tiempoRedondeo;

          assignmentsData.push({
            taskId: tarea.id,
            assignedTo: usuario.id,
            planningOrder: index,
            duracionBase,
            tiempoRiesgo,
            tiempoRiesgoUsuario: tarea.tiempoRiesgoUsuario || 0,
            tiempoRiesgoProyecto: tarea.tiempoRiesgoProyecto || 0,
            tiempoRedondeo,
            duracionTotal
          });
        });
      });

      // Guardar en Firestore
      const result = await saveOptimization(assignmentsData);

      if (result.success || result.partial) {
        const message = result.success
          ? `Optimización guardada: ${result.stats.success} tarea${result.stats.success !== 1 ? 's' : ''} actualizada${result.stats.success !== 1 ? 's' : ''}`
          : `Optimización guardada parcialmente: ${result.stats.success} éxitos, ${result.stats.errors} errores`;

        setToast({
          isOpen: true,
          message,
          type: result.success ? 'success' : 'warning'
        });

        // Opcional: limpiar resultado después de guardar
        // limpiar();
      } else {
        setToast({
          isOpen: true,
          message: `Error al guardar: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error al guardar optimización:', error);
      setToast({
        isOpen: true,
        message: `Error inesperado: ${error.message}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
      setShowSaveConfirm(false);
    }
  };

  // Mostrar error del optimizador
  useEffect(() => {
    if (error) {
      setToast({
        isOpen: true,
        message: `Error al optimizar: ${error}`,
        type: 'error'
      });
    }
  }, [error]);

  // Determinar qué tareas mostrar en el Gantt (planeadas o resultado de optimización)
  // Nota: tareasDoing ya contiene todas las tareas ajustadas (doing + optimizadas + nuevas con offset)
  const tareasGantt = resultado ? tareasDoing : tareasPlaneadas;
  const makespanRaw = tareasGantt.length > 0
    ? Math.max(...tareasGantt.map(t => t.diaFin))
    : 0;

  // Redondear makespan a 1 decimal para mostrar
  const makespan = Math.round(makespanRaw * 10) / 10;

  return (
    <>
      {toast.isOpen && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ isOpen: false, message: '', type: 'error' })}
        />
      )}

      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          columns={columns}
          allTasks={tareas}
          onClose={() => setSelectedTask(null)}
        />
      )}

      <div className="task-scheduler">
        {/* Header simple con acciones */}
        <div className="flex justify-between items-center mb-lg">
          <div className="flex items-center gap-lg">
            <div>
              <p className="text-sm text-tertiary">Tareas</p>
              <p className="text-2xl font-bold text-primary">
                {resultado ? resultado.solucion?.length || 0 : tareasPlaneadas.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-tertiary">Duración</p>
              <p className="text-2xl font-bold text-primary">{makespan} días</p>
            </div>
            <div>
              <p className="text-sm text-tertiary">Usuarios</p>
              <p className="text-2xl font-bold text-primary">
                {resultado
                  ? new Set([...tareasDoing, ...resultado.solucion].map(t => t.usuario)).size
                  : new Set(tareasPlaneadas.map(t => t.usuario)).size
                } / {usuarios.length}
              </p>
            </div>
          </div>

          <div className="flex gap-sm">
            <button
              className="btn btn-primary flex items-center gap-xs"
              onClick={() => setShowProjectModal(true)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Optimizando...
                </>
              ) : (
                <>
                  <Icon name="zap" size={18} />
                  Optimizar
                </>
              )}
            </button>
            {resultado && (
              <>
                <button
                  className="btn btn-success flex items-center gap-xs"
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="spinner"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Icon name="save" size={18} />
                      Guardar Optimización
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost flex items-center gap-xs"
                  onClick={() => limpiar()}
                  disabled={saving}
                >
                  <Icon name="x" size={18} />
                  Limpiar
                </button>
              </>
            )}
            {tareasPlaneadas.length > 0 && !resultado && (
              <button
                className="btn btn-warning flex items-center gap-xs"
                onClick={() => setShowClearConfirm(true)}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <div className="spinner"></div>
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Icon name="trash-2" size={18} />
                    Limpiar Optimización
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Resultado de optimización (si existe) */}
        {resultado && (
          <div className="card mb-lg">
            <div className="card-body p-base">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-lg">
                  <div className="flex items-center gap-xs">
                    <Icon name="check-circle" size={20} className="text-success" />
                    <span className="text-sm font-medium text-primary">Optimización completada</span>
                  </div>
                  <div className="flex items-center gap-md text-sm">
                    <span className="text-tertiary">
                      Duración: <strong className="text-primary">{resultado.makespan} días</strong>
                    </span>
                    {resultado.analisis?.impactoDias > 0 && (
                      <>
                        <span className="text-tertiary">•</span>
                        <span className="text-tertiary">
                          Riesgos: <strong className="text-warning">+{resultado.analisis.impactoDias} días</strong>
                        </span>
                      </>
                    )}
                    <span className="text-tertiary">•</span>
                    <span className="text-tertiary">
                      Tareas: <strong className="text-primary">{resultado.solucion?.length || 0}</strong>
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm flex items-center gap-xs"
                  onClick={() => limpiar()}
                >
                  <Icon name="x" size={16} />
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gantt Chart */}
        {tareasGantt.length > 0 ? (
          <CustomGanttChart
            solucion={tareasGantt}
            makespan={makespanRaw}
            proyectos={proyectos}
            usuarios={usuarios}
            onTaskClick={(ganttTask) => {
              const tareaOriginal = tareas.find(t => t.id === ganttTask.taskId);
              if (tareaOriginal) {
                setSelectedTask(tareaOriginal);
              }
            }}
          />
        ) : (
          <div className="empty-state">
            <Icon name="calendar" size={64} className="text-tertiary mb-base" />
            <h3 className="heading-3 text-secondary mb-sm">No hay tareas planificadas</h3>
            <p className="text-sm text-tertiary mb-base">
              Las tareas planificadas son aquellas que tienen usuario asignado y un orden de planificación definido.
            </p>
            <p className="text-sm text-tertiary">
              Usa el optimizador para generar una planificación automática o asigna tareas manualmente con un orden de planificación.
            </p>
          </div>
        )}
      </div>

      {/* Modal de selección de proyectos */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content optimizer-modal" onClick={e => e.stopPropagation()}>
            <div className="optimizer-modal-header">
              <h3 className="heading-3 text-primary">Seleccionar Proyectos</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowProjectModal(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="optimizer-modal-body">
              <div className="optimizer-modal-controls">
                <span className="text-xs text-tertiary">
                  {selectedProyectos.length} de {proyectos.length} seleccionados
                </span>
                <div className="flex gap-xs">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedProyectos(proyectos.map(p => p.id))}
                  >
                    Todos
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedProyectos([])}
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <div className="optimizer-modal-grid">
                {proyectos.map(proyecto => {
                  const tareasProyecto = tareas.filter(t =>
                    (t.projectId || t.proyectoId) === proyecto.id &&
                    t.storyPoints &&
                    t.storyPoints > 0 &&
                    t.status !== 'qa' &&
                    t.status !== 'completed' &&
                    !t.archived
                  );
                  const isSelected = selectedProyectos.includes(proyecto.id);

                  return (
                    <div
                      key={proyecto.id}
                      className={`optimizer-project-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedProyectos(selectedProyectos.filter(id => id !== proyecto.id));
                        } else {
                          setSelectedProyectos([...selectedProyectos, proyecto.id]);
                        }
                      }}
                    >
                      <div className="optimizer-card-header">
                        <div
                          className="optimizer-card-color"
                          style={{ backgroundColor: proyecto.color || '#6B7280' }}
                        />
                        <span className="text-sm font-medium text-primary">{proyecto.name}</span>
                      </div>
                      <div className="optimizer-card-footer">
                        <span className="text-xs text-tertiary">
                          {tareasProyecto.length} tarea{tareasProyecto.length !== 1 ? 's' : ''}
                        </span>
                        {isSelected && (
                          <Icon name="check-circle" size={16} className="optimizer-check-icon" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="optimizer-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowProjectModal(false);
                  handleOptimizar();
                }}
                disabled={selectedProyectos.length === 0}
              >
                Optimizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de guardado */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="Guardar Optimización"
        message={
          <div>
            <p className="text-base text-secondary mb-sm">
              Esto asignará las tareas a los usuarios según el resultado de la optimización y guardará el orden de ejecución.
            </p>
            <p className="text-sm text-tertiary mb-sm">
              <strong>Nota importante:</strong> Si más adelante cambias manualmente el usuario asignado a una tarea, esto podría afectar el orden de ejecución optimizado.
            </p>
            <p className="text-sm text-tertiary">
              Las tareas mantendrán su orden relativo (no se guardan fechas específicas), por lo que si alguna tarea se atrasa, las siguientes se correrán automáticamente.
            </p>
          </div>
        }
        onConfirm={handleSaveOptimization}
        onCancel={() => setShowSaveConfirm(false)}
        confirmText="Guardar"
        confirmVariant="primary"
      />

      {/* Confirmación de limpieza de optimización */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Limpiar Optimización"
        message={
          <div>
            <p className="text-base text-secondary mb-sm">
              Esto eliminará los detalles de optimización de todas las tareas (orden de planificación, duraciones calculadas, etc.).
            </p>
            <p className="text-sm text-tertiary mb-sm">
              <strong>Se mantendrá:</strong> La asignación de usuarios (assignedTo)
            </p>
            <p className="text-sm text-tertiary">
              <strong>Se eliminará:</strong> Orden de planificación, fechas de optimización y detalles de duración calculada
            </p>
          </div>
        }
        onConfirm={handleClearOptimizationDetails}
        onCancel={() => setShowClearConfirm(false)}
        confirmText="Limpiar"
        confirmVariant="warning"
      />
    </>
  );
};

export default TaskScheduler;
