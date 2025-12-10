/**
 * Smart Task Scheduling Service
 * Calculates task start/end dates dynamically based on:
 * - Project start dates
 * - Task dependencies
 * - User capacity and working days
 * - Story points (1 point = 1 day of work)
 * - Multi-project resource allocation
 */

import {
  parseDate,
  formatDate,
  addDays,
  isWorkingDay,
  getFirstWorkingDay,
  maxDate,
  compareDates
} from '../utils/dateUtils';

/**
 * Build dependency graph from tasks
 * @param {Array} tasks
 * @returns {Map<taskId, Array<dependencyTaskId>>} Graph where keys are tasks and values are their dependencies
 */
export const buildDependencyGraph = (tasks) => {
  const graph = new Map();

  tasks.forEach(task => {
    graph.set(task.id, task.dependencies || []);
  });

  return graph;
};

/**
 * Detect circular dependencies using DFS
 * @param {Map} graph - Dependency graph
 * @param {Array} tasks - All tasks
 * @returns {Array|null} Array of task IDs forming a cycle, or null if no cycle
 */
export const detectCycle = (graph, tasks) => {
  const visited = new Set();
  const recursionStack = new Set();
  const path = [];

  const dfs = (taskId) => {
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);

    const dependencies = graph.get(taskId) || [];

    for (const depId of dependencies) {
      if (!visited.has(depId)) {
        const cycle = dfs(depId);
        if (cycle) return cycle;
      } else if (recursionStack.has(depId)) {
        // Found a cycle
        const cycleStart = path.indexOf(depId);
        return path.slice(cycleStart).concat(depId);
      }
    }

    path.pop();
    recursionStack.delete(taskId);
    return null;
  };

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      const cycle = dfs(task.id);
      if (cycle) return cycle;
    }
  }

  return null;
};

/**
 * Topological sort using Kahn's algorithm
 * @param {Array} tasks
 * @returns {Array} Tasks sorted in dependency order
 */
