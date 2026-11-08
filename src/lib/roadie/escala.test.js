import { describe, it, expect } from 'vitest';
import { buildEscalaDoDia } from './escala';

const clients = [{ id: 'c1', name: 'Ana' }];
describe('buildEscalaDoDia', () => {
  it('mostra hoje, amanhã e uma dica que não repete as pendências', () => {
    const events = [
      { id: 'a', title: 'Show', client_id: 'c1', start_date: '2026-11-08', end_date: '2026-11-08', start_time: '18:00:00', status: 'confirmed' },
      { id: 'b', title: 'Feira', client_id: 'c1', start_date: '2026-11-09', end_date: '2026-11-10', status: 'confirmed' },
    ];
    const r = buildEscalaDoDia({ events, clients, today: '2026-11-08' });
    expect(r.linhas[0]).toEqual({ rotulo: 'Hoje', texto: 'Show com Ana às 18:00' });
    expect(r.linhas[1]).toEqual({ rotulo: 'Amanhã', texto: 'Feira com Ana' });
  });

  it('dia livre aponta o próximo trabalho e sugere mandar disponibilidade', () => {
    const events = [{ id: 'c', title: 'Congresso', client_id: 'c1', start_date: '2026-11-25', end_date: '2026-11-25', status: 'confirmed' }];
    const r = buildEscalaDoDia({ events, clients, today: '2026-11-08' });
    expect(r.linhas.map((l) => l.rotulo)).toEqual(['Hoje', 'Próximo']);
    expect(r.linhas[0].texto).toBe('Dia livre');
    expect(r.dica).toMatchObject({ to: '/calendar' });
  });
});
