import { describe, expect, it } from 'vitest';
import { buildFinanceDashboard } from './financeDashboard';
import { buildFinanceMetricDetails } from './financeMetricDetails';

const event = (id, overrides = {}) => ({ id, client_id: id, client_name: id, start_date: '2026-11-10', end_date: '2026-11-10', estimated_revenue: 100, payment_status: 'unpaid', ...overrides });
const build = (events, expenses = [], monthKey = '2026-11') => buildFinanceDashboard({ events, expenses, monthKey, today: '2026-11-20' });
const detail = (dashboard, key) => buildFinanceMetricDetails(dashboard, key);
const ids = (section) => section.rows.map((row) => row.id);

describe('monthly metric details', () => {
  it('separates receipts of this month from receipts of events of other months', () => {
    const dashboard = build([
      event('continuous', { start_date: '2026-10-28', paid_date: '2026-11-18', payment_status: 'paid', paid_amount: 300 }),
      event('old', { start_date: '2026-10-20', end_date: '2026-10-20', paid_date: '2026-11-05', payment_status: 'paid', paid_amount: 200 }),
      event('future', { start_date: '2026-11-25', end_date: '2026-11-25' }),
    ]);
    const receipts = detail(dashboard, 'received');
    expect(ids(receipts.sections[0])).toEqual(['continuous']);
    expect(ids(receipts.sections[1])).toEqual(['old']);
    expect(receipts.total).toBe(dashboard.totals.received);
    expect(receipts.total).toBe(500);
    expect(detail(dashboard, 'revenue').sections[0].rows.map((row) => row.id)).toEqual(['continuous']);
  });

  it('limits pending to selected month while global history remains in dashboard', () => {
    const dashboard = build([event('current'), event('old', { start_date: '2026-10-20', end_date: '2026-10-20', estimated_revenue: 500 })]);
    expect(dashboard.totals.pending).toBe(600);
    expect(detail(dashboard, 'pending').total).toBe(100);
    expect(ids(detail(dashboard, 'pending').sections[0])).toEqual(['current']);
    const october = build(dashboard.rows.map((row) => row.event), [], '2026-10');
    expect(detail(october, 'pending').total).toBe(500);
  });

  it('reconciles cash to receipt rows minus dated expenses in cents', () => {
    const dashboard = build([event('paid', { paid_date: '2026-11-10', payment_status: 'paid', paid_amount: 0.3 })], [
      { id: 'included', amount: 0.1, expense_date: '2026-11-10', event_id: 'paid', title: 'Transporte' },
      { id: 'old', amount: 100, expense_date: '2026-10-10' },
    ]);
    const cash = detail(dashboard, 'cash');
    expect(cash.total).toBe(0.2);
    expect(cash.total).toBe(dashboard.totals.cash);
    expect(ids(cash.sections[1])).toEqual(['included']);
    expect(cash.sections[1].rows[0].event.id).toBe('paid');
  });

  it('preserves recorded zero and identifies legacy amount provenance', () => {
    const dashboard = build([
      event('zero', { payment_status: 'paid', paid_amount: 0, paid_date: '2026-11-10' }),
      event('legacy', { payment_status: 'paid', actual_revenue: 150, paid_date: '2026-11-10' }),
      event('estimated', { payment_status: 'paid', paid_date: '2026-11-10' }),
    ]);
    const rows = detail(dashboard, 'received').sections[0].rows;
    expect(rows[0]).toMatchObject({ amount: 0, needsReview: false });
    expect(rows[1]).toMatchObject({ amount: 150, needsReview: true, source: 'Valor do evento pago · cadastro antigo' });
    expect(rows).toHaveLength(2);
    const review = detail(dashboard, 'received').sections[2];
    expect(review.excluded).toBe(true);
    expect(review.rows[0]).toMatchObject({ amount: 100, needsReview: true, source: 'Valor calculado do evento · recebimento a conferir' });
    expect(detail(dashboard, 'received').total).toBe(150);
    expect(detail(dashboard, 'cash').total).toBe(150);
  });

  it('never substitutes event date for a missing payment date', () => {
    const dashboard = build([event('missing', { payment_status: 'paid', paid_amount: 150 })]);
    expect(detail(dashboard, 'received').total).toBe(0);
    expect(detail(dashboard, 'received').sections.every((section) => !section.rows.length)).toBe(true);
    expect(detail(dashboard, 'revenue').total).toBe(150);
  });

  it('prioritizes a confirmed final amount and retains the prior daily calculation', () => {
    const dashboard = build([event('adjusted', { estimated_revenue: 1000, paid_amount: 1175, paid_date: '2026-11-10', payment_status: 'paid' })]);
    const revenue = detail(dashboard, 'revenue');
    expect(revenue.total).toBe(1175);
    expect(revenue.sections[0].rows[0]).toMatchObject({ receivedAmount: 1175, paymentDifference: 175 });
    expect(detail(dashboard, 'received').total).toBe(1175);
    expect(dashboard.rows[0].event.paid_amount).toBe(1175);
  });

  it('handles empty selections, unknown metric and invalid expense value', () => {
    const dashboard = build([], [{ id: 'bad', amount: 'invalid', expense_date: '2026-11-10' }]);
    expect(detail(dashboard, 'cash').total).toBe(0);
    expect(detail(dashboard, 'expenses').total).toBe(0);
    expect(detail(dashboard, 'unknown')).toBeNull();
  });
});
