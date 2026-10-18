import { describe, it, expect } from 'vitest';
import { getClientActivity, eventDay } from './clientActivity';

const HOJE = '2026-10-18';
const ev = (start_date, status = 'completed') => ({ start_date, status });

describe('cliente ativo (regra unica de 90 dias)', () => {
  it('89 e 90 dias ativo; 91 inativo', () => {
    expect(getClientActivity([ev('2026-07-21')], HOJE)).toMatchObject({ daysSinceLastEvent: 89, isActive: true });
    expect(getClientActivity([ev('2026-07-20')], HOJE)).toMatchObject({ daysSinceLastEvent: 90, isActive: true });
    expect(getClientActivity([ev('2026-07-19')], HOJE)).toMatchObject({ daysSinceLastEvent: 91, isActive: false });
  });

  it('sem eventos, so cancelados ou so futuros = inativo sem historico', () => {
    for (const lista of [[], [ev('2026-10-01', 'cancelled')], [ev('2026-12-01')]]) {
      expect(getClientActivity(lista, HOJE)).toEqual({ lastEventDate: null, daysSinceLastEvent: null, isActive: false });
    }
  });

  it('ignora data invalida e pega o ultimo evento valido', () => {
    const r = getClientActivity([ev('lixo'), ev('2026-02-30'), ev('2026-09-01'), ev('2026-10-10'), ev('2026-11-20')], HOJE);
    expect(r).toMatchObject({ lastEventDate: '2026-10-10', daysSinceLastEvent: 8, isActive: true });
  });

  it('horario perto da meia-noite usa o dia de Sao Paulo', () => {
    expect(eventDay('2026-10-18T02:00:00Z')).toBe('2026-10-17');
    expect(eventDay('2026-10-18T02:00:00')).toBeNull();
    expect(eventDay(null)).toBeNull();
  });
});
