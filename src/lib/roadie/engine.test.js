import { describe, expect, it } from 'vitest';
import { buildRoadieCards, cardsForRoute } from './engine';
import { buildRoadieContext } from './context';

const today = '2026-11-08';
const clients = [{ id: 'r1', name: 'R1 Audiovisual', client_type: 'empresa' }, { id: 'gs', name: 'GS eventos', client_type: 'empresa' }];
const ev = (id, client_id, start, end, extra = {}) => ({ id, client_id, title: id, start_date: start, end_date: end, daily_cache_value: 1000, status: 'confirmed', payment_status: 'unpaid', ...extra });

describe('Roadie: cartões proativos', () => {
  const events = [
    ev('r1-out', 'r1', '2026-10-24', '2026-10-24'),
    ev('r1-set', 'r1', '2026-09-10', '2026-09-10', { payment_status: 'paid', paid_amount: 1000, paid_date: '2026-09-20' }),
    ev('r1-ago', 'r1', '2026-08-10', '2026-08-10', { payment_status: 'paid', paid_amount: 1000, paid_date: '2026-08-20' }),
    ev('r1-futuro', 'r1', '2026-11-20', '2026-11-20', { daily_cache_value: 700 }),
    ev('gs-maio', 'gs', '2026-05-01', '2026-05-01', { payment_status: 'paid', paid_amount: 900, paid_date: '2026-05-10' }),
    ev('gs-abril', 'gs', '2026-04-01', '2026-04-01', { payment_status: 'paid', paid_amount: 900, paid_date: '2026-04-10' }),
  ];
  const dailyWork = [{ event_id: 'r1-out', work_date: '2026-10-24', entry_time: '08:00', exit_time: '20:00' }];
  const cards = buildRoadieCards({ events, dailyWork, clients, today, now: new Date(`${today}T10:00:00`) });
  const kinds = cards.map((c) => c.kind);

  it('cobra quem passou de 10 dias, com a cobrança pronta e a opção de dar baixa', () => {
    const c = cards.find((x) => x.id === 'cobrar:r1-out');
    expect(c).toMatchObject({ action: { type: 'cobrar', eventId: 'r1-out' }, secondary: { to: '/pendencias?grupo=receber' } });
    expect(c.body).toContain('15 dias');
  });
  it('avisa cachê abaixo da média com o mesmo cliente', () => {
    expect(cards.find((x) => x.id === 'cache:r1-futuro')?.body).toContain('R$ 1.000,00');
  });
  it('lembra do cliente sumido há 90+ dias', () => {
    expect(kinds).toContain('sumido');
    expect(cards.find((x) => x.kind === 'sumido').title).toContain('GS eventos');
  });
  it('ordena pela tela: no Dinheiro, os de dinheiro primeiro dentro da mesma prioridade', () => {
    const ordem = cardsForRoute(cards, '/reports').map((c) => c.kind);
    expect(ordem.indexOf('cobrar')).toBeLessThan(ordem.indexOf('cache'));
  });
});

describe('Roadie: retrato da conta', () => {
  it('traz quem deve, prazo médio por cliente e os próximos trabalhos', () => {
    const ctx = buildRoadieContext({
      today, clients,
      events: [
        ev('a', 'r1', '2026-10-24', '2026-10-24'),
        ev('b', 'r1', '2026-09-10', '2026-09-10', { payment_status: 'paid', paid_amount: 1000, paid_date: '2026-09-25' }),
        ev('c', 'gs', '2026-11-20', '2026-11-20'),
      ],
    });
    expect(ctx.a_receber_total).toBe(1000);
    expect(ctx.a_receber[0]).toMatchObject({ cliente: 'R1 Audiovisual', dias_desde_fim: 15 });
    expect(ctx.clientes.find((c) => c.cliente === 'R1 Audiovisual')).toMatchObject({ deve_agora: 1000, prazo_medio_pagamento_dias: 15 });
    expect(ctx.proximos_trabalhos.map((p) => p.id)).toEqual(['c']);
    expect(ctx.ultimos_6_meses).toHaveLength(6);
  });
});
