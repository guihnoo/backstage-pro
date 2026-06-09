import { parseISO, differenceInDays } from 'date-fns';
import { getEventStatus } from '@/components/utils/dateUtils';

const UNPAID_STATUSES = new Set(['pending', 'unpaid', 'partial']);

export function isReceivableEvent(event) {
  if (!event) return false;
  const status = getEventStatus(event);
  if (status !== 'completed') return false;
  return UNPAID_STATUSES.has(event.payment_status);
}

/** Número de dias de um evento (mínimo 1). */
export function calcEventDays(event) {
  if (!event?.start_date) return 1;
  try {
    const start = parseISO(event.start_date);
    const end = parseISO(event.end_date || event.start_date);
    return Math.max(1, differenceInDays(end, start) + 1);
  } catch {
    return 1;
  }
}

/**
 * Valor total do evento sem depender de daily_work (fallback para relatórios/listas).
 * daily_cache_value é a DIÁRIA — multiplica pelo número de dias.
 * actual_revenue / estimated_revenue são totais já calculados.
 */
export function getEventCacheAmount(event) {
  if (!event) return 0;
  if (Number(event.actual_revenue) > 0) return Number(event.actual_revenue);
  if (Number(event.estimated_revenue) > 0) return Number(event.estimated_revenue);
  if (Number(event.daily_cache_value) > 0) {
    return Math.round(Number(event.daily_cache_value) * calcEventDays(event) * 100) / 100;
  }
  return Number(event.daily_cache) || 0;
}

export function calculateEventReceivableAmount(event, dailyWorkForEvent = []) {
  if (dailyWorkForEvent.length > 0) {
    const fromWork = dailyWorkForEvent.reduce(
      (sum, w) => sum + (w.daily_cache || w.daily_rate || 0),
      0
    );
    if (fromWork > 0) return fromWork;
  }

  return getEventCacheAmount(event);
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
