import { describe, it, expect } from 'vitest';
import { buildMonthSummary, findRecentMissingHours } from './homeSummary';

describe('buildMonthSummary', () => {
  const stats = { faturamento_pago: 7400, a_receber: 2100, eventos_count: 9, diarias_count: 10 };

  it('monta o resumo do mês', () => {
    const s = buildMonthSummary(stats, { monthly_goal_revenue: 8800, monthly_goal_events: 12 }, new Date(2026, 9, 16));
    expect(s.mes).toBe('Outubro');
    expect(s).toMatchObject({ eventos: 9, recebido: 7400, aReceber: 2100 });
    expect(s.meta).toEqual({ atingida: false, faltaReceita: 1400, faltaDiarias: 2 });
  });

  it('meta de faturamento atingida', () => {
    const s = buildMonthSummary(stats, { monthly_goal_revenue: 7000 }, new Date(2026, 9, 1));
    expect(s.meta).toEqual({ atingida: true });
  });

  it('sem meta definida não mostra meta', () => {
    expect(buildMonthSummary(stats, {}, new Date()).meta).toBeNull();
  });

  it('valores vazios viram zero', () => {
    const s = buildMonthSummary({}, null, new Date(2026, 0, 5));
    expect(s).toMatchObject({ mes: 'Janeiro', eventos: 0, recebido: 0, aReceber: 0 });
  });
});

describe('findRecentMissingHours', () => {
  const today = '2026-10-16';
  it('acha o dia de ontem sem horas', () => {
    const ev = { id: 'e1', start_date: '2026-10-15', end_date: '2026-10-15', status: 'confirmed' };
    const r = findRecentMissingHours([ev], [], today);
    expect(r).toHaveLength(1);
    expect(r[0].dias).toEqual(['2026-10-15']);
  });

  it('dia com horas lançadas não aparece', () => {
    const ev = { id: 'e1', start_date: '2026-10-15', end_date: '2026-10-15' };
    const r = findRecentMissingHours([ev], [{ event_id: 'e1', date: '2026-10-15', total_hours: 12 }], today);
    expect(r).toHaveLength(0);
  });

  it('hoje e futuro não contam; mais de 3 dias atrás também não', () => {
    const hoje = { id: 'h', start_date: today, end_date: today };
    const velho = { id: 'v', start_date: '2026-10-01', end_date: '2026-10-02' };
    const futuro = { id: 'f', start_date: '2026-10-20', end_date: '2026-10-21' };
    expect(findRecentMissingHours([hoje, velho, futuro], [], today)).toHaveLength(0);
  });

  it('evento de vários dias mostra só os dias recentes que faltam', () => {
    const ev = { id: 'e2', start_date: '2026-10-10', end_date: '2026-10-17' };
    const work = [{ event_id: 'e2', date: '2026-10-14', total_hours: 12 }];
    const r = findRecentMissingHours([ev], work, today);
    expect(r[0].dias).toEqual(['2026-10-13', '2026-10-15']);
  });

  it('cancelado não cobra horas', () => {
    const ev = { id: 'c', start_date: '2026-10-15', end_date: '2026-10-15', status: 'cancelled' };
    expect(findRecentMissingHours([ev], [], today)).toHaveLength(0);
  });
});
