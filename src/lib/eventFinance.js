import { parseISO, differenceInDays } from 'date-fns';
import { getEventStatus, todayLocalISO } from '@/components/utils/dateUtils';
import { dailyBaseValue } from './workDay';
import { reimbursableMeals } from './mealPolicy';

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
    const diff = differenceInDays(end, start);
    // Data invalida nao lanca erro: vira NaN e "contaminava" cache e a receber. Conta 1 dia.
    if (!Number.isFinite(diff)) return 1;
    return Math.max(1, diff + 1);
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

function workValue(work) {
  return Number(work?.daily_cache) || Number(work?.daily_rate) || 0;
}

/**
 * Um registro por dia: se houver dois no mesmo dia, vale o mais recente que tenha
 * valor (um turno ainda aberto, com valor 0, não apaga o dia já fechado).
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
    const better = !previous
      || (workValue(work) > 0 && workValue(previous) <= 0)
      || ((workValue(work) > 0) === (workValue(previous) > 0) && workStamp(work) >= workStamp(previous));
    if (better) byDay.set(key, work);
  }
  return [...byDay.values(), ...undated];
}

function isWithinEvent(event, dayKey) {
  const start = String(event?.start_date || '').slice(0, 10);
  const end = String(event?.end_date || event?.start_date || '').slice(0, 10);
  if (!start) return true;
  return dayKey >= start && dayKey <= end;
}

/**
 * Valor do evento considerando as horas lançadas.
 * Cachê é por DIA de evento: cada dia lançado vale o que foi calculado nele e
 * cada dia ainda sem registro vale a diária combinada. Um registro nunca apaga
 * os outros dias (antes: evento de 3 dias com 1 registro caía de 3 para 1 diária).
 */
export function calculateEventReceivableAmount(event, dailyWorkForEvent = []) {
  const rows = dedupeWorkByDay(dailyWorkForEvent || []);
  // Alimentacao so entra quando o cliente reembolsa (sem regra = 0, dados antigos nao mudam).
  const meals = reimbursableMeals(event, rows);
  const fromWork = rows.reduce((sum, w) => sum + workValue(w), 0);
  if (rows.length === 0 || fromWork <= 0) return Math.round((getEventCacheAmount(event) + meals) * 100) / 100;

  const days = calcEventDays(event);
  // Só registros dentro das datas do evento ocupam um dia (sem data = legado, ocupa).
  const coveredDays = rows.filter((w) => {
    const key = workDayKey(w);
    return !key || isWithinEvent(event, key);
  }).length;
  const missingDays = Math.max(0, days - coveredDays);
  if (missingDays === 0) return Math.round((fromWork + meals) * 100) / 100;

  const perDay = dailyBaseValue(event) || getEventCacheAmount(event) / days;
  return Math.round((fromWork + missingDays * perDay + meals) * 100) / 100;
}

function eachDayKey(start, end) {
  const s = Date.parse(String(start || '').slice(0, 10) + 'T00:00:00Z');
  let e = Date.parse(String(end || start || '').slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(s)) return [];
  // Fim inválido ou antes do início: conta pelo menos o dia de início (não libera a trava).
  if (Number.isNaN(e) || e < s) e = s;
  const days = [];
  for (let t = s; t <= e && days.length < 400; t += 86400000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** Dia preenchido pelas 12 h automáticas (coluna nova `origem` ou marca antiga nas notas). */
export function isEstimatedWork(work) {
  if (!work) return false;
  if (work.origem) return work.origem === 'estimada';
  return /^12h automáticas/i.test(String(work.notes || work.description || ''));
}

/**
 * Situação das horas de cada dia do evento (Lote 3).
 * status: 'lancado' (horas reais) | 'estimado' (12 h automáticas) | 'pendente' (já passou, sem horas) | 'futuro'.
 * `missing` = dias até hoje sem nenhum registro; `estimated` = dias com 12 h automáticas.
 */
export function getEventHoursStatus(event, dailyWorkForEvent = [], today = todayLocalISO()) {
  const byDay = new Map();
  for (const work of dedupeWorkByDay(dailyWorkForEvent || [])) {
    const key = workDayKey(work);
    if (key) byDay.set(key, work);
  }
  const days = eachDayKey(event?.start_date, event?.end_date || event?.start_date).map((date) => {
    const work = byDay.get(date) || null;
    let status = 'futuro';
    if (work) status = isEstimatedWork(work) ? 'estimado' : 'lancado';
    else if (date <= today) status = 'pendente';
    return { date, work, status };
  });
  const missing = days.filter((d) => d.status === 'pendente').map((d) => d.date);
  const estimated = days.filter((d) => d.status === 'estimado').map((d) => d.date);
  return { days, missing, estimated, complete: missing.length === 0 };
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

/** Evento ja tem nota fiscal registrada (qualquer um dos campos usados no app). */
export function hasNfFor(event) {
  return Boolean(event?.nf_number) || Boolean(event?.nfe_numero) || Boolean(event?.nfe_arquivo_url);
}

/**
 * NF pendente: evento ja concluido (pela data ou manualmente), nao cancelado, com valor e sem nota.
 * Evento futuro nunca conta como pendente (a nota pode ser emitida antes, e entao aparece como emitida).
 */
export function isNfPendingEvent(event) {
  if (!event || isCancelledEvent(event)) return false;
  if (getEventStatus(event) !== 'completed') return false;
  if (hasNfFor(event)) return false;
  return Number(event.paid_amount) > 0 || getEventCacheAmount(event) > 0;
}
