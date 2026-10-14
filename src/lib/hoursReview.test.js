import { describe, expect, it } from 'vitest';
import { findHoursIssues, hoursOriginStats } from './hoursReview';

const ev = (o = {}) => ({
  id: 'e1', title: 'Show', start_date: '2026-09-01', end_date: '2026-09-01',
  payment_model: 'HORAS_EXTRAS', daily_cache_value: 1200, payment_status: 'unpaid', ...o,
});
const TODAY = '2026-10-14';

describe('findHoursIssues', () => {
  it('aponta dia lançado duas vezes', () => {
    const work = [
      { id: 'a', event_id: 'e1', date: '2026-09-01', daily_cache: 1200 },
      { id: 'b', event_id: 'e1', date: '2026-09-01', daily_cache: 1200 },
    ];
    const r = findHoursIssues([ev()], work, { today: TODAY });
    const dup = r.find((i) => i.tipo === 'dia_repetido');
    expect(dup).toMatchObject({ valorGravado: 2400, valorRegraAtual: 1200, registros: 2 });
  });

  it('aponta entrada = saída com valor cobrado', () => {
    const work = [{ id: 'a', event_id: 'e1', date: '2026-09-01', entry_time: '20:00', exit_time: '20:00', total_hours: 0, daily_cache: 1200 }];
    const r = findHoursIssues([ev()], work, { today: TODAY });
    expect(r[0]).toMatchObject({ tipo: 'zero_horas_cobrado', valorGravado: 1200, valorRegraAtual: 0 });
  });

  it('aponta valor diferente da regra atual (antigo arredondamento)', () => {
    const e = ev({ payment_model: 'MEIO_CACHE_E_DOBRA', daily_cache_value: 500 });
    // 08:00–14:02: antes 6,0 h (meia = 250); agora 6 h 02 min = cheio (500)
    const work = [{ id: 'a', event_id: 'e1', date: '2026-09-01', entry_time: '08:00', exit_time: '14:02', total_hours: 6, daily_cache: 250 }];
    const r = findHoursIssues([e], work, { today: TODAY });
    expect(r[0]).toMatchObject({ tipo: 'valor_diferente', valorGravado: 250, valorRegraAtual: 500 });
  });

  it('não aponta dia correto nem 12 h automáticas', () => {
    const work = [
      { id: 'a', event_id: 'e1', date: '2026-09-01', entry_time: '08:00', exit_time: '22:00', total_hours: 14, daily_cache: 1400 },
      { id: 'b', event_id: 'e2', date: '2026-09-02', entry_time: '08:00', exit_time: '20:00', total_hours: 12, daily_cache: 999, notes: '12h automáticas' },
    ];
    const r = findHoursIssues([ev(), ev({ id: 'e2', start_date: '2026-09-02', end_date: '2026-09-02' })], work, { today: TODAY });
    expect(r).toHaveLength(0);
  });

  it('aponta evento pago com valor abaixo do devido (só conferência)', () => {
    const e = ev({ start_date: '2026-09-01', end_date: '2026-09-03', payment_status: 'paid', paid_amount: 1200 });
    const work = [{ id: 'a', event_id: 'e1', date: '2026-09-01', daily_cache: 1200 }];
    const r = findHoursIssues([e], work, { today: TODAY });
    expect(r.find((i) => i.tipo === 'recebido_a_menos')).toMatchObject({ valorGravado: 1200, valorRegraAtual: 3600, pago: true });
  });

  it('ignora eventos cancelados e eventos que ainda não terminaram', () => {
    const work = [{ id: 'a', event_id: 'e1', date: '2026-10-20', entry_time: '20:00', exit_time: '20:00', total_hours: 0, daily_cache: 1200 }];
    expect(findHoursIssues([ev({ start_date: '2026-10-20', end_date: '2026-10-20' })], work, { today: TODAY })).toHaveLength(0);
    expect(findHoursIssues([ev({ status: 'cancelled' })], [{ ...work[0], date: '2026-09-01' }], { today: TODAY })).toHaveLength(0);
  });

  it('usa a escolha do dia (regime) quando existe', () => {
    const work = [{ id: 'a', event_id: 'e1', date: '2026-09-01', entry_time: '08:00', exit_time: '20:03', total_hours: 12.1, daily_cache: 1200, regime: 'cheia', hora_extra: false }];
    expect(findHoursIssues([ev()], work, { today: TODAY })).toHaveLength(0);
  });
});

describe('hoursOriginStats', () => {
  const work = [
    { date: '2026-09-20', daily_cache: 1000, origem: 'estimada' },     // antes da ativação: fora
    { date: '2026-10-02', daily_cache: 1200, origem: 'estimada' },
    { date: '2026-10-03', daily_cache: 1400, origem: 'lancada', overtime_hours: 2 },
    { date: '2026-10-04', daily_cache: 1300, origem: 'lancada', overtime_hours: 1 },
  ];

  it('sem data de ativação não mostra nada', () => {
    expect(hoursOriginStats(work, null)).toBeNull();
  });

  it('conta só a partir da ativação e compara as médias', () => {
    const r = hoursOriginStats(work, '2026-10-01', { today: TODAY, months: 2 });
    expect(r.totalLancados).toBe(2);
    expect(r.totalEstimados).toBe(1);
    expect(r.mediaLancado).toBe(1350);
    expect(r.mediaEstimado).toBe(1200);
    expect(r.horasExtrasLancadas).toBe(3);
    expect(r.months.map((m) => m.month)).toEqual(['2026-09', '2026-10']);
    expect(r.months[1]).toMatchObject({ lancados: 2, estimados: 1 });
  });
});
