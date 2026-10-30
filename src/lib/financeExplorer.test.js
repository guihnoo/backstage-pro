import { describe, it, expect } from 'vitest';
import { createFinanceExplorerModel } from './financeExplorer';
const clients = [{
  id: 'a',
  name: 'Mesma empresa'
}, {
  id: 'b',
  name: 'Mesma empresa'
}];
const event = (id, values = {}) => ({
  id,
  client_id: 'a',
  title: id,
  start_date: '2026-10-01',
  end_date: '2026-10-01',
  estimated_revenue: 100,
  status: 'completed',
  payment_status: 'unpaid',
  ...values
});
const model = (events, extra = {}) => createFinanceExplorerModel({
  events,
  clients,
  expenses: [],
  today: '2026-11-20',
  ...extra
});
describe('exploração financeira com dados da conta', () => {
  it('fecha evento contínuo uma vez, no fim, e separa prazo de depósito', () => {
    const m = model([event('continuous', {
      start_date: '2026-11-28',
      end_date: '2026-12-02',
      status: 'confirmed',
      estimated_revenue: 4000
    })]);
    expect(m.futureRows('2026-11')).toHaveLength(0);
    expect(m.futureRows('2026-12').map(r => r.id)).toEqual(['continuous']);
    expect(m.futureRows('2026-12', 'cash')).toEqual([]);
    expect(m.futureRows('2026-12', 'noDate')).toHaveLength(1);
    expect(m.futureRows('2026-12', 'reference')).toHaveLength(1);
  });
  it('entrada futura exige prazo cadastrado e evento não pago', () => {
    const m = model([event('due', {
      payment_due_date: '2026-12-05'
    }), event('paid', {
      payment_due_date: '2026-12-05',
      payment_status: 'paid',
      paid_amount: 100,
      paid_date: '2026-11-15'
    }), event('cancel', {
      status: 'cancelled',
      payment_due_date: '2026-12-05'
    })]);
    expect(m.futureRows('2026-12', 'cash').map(r => r.id)).toEqual(['due']);
  });
  it('compara o mesmo recorte de dias e abre os registros responsáveis', () => {
    const m = model([event('now', {
      payment_status: 'paid',
      paid_amount: 200,
      paid_date: '2026-11-15'
    }), event('prior', {
      payment_status: 'paid',
      paid_amount: 100,
      paid_date: '2026-10-15'
    }), event('late', {
      payment_status: 'paid',
      paid_amount: 900,
      paid_date: '2026-10-25'
    })]);
    const result = m.compare('2026-11', 'received');
    expect(result.currentEnd).toBe('2026-11-20');
    expect(result.previousEnd).toBe('2026-10-20');
    expect(result.delta).toBe(100);
    expect(result.percent).toBe(100);
    expect(result.prior.rows.map(r => r.id)).toEqual(['prior']);
    expect(m.compare('2026-11', 'received', null, false).prior.total).toBe(1000);
  });
  it('não inventa percentual com base zero e distingue empresa por ID', () => {
    const m = model([event('a', {
      payment_status: 'paid',
      paid_amount: 200,
      paid_date: '2026-11-15'
    }), event('b', {
      client_id: 'b',
      payment_status: 'paid',
      paid_amount: 500,
      paid_date: '2026-11-15'
    })]);
    expect(m.compare('2026-11', 'received', 'a').percent).toBeNull();
    expect(m.metric('2026-11', 'received', 'a').total).toBe(200);
    expect(m.metric('2026-11', 'received', 'b').total).toBe(500);
  });
  it('despesas da empresa exigem vínculo, totais gerais mantêm as sem vínculo', () => {
    const m = model([event('a')], {
      expenses: [{
        id: 'linked',
        event_id: 'a',
        amount: 20,
        expense_date: '2026-11-01'
      }, {
        id: 'general',
        amount: 50,
        expense_date: '2026-11-01'
      }]
    });
    expect(m.metric('2026-11', 'expenses', 'a').total).toBe(20);
    expect(m.metric('2026-11', 'expenses').total).toBe(70);
  });
  it('valor ausente não vira depósito, zero final e data estimada são preservados', () => {
    const m = model([event('missing', {
      estimated_revenue: null,
      payment_status: 'paid',
      paid_date: '2026-11-01'
    }), event('zero', {
      payment_status: 'paid',
      paid_amount: 0,
      paid_date: '2026-11-01'
    }), event('estimated', {
      payment_status: 'paid',
      paid_amount: 500,
      paid_date: '2026-11-02',
      paid_date_meta: {
        source: 'estimated',
        days: 10
      }
    })]);
    expect(m.dashboard('2026-11').totals.received).toBe(500);
    expect(m.hasValue(m.all.rows.find(r => r.id === 'missing'))).toBe(false);
    expect(m.hasValue(m.all.rows.find(r => r.id === 'zero'))).toBe(true);
    expect(m.all.rows.find(r => r.id === 'estimated').receivedDateEstimated).toBe(true);
  });
  it('clampa mês anterior curto no último dia válido', () => {
    const m = model([], {
      today: '2026-03-31'
    });
    expect(m.compare('2026-03', 'received').previousEnd).toBe('2026-02-28');
  });
});
