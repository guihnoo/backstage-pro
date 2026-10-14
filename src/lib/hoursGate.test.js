import { describe, expect, it } from 'vitest';
import { buildHoursGateMessage, shouldBlockPayment } from './hoursGate';

describe('hoursGate', () => {
  it('bloqueia só quando falta dia', () => {
    expect(shouldBlockPayment({ missing: ['2026-10-01'], estimated: [] })).toBe(true);
    expect(shouldBlockPayment({ missing: [], estimated: ['2026-10-01'] })).toBe(false);
    expect(shouldBlockPayment(null)).toBe(false);
  });

  it('mensagem cita os dias faltantes em dd/MM', () => {
    const msg = buildHoursGateMessage({ missing: ['2026-10-01', '2026-10-02'], estimated: [] });
    expect(msg).toContain('2 dias estão sem horas lançadas (01/10, 02/10)');
    expect(msg).toContain('diária cheia, sem hora extra');
  });

  it('mensagem informa dias estimados', () => {
    const msg = buildHoursGateMessage({ missing: [], estimated: ['2026-10-03'] });
    expect(msg).toContain('1 dia foi fechado com 12 h automáticas (03/10)');
  });

  it('nada a avisar', () => {
    expect(buildHoursGateMessage({ missing: [], estimated: [] })).toBeNull();
  });

  it('lista longa é resumida', () => {
    const msg = buildHoursGateMessage({ missing: ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06'], estimated: [] });
    expect(msg).toContain('e mais 2');
  });
});
