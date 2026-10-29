import { todayLocalISO } from '@/components/utils/dateUtils';
import { calculateEventReceivableAmount, dedupeWorkByDay, isCancelledEvent, isEstimatedWork } from './eventFinance';
import { getEventReceivedAmount } from './financeMetrics';
import { buildClientMap, getEventDisplay, resolveClientForEvent } from './eventDisplay';

const DAY_MS = 86400000;
const missing = (value) => value === null || value === undefined || value === '';
const cents = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Math.sign(number) * Number.EPSILON) * 100) : 0;
};
const moneySum = (items, select) => items.reduce((sum, item) => sum + cents(select(item)), 0) / 100;

// Legacy date helpers accept overflowing dates and fabricate fallbacks. Financial
// competence must reject those values without changing the shared helpers.
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  const key = value.slice(0, 10);
  const parsed = new Date(key + 'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key) return null;
  if (value.length > 10 && !Number.isFinite(Date.parse(value))) return null;
  return key;
}

function getRange(monthKey) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey) || !validDate(monthKey + '-01')) {
    throw new RangeError('monthKey deve ser um mês válido em YYYY-MM.');
  }
  const start = monthKey + '-01';
  const next = new Date(start + 'T00:00:00Z');
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: new Date(next.getTime() - DAY_MS).toISOString().slice(0, 10) };
}

const inRange = (date, range) => Boolean(date && date >= range.start && date <= range.end);
const intersects = (row, range) => Boolean(row.startDate && row.endDate && row.startDate <= range.end && row.endDate >= range.start);

const WARNING_LABELS = {
  invalid_event_dates: 'Eventos com período inválido não entraram no faturamento ou na previsão.',
  invalid_paid_date: 'Pagamentos com data inválida não entraram nos recebimentos.',
  missing_paid_date: 'Eventos pagos sem data de pagamento não entraram nos recebimentos.',
  future_paid_date: 'Pagamentos com data futura não entraram nos recebimentos.',
  cancelled_paid: 'Eventos cancelados marcados como pagos foram excluídos; revise os dados.',
  invalid_due_date: 'Vencimentos inválidos foram tratados como não informados.',
  invalid_expense_date: 'Despesas com data inválida não entraram no período.',
  invalid_work_date: 'Registros de trabalho sem data válida não entraram no calendário.',
  invalid_amount: 'Valores monetários inválidos foram tratados como zero.',
};

/**
 * Pure read model. Revenue belongs to completed events' end month; receipts use
 * actual paid_date only. Pending is global, while ongoing/upcoming intersect the
 * selected month. No installment inference and no daily allocation of event fees.
 * Row/company expenses are linked expenses of the selected month, not lifetime cost.
 */
