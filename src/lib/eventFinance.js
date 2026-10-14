import { parseISO, differenceInDays } from 'date-fns';
import { getEventStatus, todayLocalISO } from '@/components/utils/dateUtils';

const UNPAID_STATUSES = new Set(['pending', 'unpaid', 'partial']);

export function isCancelledEvent(event) {
  const status = event?.status;
  return status === 'cancelled' || status === 'cancelado';
}

export function isReceivableEvent(event) {
  if (isCancelledEvent(event)) return false;
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

function workDayKey(work) {
  const raw = work?.date || work?.work_date;
  return raw ? String(raw).slice(0, 10) : null;
}

function workStamp(work) {
  return Date.parse(work?.updated_at || work?.created_at || '') || 0;
}

/**
 * Um registro por dia: se houver dois no mesmo dia, vale o mais recente.
 * Registros sem data são mantidos como estão (legado).
 */
export function dedupeWorkByDay(dailyWork = []) {
  const byDay = new Map();
  const undated = [];
  for (const work of dailyWork) {
    const key = workDayKey(work);
    if (!key) {
      undated.push(work);
      continue;
    }
    const previous = byDay.get(key);
    if (!previous || workStamp(work) >= workStamp(previous)) byDay.set(key, work);
  }
  return [...byDay.values(), ...undated];
}

/**
 * Valor do evento considerando as horas lançadas.
 * Cachê é por DIA de evento: cada dia lançado vale o que foi calculado nele e
 * cada dia ainda sem registro vale a diária combinada. Um registro nunca apaga
 * os outros dias (antes: evento de 3 dias com 1 registro caía de 3 para 1 diária).
 */
export function calculateEventReceivableAmount(event, dailyWorkForEvent = []) {
  const rows = dedupeWorkByDay(dailyWorkForEvent || []);
  const fromWork = rows.reduce(
    (sum, w) => sum + (Number(w.daily_cache) || Number(w.daily_rate) || 0),
    0
  );
  if (rows.length === 0 || fromWork <= 0) return getEventCacheAmount(event);

  const days = calcEventDays(event);
  const missingDays = Math.max(0, days - rows.length);
  if (missingDays === 0) return Math.round(fromWork * 100) / 100;

  const perDay = Number(event?.daily_cache_value) > 0
    ? Number(event.daily_cache_value)
    : getEventCacheAmount(event) / days;
  return Math.round((fromWork + missingDays * perDay) * 100) / 100;
}

/** Soma valores a receber com a mesma regra do bloco A Receber. */
export function sumReceivableAmount(events = [], workByEvent = {}) {
  return events.reduce((sum, event) => {
    if (!isReceivableEvent(event)) return sum;
    const amount = calculateEventReceivableAmount(
      event,
      workByEvent[event.id] || []
    );
    return sum + amount;
  }, 0);
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

/**
 * Dias de atraso respeitando payment_due_date quando definida.
 * Retorna valor negativo quando o vencimento ainda não chegou (quantos dias faltam).
 * Retorna 0+ quando já venceu.
 */
export function daysOverduePayment(event) {
  if (!event) return 0;
  if (event.payment_due_date) {
    try {
      return differenceInDays(new Date(), parseISO(event.payment_due_date));
    } catch { return 0; }
  }
  return daysSinceEventEnd(event);
}

/**
 * Retorna true somente quando o pagamento está efetivamente em atraso:
 * - se payment_due_date existe: somente após essa data
 * - se não existe: 7+ dias após end_date (comportamento legado)
 */
export function isPaymentOverdue(event) {
  if (!event || event.payment_status === 'paid') return false;
  if (event.payment_due_date) {
    // "Hoje" no fuso de São Paulo (antes: UTC, que virava o dia às 21 h).
    return String(event.payment_due_date).slice(0, 10) < todayLocalISO();
  }
  return daysSinceEventEnd(event) >= 7;
}
