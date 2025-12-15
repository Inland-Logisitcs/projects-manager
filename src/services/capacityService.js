/**
 * Servicio para calcular la capacidad del equipo en sprints
 * La capacidad se basa en:
 * - Fechas del sprint (startDate - endDate)
 * - Días laborales de cada usuario (workingDays: array de números 0-6, donde 0=Domingo, 1=Lunes, etc.)
 * - Puntos por día de cada usuario (dailyCapacity)
 */

/**
 * Calcular cuántos días laborales hay entre dos fechas para un usuario específico
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @param {array} workingDays - Array de días laborales (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * @returns {number} Cantidad de días laborales
 */
export const calculateWorkingDays = (startDate, endDate, workingDays = [1, 2, 3, 4, 5]) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Si las fechas son inválidas
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  // Si la fecha de inicio es después de la fecha de fin
  if (start > end) return 0;

  let count = 0;
  const current = new Date(start);

  // Iterar día por día desde start hasta end (inclusive)
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (workingDays.includes(dayOfWeek)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Calcular la capacidad total del equipo para un sprint
 * @param {object} sprint - Objeto del sprint con startDate y endDate
 * @param {array} users - Array de usuarios del equipo
 * @param {boolean} useRemainingTime - Si es true, calcula la capacidad desde hoy hasta el final del sprint
 * @returns {number} Capacidad total en story points
 */
export const calculateSprintCapacity = (sprint, users = [], useRemainingTime = false) => {
  if (!sprint || !sprint.startDate || !sprint.endDate) return 0;
  if (!users || users.length === 0) return 0;

  let totalCapacity = 0;

  // Determinar la fecha de inicio
  let effectiveStartDate = sprint.startDate;

  if (useRemainingTime && sprint.status === 'active') {
    // Si el sprint está activo, usar la fecha actual como inicio
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const sprintEndDate = new Date(sprint.endDate);

    // Solo calcular capacidad restante si aún no ha terminado el sprint
    if (today <= sprintEndDate) {
      effectiveStartDate = todayString;
    } else {
      // Si el sprint ya terminó, la capacidad restante es 0
      return 0;
    }
  }

  // Calcular capacidad para cada usuario
  users.forEach(user => {
    // Solo contar usuarios habilitados
    if (user.disabled) return;

    const dailyCapacity = user.dailyCapacity || 1;
    const workingDays = user.workingDays || [1, 2, 3, 4, 5]; // Lunes a Viernes por defecto

    const userWorkingDays = calculateWorkingDays(
      effectiveStartDate,
      sprint.endDate,
      workingDays
    );

    const userCapacity = userWorkingDays * dailyCapacity;
    totalCapacity += userCapacity;
  });

  return totalCapacity;
};

/**
 * Calcular los story points asignados a un sprint
 * @param {array} tasks - Array de tareas del sprint
 * @returns {number} Total de story points asignados
 */
export const calculateSprintPoints = (tasks = []) => {
  return tasks.reduce((sum, task) => {
    // Solo contar tareas no archivadas
    if (task.archived) return sum;
    return sum + (task.storyPoints || 0);
  }, 0);
};

/**
 * Calcular los story points completados en un sprint
 * @param {array} tasks - Array de tareas del sprint
 * @returns {number} Total de story points completados
 */
export const calculateCompletedPoints = (tasks = []) => {
  return tasks.reduce((sum, task) => {
    // Solo contar tareas completadas y no archivadas
    if (task.archived || task.status !== 'completed') return sum;
    return sum + (task.storyPoints || 0);
  }, 0);
};

/**
 * Calcular el porcentaje de capacidad utilizada
 * @param {number} assignedPoints - Puntos asignados
 * @param {number} capacity - Capacidad total
 * @returns {number} Porcentaje de 0 a 100
 */
export const calculateCapacityPercentage = (assignedPoints, capacity) => {
  if (capacity === 0) return 0;
  return Math.round((assignedPoints / capacity) * 100);
};

/**
 * Determinar el estado de la capacidad (normal, near-limit, over-capacity)
 * @param {number} percentage - Porcentaje de capacidad utilizada
 * @returns {string} Estado de la capacidad
 */
export const getCapacityStatus = (percentage) => {
  if (percentage >= 100) return 'over-capacity';
  if (percentage >= 80) return 'near-limit';
  return 'normal';
};

/**
 * Obtener información completa de capacidad para un sprint
 * @param {object} sprint - Objeto del sprint
 * @param {array} tasks - Array de tareas del sprint
 * @param {array} users - Array de usuarios del equipo
 * @param {boolean} useRemainingTime - Si es true, calcula la capacidad desde hoy hasta el final del sprint
 * @returns {object} Objeto con información de capacidad
 */
export const getSprintCapacityInfo = (sprint, tasks = [], users = [], useRemainingTime = true) => {
  const capacity = calculateSprintCapacity(sprint, users, useRemainingTime);
  const assignedPoints = calculateSprintPoints(tasks);
  const completedPoints = calculateCompletedPoints(tasks);
  const percentage = calculateCapacityPercentage(assignedPoints, capacity);
  const status = getCapacityStatus(percentage);

  return {
    capacity,
    assignedPoints,
    completedPoints,
    percentage,
    status,
    remaining: Math.max(0, capacity - assignedPoints),
    useRemainingTime
  };
};

/**
 * Verificar si un usuario está sobrecargado en un sprint
 * @param {string} userId - ID del usuario
 * @param {object} sprint - Objeto del sprint
 * @param {array} tasks - Array de tareas del sprint
 * @param {array} users - Array de usuarios del equipo
 * @param {boolean} useRemainingTime - Si es true, calcula la capacidad desde hoy hasta el final del sprint
 * @returns {boolean} True si el usuario está sobrecargado (>= 100% capacidad)
 */
export const isUserOverbooked = (userId, sprint, tasks = [], users = [], useRemainingTime = true) => {
  if (!userId || !sprint || !sprint.startDate || !sprint.endDate) return false;

  const user = users.find(u => u.id === userId);
  if (!user || user.disabled) return false;

  const dailyCapacity = user.dailyCapacity || 1;
  const workingDays = user.workingDays || [1, 2, 3, 4, 5];

  // Determinar la fecha de inicio
  let effectiveStartDate = sprint.startDate;

  if (useRemainingTime && sprint.status === 'active') {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const sprintEndDate = new Date(sprint.endDate);

    if (today <= sprintEndDate) {
      effectiveStartDate = todayString;
    } else {
      // Si el sprint ya terminó, no hay capacidad restante
      return false;
    }
  }

  const userWorkingDays = calculateWorkingDays(
    effectiveStartDate,
    sprint.endDate,
    workingDays
  );

  const totalCapacity = userWorkingDays * dailyCapacity;

  // Calcular puntos asignados al usuario (solo tareas no completadas)
  const assignedTasks = tasks.filter(task =>
    task.assignedTo === userId && !task.archived && task.status !== 'completed'
  );

  const assignedPoints = assignedTasks.reduce((sum, task) =>
    sum + (task.storyPoints || 0), 0
  );

  // Si la capacidad es 0, considerar como overbooked si tiene tareas asignadas pendientes
  if (totalCapacity === 0) {
    return assignedPoints > 0;
  }

  const percentage = (assignedPoints / totalCapacity) * 100;
  return percentage >= 100;
};
