/**
 * API Service para comunicación con Firebase Cloud Function de optimización
 */

// URL de la Cloud Function
const CLOUD_FUNCTION_URL = import.meta.env.VITE_OPTIMIZER_FUNCTION_URL ||
  'http://localhost:5001/production-inland/us-central1/optimize_tasks'; // URL del emulador local

/**
 * Transformar datos de Firebase al formato esperado por el optimizador
 */
const transformarDatos = (proyectos, usuarios, tareas, factoresRiesgo = []) => {
  // Filtrar usuarios con capacidad válida (> 0)
  const usuariosValidos = usuarios.filter(u => {
    const capacidad = u.dailyCapacity || u.capacidadDiaria || 0;
    return capacidad > 0;
  });

  return {
    proyectos: proyectos.map(p => ({
      id: p.id,
      nombre: p.name || p.nombre,
      color: p.color || '#3B82F6',
      prioridad: p.priority !== undefined ? Number(p.priority) : 999
    })),
    usuarios: usuariosValidos.map(u => ({
      id: u.id,
      nombre: u.displayName || u.nombre,
      capacidadDiaria: Number(u.dailyCapacity || u.capacidadDiaria),
      proyectosAsignados: u.projectsAssigned || u.proyectosAsignados || [],
      diasLaborables: u.workingDays || [1, 2, 3, 4, 5]
    })),
    tareas: tareas.map(t => ({
      id: t.id,
      nombre: t.title || t.nombre,
      proyectoId: t.projectId || t.proyectoId,
      storyPoints: Number(t.storyPoints || 3),
      dependencias: t.dependencies || t.dependencias || [],
      usuarioForzado: t.assignedTo || t.usuarioForzado || null
    })),
    factoresRiesgo: factoresRiesgo.map(r => ({
      usuarioId: r.userId || r.usuarioId,
      proyectoId: r.projectId || r.proyectoId,
      tareaId: r.taskId || r.tareaId,
      porcentajeExtra: Number(r.extraPercentage || r.porcentajeExtra || 0),
      diasExtra: Number(r.extraDays || r.diasExtra || 0),
      razon: r.reason || r.razon || ''
    }))
  };
};

/**
 * Servicio de API para el optimizador
 */
export const optimizerApi = {
  /**
   * Optimizar asignación de tareas
   * @param {Object} params - Parámetros de optimización
   * @param {Array} params.proyectos - Lista de proyectos
   * @param {Array} params.usuarios - Lista de usuarios
   * @param {Array} params.tareas - Lista de tareas
   * @param {Array} params.factoresRiesgo - Factores de riesgo (opcional)
   * @param {Array} params.tareasEnProgreso - Tareas en progreso (opcional)
   * @param {number} params.tiempoLimite - Tiempo límite en segundos (default: 60)
   * @returns {Promise<Object>} Resultado de optimización
   */
  async optimize({ proyectos, usuarios, tareas, factoresRiesgo = [], tareasEnProgreso = [], tiempoLimite = 60 }) {
    try {
      // Validaciones básicas
      if (!usuarios || usuarios.length === 0) {
        throw new Error('Debe haber al menos un usuario');
      }

      if (!tareas || tareas.length === 0) {
        throw new Error('Debe haber al menos una tarea');
      }

      // Transformar datos al formato del optimizador
      const payload = {
        ...transformarDatos(proyectos, usuarios, tareas, factoresRiesgo),
        tareasEnProgreso: tareasEnProgreso || [],
        tiempoLimite
      };

      // Llamar a Cloud Function
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
          errorData.message ||
          `Error HTTP ${response.status}`
        );
      }

      const resultado = await response.json();

      return {
        success: true,
        data: resultado
      };

    } catch (error) {
      console.error('Error al optimizar tareas:', error);

      // Mensajes de error amigables
      let errorMessage = error.message;

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'No se pudo conectar con el servicio de optimización. Verifica tu conexión a internet.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'La optimización tardó demasiado tiempo. Intenta con menos tareas.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Verificar si el servicio de optimización está disponible
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'OPTIONS',
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  /**
   * Obtener URL de la Cloud Function configurada
   * @returns {string}
   */
  getFunctionUrl() {
    return CLOUD_FUNCTION_URL;
  }
};

// Alternativa usando Firebase Callable (requiere autenticación)
/*
import { getFunctions, httpsCallable } from 'firebase/functions';

export const optimizerApiCallable = {
  async optimize(params) {
    try {
      const functions = getFunctions();
      const optimizeTasks = httpsCallable(functions, 'optimize_tasks_secure');

      const payload = transformarDatos(
        params.proyectos,
        params.usuarios,
        params.tareas,
        params.factoresRiesgo
      );

      const result = await optimizeTasks({
        ...payload,
        tiempoLimite: params.tiempoLimite || 60
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error al optimizar tareas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
*/
