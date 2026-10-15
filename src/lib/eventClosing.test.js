import { describe, expect, it } from 'vitest';
import { buildEventClosing } from './eventClosing';

const ev = { payment_model: 'HORAS_EXTRAS', daily_cache_value: 1200, start_date: '2026-10-01', end_date: '2026-10-03' };

describe('buildEventClosing — relatório de fechamento do evento inteiro', () => {
  it('não soma hora extra duas vezes (bug do PDF antigo)', () => {
    const work = [{ date: '2026-10-01', entry_time: '08:00', exit_time: '22:00', total_hours: 14, overtime_hours: 2, daily_cache: 1400 }];
    const r = buildEventClosing({ ...ev, end_date: '2026-10-01' }, work);
    expect(r.rows[0]).toMatchObject({ diaria: 1200, horasExtras: 200, subtotal: 1400 });
    expect(r.totalServicos).toBe(1400);
    expect(r.total).toBe(1400);
  });

  it('lista todos os dias; dia sem horas entra com a diária e fica marcado', () => {
    const work = [{ date: '2026-10-02', entry_time: '08:00', exit_time: '20:00', total_hours: 12, daily_cache: 1200 }];
    const r = buildEventClosing(ev, work);
    expect(r.rows.map((x) => x.status)).toEqual(['sem_horas', 'lancado', 'sem_horas']);
    expect(r.semHoras).toEqual(['2026-10-01', '2026-10-03']);
    expect(r.totalServicos).toBe(3600);
  });

  it('total dos serviços bate com o "a receber" do app', () => {
    const work = [
      { date: '2026-10-01', total_hours: 14, overtime_hours: 2, daily_cache: 1400 },
      { date: '2026-10-02', total_hours: 12, daily_cache: 1200, notes: '12h automáticas' },
    ];
    const r = buildEventClosing(ev, work);
    expect(r.totalServicos).toBe(r.aReceberApp);
    expect(r.estimados).toEqual(['2026-10-02']);
  });

  it('soma reembolsos autorizados', () => {
    const r = buildEventClosing({ ...ev, end_date: '2026-10-01' }, [{ date: '2026-10-01', daily_cache: 1200 }], [
      { amount: 150, is_reimbursable: true }, { amount: 80, is_reimbursable: false },
    ]);
    expect(r.totalReembolsos).toBe(150);
    expect(r.total).toBe(1350);
  });

  it('meia/dobra: valor do dia vira diária, sem hora extra separada', () => {
    const e = { payment_model: 'MEIO_CACHE_E_DOBRA', daily_cache_value: 500, start_date: '2026-10-01', end_date: '2026-10-01' };
    const r = buildEventClosing(e, [{ date: '2026-10-01', total_hours: 14, overtime_hours: 2, daily_cache: 1000 }]);
    expect(r.rows[0]).toMatchObject({ diaria: 1000, horasExtras: 0 });
  });

  it('dia lançado fora das datas do evento (montagem na véspera) também aparece', () => {
    const r = buildEventClosing({ ...ev, end_date: '2026-10-01' }, [
      { date: '2026-09-30', daily_cache: 600 }, { date: '2026-10-01', daily_cache: 1200 },
    ]);
    expect(r.rows.map((x) => x.date)).toEqual(['2026-09-30', '2026-10-01']);
    expect(r.totalServicos).toBe(1800);
  });
});
