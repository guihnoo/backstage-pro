import { parseISO, differenceInDays } from 'date-fns';
import { getEventStatus } from '@/components/utils/dateUtils';

const UNPAID_STATUSES = new Set(['pending', 'unpaid', 'partial']);

export function isReceivableEvent(event) {
  if (!event) return false;
  const status = getEventStatus(event);
  if (status !== 'completed') return false;
  return UNPAID_STATUSES.has(event.payment_status);
}

export function calculateEventReceivableAmount(event, dailyWorkForEvent = []) {
  if (dailyWorkForEvent.length > 0) {
    const fromWork = dailyWorkForEvent.reduce(
      (sum, w) => sum + (w.daily_cache || w.daily_rate || 0),
      0
    );
    if (fromWork > 0) return fromWork;
  }

  // Prioridade: daily_cache_value (campo atual) → actual_revenue → estimated_revenue
  if (event.daily_cache_value > 0) return Number(event.daily_cache_value);
  if (event.actual_revenue > 0) return event.actual_revenue;
  if (event.estimated_revenue > 0) return event.estimated_revenue;
  return event.daily_cache || 0;
}

export function daysSinceEventEnd(event) {
  if (!event?.end_date && !event?.start_date) return 0;
  try {
    const ref = parseISO(event.end_date || event.start_date);
    return Math.max(0, differenceInDays(new Date(), ref));
  } catch {
    return 0;
  }
}
