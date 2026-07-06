/**
 * Add minutes to a date
 */
export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Get arrival Date from a slot descriptor
 * @param {string|number} slot - '+15', '+30', '+45', '+60', or a timestamp
 * @returns {Date}
 */
export function getArrivalDate(slot) {
  const now = new Date();
  if (typeof slot === 'string' && slot.startsWith('+')) {
    return addMinutes(now, parseInt(slot.slice(1)));
  }
  if (slot instanceof Date) return slot;
  return new Date(slot);
}

/**
 * Get estimated ready time
 * Ready time = arrival_time - avg_prep_time_minutes
 * So kitchen starts N minutes before arrival
 * But for display we show: food will be ready BY arrival time
 * The "estimated_ready_time" stored is arrival_time itself in this model.
 */
export function getEstimatedReadyTime(arrivalDate, avgPrepMinutes) {
  // The food will be ready at: arrivalTime
  // Kitchen gets the order and will start preparing avgPrepMinutes before
  // For the customer display: "Your food will be ready by [arrivalTime]"
  return new Date(arrivalDate);
}

/**
 * Format time as HH:MM AM/PM
 */
export function formatTimeShort(date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get time difference in seconds between two dates
 */
export function getSecondsDiff(futureDate, now = new Date()) {
  return Math.max(0, Math.floor((futureDate - now) / 1000));
}

/**
 * Format seconds as MM:SS
 */
export function formatCountdown(seconds) {
  if (seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Quick arrival slots (under 1 hour)
 */
export const QUICK_SLOTS = [
  { label: '15 min', value: '+15' },
  { label: '30 min', value: '+30' },
  { label: '45 min', value: '+45' },
  { label: '1 hr',   value: '+60' },
];

/**
 * Extended slot booking options (1 hour+)
 */
export const EXTENDED_SLOTS = [
  { label: '1 hr 15 min', value: '+75'  },
  { label: '1 hr 30 min', value: '+90'  },
  { label: '1 hr 45 min', value: '+105' },
  { label: '2 hours',     value: '+120' },
  { label: '2 hr 30 min', value: '+150' },
  { label: '3 hours',     value: '+180' },
  { label: '4 hours',     value: '+240' },
  { label: '5 hours',     value: '+300' },
];

/**
 * Format a date as a readable label e.g. "Today, 7:30 PM"
 */
export function formatSlotLabel(date) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((d - today) / 86400000);
  const prefix = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${prefix}, ${formatTimeShort(date)}`;
}