export const topologicalSort = (tasks) => {
  const graph = buildDependencyGraph(tasks);
  const inDegree = new Map();
  const taskMap = new Map();

  // Initialize
  tasks.forEach(task => {
    taskMap.set(task.id, task);
    inDegree.set(task.id, 0);
  });

  // Calculate in-degrees (count how many dependencies each task has)
  tasks.forEach(task => {
    const deps = graph.get(task.id) || [];
    console.log(`      TopSort: "${task.title}" depende de:`, deps);

    // Count valid dependencies (only those that exist in validTasks)
    let validDepsCount = 0;
    deps.forEach(depId => {
      if (inDegree.has(depId)) {
        validDepsCount++;
        console.log(`         → Dependencia válida: "${taskMap.get(depId).title}"`);
      } else {
        console.log(`         ⚠️ Dependencia "${depId}" NO existe en validTasks - será ignorada!`);
      }
    });

    // Set the inDegree for THIS task (how many dependencies it has)
    inDegree.set(task.id, validDepsCount);
  });

  console.log(`      InDegrees finales:`);
  inDegree.forEach((degree, taskId) => {
    console.log(`         - "${taskMap.get(taskId).title}": ${degree}`);
  });

  // Helper to sort tasks by priority and creation date
  const sortTasksByPriority = (tasksToSort) => {
    console.log(`         🔀 Ordenando ${tasksToSort.length} tareas por priority:`);
    tasksToSort.forEach(t => {
      console.log(`            - "${t.title}": priority=${t.priority} (type: ${typeof t.priority}), created=${t.createdAt?.toDate?.()}`);
    });

    return tasksToSort.sort((a, b) => {
      // First by numeric priority (lower number = higher priority)
      // Tasks without priority OR with old string priority (high/medium/low) go last (treated as Infinity)
      const aPriority = (typeof a.priority === 'number') ? a.priority : Infinity;
      const bPriority = (typeof b.priority === 'number') ? b.priority : Infinity;

      console.log(`            🔄 Comparing "${a.title}" (priority=${aPriority}) vs "${b.title}" (priority=${bPriority})`);

      if (aPriority !== bPriority) {
        const result = aPriority - bPriority;
        console.log(`               ✅ Different priorities: ${result < 0 ? a.title : b.title} goes first`);
        return result; // Lower priority number first (0, 1, 2, ...)
      }

      // Then by creation date (older first)
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      const dateResult = aDate - bDate;
      console.log(`               📅 Same priority (${aPriority}), comparing dates: ${aDate.toISOString()} vs ${bDate.toISOString()}`);
      console.log(`               ✅ By date: ${dateResult < 0 ? a.title : b.title} goes first (older first)`);
      return dateResult;
    });
  };

  // Queue tasks with no dependencies (sorted by priority)
  const initialTasks = tasks.filter(task => inDegree.get(task.id) === 0);
  const queue = sortTasksByPriority(initialTasks);

  const sorted = [];

  while (queue.length > 0) {
    const task = queue.shift();
    sorted.push(task);

    // Collect all tasks that are now ready (dependencies satisfied)
    const readyTasks = [];
    tasks.forEach(otherTask => {
      const deps = graph.get(otherTask.id) || [];
      if (deps.includes(task.id)) {
        const newDegree = inDegree.get(otherTask.id) - 1;
        inDegree.set(otherTask.id, newDegree);
        if (newDegree === 0) {
          readyTasks.push(otherTask);
        }
      }
    });

    // Sort ready tasks by priority before adding to queue
    if (readyTasks.length > 0) {
      const sortedReadyTasks = sortTasksByPriority(readyTasks);
      queue.push(...sortedReadyTasks);
    }
  }

  // Check for tasks that weren't included (have dependencies on non-existent tasks)
  const notIncluded = tasks.filter(t => !sorted.includes(t));
  if (notIncluded.length > 0) {
    console.log(`      ⚠️ Tareas NO incluidas en topSort:`);
    notIncluded.forEach(t => {
      console.log(`         - "${t.title}" (inDegree: ${inDegree.get(t.id)}, deps: ${(graph.get(t.id) || []).join(', ')})`);
    });
  }

  return sorted;
};

/**
 * Sort tasks by priority and creation date
 * @param {Array} tasks
 * @returns {Array} Sorted tasks
 */
export const sortByPriority = (tasks) => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };

  return [...tasks].sort((a, b) => {
    // First by priority
    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    // Then by creation date (older first)
    const aDate = a.createdAt?.toDate?.() || new Date(0);
    const bDate = b.createdAt?.toDate?.() || new Date(0);

    return aDate - bDate;
  });
};

/**
 * Allocate capacity for a task on a user's schedule
 * @param {Map<string, number>} userSchedule - Map of dateString to allocated points
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @param {number} points - Story points to allocate
 * @param {number} dailyCapacity - User's daily capacity
 * @returns {number} Points actually allocated
 */
export const allocateCapacity = (userSchedule, dateKey, points, dailyCapacity) => {
  const allocated = userSchedule.get(dateKey) || 0;
  const available = Math.max(0, dailyCapacity - allocated);
  const toAllocate = Math.min(available, points);

  userSchedule.set(dateKey, allocated + toAllocate);

  return toAllocate;
};

/**
 * Find the best available user to simulate assignment
 * @param {Date} earliestStart - Earliest start date for the task
 * @param {number} storyPoints - Task story points
 * @param {Map<userId, Map<dateString, points>>} globalUserSchedules - Global capacity map
 * @param {Map<userId, user>} userMap - Map of all users
 * @param {Array<string>} projectUserIds - User IDs assigned to the project
 * @returns {string|null} User ID or null if no user available
 */