export function buildFinanceDashboard({
  events = [], clients = [], expenses = [], workByEvent = {},
  monthKey, today = todayLocalISO(),
} = {}) {
  today = validDate(today);
  if (!today) throw new RangeError('today deve ser uma data válida em YYYY-MM-DD.');
  monthKey = monthKey ?? today.slice(0, 7);
  const range = getRange(monthKey);
  const warningCounts = new Map();
  const warn = (code) => warningCounts.set(code, (warningCounts.get(code) || 0) + 1);
  const amount = (value) => {
    if (!missing(value) && !Number.isFinite(Number(value))) warn('invalid_amount');
    return cents(value) / 100;
  };
  const clientMap = buildClientMap(clients);
  const rows = [];

  for (const [index, event] of events.entries()) {
    if (!event) continue;
    const paid = event.payment_status === 'paid';
    if (isCancelledEvent(event)) {
      if (paid) warn('cancelled_paid');
      continue;
    }
    const startDate = validDate(missing(event.start_date) ? event.event_date : event.start_date);
    const endDate = missing(event.end_date) ? startDate : validDate(event.end_date);
    const validPeriod = Boolean(startDate && endDate && endDate >= startDate);
    let stage = 'unknown';
    if (!validPeriod) warn('invalid_event_dates');
    else if (endDate < today || (['completed', 'archived'].includes(event.status) && endDate <= today)) stage = 'completed';
    else if (startDate > today) stage = 'upcoming';
    else stage = 'ongoing';

    const work = Array.isArray(workByEvent[event.id]) ? workByEvent[event.id] : [];
    const client = resolveClientForEvent(event, clientMap);
    const companyName = getEventDisplay(event, client).companyName;
    const companyKey = !missing(event.client_id) ? String(event.client_id) : 'name:' + companyName;
    let receivedDate = paid ? validDate(event.paid_date) : null;
    if (paid && !receivedDate) warn(missing(event.paid_date) ? 'missing_paid_date' : 'invalid_paid_date');
    if (receivedDate && receivedDate > today) {
      warn('future_paid_date');
      receivedDate = null;
    }
    const dueDate = validDate(event.payment_due_date);
    if (!missing(event.payment_due_date) && !dueDate) warn('invalid_due_date');
    rows.push({
      id: event.id ?? 'event-' + index, event, client, companyKey, companyName,
      startDate, endDate, stage,
      revenueDate: stage === 'completed' ? endDate : null,
      amount: amount(calculateEventReceivableAmount(event, work)),
      receivedAmount: paid ? amount(getEventReceivedAmount(event, work)) : 0,
      receivedDate, paid, dueDate,
      overdue: stage === 'completed' && !paid && Boolean(dueDate && dueDate < today),
      expenseAmount: 0,
    });
  }

  const monthExpenses = expenses.filter((expense) => {
    if (!expense) return false;
    // A present but invalid authoritative date is not silently replaced.
    const date = validDate(missing(expense.expense_date) ? expense.date : expense.expense_date);
    if (!date) warn('invalid_expense_date');
    return inRange(date, range) && date <= today;
  });
  const expenseByEvent = new Map();
  for (const expense of monthExpenses) {
    const value = amount(expense.amount);
    const key = String(expense.event_id);
    expenseByEvent.set(key, (expenseByEvent.get(key) || 0) + cents(value));
  }
  for (const row of rows) row.expenseAmount = (expenseByEvent.get(String(row.id)) || 0) / 100;

  const billedRows = rows.filter((row) => inRange(row.revenueDate, range));
  const receiptRows = rows.filter((row) => row.paid && inRange(row.receivedDate, range));
  const pendingRows = rows.filter((row) => row.stage === 'completed' && !row.paid);
  const ongoingRows = rows.filter((row) => row.stage === 'ongoing' && intersects(row, range));
  const upcomingRows = rows.filter((row) => row.stage === 'upcoming' && intersects(row, range));

  const calendarDays = [];
  for (let time = Date.parse(range.start + 'T00:00:00Z'); time <= Date.parse(range.end + 'T00:00:00Z'); time += DAY_MS) {
    calendarDays.push({ date: new Date(time).toISOString().slice(0, 10), receipts: [], works: [], received: 0, earned: 0 });
  }
  const calendarMap = new Map(calendarDays.map((day) => [day.date, day]));
  for (const row of receiptRows) calendarMap.get(row.receivedDate).receipts.push(row);
  for (const row of rows) {
    const rawWork = Array.isArray(workByEvent[row.event.id]) ? workByEvent[row.event.id] : [];
    // Normalize the day before shared deduplication, including work_date-only rows.
    const dated = rawWork.flatMap((work) => {
      const date = validDate(work?.date) ?? validDate(work?.work_date);
      if (!date) { warn('invalid_work_date'); return []; }
      return date <= today ? [{ ...work, date }] : [];
    });
    for (const work of dedupeWorkByDay(dated)) {
      const day = calendarMap.get(work.date);
      if (!day) continue;
      day.works.push({
        event: row.event, work,
        amount: amount(!missing(work.daily_cache) ? work.daily_cache : work.daily_rate ?? 0),
        estimated: isEstimatedWork(work),
      });
    }
  }
  for (const day of calendarDays) {
    day.received = moneySum(day.receipts, (row) => row.receivedAmount);
    day.earned = moneySum(day.works, (work) => work.amount);
  }

  const relevant = new Set([...billedRows, ...receiptRows, ...pendingRows, ...ongoingRows, ...upcomingRows]);
  for (const row of rows) if (row.expenseAmount !== 0) relevant.add(row);
  const companyMap = new Map();
  for (const row of relevant) {
    if (!companyMap.has(row.companyKey)) {
      companyMap.set(row.companyKey, { key: row.companyKey, name: row.companyName, client: row.client, rows: [] });
    }
    companyMap.get(row.companyKey).rows.push(row);
  }
  const billed = new Set(billedRows), receipts = new Set(receiptRows), pending = new Set(pendingRows);
  const ongoing = new Set(ongoingRows), upcoming = new Set(upcomingRows);
  const companies = [...companyMap.values()].map((company) => ({
    ...company,
    revenue: moneySum(company.rows.filter((row) => billed.has(row)), (row) => row.amount),
    received: moneySum(company.rows.filter((row) => receipts.has(row)), (row) => row.receivedAmount),
    pending: moneySum(company.rows.filter((row) => pending.has(row)), (row) => row.amount),
    ongoing: moneySum(company.rows.filter((row) => ongoing.has(row)), (row) => row.amount),
    upcoming: moneySum(company.rows.filter((row) => upcoming.has(row)), (row) => row.amount),
    expenseAmount: moneySum(company.rows, (row) => row.expenseAmount),
  }));
  const totals = {
    revenue: moneySum(billedRows, (row) => row.amount),
    received: moneySum(receiptRows, (row) => row.receivedAmount),
    pending: moneySum(pendingRows, (row) => row.amount),
    ongoing: moneySum(ongoingRows, (row) => row.amount),
    upcoming: moneySum(upcomingRows, (row) => row.amount),
    expenses: moneySum(monthExpenses, (expense) => expense.amount),
  };
  totals.cash = (cents(totals.received) - cents(totals.expenses)) / 100;
  return {
    monthKey, range, rows, billedRows, receiptRows, pendingRows, ongoingRows,
    upcomingRows, monthExpenses, companies, calendarDays, totals,
    warnings: [...warningCounts].map(([code, count]) => ({ code, count, label: WARNING_LABELS[code] })),
  };
}
