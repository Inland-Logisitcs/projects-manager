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

  // Calculate in-degrees
  tasks.forEach(task => {
    const deps = graph.get(task.id) || [];
    deps.forEach(depId => {
      if (inDegree.has(depId)) {
        inDegree.set(depId, inDegree.get(depId) + 1);
      }
    });
  });

  // Queue tasks with no dependencies
  const queue = [];
  tasks.forEach(task => {
    if (inDegree.get(task.id) === 0) {
      queue.push(task);
    }
  });

  const sorted = [];

  while (queue.length > 0) {
    const task = queue.shift();
    sorted.push(task);

    // Check all tasks that depend on this one
    tasks.forEach(otherTask => {
      const deps = graph.get(otherTask.id) || [];
      if (deps.includes(task.id)) {
        const newDegree = inDegree.get(otherTask.id) - 1;
        inDegree.set(otherTask.id, newDegree);
        if (newDegree === 0) {
          queue.push(otherTask);
        }
      }
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

    if (pointsRemaining > 0) {
      currentDate = addDays(currentDate, 1);
    } else {
      endDate = new Date(currentDate);
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
  const validTasks = projectTasks.filter(task => {
    if (!task.storyPoints || task.storyPoints <= 0) {
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

  // Topological sort then sort by priority
  const topSorted = topologicalSort(validTasks);
  const sortedTasks = sortByPriority(topSorted);

  // Schedule each task
  for (const task of sortedTasks) {
    // Calculate earliest start date
    let earliestStart = new Date(projectStartDate);

    // Check dependencies
    const dependencies = task.dependencies || [];
    for (const depId of dependencies) {
      const depSchedule = allScheduledTasks.get(depId);
      if (depSchedule && depSchedule.endDate) {
        const depEndDate = parseDate(depSchedule.endDate);
        const dayAfterDep = addDays(depEndDate, 1);
        earliestStart = maxDate(earliestStart, dayAfterDep);
      }
    }

    // Determine user assignment (real or simulated)
    let userId = task.assignedTo;
    let isSimulated = false;

    if (!userId) {
      // Simulate assignment: find best available user from project's assigned users
      const projectUserIds = project.assignedUsers || [];
      userId = findBestAvailableUser(earliestStart, task.storyPoints, globalUserSchedules, userMap, projectUserIds);
      if (userId) {
        isSimulated = true;
        warnings.push(`Tarea "${task.title}" sin asignar - simulada con usuario disponible`);
      } else {
        warnings.push(`Tarea "${task.title}" no se pudo asignar - no hay usuarios disponibles en el proyecto`);
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
