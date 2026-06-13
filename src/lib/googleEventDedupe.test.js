import { describe, expect, it } from 'vitest';
import { pickDuplicateIdsToRemove } from './googleEventDedupe';

describe('pickDuplicateIdsToRemove', () => {
  it('não remove eventos únicos', () => {
    const events = [
      { id: 'a', title: 'Show A', start_date: '2026-06-01', clients: { name: 'Cliente X' } },
      { id: 'b', title: 'Show B', start_date: '2026-06-02', clients: { name: 'Cliente Y' } },
    ];
    expect(pickDuplicateIdsToRemove(events, new Set())).toEqual([]);
  });

  it('mantém evento com google_event_id e remove duplicata sem vínculo', () => {
    const events = [
      {
        id: 'keep',
        title: 'Festival',
        start_date: '2026-06-10',
        google_event_id: 'gcal-1',
        clients: { name: 'Produtora' },
        created_at: '2026-06-01T10:00:00Z',
      },
      {
        id: 'dup',
        title: 'Festival importado',
        start_date: '2026-06-10',
        clients: { name: 'Produtora' },
        created_at: '2026-06-02T10:00:00Z',
      },
    ];
    expect(pickDuplicateIdsToRemove(events, new Set())).toEqual(['dup']);
  });

  it('não remove duplicata que tem horas lançadas', () => {
    const events = [
      { id: 'a', title: 'Show', start_date: '2026-06-10', clients: { name: 'Cliente' } },
      { id: 'b', title: 'Show', start_date: '2026-06-10', clients: { name: 'Cliente' } },
    ];
    expect(pickDuplicateIdsToRemove(events, new Set(['b']))).toEqual(['a']);
  });

  it('remove múltiplas duplicatas no mesmo grupo', () => {
    const events = [
      { id: '1', title: 'Gala', start_date: '2026-07-01', google_event_id: 'g1', clients: { name: 'TV' } },
      { id: '2', title: 'Gala', start_date: '2026-07-01', clients: { name: 'TV' } },
      { id: '3', title: 'Gala', start_date: '2026-07-01', clients: { name: 'TV' } },
    ];
    expect(pickDuplicateIdsToRemove(events, new Set())).toEqual(['2', '3']);
  });
});
