import { describe, expect, it } from 'vitest';
import {
  computeEventsNeededForGoal,
  computeGoalStreak,
  monthKeyFromOffset,
} from './goalMetrics';

const REF = new Date(2026, 5, 15); // 15/jun/2026

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
