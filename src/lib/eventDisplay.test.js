import { describe, it, expect } from 'vitest';
import {
  getClientDisplayName,
  getEventDisplay,
  buildClientMap,
  resolveClientForEvent,
} from './eventDisplay.js';

describe('eventDisplay', () => {
  it('getClientDisplayName prefere name e faz fallback para company', () => {
    expect(getClientDisplayName({ name: 'Acme', company: 'Acme Ltda' })).toBe('Acme');
    expect(getClientDisplayName({ name: '', company: 'Só Empresa' })).toBe('Só Empresa');
    expect(getClientDisplayName(null)).toBeNull();
  });

  it('getEventDisplay usa cliente resolvido como empresa em destaque', () => {
    const event = { title: 'Festival Verão', client_id: 'c1' };
    const client = { id: 'c1', name: 'Produtora X' };
    const d = getEventDisplay(event, client);
    expect(d.companyName).toBe('Produtora X');
    expect(d.eventName).toBe('Festival Verão');
    expect(d.showEventSubtitle).toBe(true);
  });

  it('getEventDisplay retorna Sem empresa sem cliente', () => {
    const d = getEventDisplay({ title: 'Show Solo' }, null);
    expect(d.companyName).toBe('Sem empresa');
  });

  it('resolveClientForEvent funciona com array e Map', () => {
    const clients = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    const event = { client_id: 'b' };
    expect(resolveClientForEvent(event, clients)?.name).toBe('B');
    expect(resolveClientForEvent(event, buildClientMap(clients))?.name).toBe('B');
    expect(resolveClientForEvent({ client_id: 'x' }, clients)).toBeNull();
  });
});
