/** YYYY-MM do mês `monthsBack` meses antes de refDate (0 = mês atual). */
export function monthKeyFromOffset(monthsBack, refDate = new Date()) {
  const d = new Date(refDate.getFullYear(), refDate.getMonth() - monthsBack, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function paidRevenueInMonth(events, monthStr) {
  return events
    .filter((e) => {
      if (e.payment_status !== 'paid') return false;
      const refDate = e.paid_date || e.start_date || '';
      return refDate.startsWith(monthStr);
    })
    .reduce((sum, e) => sum + (Number(e.paid_amount) || 0), 0);
}

/** Meses consecutivos (exclui o mês atual) em que receita paga >= meta. */
export function computeGoalStreak(events, metaReceita, refDate = new Date()) {
  if (!metaReceita) return 0;
  let streak = 0;
  for (let i = 1; i <= 24; i += 1) {
    const monthStr = monthKeyFromOffset(i, refDate);
    const rev = paidRevenueInMonth(events, monthStr);
    if (rev >= metaReceita) streak += 1;
    else break;
  }
  return streak;
}

/** Shows restantes estimados com base na média dos pagos dos últimos 3 meses. */
export function computeEventsNeededForGoal(events, metaReceita, faturamentoPago, refDate = new Date()) {
  if (!metaReceita || faturamentoPago >= metaReceita) return null;

  const remaining = metaReceita - faturamentoPago;
  const cutoff = new Date(refDate.getFullYear(), refDate.getMonth() - 3, 1)
    .toISOString()
    .slice(0, 7);

  const paidLast3 = events.filter((e) => {
    if (e.payment_status !== 'paid') return false;
    return (e.start_date || '') >= cutoff;
  });

  if (paidLast3.length === 0) return null;

  const avgPerEvent =
    paidLast3.reduce((sum, e) => sum + (Number(e.paid_amount) || 0), 0) / paidLast3.length;
  if (avgPerEvent <= 0) return null;

  return { remaining, avg: avgPerEvent, count: Math.ceil(remaining / avgPerEvent) };
}
