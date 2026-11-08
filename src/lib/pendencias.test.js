import { describe, expect, it } from 'vitest';
import { buildPendencias, buildBaixaUpdate, suggestedPaidDate } from './pendencias';

const ev = (id, start, end, extra = {}) => ({ id, client_id: 'c1', start_date: start, end_date: end, daily_cache_value: 900, status: 'confirmed', payment_status: 'unpaid', ...extra });
const clients = [{ id: 'c1', name: 'Palco', client_type: 'empresa' }, { id: 'p1', name: 'Ana', client_type: 'pessoa' }];
const today = '2026-11-08';

describe('buildPendencias', () => {
  it('separa a receber, pagos sem valor, não realizados, sem horas e sem nota', () => {
    const p = buildPendencias({
      today, clients,
      events: [
        ev('velho', '2026-10-01', '2026-10-02'),
        ev('recente', '2026-11-05', '2026-11-05', { status: 'completed', nfe_numero: '12' }),
        ev('pagoSemValor', '2026-09-01', '2026-09-01', { payment_status: 'paid', paid_amount: null, status: 'completed' }),
        ev('futuro', '2026-11-20', '2026-11-20'),
        ev('cancelado', '2026-10-01', '2026-10-01', { status: 'cancelled' }),
        ev('pessoa', '2026-10-10', '2026-10-10', { client_id: 'p1', payment_status: 'paid', paid_amount: 500 }),
      ],
      dailyWork: [{ event_id: 'velho', work_date: '2026-10-01', entry_time: '08:00', exit_time: '20:00', daily_cache: 900 }],
    });
    expect(p.receber.map((r) => r.event.id)).toEqual(['velho', 'recente']);
    expect(p.receber[0]).toMatchObject({ dataSugerida: '2026-10-12', dataEstimada: true, valorPrevisto: 1800 });
    expect(p.receber[1]).toMatchObject({ dataSugerida: today, dataEstimada: false });
    expect(p.pagosSemValor.map((r) => r.event.id)).toEqual(['pagoSemValor']);
    expect(p.naoRealizados.map((r) => r.event.id)).toEqual(['velho', 'pessoa']);
    expect(p.semHoras.find((r) => r.event.id === 'velho').dias).toEqual(['2026-10-02']);
    expect(p.semNota.map((r) => r.event.id)).toEqual(['velho', 'pagoSemValor']);
  });

  it('saída aberta só depois de 12 h da entrada', () => {
    const base = { today, clients, events: [ev('hoje', today, today)], dailyWork: [{ event_id: 'hoje', work_date: today, entry_time: '08:00', exit_time: null }] };
    expect(buildPendencias({ ...base, now: new Date(`${today}T19:00:00`) }).saidaAberta).toHaveLength(0);
    const p = buildPendencias({ ...base, now: new Date(`${today}T20:30:00`) });
    expect(p.saidaAberta).toHaveLength(1);
    expect(p.saidaAberta[0].horasDesdeEntrada).toBe(12);
    expect(p.saidaAberta[0].work.entry_time).toBe('08:00');
  });
});

describe('dar baixa', () => {
  it('sugere fim + 10 dias para o antigo e hoje para o recente', () => {
    expect(suggestedPaidDate('2026-10-02', today)).toEqual({ date: '2026-10-12', estimated: true });
    expect(suggestedPaidDate('2026-11-01', today)).toEqual({ date: today, estimated: false });
  });
  it('grava valor, data, origem da data e realizado', () => {
    expect(buildBaixaUpdate({ valor: '900.5', data: '2026-10-12', estimada: true })).toMatchObject({
      payment_status: 'paid', paid_amount: 900.5, paid_date: '2026-10-12', status: 'completed',
      paid_date_meta: { source: 'estimated' },
    });
    expect(() => buildBaixaUpdate({ valor: 'x', data: today })).toThrow();
  });
});

describe('lista simples (08/11)', () => {
  it('trabalho sem cachê vai para "Falta o valor", não para dar baixa; horas só dos últimos 45 dias', () => {
    const p = buildPendencias({
      today, clients,
      events: [
        ev('semCache', '2026-10-20', '2026-10-20', { daily_cache_value: 0 }),
        ev('antigo', '2026-05-01', '2026-05-01', { payment_status: 'paid', paid_amount: 900 }),
      ],
      dailyWork: [],
    });
    expect(p.receber).toEqual([]);
    expect(p.pagosSemValor.map((r) => [r.event.id, r.pago])).toEqual([['semCache', false]]);
    expect(p.semHoras.map((r) => r.event.id)).toEqual(['semCache']);
    expect(p.total).toBe(2);
  });
});
