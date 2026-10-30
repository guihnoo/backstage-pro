const DAY_MS = 86_400_000;
export const PAYMENT_REMINDER_START_DAYS = 10;

const missing = (value) => value === null || value === undefined || value === '';

function dateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  const key = value.slice(0, 10);
  const parsed = new Date(key + 'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key) return null;
  if (value.length > 10 && !Number.isFinite(Date.parse(value))) return null;
  return key;
}

const daysBetween = (later, earlier) => (Date.parse(later + 'T00:00:00Z') - Date.parse(earlier + 'T00:00:00Z')) / DAY_MS;

/**
 * Read-only timing for payment reminders. Inputs represent local calendar days;
 * UTC arithmetic avoids DST/time-of-day differences. Ten days is a reminder
 * threshold, not an inferred due date or an automatic claim that payment is late.
 */
export function getPaymentReminderTiming(event, todayISO) {
  if (!event || event.payment_status === 'paid' || ['cancelled', 'cancelado'].includes(event.status)) return null;
  const today = dateKey(todayISO);
  const startDate = dateKey(missing(event.start_date) ? event.event_date : event.start_date);
  const endDate = missing(event.end_date) ? startDate : dateKey(event.end_date);
  if (!today || !startDate || !endDate || endDate < startDate || endDate >= today) return null;
  const daysSinceEnd = daysBetween(today, endDate);
  if (daysSinceEnd < PAYMENT_REMINDER_START_DAYS) return null;
  const dueDate = dateKey(event.payment_due_date);
  const isOverdue = Boolean(dueDate && dueDate < today);
  return {
    endDate,
    daysSinceEnd,
    dueDate,
    isOverdue,
    daysOverdue: isOverdue ? daysBetween(today, dueDate) : 0,
  };
}
