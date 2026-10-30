import { buildFinanceDashboard } from './financeDashboard';
import { getEventDisplay } from './eventDisplay';
export { buildFinanceMetricDetails } from './financeMetricDetails';
export { getPaymentReminderTiming } from './paymentReminderTiming';
export const sum = (rows, select = r => r.amount) => rows.reduce((total, row) => total + Math.round(Number(select(row) || 0) * 100), 0) / 100;
export function addDays(date, n) {
  const day = new Date(date + 'T00:00:00Z');
  day.setUTCDate(day.getUTCDate() + n);
  return day.toISOString().slice(0, 10);
}
export function shiftMonth(month, n) {
  const day = new Date(month + '-01T00:00:00Z');
  day.setUTCMonth(day.getUTCMonth() + n);
  return day.toISOString().slice(0, 7);
}
export function lastDay(month) {
  const day = new Date(shiftMonth(month, 1) + '-01T00:00:00Z');
  day.setUTCDate(0);
  return day.toISOString().slice(0, 10);
}
export function createFinanceExplorerModel({
  events: inputEvents = [],
  clients: inputClients = [],
  expenses: inputExpenses = [],
  workByEvent = {},
  today
}) {
  const data = {
    today,
    clients: inputClients,
    expenses: inputExpenses
  };
  const clients = new Map(inputClients.map(c => [c.id, c]));
  const events = inputEvents.map(event => ({
    ...event,
    client_name: clients.get(event.client_id)?.name || event.client_name,
    client: clients.get(event.client_id) || event.client
  }));
  const cache = new Map();
  function dashboard(month, company = null) {
    const key = month + ':' + (company || '');
    if (cache.has(key)) return cache.get(key);
    const selected = company ? events.filter(e => (e.client_id ? String(e.client_id) : 'name:' + getEventDisplay(e, e.client).companyName) === company) : events;
    const ids = new Set(selected.map(e => e.id));
    const expenses = company ? data.expenses.filter(e => ids.has(e.event_id)) : data.expenses;
    const result = buildFinanceDashboard({
      events: selected,
      clients: data.clients,
      expenses,
      workByEvent,
      monthKey: month,
      today: data.today
    });
    cache.set(key, result);
    return result;
  }
  const all = dashboard(data.today.slice(0, 7));
  function hasValue(row) {
    return [row.event.paid_amount, row.event.actual_revenue, row.event.estimated_revenue].some(v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))) || Number(row.event.daily_cache_value) > 0 || (workByEvent[row.id] || []).some(w => Number(w.daily_cache) > 0);
  }
  const future = all.rows.filter(row => ['upcoming', 'ongoing'].includes(row.stage) && row.endDate >= data.today);
  function futureRows(month, kind = 'revenue') {
    if (kind === 'revenue') return future.filter(row => row.endDate.startsWith(month));
    if (kind === 'cash') return all.rows.filter(row => !row.paid && row.dueDate >= data.today && row.dueDate.startsWith(month));
    if (kind === 'reference') return future.filter(row => !row.paid && !row.dueDate && addDays(row.endDate, 10).startsWith(month));
    return future.filter(row => !row.paid && !row.dueDate && row.endDate.startsWith(month));
  }
  function metric(month, key, company = null, cutoff = null) {
    const d = dashboard(month, company);
    let rows = key === 'received' ? d.receiptRows : key === 'revenue' ? d.billedRows : d.monthExpenses;
    if (cutoff) rows = rows.filter(row => (key === 'received' ? row.receivedDate : key === 'revenue' ? row.revenueDate : row.expense_date || row.date) <= cutoff);
    return {
      rows,
      total: sum(rows, row => key === 'received' ? row.receivedAmount : key === 'revenue' ? row.amount : row.amount),
      dashboard: d
    };
  }
  function compare(month, key, company = null, equivalent = true) {
    const previous = shiftMonth(month, -1);
    const partial = equivalent && month === data.today.slice(0, 7);
    const currentEnd = partial ? data.today : lastDay(month);
    const previousEnd = partial ? previous + '-' + String(Math.min(Number(data.today.slice(-2)), Number(lastDay(previous).slice(-2)))).padStart(2, '0') : lastDay(previous);
    const current = metric(month, key, company, currentEnd),
      prior = metric(previous, key, company, previousEnd);
    const delta = (Math.round(current.total * 100) - Math.round(prior.total * 100)) / 100;
    return {
      current,
      prior,
      currentEnd,
      previousEnd,
      previous,
      delta,
      percent: prior.total > 0 ? delta / prior.total * 100 : null,
      partial
    };
  }
  return {
    events,
    expenses: inputExpenses,
    today,
    clients: data.clients,
    workByEvent,
    dashboard,
    all,
    futureRows,
    hasValue,
    metric,
    compare
  };
}