export const findBestAvailableUser = (earliestStart, storyPoints, globalUserSchedules, userMap, projectUserIds) => {
  // Only consider users assigned to this project
  const users = Array.from(userMap.values()).filter(u =>
    projectUserIds.includes(u.id) &&
    u.workingDays && u.workingDays.length > 0 && u.dailyCapacity > 0
  );

  if (users.length === 0) return null;

  // Find user with earliest availability who can complete the entire task
  let bestUser = null;
  let earliestAvailability = null;

  for (const user of users) {
    const userSchedule = globalUserSchedules.get(user.id);
    let currentDate = getFirstWorkingDay(earliestStart, user.workingDays);

    if (!currentDate) continue;

    // Simulate scheduling this task to see if user can complete it
    let pointsRemaining = storyPoints;
    let testDate = new Date(currentDate);
    let attempts = 0;
    let canComplete = false;

    while (pointsRemaining > 0 && attempts < 365) {
      const dayOfWeek = testDate.getDay();
      const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (user.workingDays.includes(dayNumber)) {
        const dateKey = formatDate(testDate);
        const allocated = userSchedule.get(dateKey) || 0;
        const available = user.dailyCapacity - allocated;

        if (available > 0) {
          pointsRemaining -= Math.min(available, pointsRemaining);
          if (pointsRemaining === 0) {
            canComplete = true;
            break;
          }
        }
      }

      testDate = addDays(testDate, 1);
      attempts++;
    }

    // If user can complete the task and starts earlier than current best
    if (canComplete && (!earliestAvailability || currentDate < earliestAvailability)) {
      earliestAvailability = currentDate;
      bestUser = user.id;
    }
  }

  return bestUser;
};

/**
 * Schedule a single task on a user's calendar
 * @param {Object} task - Task to schedule
 * @param {Date} earliestStart - Earliest possible start date
 * @param {Map<string, number>} userSchedule - User's schedule map
 * @param {Object} user - User object with capacity and working days
 * @returns {Object} { startDate: string, endDate: string } in YYYY-MM-DD format
 */
