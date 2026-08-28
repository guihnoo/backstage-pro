import { describe, expect, it } from 'vitest';
import {
  computeEventsNeededForGoal,
  computeGoalStreak,
  monthKeyFromOffset,
  paidRevenueInMonth,
} from './goalMetrics';

const REF = new Date(2026, 5, 15); // 15/jun/2026

describe('paidRevenueInMonth — caracterização de competência (comportamento existente)', () => {
  const month = '2026-06';

  it('paid com paid_date no mês conta paid_amount', () => {
    const events = [{ payment_status: 'paid', paid_date: '2026-06-20', paid_amount: 3000, start_date: '2026-05-01' }];
    expect(paidRevenueInMonth(events, month)).toBe(3000);
  });

  it('paid sem paid_date usa start_date como competência', () => {
    const events = [{ payment_status: 'paid', paid_amount: 2500, start_date: '2026-06-10' }];
    expect(paidRevenueInMonth(events, month)).toBe(2500);
  });

  it('paid com paid_amount null soma 0', () => {
    const events = [{ payment_status: 'paid', paid_date: '2026-06-05', paid_amount: null, start_date: '2026-06-01' }];
    expect(paidRevenueInMonth(events, month)).toBe(0);
  });

  it('paid com paid_amount 0 soma 0', () => {
    const events = [{ payment_status: 'paid', paid_date: '2026-06-05', paid_amount: 0, start_date: '2026-06-01' }];
    expect(paidRevenueInMonth(events, month)).toBe(0);
  });

  it('unpaid/partial não entram na receita paga do mês', () => {
    const events = [
      { payment_status: 'unpaid', start_date: '2026-06-10', paid_amount: 1000 },
      { payment_status: 'partial', start_date: '2026-06-12', paid_amount: 500 },
      { payment_status: 'pending', start_date: '2026-06-15', paid_amount: 800 },
    ];
    expect(paidRevenueInMonth(events, month)).toBe(0);
  });

  it('paid_date em outro mês não conta mesmo com start_date no mês', () => {
    const events = [
      { payment_status: 'paid', paid_date: '2026-07-01', paid_amount: 4000, start_date: '2026-06-28' },
    ];
    expect(paidRevenueInMonth(events, month)).toBe(0);
  });
});

describe('computeGoalStreak', () => {
  it('retorna 0 sem meta', () => {
    expect(computeGoalStreak([], 0, REF)).toBe(0);
  });

  it('conta meses consecutivos batendo a meta (exclui mês atual)', () => {
    const events = [
      { payment_status: 'paid', start_date: `${monthKeyFromOffset(1, REF)}-10`, paid_amount: 10_000 },
      { payment_status: 'paid', start_date: `${monthKeyFromOffset(2, REF)}-05`, paid_amount: 12_000 },
      { payment_status: 'paid', start_date: `${monthKeyFromOffset(3, REF)}-01`, paid_amount: 4_000 },
    ];
    expect(computeGoalStreak(events, 10_000, REF)).toBe(2);
  });
});

describe('computeEventsNeededForGoal', () => {
  it('retorna null quando meta já foi batida', () => {
    expect(computeEventsNeededForGoal([], 10_000, 10_000, REF)).toBeNull();
  });

  it('estima shows restantes pela média dos últimos 3 meses', () => {
    const events = [
      { payment_status: 'paid', start_date: `${monthKeyFromOffset(0, REF)}-01`, paid_amount: 3_000 },
      { payment_status: 'paid', start_date: `${monthKeyFromOffset(1, REF)}-01`, paid_amount: 5_000 },
      { payment_status: 'paid', start_date: `${monthKeyFromOffset(2, REF)}-01`, paid_amount: 5_000 },
    ];
    const result = computeEventsNeededForGoal(events, 10_000, 3_000, REF);
    expect(result).toEqual({ remaining: 7_000, avg: 4_333.333333333333, count: 2 });
  });
});
