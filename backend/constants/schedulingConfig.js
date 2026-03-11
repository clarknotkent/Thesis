/**
 * Scheduling configuration constants
 * Centralized configuration for the hourly-block scheduling system.
 */

// Operating days: Monday (1) through Friday (5)
export const OPERATING_DAYS = [1, 2, 3, 4, 5];

// Clinic hours
export const CLINIC_OPEN = '07:00';
export const CLINIC_CLOSE = '17:00';

// Active scheduling window (30-min buffer at start/end)
export const SCHEDULE_WINDOW_START = '07:30';
export const SCHEDULE_WINDOW_END = '16:30';

// 1-hour appointment blocks within the scheduling window
export const TIME_BLOCKS = [
  '07:30', '08:30', '09:30', '10:30', '11:30',
  '12:30', '13:30', '14:30', '15:30',
];

// Block labels for display (start–end)
export const TIME_BLOCK_LABELS = {
  '07:30': '7:30 – 8:30 AM',
  '08:30': '8:30 – 9:30 AM',
  '09:30': '9:30 – 10:30 AM',
  '10:30': '10:30 – 11:30 AM',
  '11:30': '11:30 AM – 12:30 PM',
  '12:30': '12:30 – 1:30 PM',
  '13:30': '1:30 – 2:30 PM',
  '14:30': '2:30 – 3:30 PM',
  '15:30': '3:30 – 4:30 PM',
};

// Patients per 1-hour block
export const PATIENTS_PER_BLOCK = 3;

// Total daily capacity = blocks × patients per block
export const DAILY_CAPACITY = TIME_BLOCKS.length * PATIENTS_PER_BLOCK; // 27

// Buffer slots reserved daily for missed/reschedule appointments
export const BUFFER_SLOTS = 1;

// Bookable capacity = total - buffer
export const BOOKABLE_CAPACITY = DAILY_CAPACITY - BUFFER_SLOTS; // 26

/**
 * Check if a given day-of-week (0=Sun … 6=Sat) is an operating day.
 */
export function isOperatingDay(dayOfWeek) {
  return OPERATING_DAYS.includes(dayOfWeek);
}

/**
 * Find the next available time block for a date given current block counts.
 * @param {Object} blockCounts - Map of block time → number of booked patients
 * @param {boolean} isReschedule - If true, allows using the buffer slot
 * @returns {string|null} next available block time or null if full
 */
export function findNextAvailableBlock(blockCounts, isReschedule = false) {
  const maxPerBlock = PATIENTS_PER_BLOCK;
  let totalBooked = 0;

  for (const block of TIME_BLOCKS) {
    totalBooked += (blockCounts[block] || 0);
  }

  // Enforce bookable capacity (reserve buffer unless this is a reschedule)
  const capacityLimit = isReschedule ? DAILY_CAPACITY : BOOKABLE_CAPACITY;
  if (totalBooked >= capacityLimit) return null;

  for (const block of TIME_BLOCKS) {
    if ((blockCounts[block] || 0) < maxPerBlock) {
      return block;
    }
  }
  return null;
}

/**
 * Heatmap color thresholds based on utilization percentage.
 * Returns a CSS class name.
 */
export function getHeatmapLevel(totalBooked, capacity = DAILY_CAPACITY) {
  if (capacity <= 0 || totalBooked <= 0) return 'heatmap-empty';
  const pct = (totalBooked / capacity) * 100;
  if (pct >= 100) return 'heatmap-full';
  if (pct >= 80) return 'heatmap-high';
  if (pct >= 50) return 'heatmap-moderate';
  return 'heatmap-low';
}
