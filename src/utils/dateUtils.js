/**
 * Date utilities for scheduling and working day calculations
 */

/**
 * Parse a date string in YYYY-MM-DD format to a Date object
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date}
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a Date object to YYYY-MM-DD string
 * @param {Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Add days to a date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if a date is a working day for a user
 * @param {Date} date
 * @param {Array<number>} userWorkingDays - Array of working days (1=Monday, 7=Sunday)
 * @returns {boolean}
 */
export const isWorkingDay = (date, userWorkingDays) => {
  if (!date || !userWorkingDays || userWorkingDays.length === 0) {
    return false;
  }

  // Get day of week (0=Sunday, 6=Saturday)
  const dayOfWeek = date.getDay();

  // Convert to 1-7 format (1=Monday, 7=Sunday)
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

  return userWorkingDays.includes(dayNumber);
};

/**
 * Get the next working day for a user
 * @param {Date} date
 * @param {Array<number>} userWorkingDays
 * @returns {Date}
 */
export const getNextWorkingDay = (date, userWorkingDays) => {
  if (!date || !userWorkingDays || userWorkingDays.length === 0) {
    return null;
  }

  let currentDate = new Date(date);
  let attempts = 0;
  const maxAttempts = 14; // Prevent infinite loop

  while (attempts < maxAttempts) {
    currentDate = addDays(currentDate, 1);
    if (isWorkingDay(currentDate, userWorkingDays)) {
      return currentDate;
    }
    attempts++;
  }

  return null;
};

/**
 * Get the first working day on or after a given date
 * @param {Date} date
 * @param {Array<number>} userWorkingDays
 * @returns {Date}
 */
export const getFirstWorkingDay = (date, userWorkingDays) => {
  if (!date || !userWorkingDays || userWorkingDays.length === 0) {
    return null;
  }

  if (isWorkingDay(date, userWorkingDays)) {
    return new Date(date);
  }

  return getNextWorkingDay(date, userWorkingDays);
};

/**
 * Compare two dates (ignoring time)
 * @param {Date} date1
 * @param {Date} date2
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

/**
 * Get the maximum of two dates
 * @param {Date} date1
 * @param {Date} date2
 * @returns {Date}
 */
export const maxDate = (date1, date2) => {
  if (!date1) return date2;
  if (!date2) return date1;
  return compareDates(date1, date2) >= 0 ? date1 : date2;
};

/**
 * Calculate the number of working days between two dates (inclusive)
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {Array<number>} userWorkingDays
 * @returns {number}
 */
export const countWorkingDays = (startDate, endDate, userWorkingDays) => {
  if (!startDate || !endDate || !userWorkingDays || userWorkingDays.length === 0) {
    return 0;
  }

  let count = 0;
  let currentDate = new Date(startDate);

  while (compareDates(currentDate, endDate) <= 0) {
    if (isWorkingDay(currentDate, userWorkingDays)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
};
