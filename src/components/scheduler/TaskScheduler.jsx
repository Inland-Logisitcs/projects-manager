import { useState, useEffect } from 'react';
import { useOptimizer } from '../../hooks/useOptimizer';
import { subscribeToUsers } from '../../services/userService';
import { saveOptimization } from '../../services/taskService';
import Icon from '../common/Icon';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import CustomGanttChart from './CustomGanttChart';
import TaskDetailSidebar from '../kanban/TaskDetailSidebar';
import '../../styles/TaskScheduler.css';

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

    // Separar tareas en progreso y pendientes
    const tareasEnProgreso = tareasConPlanificacion.filter(t => t.status === 'in-progress');
    const tareasPendientes = tareasConPlanificacion.filter(t => t.status !== 'in-progress');

    // Agrupar por usuario y ordenar por planningOrder
    const tareasPorUsuario = {};
    tareasConPlanificacion.forEach(tarea => {
      if (!tareasPorUsuario[tarea.assignedTo]) {
        tareasPorUsuario[tarea.assignedTo] = [];
      }
      tareasPorUsuario[tarea.assignedTo].push(tarea);
    });

    // Ordenar tareas de cada usuario por planningOrder
    Object.keys(tareasPorUsuario).forEach(usuarioId => {
      tareasPorUsuario[usuarioId].sort((a, b) => a.planningOrder - b.planningOrder);
    });

    // Convertir a formato Gantt
    const tareasGantt = [];

    Object.entries(tareasPorUsuario).forEach(([usuarioId, tareasUsuario]) => {
      const usuario = usuarios.find(u => u.id === usuarioId);
      if (!usuario) return;

      const capacidad = usuario.dailyCapacity || usuario.capacidadDiaria || 1;

      // Procesar cada tarea del usuario
      tareasUsuario.forEach((tarea, index) => {
        // Usar la duración optimizada si existe, sino calcular basándose en story points
        let duracion, duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, tiempoRedondeo;

        if (tarea.optimizedDuration) {
          // Usar datos guardados del optimizador
          duracionBase = tarea.optimizedDuration.duracionBase || 0;
          tiempoRiesgo = tarea.optimizedDuration.tiempoRiesgo || 0;
          tiempoRiesgoUsuario = tarea.optimizedDuration.tiempoRiesgoUsuario || 0;
          tiempoRiesgoProyecto = tarea.optimizedDuration.tiempoRiesgoProyecto || 0;
          tiempoRedondeo = tarea.optimizedDuration.tiempoRedondeo || 0;
          duracion = tarea.optimizedDuration.duracionTotal || duracionBase + tiempoRiesgo + tiempoRedondeo;
        } else {
          // Calcular duración simple basándose en story points
          duracionBase = tarea.storyPoints ? (tarea.storyPoints / capacidad) : 1;
          duracion = duracionBase;
          tiempoRiesgo = 0;
          tiempoRiesgoUsuario = 0;
          tiempoRiesgoProyecto = 0;
          tiempoRedondeo = 0;
        }

        // Calcular posición de inicio y días transcurridos
        let diaInicio = 0;
        let diasTranscurridos = 0;

        if (tarea.status === 'in-progress' && tarea.lastStatusChange) {
          // Tarea en progreso: calcular días negativos
          const fechaInicio = tarea.lastStatusChange.toDate ? tarea.lastStatusChange.toDate() : new Date(tarea.lastStatusChange);
          const ahora = new Date();
          const diferenciaMs = ahora - fechaInicio;
          diasTranscurridos = diferenciaMs / (1000 * 60 * 60 * 24);

          // Empezar en negativo según días transcurridos
          diaInicio = -diasTranscurridos;
        } else {
          // Tarea pendiente: calcular inicio basándose en tareas anteriores del mismo usuario
          // Encontrar la última tarea anterior que termine más tarde
          let maxFinAnterior = 0;
          for (let i = 0; i < index; i++) {
            const tareaAnterior = tareasUsuario[i];
            const tareaAnteriorGantt = tareasGantt.find(t => t.id === tareaAnterior.id);
            if (tareaAnteriorGantt) {
              maxFinAnterior = Math.max(maxFinAnterior, tareaAnteriorGantt.diaFin);
            }
          }
          diaInicio = maxFinAnterior;
        }

        const diaFin = diaInicio + duracion;

        tareasGantt.push({
          id: tarea.id,
          nombre: tarea.title || tarea.nombre,
          usuario: usuario.displayName || usuario.nombre || 'Sin nombre',
          proyectoId: tarea.projectId || tarea.proyectoId,
          proyectoNombre: proyectos.find(p => p.id === (tarea.projectId || tarea.proyectoId))?.name || 'Sin proyecto',
          diaInicio: diaInicio,
          diaFin: diaFin,
          duracion: duracion,
          duracionBase: duracionBase,
          tiempoRiesgo: tiempoRiesgo,
          tiempoRiesgoUsuario: tiempoRiesgoUsuario,
          tiempoRiesgoProyecto: tiempoRiesgoProyecto,
          duracionAntesCeil: duracionBase + tiempoRiesgo, // Para el overlay de redondeo
          storyPoints: tarea.storyPoints,
          forzado: true, // Las tareas planeadas son "forzadas"
          enProgreso: tarea.status === 'in-progress',
          planningOrder: tarea.planningOrder,
          dependencias: tarea.dependencies || [], // Incluir dependencias
          diasTranscurridos: diasTranscurridos // Para el tooltip
        });
      });
    });

    setTareasPlaneadas(tareasGantt);
  }, [tareas, usuarios, proyectos]);

  // Función helper para calcular duración con riesgos
  const calcularDuracionConRiesgos = (tarea, usuario, factoresRiesgo) => {
    const capacidad = usuario?.dailyCapacity || usuario?.capacidadDiaria || 1;
    const storyPoints = tarea.storyPoints || 0;
    const duracionBase = storyPoints / capacidad;

    // Buscar riesgos aplicables
    let porcentajeUsuario = 0;
    let porcentajeProyecto = 0;
    let diasExtra = 0;

    factoresRiesgo.forEach(riesgo => {
      // Riesgo específico del usuario para esta tarea
      if (riesgo.usuarioId === tarea.assignedTo && riesgo.tareaId === tarea.id) {
        porcentajeUsuario = riesgo.porcentajeExtra || 0;
        diasExtra += riesgo.diasExtra || 0;
      }
      // Riesgo del usuario para todo el proyecto
      else if (riesgo.usuarioId === tarea.assignedTo && riesgo.proyectoId === (tarea.projectId || tarea.proyectoId)) {
        porcentajeUsuario = riesgo.porcentajeExtra || 0;
        diasExtra += riesgo.diasExtra || 0;
      }
      // Riesgo general para esta tarea (sin usuarioId)
      else if (!riesgo.usuarioId && riesgo.tareaId === tarea.id) {
        porcentajeProyecto = riesgo.porcentajeExtra || 0;
        diasExtra += riesgo.diasExtra || 0;
      }
      // Riesgo general del proyecto (sin usuarioId)
      else if (!riesgo.usuarioId && riesgo.proyectoId === (tarea.projectId || tarea.proyectoId)) {
        porcentajeProyecto = riesgo.porcentajeExtra || 0;
        diasExtra += riesgo.diasExtra || 0;
      }
    });

    // Calcular riesgo en story points primero, luego convertir a días
    // Esto es importante para usuarios part-time
    const riesgoUsuarioEnSP = storyPoints * porcentajeUsuario;
    const riesgoProyectoEnSP = storyPoints * porcentajeProyecto;
    const tiempoRiesgoUsuario = riesgoUsuarioEnSP / capacidad;
    const tiempoRiesgoProyecto = riesgoProyectoEnSP / capacidad;
    const tiempoRiesgoTotal = tiempoRiesgoUsuario + tiempoRiesgoProyecto + diasExtra;
    const duracionTotal = duracionBase + tiempoRiesgoTotal;

    return {
      duracionBase,
      tiempoRiesgo: tiempoRiesgoTotal,
      tiempoRiesgoUsuario,
      tiempoRiesgoProyecto,
      duracion: duracionTotal
    };
  };

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
    // Validar datos
    const errorValidacion = validarDatos();
    if (errorValidacion) {
      setToast({
        isOpen: true,
        message: errorValidacion,
        type: 'error'
      });
      return;
    }

    // Validar que haya al menos un proyecto seleccionado
    if (selectedProyectos.length === 0) {
      setToast({
        isOpen: true,
        message: 'Debes seleccionar al menos un proyecto para optimizar',
        type: 'error'
      });
      return;
    }

    // Separar tareas en doing (en progreso) y pendientes, filtrando por proyectos seleccionados
    const tareasDoing = tareas.filter(t =>
      t.status === 'in-progress' &&
      t.storyPoints &&
      t.storyPoints > 0 &&
      selectedProyectos.includes(t.projectId || t.proyectoId)
    );

    // Filtrar tareas pendientes (ni doing, ni terminadas) y de proyectos seleccionados
    const todasLasPendientes = tareas.filter(t => {
      const tieneStoryPoints = t.storyPoints && t.storyPoints > 0;
      const estadoValido = t.status !== 'qa' && t.status !== 'completed' && t.status !== 'in-progress';
      const proyectoSeleccionado = selectedProyectos.includes(t.projectId || t.proyectoId);
      return tieneStoryPoints && estadoValido && proyectoSeleccionado;
    });

    // Separar las pendientes en: ya optimizadas vs. no optimizadas
    const tareasYaOptimizadas = todasLasPendientes.filter(t =>
      t.assignedTo && typeof t.planningOrder === 'number'
    );

    const tareasPendientes = todasLasPendientes.filter(t =>
      !t.assignedTo || typeof t.planningOrder !== 'number'
    );

    // Contar tareas excluidas y ya optimizadas
    const tareasExcluidasPorProyecto = tareas.filter(t => {
      const tieneStoryPoints = t.storyPoints && t.storyPoints > 0;
      const estadoValido = t.status !== 'qa' && t.status !== 'completed' && t.status !== 'in-progress';
      const proyectoNoSeleccionado = !selectedProyectos.includes(t.projectId || t.proyectoId);
      return tieneStoryPoints && estadoValido && proyectoNoSeleccionado;
    }).length;

    const numTareasYaOptimizadas = tareasYaOptimizadas.length;

    // Filtrar usuarios con capacidad válida
    const usuariosValidos = usuarios.filter(u => {
      const capacidad = u.dailyCapacity || u.capacidadDiaria || 0;
      return capacidad > 0;
    });
    const usuariosSinCapacidad = usuarios.length - usuariosValidos.length;

    // Combinar factores de riesgo de cada proyecto seleccionado
    const todosLosRiesgos = [];
    selectedProyectos.forEach(proyectoId => {
      const riesgosProyecto = projectRisks[proyectoId] || [];
      todosLosRiesgos.push(...riesgosProyecto);
    });

    // Mostrar info sobre optimización
    const mensajes = [];
    const proyectosSeleccionadosNombres = proyectos
      .filter(p => selectedProyectos.includes(p.id))
      .map(p => p.name)
      .join(', ');

    if (selectedProyectos.length < proyectos.length) {
      mensajes.push(`Proyectos: ${proyectosSeleccionadosNombres}`);
    }
    if (tareasDoing.length > 0) {
      mensajes.push(`${tareasDoing.length} tarea(s) en progreso`);
    }
    if (numTareasYaOptimizadas > 0) {
      mensajes.push(`${numTareasYaOptimizadas} tarea(s) ya optimizadas (se mantendrán)`);
    }
    if (tareasExcluidasPorProyecto > 0) {
      mensajes.push(`${tareasExcluidasPorProyecto} tarea(s) de proyectos no seleccionados`);
    }
    if (usuariosSinCapacidad > 0) {
      mensajes.push(`${usuariosSinCapacidad} usuario(s) sin capacidad`);
    }
    if (todosLosRiesgos.length > 0) {
      mensajes.push(`${todosLosRiesgos.length} factor(es) de riesgo`);
    }

    if (mensajes.length > 0) {
      setToast({
        isOpen: true,
        message: `Optimizando: ${mensajes.join(' • ')}`,
        type: 'info'
      });
    }

    // Limpiar resultados anteriores
    limpiar();

    // Preparar info de tareas en progreso para el optimizador
    // IMPORTANTE: Validar que las tareas en progreso no tengan dependencias pendientes
    const tareasEnProgresoInvalidas = [];
    const tareasEnProgreso = tareasDoing
      .map(t => {
        const usuario = usuarios.find(u => u.id === t.assignedTo);
        const { duracion } = calcularDuracionConRiesgos(t, usuario, todosLosRiesgos);
        const dependencias = t.dependencies || [];

        // Calcular cuántos días lleva la tarea en progreso
        let diasTranscurridos = 0;
        if (t.lastStatusChange) {
          const fechaInicio = t.lastStatusChange.toDate ? t.lastStatusChange.toDate() : new Date(t.lastStatusChange);
          const ahora = new Date();
          const diferenciaMs = ahora - fechaInicio;
          diasTranscurridos = diferenciaMs / (1000 * 60 * 60 * 24);
        }

        // Calcular duración RESTANTE (no la duración total)
        // Si la tarea lleva 1.2 días en progreso y la duración total es 3 días,
        // entonces quedan 1.8 días
        const duracionRestante = Math.max(0, duracion - diasTranscurridos);

        // Verificar si alguna dependencia está en tareasPendientes (inconsistencia)
        const dependenciasPendientes = dependencias.filter(depId =>
          tareasPendientes.some(tp => tp.id === depId)
        );

        if (dependenciasPendientes.length > 0) {
          tareasEnProgresoInvalidas.push({
            tarea: t.title || t.nombre,
            dependencias: dependenciasPendientes.map(depId => {
              const dep = tareasPendientes.find(tp => tp.id === depId);
              return dep?.title || dep?.nombre || depId;
            })
          });
        }

        return {
          id: t.id,
          usuarioId: t.assignedTo,
          duracion: duracionRestante, // Usar duración restante en lugar de duración total
          dependencias: dependencias // Incluir dependencias para verificación cruzada
        };
      });

    // Preparar tareas ya optimizadas para pasar al optimizador como restricciones
    // IMPORTANTE: Pasar cada tarea individualmente para que el optimizador las trate como
    // tareas forzadas ya asignadas. El optimizador debe posicionar las tareas nuevas DESPUÉS.
    const tareasOptimizadasParaAlgoritmo = tareasYaOptimizadas.map(t => {
      const usuario = usuarios.find(u => u.id === t.assignedTo);

      // Usar la duración optimizada guardada si existe, sino calcular
      let duracion;
      if (t.optimizedDuration && t.optimizedDuration.duracionTotal) {
        duracion = t.optimizedDuration.duracionTotal;
      } else {
        const result = calcularDuracionConRiesgos(t, usuario, todosLosRiesgos);
        duracion = result.duracion;
      }

      return {
        id: t.id,
        usuarioId: t.assignedTo,
        duracion: duracion,
        dependencias: t.dependencies || []
      };
    });

    console.log('📦 Tareas ya optimizadas como restricciones:', tareasOptimizadasParaAlgoritmo.map(r => ({
      nombre: tareasYaOptimizadas.find(t => t.id === r.id)?.title,
      usuario: usuarios.find(u => u.id === r.usuarioId)?.displayName,
      duracion: r.duracion
    })));

    // Mostrar advertencia si hay inconsistencias
    if (tareasEnProgresoInvalidas.length > 0) {
      const mensajes = tareasEnProgresoInvalidas.map(item =>
        `• "${item.tarea}" depende de: ${item.dependencias.join(', ')}`
      ).join('\n');

      console.warn('⚠️ Inconsistencia detectada: Tareas en progreso con dependencias pendientes:\n' + mensajes);
      alert(
        `Advertencia: ${tareasEnProgresoInvalidas.length} tarea(s) en progreso tienen dependencias sin completar:\n\n${mensajes}\n\nEstas tareas deberían estar pendientes hasta que sus dependencias estén completas.`
      );
    }

    // Combinar tareas en progreso y ya optimizadas como restricciones
    const todasLasRestricciones = [...tareasEnProgreso, ...tareasOptimizadasParaAlgoritmo];

    // Optimizar solo tareas pendientes no optimizadas
    const resultado = await optimizar({
      proyectos,
      usuarios,
      tareas: tareasPendientes,
      factoresRiesgo: todosLosRiesgos,
      tareasEnProgreso: todasLasRestricciones, // Pasar ambas como restricciones
      tiempoLimite: 60
    });

    if (resultado) {
      // Preparar tareas ya optimizadas para mostrar en Gantt
      const tareasOptimizadasGantt = tareasYaOptimizadas.map(t => {
        const usuario = usuarios.find(u => u.id === t.assignedTo);

        // Usar duración optimizada guardada si existe
        let duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, duracion;
        if (t.optimizedDuration) {
          duracionBase = t.optimizedDuration.duracionBase || 0;
          tiempoRiesgo = t.optimizedDuration.tiempoRiesgo || 0;
          tiempoRiesgoUsuario = t.optimizedDuration.tiempoRiesgoUsuario || 0;
          tiempoRiesgoProyecto = t.optimizedDuration.tiempoRiesgoProyecto || 0;
          duracion = t.optimizedDuration.duracionTotal || duracionBase + tiempoRiesgo;
        } else {
          const result = calcularDuracionConRiesgos(t, usuario, todosLosRiesgos);
          duracionBase = result.duracionBase;
          tiempoRiesgo = result.tiempoRiesgo;
          tiempoRiesgoUsuario = result.tiempoRiesgoUsuario;
          tiempoRiesgoProyecto = result.tiempoRiesgoProyecto;
          duracion = result.duracion;
        }

        return {
          id: t.id,
          nombre: t.title || t.nombre,
          usuario: usuario?.displayName || usuario?.nombre || 'Sin asignar',
          proyectoId: t.projectId || t.proyectoId,
          proyectoNombre: proyectos.find(p => p.id === (t.projectId || t.proyectoId))?.name || '',
          storyPoints: t.storyPoints,
          diaInicio: 0, // Se calculará después
          diaFin: duracion, // Se calculará después
          duracion: duracion,
          duracionBase: duracionBase,
          duracionAntesCeil: duracionBase + tiempoRiesgo,
          tiempoRiesgo: tiempoRiesgo,
          tiempoRiesgoUsuario: tiempoRiesgoUsuario,
          tiempoRiesgoProyecto: tiempoRiesgoProyecto,
          forzado: true, // Marcar como forzadas (ya optimizadas)
          enProgreso: false,
          planningOrder: t.planningOrder,
          dependencias: t.dependencies || [] // Incluir dependencias
        };
      });

      // Guardar tareas doing para mostrarlas en el Gantt
      // IMPORTANTE: usar los mismos nombres de campo que espera GanttChart
      const tareasDoingGantt = tareasDoing.map(t => {
        const usuario = usuarios.find(u => u.id === t.assignedTo);
        const { duracionBase, tiempoRiesgo, tiempoRiesgoUsuario, tiempoRiesgoProyecto, duracion } =
          calcularDuracionConRiesgos(t, usuario, todosLosRiesgos);

        // Calcular cuántos días lleva la tarea en progreso
        let diasTranscurridos = 0;
        if (t.lastStatusChange) {
          // lastStatusChange puede ser un Timestamp de Firebase o un Date
          const fechaInicio = t.lastStatusChange.toDate ? t.lastStatusChange.toDate() : new Date(t.lastStatusChange);
          const ahora = new Date();
          const diferenciaMs = ahora - fechaInicio;
          diasTranscurridos = diferenciaMs / (1000 * 60 * 60 * 24); // Convertir ms a días (con decimales)
        }

        // Ajustar diaInicio y diaFin para que la tarea empiece en negativo si ya lleva días en progreso
        const diaInicio = -diasTranscurridos;
        const diaFin = diaInicio + duracion;

        return {
          id: t.id,
          nombre: t.title || t.nombre,
          usuario: usuario?.displayName || usuario?.nombre || 'Sin asignar',
          proyectoId: t.projectId || t.proyectoId,
          proyectoNombre: proyectos.find(p => p.id === (t.projectId || t.proyectoId))?.name || '',
          storyPoints: t.storyPoints,
          diaInicio: diaInicio,
          diaFin: diaFin,
          duracion: duracion,
          duracionBase: duracionBase,
          duracionAntesCeil: duracionBase + tiempoRiesgo, // Suma exacta antes de redondeo
          tiempoRiesgo: tiempoRiesgo,
          tiempoRiesgoUsuario: tiempoRiesgoUsuario,
          tiempoRiesgoProyecto: tiempoRiesgoProyecto,
          forzado: false,
          enProgreso: true, // Marcar como en progreso para visual feedback
          diasTranscurridos: diasTranscurridos, // Información adicional para el tooltip
          dependencias: t.dependencies || [] // Incluir dependencias
        };
      });

      // Ahora calcular las posiciones de las tareas ya optimizadas
      // Ordenar por planningOrder dentro de cada usuario
      const tareasOptimizadasPorUsuario = {};
      tareasOptimizadasGantt.forEach(tarea => {
        if (!tareasOptimizadasPorUsuario[tarea.usuario]) {
          tareasOptimizadasPorUsuario[tarea.usuario] = [];
        }
        tareasOptimizadasPorUsuario[tarea.usuario].push(tarea);
      });

      // Ordenar tareas de cada usuario por planningOrder
      Object.keys(tareasOptimizadasPorUsuario).forEach(usuario => {
        tareasOptimizadasPorUsuario[usuario].sort((a, b) => a.planningOrder - b.planningOrder);
      });

      // Calcular posición de inicio y fin basándose en las tareas doing
      Object.entries(tareasOptimizadasPorUsuario).forEach(([usuario, tareas]) => {
        // Buscar la última tarea doing de este usuario
        const tareasDoingUsuario = tareasDoingGantt.filter(t => t.usuario === usuario);
        let maxFin = tareasDoingUsuario.length > 0
          ? Math.max(...tareasDoingUsuario.map(t => t.diaFin))
          : 0;

        // Posicionar cada tarea optimizada secuencialmente
        tareas.forEach(tarea => {
          tarea.diaInicio = maxFin;
          tarea.diaFin = maxFin + tarea.duracion;
          maxFin = tarea.diaFin;
        });
      });

      // Ajustar las posiciones de las tareas nuevas del resultado
      // para que empiecen DESPUÉS de las tareas ya optimizadas
      console.log('🔧 Ajustando posiciones de tareas nuevas...');
      console.log('Tareas del resultado.solucion:', resultado.solucion.map(t => ({
        id: t.id,
        nombre: t.nombre,
        usuario: t.usuario,
        diaInicio: t.diaInicio,
        diaFin: t.diaFin
      })));

      const tareasNuevasAjustadas = resultado.solucion.map(tarea => {
        // El resultado.solucion ya viene con el campo 'usuario' como nombre (string)
        const usuarioNombre = tarea.usuario;

        // Buscar la última tarea (doing + ya optimizada) de este usuario
        const tareasUsuario = [...tareasDoingGantt, ...tareasOptimizadasGantt]
          .filter(t => t.usuario === usuarioNombre);

        console.log(`Usuario "${usuarioNombre}": ${tareasUsuario.length} tareas existentes`);
        if (tareasUsuario.length > 0) {
          console.log(`  → Tareas existentes:`, tareasUsuario.map(t => ({
            nombre: t.nombre,
            diaInicio: t.diaInicio,
            diaFin: t.diaFin
          })));
        }

        // NOTA: El optimizador ya devuelve las tareas con posiciones considerando las restricciones
        // No necesitamos ajustar el offset, las posiciones ya son correctas
        console.log(`  ℹ️ Tarea "${tarea.nombre}" sin ajuste: diaInicio=${tarea.diaInicio}, diaFin=${tarea.diaFin}`);

        return tarea; // Devolver sin modificar
      });

      // Guardar tareas doing, optimizadas, y nuevas (ajustadas) en estado
      const todasLasTareasParaGantt = [...tareasDoingGantt, ...tareasOptimizadasGantt, ...tareasNuevasAjustadas];

      // Debug: verificar dependencias
      const tareasConDeps = todasLasTareasParaGantt.filter(t => t.dependencias && t.dependencias.length > 0);
      console.log('📊 Tareas con dependencias para Gantt:', tareasConDeps.map(t => ({
        id: t.id,
        nombre: t.nombre,
        dependencias: t.dependencias
      })));

      setTareasDoing(todasLasTareasParaGantt);

      setShowProjectModal(false);

      const tareasDoingCount = tareasDoing.length;
      const tareasOptimizadasCount = tareasYaOptimizadas.length;
      let mensaje = `Optimización completada: ${resultado.makespan} días`;

      if (tareasDoingCount > 0 || tareasOptimizadasCount > 0) {
        const detalles = [];
        if (tareasDoingCount > 0) detalles.push(`${tareasDoingCount} en progreso`);
        if (tareasOptimizadasCount > 0) detalles.push(`${tareasOptimizadasCount} ya optimizadas`);
        mensaje += ` (${detalles.join(', ')})`;
      }

      setToast({
        isOpen: true,
        message: mensaje,
        type: 'success'
      });
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
          // Calcular redondeo a 0.5 días
          const duracionBase = tarea.duracionBase || 0;
          const tiempoRiesgo = tarea.tiempoRiesgo || 0;
          const duracionAntesCeil = duracionBase + tiempoRiesgo;
          const duracionRedondeada = Math.ceil(duracionAntesCeil * 2) / 2;
          const tiempoRedondeo = duracionRedondeada - duracionAntesCeil;

          assignmentsData.push({
            taskId: tarea.id,
            assignedTo: usuario.id,
            planningOrder: index, // 0, 1, 2, ... en orden de ejecución
            // Información de duración y riesgos
            duracionBase: duracionBase,
            tiempoRiesgo: tiempoRiesgo,
            tiempoRiesgoUsuario: tarea.tiempoRiesgoUsuario || 0,
            tiempoRiesgoProyecto: tarea.tiempoRiesgoProyecto || 0,
            tiempoRedondeo: tiempoRedondeo,
            duracionTotal: duracionRedondeada
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
    </>
  );
};

export default TaskScheduler;
