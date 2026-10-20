import { describe, expect, it } from 'vitest';
import { mapPayloadToDb } from './useDailyWork';

describe('mapPayloadToDb — campos do Lote 2', () => {
  it('sem escolha por dia, não envia colunas novas (seguro antes da migration 035)', () => {
    const row = mapPayloadToDb({ event_id: 'e1', date: '2026-10-01', total_hours: 12, daily_cache: 500 });
    expect(row).not.toHaveProperty('regime');
    expect(row).not.toHaveProperty('hora_extra');
    expect(row).not.toHaveProperty('origem');
  });

  it('com escolha por dia, envia regime, hora_extra (inclusive false) e origem', () => {
    const row = mapPayloadToDb({
      event_id: 'e1', date: '2026-10-01', total_hours: 12, daily_cache: 250,
      regime: 'meia', hora_extra: false, origem: 'lancada',
    });
    expect(row).toMatchObject({ regime: 'meia', hora_extra: false, origem: 'lancada' });
  });
});
