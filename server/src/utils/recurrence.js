const DAY = 24 * 60 * 60 * 1000;

export function parseDateOnly(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function addOccurrence(date, schedule) {
  const result = new Date(date);
  if (schedule.frequency === 'daily' || (schedule.frequency === 'custom' && schedule.intervalUnit === 'day')) {
    result.setUTCDate(result.getUTCDate() + (schedule.frequency === 'daily' ? schedule.interval : schedule.interval));
  } else if (schedule.frequency === 'weekly' || (schedule.frequency === 'custom' && schedule.intervalUnit === 'week')) {
    result.setUTCDate(result.getUTCDate() + 7 * schedule.interval);
  } else {
    const months = schedule.frequency === 'quarterly' ? 3 : schedule.frequency === 'yearly' ? 12 : schedule.interval;
    const anchorDay = schedule.startDate ? new Date(schedule.startDate).getUTCDate() : result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    result.setUTCDate(Math.min(anchorDay, daysInMonth(result.getUTCFullYear(), result.getUTCMonth())));
  }
  return result;
}

export function occurrenceDates(schedule, until = new Date(), limit = 2400) {
  const dates = [];
  let current = new Date(schedule.startDate);
  const end = schedule.endDate && new Date(schedule.endDate) < until ? new Date(schedule.endDate) : until;
  for (let count = 0; current <= end && count < limit; count += 1) {
    dates.push(new Date(current));
    const next = addOccurrence(current, schedule);
    if (next <= current) break;
    current = next;
  }
  return dates;
}

export function nextOccurrence(schedule, from = new Date()) {
  if (schedule.status !== 'active') return null;
  let current = new Date(schedule.startDate);
  for (let count = 0; count < 2400; count += 1) {
    if (current >= from && (!schedule.endDate || current <= new Date(schedule.endDate))) return current;
    current = addOccurrence(current, schedule);
  }
  return null;
}

export function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}
