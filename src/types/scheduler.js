/**
 * Tipos para el sistema de optimización de tareas
 * Basado en Google OR-Tools CP-SAT
 */

/**
 * @typedef {Object} Usuario
 * @property {string} id - Identificador único
 * @property {string} nombre - Nombre para mostrar
 * @property {number} capacidadDiaria - Story points que completa por día (0.5 o 1.0)
 * @property {string[]} proyectosAsignados - IDs de proyectos donde tiene afinidad
 */

/**
 * @typedef {Object} Tarea
 * @property {string} id - Identificador único
 * @property {string} nombre - Descripción de la tarea
 * @property {string} proyectoId - A qué proyecto pertenece
 * @property {number} storyPoints - Esfuerzo estimado (1-13)
 * @property {string[]} dependencias - IDs de tareas que deben terminar antes
 * @property {string} [usuarioForzado] - ID de usuario obligatorio (opcional)
 */

/**
 * @typedef {Object} FactorRiesgo
 * @property {string} usuarioId - A quién aplica
 * @property {string} [proyectoId] - Aplica a todo el proyecto (opcional)
 * @property {string} [tareaId] - O aplica a tarea específica (prioridad sobre proyectoId)
 * @property {number} porcentajeExtra - Porcentaje adicional de tiempo (0.20 = +20%)
 * @property {number} [diasExtra] - Días fijos adicionales (opcional)
 * @property {string} razon - Explicación del riesgo
 */

/**
 * @typedef {Object} Proyecto
 * @property {string} id - Identificador único
 * @property {string} nombre - Nombre del proyecto
 * @property {string} color - Color para visualización
 */

/**
 * @typedef {Object} TareaResuelta
 * @property {string} id - ID de la tarea
 * @property {string} nombre - Nombre de la tarea
 * @property {string} usuario - Nombre del usuario asignado
 * @property {string} usuarioId - ID del usuario asignado
 * @property {number} diaInicio - Día de inicio (0-based)
 * @property {number} diaFin - Día de fin (0-based)
 * @property {number} duracion - Duración en días
 * @property {number} duracionBase - Duración sin riesgos
 * @property {number} tiempoRiesgo - Tiempo adicional por riesgos en días
 * @property {boolean} forzado - Si fue asignación forzada
 * @property {string} proyectoId - ID del proyecto
 * @property {string} proyectoNombre - Nombre del proyecto
 */

/**
 * @typedef {Object} DetalleRiesgo
 * @property {string} tareaId - ID de la tarea afectada
 * @property {string} tareaNombre - Nombre de la tarea
 * @property {string} usuarioId - ID del usuario
 * @property {string} usuarioNombre - Nombre del usuario
 * @property {number} diasExtra - Días adicionales por riesgo
 * @property {number} porcentajeExtra - Porcentaje de tiempo extra
 * @property {string} razon - Explicación del riesgo
 */

/**
 * @typedef {Object} AnalisisOptimizacion
 * @property {number} impactoDias - Días adicionales por riesgos
 * @property {number} impactoPorcentaje - Porcentaje de impacto en makespan
 * @property {number} tareasConRiesgo - Cantidad de tareas afectadas por riesgos
 * @property {DetalleRiesgo[]} detalleRiesgos - Detalle de cada riesgo aplicado
 */

/**
 * @typedef {Object} ResultadoOptimizacion
 * @property {TareaResuelta[]} solucion - Array de tareas con asignaciones resueltas
 * @property {number} makespan - Días totales del proyecto
 * @property {number} [makespanSinRiesgo] - Makespan sin considerar riesgos (opcional)
 * @property {AnalisisOptimizacion} analisis - Análisis del impacto de optimización
 */

/**
 * @typedef {Object} OptimizeRequest
 * @property {Proyecto[]} proyectos - Lista de proyectos
 * @property {Usuario[]} usuarios - Lista de usuarios
 * @property {Tarea[]} tareas - Lista de tareas
 * @property {FactorRiesgo[]} [factoresRiesgo] - Factores de riesgo opcionales
 * @property {number} [tiempoLimite] - Tiempo límite en segundos (default: 60)
 */

// Exportar para que puedan ser importados si es necesario
export const SchedulerTypes = {};
