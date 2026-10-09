import {
  getEventReceivedAmount,
  getEventReceivedDate,
  isReceivedEvent,
  monthKeyRange,
  receivedInPeriod,
} from './financeMetrics';

/** YYYY-MM do mês `monthsBack` meses antes de refDate (0 = mês atual). */
export function monthKeyFromOffset(monthsBack, refDate = new Date()) {
  const d = new Date(refDate.getFullYear(), refDate.getMonth() - monthsBack, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Receita recebida no mês `monthStr` (YYYY-MM), pela data do pagamento. */
export function paidRevenueInMonth(events, monthStr, workByEvent = {}) {
  return receivedInPeriod(events, monthKeyRange(monthStr), workByEvent);
}

/** Meses consecutivos (exclui o mês atual) em que receita paga >= meta. */
export function computeGoalStreak(events, metaReceita, refDate = new Date(), workByEvent = {}) {
  if (!metaReceita) return 0;
  let streak = 0;
  for (let i = 1; i <= 24; i += 1) {
    const monthStr = monthKeyFromOffset(i, refDate);
    const rev = paidRevenueInMonth(events, monthStr, workByEvent);
    if (rev >= metaReceita) streak += 1;
    else break;
  }
  return streak;
}

/** Shows restantes estimados com base na média dos recebidos nos últimos 3 meses. */
export function computeEventsNeededForGoal(
  events,
  metaReceita,
  faturamentoPago,
  refDate = new Date(),
  workByEvent = {}
) {
  if (!metaReceita || faturamentoPago >= metaReceita) return null;

  const remaining = metaReceita - faturamentoPago;
  const cutoff = monthKeyFromOffset(3, refDate);

  const paidLast3 = events.filter(
    (e) => isReceivedEvent(e) && (getEventReceivedDate(e) || '') >= cutoff
  );

  if (paidLast3.length === 0) return null;

  const avgPerEvent =
    paidLast3.reduce((sum, e) => sum + getEventReceivedAmount(e, workByEvent[e.id] || []), 0) /
    paidLast3.length;
  if (avgPerEvent <= 0) return null;

  return { remaining, avg: avgPerEvent, count: Math.ceil(remaining / avgPerEvent) };
}
