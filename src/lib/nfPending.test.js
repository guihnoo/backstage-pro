import { describe, expect, it } from 'vitest';
import { addDays, format } from 'date-fns';
import { hasNfFor, isNfPendingEvent } from '@/lib/eventFinance';

const dia = (n) => format(addDays(new Date(), n), 'yyyy-MM-dd');
const evento = (extra = {}) => ({
  id: 'e1',
  status: 'confirmed',
  payment_status: 'pending',
  start_date: dia(-5),
  end_date: dia(-4),
  daily_cache_value: 800,
  ...extra,
});

describe('hasNfFor', () => {
  it('reconhece qualquer um dos tres campos de nota', () => {
    expect(hasNfFor(evento())).toBe(false);
    expect(hasNfFor(evento({ nf_number: '123' }))).toBe(true);
    expect(hasNfFor(evento({ nfe_numero: '456' }))).toBe(true);
    expect(hasNfFor(evento({ nfe_arquivo_url: 'https://x/nota.pdf' }))).toBe(true);
  });
});

describe('isNfPendingEvent', () => {
  it('evento ja realizado, com valor e sem nota fica pendente', () => {
    expect(isNfPendingEvent(evento())).toBe(true);
  });

  it('evento futuro nunca conta como pendente', () => {
    expect(isNfPendingEvent(evento({ start_date: dia(5), end_date: dia(6) }))).toBe(false);
  });

  it('evento cancelado nao conta', () => {
    expect(isNfPendingEvent(evento({ status: 'cancelled' }))).toBe(false);
  });

  it('evento com nota em qualquer campo nao conta', () => {
    expect(isNfPendingEvent(evento({ nfe_numero: '789' }))).toBe(false);
  });

  it('evento sem valor nao conta', () => {
    expect(isNfPendingEvent(evento({ daily_cache_value: 0, estimated_revenue: 0, actual_revenue: 0 }))).toBe(false);
  });

  it('evento futuro com nota emitida antes nao vira pendente', () => {
    expect(isNfPendingEvent(evento({ start_date: dia(3), end_date: dia(3), nf_number: '1' }))).toBe(false);
  });
});
