import { describe, expect, it } from 'vitest';
import { addDays, format } from 'date-fns';
import {
  isCancelledEvent,
  isReceivableEvent,
  calcEventDays,
  getEventCacheAmount,
  calculateEventReceivableAmount,
  sumReceivableAmount,
  daysOverduePayment,
  isPaymentOverdue,
} from './eventFinance';
import { getEventStatus } from '@/components/utils/dateUtils';

const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
const twoDaysAgo = format(addDays(new Date(), -2), 'yyyy-MM-dd');

function pastEvent(overrides = {}) {
  return {
    start_date: twoDaysAgo,
    end_date: yesterday,
    status: 'completed',
    payment_status: 'unpaid',
    ...overrides,
  };
}

describe('isCancelledEvent', () => {
  it('reconhece status cancelled (inglês)', () => {
    expect(isCancelledEvent({ status: 'cancelled' })).toBe(true);
  });

  it('reconhece status cancelado (legado)', () => {
    expect(isCancelledEvent({ status: 'cancelado' })).toBe(true);
  });

  it('ignora eventos confirmados ou concluídos', () => {
    expect(isCancelledEvent({ status: 'confirmed' })).toBe(false);
    expect(isCancelledEvent({ status: 'completed' })).toBe(false);
    expect(isCancelledEvent(null)).toBe(false);
  });
});

describe('getEventCacheAmount — comportamento existente (caracterização)', () => {
  it('prioriza actual_revenue', () => {
    expect(
      getEventCacheAmount({
        actual_revenue: 5000,
        estimated_revenue: 3000,
        daily_cache_value: 1000,
        start_date: twoDaysAgo,
        end_date: yesterday,
      })
    ).toBe(5000);
  });

  it('usa estimated_revenue quando actual_revenue é zero', () => {
    expect(
      getEventCacheAmount({
        actual_revenue: 0,
        estimated_revenue: 3200,
        daily_cache_value: 800,
        start_date: yesterday,
        end_date: yesterday,
      })
    ).toBe(3200);
  });

  it('multiplica daily_cache_value pelo número de dias do evento', () => {
    expect(
      getEventCacheAmount({
        daily_cache_value: 1000,
        start_date: twoDaysAgo,
        end_date: yesterday,
      })
    ).toBe(2000);
  });

  it('fallback para daily_cache legado', () => {
    expect(getEventCacheAmount({ daily_cache: 750 })).toBe(750);
  });

  it('retorna 0 sem campos financeiros', () => {
    expect(getEventCacheAmount({})).toBe(0);
  });
});

describe('calcEventDays', () => {
  it('evento multi-dia conta dias inclusivos', () => {
    expect(calcEventDays({ start_date: twoDaysAgo, end_date: yesterday })).toBe(2);
  });

  it('mínimo 1 dia', () => {
    expect(calcEventDays({ start_date: yesterday })).toBe(1);
  });
});

describe('calculateEventReceivableAmount — daily_work vs fallback', () => {
  it('soma daily_cache dos registros de trabalho quando > 0', () => {
    const amount = calculateEventReceivableAmount(
      { daily_cache_value: 500, start_date: yesterday, end_date: yesterday },
      [{ daily_cache: 1200 }, { daily_cache: 800 }]
    );
    expect(amount).toBe(2000);
  });

  it('cai no getEventCacheAmount quando work está vazio', () => {
    const ev = { estimated_revenue: 4500, start_date: yesterday, end_date: yesterday };
    expect(calculateEventReceivableAmount(ev, [])).toBe(4500);
  });
});

describe('isReceivableEvent — payment_status (comportamento existente)', () => {
  it('completed + unpaid é recebível', () => {
    expect(isReceivableEvent(pastEvent({ payment_status: 'unpaid' }))).toBe(true);
  });

  it('completed + partial é recebível (tratado como não pago)', () => {
    expect(isReceivableEvent(pastEvent({ payment_status: 'partial' }))).toBe(true);
  });

  it('completed + pending é recebível', () => {
    expect(isReceivableEvent(pastEvent({ payment_status: 'pending' }))).toBe(true);
  });

  it('completed + paid NÃO é recebível', () => {
    expect(isReceivableEvent(pastEvent({ payment_status: 'paid', paid_amount: 1000 }))).toBe(false);
  });

  it('evento futuro confirmed não é recebível mesmo com unpaid', () => {
    const future = format(addDays(new Date(), 5), 'yyyy-MM-dd');
    expect(
      isReceivableEvent({
        start_date: future,
        end_date: future,
        status: 'confirmed',
        payment_status: 'unpaid',
      })
    ).toBe(false);
  });

  it('cancelled nunca é recebível', () => {
    expect(isReceivableEvent(pastEvent({ status: 'cancelled', payment_status: 'unpaid' }))).toBe(false);
  });
});

describe('sumReceivableAmount', () => {
  it('soma apenas eventos recebíveis', () => {
    const events = [
      pastEvent({ id: 'a', payment_status: 'unpaid', estimated_revenue: 1000 }),
      pastEvent({ id: 'b', payment_status: 'paid', paid_amount: 2000 }),
      pastEvent({ id: 'c', payment_status: 'partial', estimated_revenue: 500 }),
    ];
    expect(sumReceivableAmount(events, {})).toBe(1500);
  });
});

describe('pagamento — paid_amount e competência (caracterização para auditoria)', () => {
  it('paid com paid_amount positivo não entra em isReceivableEvent', () => {
    const ev = pastEvent({ payment_status: 'paid', paid_amount: 1500, paid_date: yesterday });
    expect(isReceivableEvent(ev)).toBe(false);
    expect(getEventStatus(ev)).toBe('completed');
  });

  it('paid com paid_amount null ainda é tratado como pago (não recebível)', () => {
    const ev = pastEvent({ payment_status: 'paid', paid_amount: null });
    expect(isReceivableEvent(ev)).toBe(false);
  });

  it('paid com paid_amount 0 ainda é tratado como pago (não recebível)', () => {
    const ev = pastEvent({ payment_status: 'paid', paid_amount: 0 });
    expect(isReceivableEvent(ev)).toBe(false);
  });
});

describe('daysOverduePayment / isPaymentOverdue', () => {
  it('usa payment_due_date quando presente', () => {
    const due = format(addDays(new Date(), -3), 'yyyy-MM-dd');
    expect(daysOverduePayment({ payment_due_date: due })).toBeGreaterThanOrEqual(3);
  });

  it('isPaymentOverdue retorna false para paid', () => {
    expect(isPaymentOverdue(pastEvent({ payment_status: 'paid' }))).toBe(false);
  });

  it('isPaymentOverdue usa payment_due_date antes do legado de 7 dias', () => {
    const futureDue = format(addDays(new Date(), 5), 'yyyy-MM-dd');
    expect(
      isPaymentOverdue({
        payment_status: 'unpaid',
        payment_due_date: futureDue,
        end_date: twoDaysAgo,
      })
    ).toBe(false);
  });
});
