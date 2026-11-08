import { describe, it, expect } from 'vitest';
import { parseRoadieAction, describeRoadieAction } from './actions';

const today = '2026-11-08';
const events = [
  { id: 'e1', title: 'Show Allianz', client_id: 'c1', start_date: '2026-10-20', end_date: '2026-10-20', daily_cache_value: 700, payment_status: 'unpaid', status: 'completed' },
  { id: 'e2', title: 'Feira', client_id: 'c1', start_date: '2026-11-06', end_date: '2026-11-08', daily_cache_value: 600, payment_status: 'unpaid', status: 'confirmed' },
  { id: 'e3', title: 'Pago', client_id: 'c1', start_date: '2026-10-01', end_date: '2026-10-01', daily_cache_value: 500, payment_status: 'paid' },
];
const clients = [{ id: 'c1', name: 'Ana Produções', phone: '11999999999' }];
const dailyWork = [
  { id: 'w1', event_id: 'e2', date: '2026-11-06', entry_time: '08:00', exit_time: '18:00', total_hours: 10 },
  { id: 'w2', event_id: 'e2', date: '2026-11-07', entry_time: '09:00', exit_time: null },
];
const ctx = { events, clients, dailyWork, today };
const d = (href) => describeRoadieAction(parseRoadieAction(href), ctx);

describe('parseRoadieAction', () => {
  it('lê só links de ação conhecidos', () => {
    expect(parseRoadieAction('/acao/baixa?event=e1')).toEqual({ tipo: 'baixa', params: { event: 'e1' } });
    expect(parseRoadieAction('/acao/apagar?event=e1')).toBeNull();
    expect(parseRoadieAction('/pendencias')).toBeNull();
  });
});

describe('describeRoadieAction', () => {
  it('baixa usa o valor do app e a data estimada (fim + 10)', () => {
    const r = d('/acao/baixa?event=e1');
    expect(r.ok).toBe(true);
    expect(r.gravacao.dados).toMatchObject({ payment_status: 'paid', paid_amount: 700, paid_date: '2026-10-30' });
    expect(r.gravacao.dados.paid_date_meta.source).toBe('estimated');
  });

  it('baixa recusa trabalho já pago', () => {
    expect(d('/acao/baixa?event=e3').ok).toBe(false);
  });

  it('horas monta o registro do dia e recusa dia já registrado ou fora do trabalho', () => {
    const r = d('/acao/horas?event=e2&dia=2026-11-08&entrada=8:00&saida=20:00');
    expect(r.ok).toBe(true);
    expect(r.gravacao).toMatchObject({ tabela: 'daily_work', dados: { event_id: 'e2', date: '2026-11-08', entry_time: '08:00', exit_time: '20:00', total_hours: 12 } });
    expect(d('/acao/horas?event=e2&dia=2026-11-06&entrada=08:00&saida=18:00').ok).toBe(false);
    expect(d('/acao/horas?event=e2&dia=2026-11-01&entrada=08:00&saida=18:00').ok).toBe(false);
  });

  it('saída fecha a entrada aberta e entende virada de dia', () => {
    const r = d('/acao/saida?work=w2&saida=02:00');
    expect(r.ok).toBe(true);
    expect(r.gravacao).toMatchObject({ tabela: 'daily_work', id: 'w2', dados: { exit_time: '02:00', total_hours: 17 } });
    expect(d('/acao/saida?work=w1&saida=20:00').ok).toBe(false);
  });

  it('novo só abre o formulário preenchido', () => {
    const r = d('/acao/novo?titulo=Show%20X&inicio=2026-11-20&cliente=c1&cache=800');
    expect(r.ok).toBe(true);
    expect(r.gravacao).toBeUndefined();
    expect(r.navegar).toContain('action=new-event');
    expect(r.navegar).toContain('client_id=c1');
    expect(r.navegar).toContain('cache=800');
  });

  it('cobrar prepara a mensagem com o valor', () => {
    const r = d('/acao/cobrar?event=e1');
    expect(r.ok).toBe(true);
    expect(r.cobranca.valor).toBe(700);
  });
});
