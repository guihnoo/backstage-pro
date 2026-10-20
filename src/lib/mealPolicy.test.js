import { describe, it, expect } from 'vitest';
import { resolveMealPolicy, mealOfDay, reimbursableMeals } from './mealPolicy';
import { calculateEventReceivableAmount } from './eventFinance';
import { buildEventClosing } from './eventClosing';

const evento = (extra = {}) => ({
  id: 'e1', start_date: '2026-10-10', end_date: '2026-10-10', cache_amount: 500, status: 'completed', ...extra,
});
const dia = (meal) => ({ date: '2026-10-10', daily_cache: 500, meal_allowance: meal });

describe('regra de alimentacao', () => {
  it('evento troca a regra do cliente; sem nada = nenhuma', () => {
    expect(resolveMealPolicy({ meal_policy: 'pago_no_local' }, { meal_policy: 'reembolso' })).toBe('pago_no_local');
    expect(resolveMealPolicy({ meal_policy: null }, { meal_policy: 'reembolso' })).toBe('reembolso');
    expect(resolveMealPolicy({ client: { meal_policy: 'custo_proprio' } })).toBe('custo_proprio');
    expect(resolveMealPolicy({})).toBeNull();
    expect(resolveMealPolicy({ meal_policy: 'inventada' })).toBeNull();
  });

  it('valor do dia nunca negativo nem NaN', () => {
    expect(mealOfDay({ meal_allowance: '45.5' })).toBe(45.5);
    expect(mealOfDay({ meal_allowance: -10 })).toBe(0);
    expect(mealOfDay({ meal_allowance: 'abc' })).toBe(0);
    expect(mealOfDay(null)).toBe(0);
  });

  it('so soma quando o cliente reembolsa', () => {
    const rows = [dia(40), { ...dia(30), date: '2026-10-11' }];
    expect(reimbursableMeals({ meal_policy: 'reembolso' }, rows)).toBe(70);
    expect(reimbursableMeals({ meal_policy: 'pago_no_local' }, rows)).toBe(0);
    expect(reimbursableMeals({ meal_policy: 'custo_proprio' }, rows)).toBe(0);
    expect(reimbursableMeals({}, rows)).toBe(0);
  });
});

describe('a receber e fechamento batem', () => {
  it('sem regra: nada muda (dados antigos)', () => {
    const ev = evento();
    expect(calculateEventReceivableAmount(ev, [dia(40)])).toBe(500);
    const f = buildEventClosing(ev, [dia(40)]);
    expect(f.totalAlimentacao).toBe(0);
    expect(f.totalServicos).toBe(f.aReceberApp);
  });

  it('reembolso: soma nos dois e continua batendo', () => {
    const ev = evento({ meal_policy: 'reembolso' });
    expect(calculateEventReceivableAmount(ev, [dia(40)])).toBe(540);
    const f = buildEventClosing(ev, [dia(40)]);
    expect(f.totalAlimentacao).toBe(40);
    expect(f.totalServicos).toBe(f.aReceberApp);
  });

  it('pago no local: nao cobra do cliente', () => {
    const ev = evento({ meal_policy: 'pago_no_local' });
    expect(calculateEventReceivableAmount(ev, [dia(40)])).toBe(500);
    expect(buildEventClosing(ev, [dia(40)]).totalAlimentacao).toBe(0);
  });
});
