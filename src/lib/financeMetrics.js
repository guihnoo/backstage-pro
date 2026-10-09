import { getEventStatus, todayLocalISO } from '@/components/utils/dateUtils';
import { calculateEventReceivableAmount, isCancelledEvent } from './eventFinance';

/**
 * Regras oficiais de competência financeira (docs/PLANO_REVISAO_GERAL.md § Modelo oficial de competência).
 *
 *   recebido       → paid_date
 *   previsto       → data do show (start_date)
 *   despesas       → expense_date
 *   horas/diárias  → dia trabalhado
 *
 * Toda tela que mostra dinheiro por período consome estas funções — não recalcular inline.
 * Períodos são `{ start, end }` inclusivos em 'YYYY-MM-DD' (aceitam Date; null = aberto).
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}/;

const pad2 = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' de uma string de data/datetime ou de um Date (fuso local); null se ausente ou inválida. */
export function toDateKey(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }
  if (typeof value === 'string' && DATE_KEY.test(value)) return value.slice(0, 10);
  return null;
}

/** Período do mês de refDate. */
export function monthRange(refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  return {
    start: toDateKey(new Date(year, month, 1)),
    end: toDateKey(new Date(year, month + 1, 0)),
  };
}

/** Período de um mês no formato 'YYYY-MM'. */
export function monthKeyRange(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number);
  return monthRange(new Date(year, month - 1, 1));
}

export function yearRange(year = new Date().getFullYear()) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function isDateInRange(value, range) {
  const key = toDateKey(value);
  if (!key) return false;
  const start = toDateKey(range?.start);
  const end = toDateKey(range?.end);
  if (start && key < start) return false;
  if (end && key > end) return false;
  return true;
}

export function buildWorkByEvent(dailyWork = []) {
  return dailyWork.reduce((acc, work) => {
    if (!work?.event_id) return acc;
    if (!acc[work.event_id]) acc[work.event_id] = [];
    acc[work.event_id].push(work);
    return acc;
  }, {});
}

const roundMoney = (value) => Math.round(value * 100) / 100;

/** Valor monetário informado; null quando ausente. 0 é um valor válido. */
function recordedAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

// ─── Recebido ────────────────────────────────────────────────────────────────

export function isReceivedEvent(event) {
  return event?.payment_status === 'paid' && !isCancelledEvent(event);
}

/**
 * Quanto foi recebido num evento pago.
 * `paid_amount` é a fonte; como 0 é válido, a ausência é testada com null (nunca `||`).
 * Pagos antigos sem `paid_amount`: `actual_revenue` (onde o antigo "marcar recebido" gravava
 * o valor ajustado) e, na falta dele, o mesmo valor que o evento mostrava em "A receber".
 */
export function getEventReceivedAmount(event, dailyWorkForEvent = []) {
  if (!event) return 0;
  const recorded = recordedAmount(event.paid_amount);
  if (recorded !== null) return recorded;
  if (Number(event.actual_revenue) > 0) return Number(event.actual_revenue);
  return calculateEventReceivableAmount(event, dailyWorkForEvent);
}

/** Data de competência do recebimento; pagos antigos sem `paid_date` caem na data do show. */
export function getEventReceivedDate(event) {
  return (
    toDateKey(event?.paid_date) ??
    toDateKey(event?.start_date) ??
    toDateKey(event?.event_date)
  );
}

export function paidEventsInPeriod(events = [], range) {
  return events.filter(
    (event) => isReceivedEvent(event) && isDateInRange(getEventReceivedDate(event), range)
  );
}

export function sumReceived(events = [], workByEvent = {}) {
  return events.reduce(
    (sum, event) => sum + getEventReceivedAmount(event, workByEvent[event.id] || []),
    0
  );
}

export function receivedInPeriod(events = [], range, workByEvent = {}) {
  return sumReceived(paidEventsInPeriod(events, range), workByEvent);
}

// ─── Previsto ────────────────────────────────────────────────────────────────

/** Shows ainda não realizados cuja data de início cai no período. */
export function projectedEventsInPeriod(events = [], range) {
  return events.filter(
    (event) =>
      !isCancelledEvent(event) &&
      getEventStatus(event) === 'scheduled' &&
      isDateInRange(event.start_date, range)
  );
}

export function projectedInPeriod(events = [], range, workByEvent = {}) {
  return projectedEventsInPeriod(events, range).reduce(
    (sum, event) => sum + calculateEventReceivableAmount(event, workByEvent[event.id] || []),
    0
  );
}

// ─── Despesas ────────────────────────────────────────────────────────────────

export function getExpenseDate(expense) {
  return toDateKey(expense?.expense_date) ?? toDateKey(expense?.date);
}

export function expensesInPeriod(expenses = [], range) {
  return expenses.filter((expense) => isDateInRange(getExpenseDate(expense), range));
}

export function sumExpenses(expenses = []) {
  return expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
}

// ─── Horas / diárias ─────────────────────────────────────────────────────────

/** Dia trabalhado: `date` e `work_date` guardam o mesmo dia; registros antigos têm só um deles. */
export function getWorkDate(work) {
  return toDateKey(work?.date) ?? toDateKey(work?.work_date);
}

export function workInPeriod(dailyWork = [], range) {
  return dailyWork.filter((work) => isDateInRange(getWorkDate(work), range));
}

export function hoursInPeriod(dailyWork = [], range) {
  return workInPeriod(dailyWork, range).reduce(
    (sum, work) => sum + (Number(work.total_hours ?? work.hours_worked) || 0),
    0
  );
}

// ─── Gravação de pagamento ───────────────────────────────────────────────────

/**
 * Payload para marcar um evento como pago. Todo caminho de "marcar pago" passa por aqui,
 * para que `paid_date` e `paid_amount` nunca fiquem para trás.
 * Sem `paidAmount` explícito assume o valor que o evento mostrava em "A receber".
 */
export function buildMarkPaidUpdate(event, dailyWorkForEvent = [], { paidAmount, paidDate } = {}) {
  const amount =
    recordedAmount(paidAmount) ?? calculateEventReceivableAmount(event, dailyWorkForEvent);
  return {
    payment_status: 'paid',
    paid_date: toDateKey(paidDate) ?? todayLocalISO(),
    // Evento ainda sem valor: fica NULL para a leitura acompanhar o cachê quando for preenchido.
    paid_amount: amount > 0 ? roundMoney(amount) : null,
  };
}

export function buildMarkUnpaidUpdate() {
  return { payment_status: 'unpaid', paid_date: null, paid_amount: null };
}

/**
 * Reparte um valor recebido entre eventos na proporção do valor de cada um.
 * O último absorve a diferença de arredondamento, para a soma bater com o que foi digitado.
 * Sem `paidAmount` cada evento fica com o próprio valor.
 */
export function distributePaidAmount(items = [], paidAmount) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const received = recordedAmount(paidAmount);
  if (received === null || received <= 0 || total <= 0) {
    return items.map((item) => ({ id: item.id, amount: roundMoney(item.amount) }));
  }

  const ratio = received / total;
  let allocated = 0;
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const amount = isLast ? roundMoney(received - allocated) : roundMoney(item.amount * ratio);
    allocated += amount;
    return { id: item.id, amount };
  });
}