export const scheduleTaskOnUser = (task, earliestStart, userSchedule, user) => {
  if (!user || !user.workingDays || user.workingDays.length === 0) {
    console.warn(`User ${user?.displayName || 'unknown'} has no working days configured`);
    return null;
  }

  const dailyCapacity = user.dailyCapacity || 1;
  const workingDays = user.workingDays;

  // Find first working day on or after earliest start
  let currentDate = getFirstWorkingDay(earliestStart, workingDays);

  if (!currentDate) {
    console.warn(`Could not find working day for user ${user.displayName}`);
    return null;
  }

  let pointsRemaining = task.storyPoints;
  let startDate = null;
  let endDate = null;
  let attempts = 0;
  const maxAttempts = 365; // Prevent infinite loop (1 year max)

  while (pointsRemaining > 0 && attempts < maxAttempts) {
    const dayOfWeek = currentDate.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Skip non-working days
    if (!workingDays.includes(dayNumber)) {
      currentDate = addDays(currentDate, 1);
      attempts++;
      continue;
    }

    const dateKey = formatDate(currentDate);
    const allocated = userSchedule.get(dateKey) || 0;
    const available = dailyCapacity - allocated;

    if (available <= 0) {
      currentDate = addDays(currentDate, 1);
      attempts++;
      continue;
    }

    // Set start date on first allocation
    if (!startDate) {
      startDate = new Date(currentDate);
    }

    const toAllocate = Math.min(available, pointsRemaining);
    userSchedule.set(dateKey, allocated + toAllocate);
    pointsRemaining -= toAllocate;

    // Update end date to current day (task continues until work is done)
    endDate = new Date(currentDate);

    // Move to next day if there's still work remaining
    if (pointsRemaining > 0) {
      currentDate = addDays(currentDate, 1);
    }

    attempts++;
  }

  if (pointsRemaining > 0) {
    console.warn(`Could not fully schedule task ${task.title} - ${pointsRemaining} points remaining`);
    return null;
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

/**
 * Calculate schedule for a single project
 * @param {Object} project - Project object
 * @param {Array} projectTasks - Tasks for this project
 * @param {Map<userId, Map<dateString, points>>} globalUserSchedules - Global capacity map
 * @param {Map<userId, user>} userMap - Map of users by ID
 * @param {Map<taskId, schedule>} allScheduledTasks - Map of already scheduled tasks (for dependencies)
 * @returns {Object} { scheduledTasks: [], warnings: [] }
 */
export const calculateProjectSchedule = (
  project,
  projectTasks,
  globalUserSchedules,
  userMap,
  allScheduledTasks
) => {
  const warnings = [];
  const scheduledTasks = [];

  // Validate project has start date
  if (!project.startDate) {
    warnings.push(`Proyecto "${project.name}" no tiene fecha de inicio`);
    return { scheduledTasks, warnings };
  }

  const projectStartDate = parseDate(project.startDate);
  const projectEndDate = project.endDate ? parseDate(project.endDate) : null;

  // Filter valid tasks (with story points)
  // Tasks without assigned user will be simulated
  console.log(`🔎 Proyecto "${project.name}" - filtrando tareas...`);
  console.log(`   Total tareas en proyecto: ${projectTasks.length}`);
  projectTasks.forEach(t => {
    console.log(`   - "${t.title}": ${t.storyPoints || 0} SP, assignedTo: ${t.assignedTo || 'null'}`);
  });

  const validTasks = projectTasks.filter(task => {
    if (!task.storyPoints || task.storyPoints <= 0) {
      console.log(`   ❌ "${task.title}" excluida (sin SP)`);
      return false;
    }

    // If task has assigned user, validate the user
    if (task.assignedTo) {
      const user = userMap.get(task.assignedTo);
      if (!user) {
        warnings.push(`Tarea "${task.title}" asignada a usuario inexistente`);
        return false;
      }
      if (!user.workingDays || user.workingDays.length === 0) {
        warnings.push(`Usuario ${user.displayName} no tiene días laborables configurados`);
        return false;
      }
      if (!user.dailyCapacity || user.dailyCapacity <= 0) {
        warnings.push(`Usuario ${user.displayName} tiene capacidad diaria inválida`);
        return false;
      }
    }
    // Tasks without user will be processed (simulated assignment)
    return true;
  });

  // Count unestimated tasks
  const unestimatedCount = projectTasks.filter(t => !t.storyPoints || t.storyPoints <= 0).length;
  if (unestimatedCount > 0) {
    warnings.push(`${unestimatedCount} tarea(s) sin story points`);
  }

  if (validTasks.length === 0) {
    return { scheduledTasks, warnings };
  }

  // Detect circular dependencies
  const graph = buildDependencyGraph(validTasks);
  const cycle = detectCycle(graph, validTasks);
  if (cycle) {
    const cycleNames = cycle.map(id => {
      const task = validTasks.find(t => t.id === id);
      return task ? task.title : id;
    }).join(' → ');
    warnings.push(`Dependencia circular detectada: ${cycleNames}`);
    return { scheduledTasks, warnings };
  }

  // Topological sort - this gives us the correct dependency order
  console.log(`   Valid tasks antes de topSort: ${validTasks.length}`);
  validTasks.forEach(t => console.log(`      - "${t.title}"`));

  const topSorted = topologicalSort(validTasks);
  console.log(`   Después de topSort: ${topSorted.length}`);
  topSorted.forEach(t => console.log(`      - "${t.title}"`));

  // IMPORTANT: Don't sort by priority after topSort - it breaks dependency order!
  // The topological sort already gives us the correct order
  const sortedTasks = topSorted;

  console.log('📋 Orden de procesamiento de tareas:');
  sortedTasks.forEach((t, i) => {
    console.log(`   ${i + 1}. "${t.title}" (${t.storyPoints} SP, deps: [${(t.dependencies || []).join(', ')}])`);
  });

  // Schedule each task
  for (const task of sortedTasks) {
    console.log(`\n   🔧 Procesando "${task.title}"...`);

    // Check if task has real dates from movement history
    const realDates = getRealDatesFromStatus(task, userMap);

    if (realDates) {
      // Task has real dates from movement history (in-progress, qa, or completed)
      console.log(`      ✅ Usando fechas reales del historial: ${realDates.startDate} → ${realDates.endDate}`);

      scheduledTasks.push({
        taskId: task.id,
        startDate: realDates.startDate,
        endDate: realDates.endDate,
        assignedTo: task.assignedTo,
        isSimulated: false,
        isReal: true // Marca para identificar que son fechas reales
      });

      // Add to global map for dependency checking
      allScheduledTasks.set(task.id, {
        startDate: realDates.startDate,
        endDate: realDates.endDate,
        assignedTo: task.assignedTo
      });

      // Si hay usuario asignado, actualizar su schedule con las horas ya ocupadas
      if (task.assignedTo && task.storyPoints) {
        const userSchedule = globalUserSchedules.get(task.assignedTo);
        if (userSchedule) {
          const startDate = parseDate(realDates.startDate);
          const endDate = parseDate(realDates.endDate);
          let currentDate = new Date(startDate);

          // Marcar los días como ocupados
          while (currentDate <= endDate) {
            const dateStr = formatDate(currentDate);
            const allocated = userSchedule.get(dateStr) || 0;
            userSchedule.set(dateStr, allocated + (task.storyPoints / ((endDate - startDate) / (1000 * 60 * 60 * 24) + 1)));
            currentDate = addDays(currentDate, 1);
          }
        }
      }

      continue; // Skip to next task
    }

    // Task is pending - simulate dates based on dependencies and user availability
    console.log(`      📅 Tarea pending - simulando fechas...`);

    // Calculate earliest start date
    let earliestStart = new Date(projectStartDate);
    console.log(`      Earliest start inicial: ${formatDate(earliestStart)} (project start)`);

    // If task has assignedTo, check for completed/in-progress/QA tasks from same user
    if (task.assignedTo) {
      console.log(`      🔍 Buscando tareas completadas/en progreso/QA del mismo usuario (${task.assignedTo})...`);

      const userTasks = sortedTasks.filter(t =>
        t.assignedTo === task.assignedTo &&
        t.id !== task.id &&
        (t.status === 'completed' || t.status === 'qa' || t.status === 'in-progress')
      );

      if (userTasks.length > 0) {
        console.log(`         Encontradas ${userTasks.length} tareas del mismo usuario`);

        // Find latest end date among these tasks
        let latestEndDate = null;
        for (const userTask of userTasks) {
          const scheduled = allScheduledTasks.get(userTask.id);
          if (scheduled && scheduled.endDate) {
            const endDate = parseDate(scheduled.endDate);
            if (!latestEndDate || endDate > latestEndDate) {
              latestEndDate = endDate;
              console.log(`         - "${userTask.title}" (${userTask.status}): end=${scheduled.endDate}`);
            }
          }
        }

        if (latestEndDate) {
          const dayAfterLatest = addDays(latestEndDate, 1);
          console.log(`         ✅ Última tarea termina: ${formatDate(latestEndDate)}`);
          console.log(`         📅 Ajustando earliest start a: ${formatDate(dayAfterLatest)}`);
          earliestStart = maxDate(earliestStart, dayAfterLatest);
        }
      } else {
        console.log(`         No se encontraron tareas previas del mismo usuario`);
      }
    }

    // Check dependencies
    const dependencies = task.dependencies || [];
    if (dependencies.length > 0) {
      console.log(`      Revisando ${dependencies.length} dependencia(s):`);
    }

    for (const depId of dependencies) {
      const depSchedule = allScheduledTasks.get(depId);
      console.log(`         - Dep ID "${depId}":`, depSchedule ? `${depSchedule.startDate} → ${depSchedule.endDate}` : 'NO ENCONTRADA');

      if (depSchedule && depSchedule.endDate) {
        const depEndDate = parseDate(depSchedule.endDate);
        const dayAfterDep = addDays(depEndDate, 1);
        console.log(`            Ajustando earliest start a: ${formatDate(dayAfterDep)}`);
        earliestStart = maxDate(earliestStart, dayAfterDep);
      }
    }

    console.log(`      Earliest start final: ${formatDate(earliestStart)}`);

    // Determine user assignment (real or simulated)
    let userId = task.assignedTo;
    let isSimulated = false;

    if (!userId) {
      // Simulate assignment: first try project's assigned users
      const projectUserIds = project.assignedUsers || [];
      console.log(`🔍 Task "${task.title}" (${task.storyPoints} SP) - buscando usuario simulado...`);
      console.log(`   Project users:`, projectUserIds);
      userId = findBestAvailableUser(earliestStart, task.storyPoints, globalUserSchedules, userMap, projectUserIds);

      // If no user found in project, try all users
      if (!userId) {
        const allUserIds = Array.from(userMap.keys());
        console.log(`   No encontrado en proyecto, buscando en todos los usuarios (${allUserIds.length} total)`);
        userId = findBestAvailableUser(earliestStart, task.storyPoints, globalUserSchedules, userMap, allUserIds);
      }

      if (userId) {
        const user = userMap.get(userId);
        console.log(`   ✅ Usuario simulado encontrado: ${user.displayName} (capacidad: ${user.dailyCapacity} SP/día)`);
        isSimulated = true;
        warnings.push(`Tarea "${task.title}" sin asignar - simulada con usuario disponible`);
      } else {
        console.log(`   ❌ No se encontró ningún usuario disponible que pueda completar la tarea`);
        // No user available, but still include task without schedule (show in list only)
        warnings.push(`Tarea "${task.title}" sin usuario - no se puede calcular fechas`);
        scheduledTasks.push({
          taskId: task.id,
          startDate: null,
          endDate: null,
          assignedTo: null,
          isSimulated: false,
          needsAssignment: true
        });
        continue;
      }
    }

    const user = userMap.get(userId);
    const userSchedule = globalUserSchedules.get(userId);

    // Schedule the task
    const schedule = scheduleTaskOnUser(task, earliestStart, userSchedule, user);

    if (schedule) {
      scheduledTasks.push({
        taskId: task.id,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        assignedTo: userId,
        isSimulated: isSimulated
      });

      // Add to global map for dependency checking
      allScheduledTasks.set(task.id, {
        ...schedule,
        assignedTo: userId
      });

      // Check if extends beyond project deadline
      if (projectEndDate) {
        const taskEndDate = parseDate(schedule.endDate);
        if (compareDates(taskEndDate, projectEndDate) > 0) {
          warnings.push(`Tarea "${task.title}" se extiende más allá de la fecha límite del proyecto`);
        }
      }
    } else {
      warnings.push(`No se pudo programar tarea "${task.title}"`);
    }
  }

  return { scheduledTasks, warnings };
};

/**
 * Get real dates from task movement history based on status
 * @param {Object} task - The task object
 * @param {Map} userMap - Map of users with their dailyCapacity
 * @returns {Object|null} { startDate, endDate } or null if should be simulated
 */
const getRealDatesFromStatus = (task, userMap) => {
  if (!task.status || !task.movementHistory || task.movementHistory.length === 0) {
    return null; // No status or movement history, simulate dates
  }

  const history = task.movementHistory;
  const currentStatus = task.status;

  // Helper to find last movement to a specific status
  const findLastMovementTo = (status) => {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].to === status) {
        return history[i];
      }
    }
    return null;
  };

  // Helper to parse Firebase timestamp to Date
  const parseTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
  };

  switch (currentStatus) {
    case 'in-progress': {
      // Start: última vez que se movió a in-progress
      // End: fecha estimada basada en story points y capacidad del usuario
      const lastInProgress = findLastMovementTo('in-progress');
      if (lastInProgress) {
        const startDate = parseTimestamp(lastInProgress.timestamp);

        // Calcular fecha de fin estimada basada en story points
        let endDate = new Date(); // Por defecto fecha actual

        if (task.storyPoints && task.assignedTo) {
          const user = userMap.get(task.assignedTo);
          if (user && user.dailyCapacity > 0) {
            const daysNeeded = Math.ceil(task.storyPoints / user.dailyCapacity);
            endDate = addDays(startDate, daysNeeded);
            console.log(`      📊 Tarea en progreso "${task.title}": ${task.storyPoints} SP / ${user.dailyCapacity} SP/día = ${daysNeeded} días`);
            console.log(`         Inicio: ${formatDate(startDate)} → Fin estimado: ${formatDate(endDate)}`);
          }
        }

        return {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        };
      }
      return null;
    }

    case 'qa': {
      // Start: última vez que se movió a in-progress
      // End: última vez que se movió a qa
      const lastInProgress = findLastMovementTo('in-progress');
      const lastQA = findLastMovementTo('qa');
      if (lastInProgress && lastQA) {
        const startDate = parseTimestamp(lastInProgress.timestamp);
        const endDate = parseTimestamp(lastQA.timestamp);
        return {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        };
      }
      return null;
    }

    case 'completed': {
      // Start: última vez que se movió a in-progress
      // End: última vez que se movió a qa (fecha en que developer terminó)
      const lastInProgress = findLastMovementTo('in-progress');
      const lastQA = findLastMovementTo('qa');
      if (lastInProgress && lastQA) {
        const startDate = parseTimestamp(lastInProgress.timestamp);
        const endDate = parseTimestamp(lastQA.timestamp);
        return {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        };
      }
      return null;
    }

    case 'pending':
    default:
      // Simular fechas para tareas pending
      return null;
  }
};

