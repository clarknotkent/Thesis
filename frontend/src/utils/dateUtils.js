import moment from 'moment-timezone';

// Set default timezone to PH
moment.tz.setDefault('Asia/Manila');

export const PH_TIMEZONE = 'Asia/Manila';

/**
 * Get current date/time in PH timezone
 */
export const nowPH = () => moment.tz(PH_TIMEZONE);

/**
 * Parse a date string and treat it as PH timezone
 */
export const parsePH = (dateString) => moment.tz(dateString, PH_TIMEZONE);

/**
 * Convert UTC timestamp to PH timezone moment
 */
export const utcToPH = (utcString) => moment.utc(utcString).tz(PH_TIMEZONE);

/**
 * Format date for display in PH timezone
 */
export const formatPHDate = (date, format = 'MMM DD, YYYY') => {
  const phMoment = typeof date === 'string' ? utcToPH(date) : moment.tz(date, PH_TIMEZONE);
  return phMoment.format(format);
};

/**
 * Format date and time for display in PH timezone
 */
export const formatPHDateTime = (date, format = 'MMM DD, YYYY hh:mm A') => {
  const phMoment = typeof date === 'string' ? utcToPH(date) : moment.tz(date, PH_TIMEZONE);
  return phMoment.format(format);
};

/**
 * Get current date in YYYY-MM-DD format (PH timezone)
 */
export const getCurrentPHDate = () => nowPH().format('YYYY-MM-DD');

/**
 * Get current datetime in ISO string (PH timezone converted to UTC for backend)
 */
export const getCurrentPHISO = () => nowPH().toISOString();

/**
 * Convert PH date to UTC ISO string for backend storage
 */
export const phToUTC = (phDate) => {
  return moment.tz(phDate, PH_TIMEZONE).utc().toISOString();
};

/**
 * Check if a date is today in PH timezone
 */
export const isTodayPH = (date) => {
  const phDate = typeof date === 'string' ? utcToPH(date) : moment.tz(date, PH_TIMEZONE);
  return phDate.isSame(nowPH(), 'day');
};

/**
 * Calculate age in months from birth date
 */
export const calculateAgeInMonths = (birthDate) => {
  const birth = moment.tz(birthDate, PH_TIMEZONE);
  const now = nowPH();
  return now.diff(birth, 'months');
};

/**
 * Get date range for today in PH timezone (start and end of day)
 */
export const getTodayPHRange = () => {
  const today = nowPH();
  return {
    start: today.clone().startOf('day').utc().toISOString(),
    end: today.clone().endOf('day').utc().toISOString()
  };
};

/**
 * Get YYYY-MM-DD string in PH timezone for day comparisons
 */
export const getPHDateKey = (date) => {
  if (!date) return '';
  const phMoment = typeof date === 'string' ? utcToPH(date) : moment.tz(date, PH_TIMEZONE);
  return phMoment.format('YYYY-MM-DD');
};