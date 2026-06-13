import { describe, expect, it } from 'vitest';
import { isCancelledEvent } from './eventFinance';

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
