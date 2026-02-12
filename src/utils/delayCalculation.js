import { isWorkingDay } from './dateUtils';

/**
 * Normalize Firestore timestamps to Date objects
 */
const parseTimestamp = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  return null;
};

/**
 * Find the last "pending -> in-progress" transition from movementHistory.
 * Falls back to lastStatusChange.
 */
const getInProgressStartDate = (task) => {
  if (task.movementHistory && task.movementHistory.length > 0) {
    // Sort oldest first to find the LAST transition to in-progress
    const sorted = [...task.movementHistory]
      .map(entry => ({
        ...entry,
        timestamp: parseTimestamp(entry.timestamp)
      }))
      .filter(entry => entry.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Find last transition where to === 'in-progress' (status change, not assignment)
    for (let i = sorted.length - 1; i >= 0; i--) {
      const entry = sorted[i];
      if (entry.type === 'assignment_change') continue;
      if (entry.to === 'in-progress') {
        return entry.timestamp;
      }
    }
  }

  // Fallback to lastStatusChange if task is currently in-progress
  if (task.status === 'in-progress') {
    return parseTimestamp(task.lastStatusChange);
  }

  return null;
};

/**
 * For QA/completed tasks: find when they transitioned OUT of in-progress (into QA).
 * For in-progress tasks: use current time.
 */
const getEndDate = (task) => {
  if (task.status === 'in-progress') {
    return new Date();
  }

  // For QA or completed: find the last transition FROM in-progress
  if (task.movementHistory && task.movementHistory.length > 0) {
    const sorted = [...task.movementHistory]
      .map(entry => ({
        ...entry,
        timestamp: parseTimestamp(entry.timestamp)
      }))
      .filter(entry => entry.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Find the last transition where from === 'in-progress'
    for (let i = sorted.length - 1; i >= 0; i--) {
      const entry = sorted[i];
      if (entry.type === 'assignment_change') continue;
      if (entry.from === 'in-progress') {
        return entry.timestamp;
      }
    }
  }

  // Fallback to lastStatusChange
  return parseTimestamp(task.lastStatusChange);
};

/**
 * Count elapsed working days between two dates.
 * Counts full working days + fractional last day based on hour.
 */
const countElapsedWorkingDays = (startDate, endDate, workingDays) => {
  if (!startDate || !endDate || !workingDays || workingDays.length === 0) {
    return 0;
  }

  const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];
  const days = workingDays || DEFAULT_WORKING_DAYS;

  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const endNormalized = new Date(endDate);
  endNormalized.setHours(0, 0, 0, 0);

  // Count full working days (not including end day)
  while (current < endNormalized) {
    if (isWorkingDay(current, days)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  // Add fractional last day if it's a working day
  if (isWorkingDay(endNormalized, days)) {
    const hoursInDay = endDate.getHours() + endDate.getMinutes() / 60;
    // Assume 8-hour work day, starting at 9am
    const workHours = Math.max(0, Math.min(8, hoursInDay - 9));
    count += workHours / 8;
  }

  return Math.max(0, count);
};

/**
 * Get the expected duration in working days.
 * - If optimizedDuration exists: use duracionBase (optimistic) or duracionTotal (risk)
 * - Otherwise: storyPoints / dailyCapacity
 */
const getExpectedDuration = (task, user, viewMode) => {
  const storyPoints = Number(task.storyPoints) || 0;
  const capacity = Number(user?.dailyCapacity) || 1;
  if (storyPoints === 0) return 0;

  // Always calculate base duration from current story points
  const duracionBase = storyPoints / capacity;

  if (task.optimizedDuration && viewMode === 'risk') {
    // Recalculate total using current base + stored risk factors
    const tiempoRiesgo = task.optimizedDuration.tiempoRiesgo || 0;
    const tiempoRedondeo = task.optimizedDuration.tiempoRedondeo || 0;
    return Math.ceil((duracionBase + tiempoRiesgo + tiempoRedondeo) * 2) / 2;
  }

  return duracionBase;
};

/**
 * Main entry point: calculate delay for a task.
 *
 * Returns null for non-applicable tasks (pending, no storyPoints, no assignedTo).
 * Returns { delay, status, label, expectedDuration, elapsedWorkingDays }
 *
 * Thresholds:
 * - delay < 1d = on-track
 * - 1 <= delay < 2 = warning
 * - delay >= 2 = danger
 */
export const calculateDelay = (task, user, viewMode = 'optimistic') => {
  // Not applicable for pending tasks
  if (task.status === 'pending') return null;

  // Need story points to calculate
  if (!task.storyPoints || task.storyPoints === 0) return null;

  // Need assigned user
  if (!task.assignedTo || !user) return null;

  const startDate = getInProgressStartDate(task);
  if (!startDate) return null;

  const endDate = getEndDate(task);
  if (!endDate) return null;

  const workingDays = user.workingDays || [1, 2, 3, 4, 5];
  const elapsedWorkingDays = countElapsedWorkingDays(startDate, endDate, workingDays);
  const expectedDuration = getExpectedDuration(task, user, viewMode);

  if (expectedDuration <= 0) return null;

  const delay = elapsedWorkingDays - expectedDuration;

  let status;
  let label;

  if (delay < 1) {
    status = 'on-track';
    label = 'Al dia';
  } else if (delay < 2) {
    status = 'warning';
    label = `+${delay.toFixed(1)}d`;
  } else {
    status = 'danger';
    label = `+${delay.toFixed(1)}d`;
  }

  return {
    delay,
    status,
    label,
    expectedDuration,
    elapsedWorkingDays
  };
};