/**
 * Calculate schedules for all projects (multi-project aware)
 * @param {Array} projects - All projects
 * @param {Array} tasks - All tasks
 * @param {Array} users - All users
 * @returns {Object} { scheduledTasks: Map<projectId, Array>, warnings: Map<projectId, Array> }
 */
export const calculateAllProjectsSchedules = (projects, tasks, users) => {
  const scheduledTasksMap = new Map(); // projectId -> Array of scheduled tasks
  const warningsMap = new Map(); // projectId -> Array of warnings
  const allScheduledTasks = new Map(); // taskId -> schedule (for dependency checking)

  // Build user map
  const userMap = new Map();
  users.forEach(user => {
    userMap.set(user.id, user);
  });

  // Initialize global user schedules (shared across all projects)
  const globalUserSchedules = new Map();
  users.forEach(user => {
    globalUserSchedules.set(user.id, new Map()); // dateString -> allocated points
  });

  // Sort projects by start date (earlier projects scheduled first)
  const sortedProjects = [...projects]
    .filter(p => p.startDate) // Only projects with start date
    .sort((a, b) => {
      const dateA = parseDate(a.startDate);
      const dateB = parseDate(b.startDate);
      return compareDates(dateA, dateB);
    });

  // Schedule each project in order
  for (const project of sortedProjects) {
    const projectTasks = tasks.filter(t => t.projectId === project.id);

    const { scheduledTasks, warnings } = calculateProjectSchedule(
      project,
      projectTasks,
      globalUserSchedules,
      userMap,
      allScheduledTasks
    );

    scheduledTasksMap.set(project.id, scheduledTasks);
    warningsMap.set(project.id, warnings);
  }

  // Handle projects without start date
  const unscheduledProjects = projects.filter(p => !p.startDate);
  unscheduledProjects.forEach(project => {
    scheduledTasksMap.set(project.id, []);
    warningsMap.set(project.id, ['Proyecto sin fecha de inicio']);
  });

  return {
    scheduledTasks: scheduledTasksMap,
    warnings: warningsMap
  };
};
