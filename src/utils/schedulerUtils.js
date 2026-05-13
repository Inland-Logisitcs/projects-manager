/**
 * Shared utilities for task scheduling and Gantt chart calculations.
 * Used by TaskScheduler and SimulationTab.
 */

/**
 * Avanza desde un día calendario de inicio contando N días de trabajo,
 * saltando días no laborables. Retorna el día calendario donde termina.
 */
export const avanzarDiasLaborables = (diaInicio, diasTrabajo, diasLaborables) => {
  if (!diasLaborables || diasLaborables.length === 0 || diasLaborables.length === 7) {
    return diaInicio + diasTrabajo;
  }

  const diasLabSet = new Set(diasLaborables);
  const unidadesTrabajo = Math.ceil(diasTrabajo * 2);

  if (!isFinite(unidadesTrabajo) || unidadesTrabajo <= 0) return diaInicio;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

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
  let safetyCounter = 0;

  while (medioDiasTrabajados < unidadesTrabajo) {
    if (++safetyCounter > 20000) { console.warn('avanzarDiasLaborables: limite de iteraciones alcanzado'); break; }
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

  return diaInicio + diasTrabajo;
};

/**
 * Calcula duración total de una tarea incluyendo riesgos y redondeo a 0.5 días.
 */
export const calcularDuracionConRiesgos = (tarea, usuario, factoresRiesgo) => {
  const rawCapacidad = usuario?.dailyCapacity ?? usuario?.capacidadDiaria;
  const capacidad = (typeof rawCapacidad === 'number' && rawCapacidad > 0) ? rawCapacidad : 1;
  const storyPoints = Number(tarea.storyPoints) || 0;
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
 */
export const calcularPosicionesParaGantt = ({
  tareasOptimizador = [],
  tareasEnProgreso = [],
  tareasYaOptimizadas = [],
  usuarios,
  factoresRiesgo,
  proyectos,
  calcularRiesgos = calcularDuracionConRiesgos,
  optimista = false
}) => {
  const resultado = [];

  const getDuracionEfectiva = (durBase, durTotal) => {
    if (optimista) return Math.ceil((durBase || 0) * 2) / 2;
    return durTotal;
  };

  const posicionUsuario = {};

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

    let riesgos;
    const freshRiesgos = calcularRiesgos(t, usuario, factoresRiesgo);
    if (t.optimizedDuration) {
      const duracionBase = freshRiesgos.duracionBase;
      const tiempoRiesgo = t.optimizedDuration.tiempoRiesgo || 0;
      const tiempoRiesgoUsuario = t.optimizedDuration.tiempoRiesgoUsuario || 0;
      const tiempoRiesgoProyecto = t.optimizedDuration.tiempoRiesgoProyecto || 0;
      const duracionSinRedondeo = duracionBase + tiempoRiesgo;
      const duracionTotal = Math.ceil(duracionSinRedondeo * 2) / 2;
      const tiempoRedondeo = duracionTotal - duracionSinRedondeo;
      riesgos = { duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, tiempoRedondeo, duracionTotal };
    } else {
      riesgos = freshRiesgos;
    }

    const diasLab = getDiasLab(t.assignedTo);
    let diasTranscurridos = 0;
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
    if (fechaInicioTrabajo) {
      diasTranscurridos = (new Date() - fechaInicioTrabajo) / (1000 * 60 * 60 * 24);
    }

    const diaInicio = Math.round(-diasTranscurridos * 2) / 2;
    const diaFin = avanzarDiasLaborables(diaInicio, getDuracionEfectiva(riesgos.duracionBase, riesgos.duracionTotal), diasLab);

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

    posicionUsuario[t.assignedTo] = Math.max(posicionUsuario[t.assignedTo] || 0, diaFin);
  });

  // 2. Tareas ya optimizadas
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
      const freshRiesgos = calcularRiesgos(t, usuario, factoresRiesgo);
      let duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, tiempoRedondeo, duracionTotal;

      if (t.optimizedDuration) {
        duracionBase = freshRiesgos.duracionBase;
        tiempoRiesgo = t.optimizedDuration.tiempoRiesgo || 0;
        tiempoRiesgoUsuario = t.optimizedDuration.tiempoRiesgoUsuario || 0;
        tiempoRiesgoProyecto = t.optimizedDuration.tiempoRiesgoProyecto || 0;
        const duracionSinRedondeo = duracionBase + tiempoRiesgo;
        duracionTotal = Math.ceil(duracionSinRedondeo * 2) / 2;
        tiempoRedondeo = duracionTotal - duracionSinRedondeo;
      } else {
        ({ duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, tiempoRedondeo, duracionTotal } = freshRiesgos);
      }

      const diaInicio = Math.max(posicionUsuario[userId] || 0, 0);
      const diaFin = avanzarDiasLaborables(diaInicio, getDuracionEfectiva(duracionBase, duracionTotal), diasLab);

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

  // 3. Tareas nuevas del optimizador
  const tareasOrdenadas = [...tareasOptimizador].sort((a, b) => (a.ordenGlobal || 0) - (b.ordenGlobal || 0));
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

    let diaInicio = posicionUsuario[t.usuarioId] || 0;
    if (t.dependencias && t.dependencias.length > 0) {
      t.dependencias.forEach(depId => {
        if (finPorTarea[depId] !== undefined) {
          diaInicio = Math.max(diaInicio, finPorTarea[depId]);
        }
      });
    }

    const diaFin = avanzarDiasLaborables(diaInicio, getDuracionEfectiva(riesgos.duracionBase, riesgos.duracionTotal), diasLab);

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
 * Convierte un número de día relativo a una fecha legible.
 */
export const diaRelativoAFecha = (diaRelativo) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(hoy);
  fecha.setDate(hoy.getDate() + Math.ceil(diaRelativo));
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};
