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
  if (typeof value === 'string' && DATE_KEY.test(value)) {
    const key=value.slice(0,10), parsed=new Date(key+'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===key ? key : null;
  }
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
 * Legado: aceita actual_revenue explicitamente informado, inclusive zero.
 * Cachê e diárias calculadas não comprovam depósito e ficam fora do recebido.
 */
export function getEventReceivedAmount(event) {
  if (!event) return 0;
  const recorded = recordedAmount(event.paid_amount);
  if (recorded !== null) return recorded;
  return recordedAmount(event.actual_revenue) ?? 0;
}

/** Data do recebimento informada e válida; sem inferir pelo dia do evento. */
export function getEventReceivedDate(event) {
  const date = toDateKey(event?.paid_date);
  return date && date <= todayLocalISO() ? date : null;
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
 * Exige valor e data explícitos; não transforma previsão em depósito.
 */
export function buildMarkPaidUpdate(event, _dailyWorkForEvent = [], { paidAmount, paidDate } = {}) {
  const amount = recordedAmount(paidAmount);
  const date = toDateKey(paidDate);
  if (amount === null || amount < 0) throw new RangeError('Informe o valor real recebido.');
  if (!date || date > todayLocalISO()) throw new RangeError('Informe a data real do recebimento, até hoje.');
  return {
    payment_status: 'paid', paid_date: date, paid_amount: roundMoney(amount),
    ...(event && 'paid_date_meta' in event ? {paid_date_meta:{source:'user_confirmed'}} : {}),
  };
}

export function buildMarkUnpaidUpdate(event) {
  return { payment_status: 'unpaid', paid_date: null, paid_amount: null,
    ...(event && 'paid_date_meta' in event ? {paid_date_meta:null} : {}),
  };
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
