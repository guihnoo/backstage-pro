import { describe, it, expect } from 'vitest';
import { calcEventDays, getEventCacheAmount, calculateEventReceivableAmount } from './eventFinance';

describe('datas invalidas nao viram NaN', () => {
  it('conta dias normais', () => {
    expect(calcEventDays({ start_date: '2026-10-10', end_date: '2026-10-12' })).toBe(3);
    expect(calcEventDays({ start_date: '2026-10-10' })).toBe(1);
  });

  it('data invalida conta 1 dia', () => {
    expect(calcEventDays({ start_date: 'lixo' })).toBe(1);
    expect(calcEventDays({ start_date: '2026-10-10', end_date: 'xx' })).toBe(1);
    expect(calcEventDays({ start_date: '2026-13-45' })).toBe(1);
  });

  it('fim antes do inicio conta 1 dia', () => {
    expect(calcEventDays({ start_date: '2026-10-12', end_date: '2026-10-10' })).toBe(1);
  });

  it('valores nunca saem NaN com data invalida', () => {
    const ev = { start_date: 'lixo', end_date: 'xx', daily_cache_value: 500, status: 'completed' };
    expect(Number.isFinite(getEventCacheAmount(ev))).toBe(true);
    expect(Number.isFinite(calculateEventReceivableAmount(ev, []))).toBe(true);
    expect(Number.isFinite(calculateEventReceivableAmount(ev, [{ date: 'zz', daily_cache: 300 }]))).toBe(true);
  });
});
