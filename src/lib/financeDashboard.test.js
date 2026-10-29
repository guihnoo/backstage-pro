import { describe, expect, it } from 'vitest';
import { buildFinanceDashboard } from './financeDashboard';

const event = (id, overrides = {}) => ({
  id, client_id: id, client_name: id,
  start_date: '2026-11-10', end_date: '2026-11-10',
  estimated_revenue: 100, payment_status: 'unpaid', ...overrides,
});
const build = (overrides = {}) => buildFinanceDashboard({
  monthKey: '2026-11', today: '2026-11-20', ...overrides,
});
const codes = (dashboard) => dashboard.warnings.map((warning) => warning.code);

describe('buildFinanceDashboard', () => {
  it('reconciles completion revenue, actual receipts, global pending, future and cash', () => {
    const dashboard = build({
      clients: [{ id: 'aurora', name: 'Empresa Aurora' }, { id: 'gs', name: 'GS Eventos' }, { id: 'sincronia', name: 'Sincronia' }],
      events: [
        event('old', { client_id: 'sincronia', start_date: '2026-10-20', end_date: '2026-10-20', estimated_revenue: 2000, payment_status: 'paid', paid_amount: 2000, paid_date: '2026-11-05' }),
        event('continuous', { client_id: 'aurora', start_date: '2026-10-28', end_date: '2026-11-10', estimated_revenue: 6000, payment_status: 'paid', paid_amount: 6000, paid_date: '2026-11-18' }),
        event('festival', { client_id: 'gs', start_date: '2026-11-14', end_date: '2026-11-15', estimated_revenue: 3000, payment_due_date: '2026-11-30' }),
        event('future', { client_id: 'aurora', start_date: '2026-11-28', end_date: '2026-12-02', estimated_revenue: 4000 }),
      ],
      expenses: [{ event_id: 'continuous', expense_date: '2026-11-08', amount: 600 }, { event_id: 'festival', expense_date: '2026-11-15', amount: 400 }],
    });
    expect(dashboard.totals).toEqual({ revenue: 9000, received: 8000, pending: 3000, ongoing: 0, upcoming: 4000, expenses: 1000, cash: 7000 });
    expect(dashboard.billedRows.map((row) => row.id)).toEqual(['continuous', 'festival']);
    expect(dashboard.pendingRows[0]).toMatchObject({ id: 'festival', overdue: false, dueDate: '2026-11-30' });
    expect(dashboard.upcomingRows[0]).toMatchObject({ id: 'future', receivedDate: null, revenueDate: null });
    expect(dashboard.companies.find((company) => company.key === 'aurora')).toMatchObject({ revenue: 6000, received: 6000, upcoming: 4000, expenseAmount: 600 });
    expect(dashboard.calendarDays.find((day) => day.date === '2026-11-05').received).toBe(2000);
    expect(dashboard.calendarDays.find((day) => day.date === '2026-11-18').received).toBe(6000);
    expect(dashboard.calendarDays.every((day) => day.works.length === 0 && day.earned === 0)).toBe(true);
    expect(dashboard.calendarDays).toHaveLength(30);
    expect(new Date(dashboard.calendarDays[0].date + 'T00:00:00Z').getUTCDay()).toBe(0);
    expect(dashboard.warnings).toEqual([]);
  });

  it('books cross-year events in their end month and intersects future intervals', () => {
    const events = [event('new-year', { start_date: '2026-12-28', end_date: '2027-01-05', estimated_revenue: 500 })];
    expect(buildFinanceDashboard({ events, monthKey: '2026-12', today: '2027-01-10' }).totals.revenue).toBe(0);
    expect(buildFinanceDashboard({ events, monthKey: '2027-01', today: '2027-01-10' }).totals.revenue).toBe(500);
    const future = buildFinanceDashboard({ events, monthKey: '2027-01', today: '2026-12-01' });
    expect(future.totals.upcoming).toBe(500);
    expect(future.totals.revenue).toBe(0);
  });

  it('keeps today ongoing unless manually closed and never closes a future manual status', () => {
    const dashboard = build({ events: [
      event('today', { start_date: '2026-11-20', end_date: '2026-11-20' }),
      event('manual', { end_date: '2026-11-20', status: 'completed' }),
      event('archived', { end_date: '2026-11-20', status: 'archived' }),
      event('future', { start_date: '2026-11-28', end_date: '2026-11-29', status: 'completed' }),
    ] });
    expect(dashboard.ongoingRows.map((row) => row.id)).toEqual(['today']);
    expect(dashboard.billedRows.map((row) => row.id)).toEqual(['manual', 'archived']);
    expect(dashboard.upcomingRows.map((row) => row.id)).toEqual(['future']);
  });

  it('excludes both cancellation spellings and flags paid cancellations', () => {
    const dashboard = build({ events: [
      event('cancelled', { status: 'cancelled', payment_status: 'paid', paid_date: '2026-11-12' }),
      event('cancelado', { status: 'cancelado' }),
    ] });
    expect(dashboard.rows).toEqual([]);
    expect(dashboard.totals.revenue).toBe(0);
    expect(dashboard.totals.received).toBe(0);
    expect(dashboard.warnings).toContainEqual(expect.objectContaining({ code: 'cancelled_paid', count: 1 }));
  });

  it('rejects overflowing and reversed dates without inventing end dates', () => {
    const dashboard = build({ events: [
      event('overflow', { end_date: '2026-02-30' }),
      event('reversed', { end_date: '2026-11-01' }),
      event('bad-start', { start_date: 'invalid', end_date: '2026-11-15' }),
      event('missing-end', { end_date: null }),
    ] });
    expect(dashboard.rows.slice(0, 3).every((row) => row.stage === 'unknown' && row.revenueDate === null)).toBe(true);
    expect(dashboard.rows[0].endDate).toBeNull();
    expect(dashboard.billedRows.map((row) => row.id)).toEqual(['missing-end']);
    expect(dashboard.rows[3].endDate).toBe('2026-11-10');
    expect(dashboard.warnings).toContainEqual(expect.objectContaining({ code: 'invalid_event_dates', count: 3 }));
  });

  it('preserves explicitly recorded zero instead of using the event fee', () => {
    const dashboard = build({ events: [event('zero', { estimated_revenue: 500, payment_status: 'paid', paid_amount: 0, paid_date: '2026-11-18' })] });
    expect(dashboard.receiptRows).toHaveLength(1);
    expect(dashboard.receiptRows[0].receivedAmount).toBe(0);
    expect(dashboard.totals.received).toBe(0);
    expect(dashboard.totals.pending).toBe(0);
    expect(dashboard.totals.revenue).toBe(500);
  });

  it('does not fabricate receipt dates for legacy, invalid or future payments', () => {
    const dashboard = build({ events: [
      event('legacy', { payment_status: 'paid', paid_amount: 200 }),
      event('invalid', { payment_status: 'paid', paid_date: '2026-11-31' }),
      event('future-paid', { payment_status: 'paid', paid_date: '2026-11-25' }),
    ] });
    expect(dashboard.receiptRows).toEqual([]);
    expect(dashboard.totals.received).toBe(0);
    expect(dashboard.pendingRows).toEqual([]);
    expect(codes(dashboard)).toEqual(expect.arrayContaining(['missing_paid_date', 'invalid_paid_date', 'future_paid_date']));
  });

  it('keeps same-name clients with different IDs and no-ID fallback separate', () => {
    const dashboard = build({
      clients: [{ id: 'a', name: 'Empresa Igual' }, { id: 'b', name: 'Empresa Igual' }],
      events: [event('1', { client_id: 'a' }), event('2', { client_id: 'b' }), event('3', { client_id: null, client_name: 'Empresa Igual' })],
    });
    expect(dashboard.companies.map((company) => company.key).sort()).toEqual(['a', 'b', 'name:Empresa Igual']);
    expect(dashboard.companies.every((company) => company.name === 'Empresa Igual' && company.revenue === 100)).toBe(true);
  });

  it('sums decimal and numeric-string amounts in cents', () => {
    const dashboard = build({
      events: [
        event('1', { estimated_revenue: '0.10', payment_status: 'paid', paid_amount: '0.10', paid_date: '2026-11-12' }),
        event('2', { estimated_revenue: '0.20', payment_status: 'paid', paid_amount: '0.20', paid_date: '2026-11-12' }),
      ],
      expenses: [{ expense_date: '2026-11-12', amount: '0.10' }, { expense_date: '2026-11-13', amount: '0.20' }],
    });
    expect(dashboard.totals).toMatchObject({ revenue: 0.3, received: 0.3, expenses: 0.3, cash: 0 });
    expect(dashboard.calendarDays.find((day) => day.date === '2026-11-12').received).toBe(0.3);
  });

  it('uses only recorded work days, deduplicates and never prorates a closed fee', () => {
    const dashboard = build({
      events: [event('work', { start_date: '2026-11-01', end_date: '2026-11-30', estimated_revenue: 6000 }), event('fee-only', { estimated_revenue: 1000 })],
      workByEvent: { work: [
        { id: 'old', date: '2026-11-02', daily_cache: 200, updated_at: '2026-11-02T10:00:00Z' },
        { id: 'new', work_date: '2026-11-02', daily_cache: 300, updated_at: '2026-11-02T20:00:00Z' },
        { id: 'open', date: '2026-11-02', daily_cache: 0, updated_at: '2026-11-02T22:00:00Z' },
        { id: 'estimated', work_date: '2026-11-03', daily_rate: 150, origem: 'estimada' },
        { id: 'invalid', date: '2026-02-30', daily_cache: 999 },
        { id: 'future', date: '2026-11-25', daily_cache: 999 },
      ] },
    });
    const day2 = dashboard.calendarDays.find((day) => day.date === '2026-11-02');
    expect(day2.earned).toBe(300);
    expect(day2.works).toHaveLength(1);
    expect(day2.works[0].work.id).toBe('new');
    expect(dashboard.calendarDays.find((day) => day.date === '2026-11-03').works[0].estimated).toBe(true);
    expect(dashboard.calendarDays.reduce((sum, day) => sum + day.earned, 0)).toBe(450);
    expect(dashboard.calendarDays.find((day) => day.date === '2026-11-25').works).toEqual([]);
    expect(codes(dashboard)).toContain('invalid_work_date');
  });

  it('requires a known due date before declaring overdue and keeps pending global', () => {
    const dashboard = build({ events: [
      event('old', { start_date: '2026-10-01', end_date: '2026-10-01' }),
      event('due-today', { payment_due_date: '2026-11-20' }),
      event('overdue', { payment_due_date: '2026-11-19' }),
      event('invalid-due', { payment_due_date: '2026-11-31' }),
    ] });
    expect(dashboard.pendingRows).toHaveLength(4);
    expect(dashboard.pendingRows.filter((row) => row.overdue).map((row) => row.id)).toEqual(['overdue']);
    expect(codes(dashboard)).toContain('invalid_due_date');
  });

  it('uses expense date fallback only when missing and excludes future or invalid expense dates', () => {
    const dashboard = build({ expenses: [
      { date: '2026-11-10', amount: 20 },
      { expense_date: '2026-11-31', date: '2026-11-10', amount: 100 },
      { expense_date: '2026-11-25', amount: 200 },
      { expense_date: '2026-10-10', amount: 300 },
    ] });
    expect(dashboard.monthExpenses).toHaveLength(1);
    expect(dashboard.totals.expenses).toBe(20);
    expect(dashboard.totals.cash).toBe(-20);
    expect(codes(dashboard)).toContain('invalid_expense_date');
  });

  it('does not list irrelevant historic paid companies', () => {
    const dashboard = build({ events: [
      event('irrelevant', { start_date: '2026-10-10', end_date: '2026-10-10', payment_status: 'paid', paid_date: '2026-10-15' }),
    ] });
    expect(dashboard.rows).toHaveLength(1);
    expect(dashboard.companies).toEqual([]);
  });

  it('rejects invalid reference parameters and handles leap-year months', () => {
    expect(() => build({ monthKey: '2026-13' })).toThrow(RangeError);
    expect(() => build({ today: '2026-02-30' })).toThrow(RangeError);
    expect(build({ monthKey: '2028-02' }).calendarDays).toHaveLength(29);
  });
});


describe('valor explícito da diária', () => {
  it('preserva zero e não troca um valor inválido pela tarifa padrão', () => {
    for (const recorded of [0, 'inválido']) {
      const dashboard = build({ events: [event('day')], workByEvent: { day: [{ date: '2026-11-10', daily_cache: recorded, daily_rate: 500 }] } });
      const day = dashboard.calendarDays.find((item) => item.date === '2026-11-10');
      expect(day.works).toHaveLength(1);
      expect(day.earned).toBe(0);
      if (recorded === 'inválido') expect(codes(dashboard)).toContain('invalid_amount');
    }
  });
});
