import { describe, expect, it } from 'vitest';
import {
  backstageIdFromGoogle,
  busyItemsFromGoogle,
  changesFromGoogle,
  googleTiming,
  needsGooglePush,
  parseImportKeywords,
  shouldImportGoogleEvent,
} from './googleSyncRules';

const APP_ID = '3f2b8c1e-1111-4222-8333-444455556666';

describe('parseImportKeywords', () => {
  it('separa por vírgula, ponto e vírgula e linha, sem acento e minúsculo', () => {
    expect(parseImportKeywords('Show, Montagem;  ÉVENTO\nx')).toEqual(['show', 'montagem', 'evento']);
  });

  it('vazio vira lista vazia', () => {
    expect(parseImportKeywords(null)).toEqual([]);
    expect(parseImportKeywords(' , ')).toEqual([]);
  });
});

describe('shouldImportGoogleEvent', () => {
  const base = { id: 'g1', summary: 'Show Rock in Rio', start: { date: '2026-11-01' }, end: { date: '2026-11-02' } };

  it('traz evento comum da agenda escolhida quando não há palavras', () => {
    expect(shouldImportGoogleEvent(base)).toBe(true);
  });

  it('nunca traz o que o próprio app criou', () => {
    const own = { ...base, description: `Cliente X\n\nbackstage://event/${APP_ID}` };
    expect(backstageIdFromGoogle(own)).toBe(APP_ID);
    expect(shouldImportGoogleEvent(own)).toBe(false);
  });

  it('ignora cancelado, aniversário e fora do escritório', () => {
    expect(shouldImportGoogleEvent({ ...base, status: 'cancelled' })).toBe(false);
    expect(shouldImportGoogleEvent({ ...base, eventType: 'birthday' })).toBe(false);
    expect(shouldImportGoogleEvent({ ...base, eventType: 'outOfOffice' })).toBe(false);
  });

  it('com palavras, só traz se o nome, local ou descrição tiver uma delas', () => {
    const keywords = parseImportKeywords('show, montagem');
    expect(shouldImportGoogleEvent(base, keywords)).toBe(true);
    expect(shouldImportGoogleEvent({ ...base, summary: 'Dentista' }, keywords)).toBe(false);
    expect(shouldImportGoogleEvent({ ...base, summary: 'Festival', description: 'Montagem de luz' }, keywords)).toBe(true);
  });
});

describe('googleTiming', () => {
  it('dia inteiro: o fim do Google é exclusivo, no app é o último dia', () => {
    expect(googleTiming({ start: { date: '2026-11-01' }, end: { date: '2026-11-02' } })).toEqual({
      start_date: '2026-11-01', end_date: '2026-11-01', start_time: null, end_time: null, all_day: true,
    });
    expect(googleTiming({ start: { date: '2026-11-01' }, end: { date: '2026-11-04' } }).end_date).toBe('2026-11-03');
  });

  it('com horário, mantém hora local e virada de dia', () => {
    expect(googleTiming({
      start: { dateTime: '2026-11-01T22:00:00-03:00' },
      end: { dateTime: '2026-11-02T02:30:00-03:00' },
    })).toEqual({
      start_date: '2026-11-01', end_date: '2026-11-02', start_time: '22:00', end_time: '02:30', all_day: false,
    });
  });

  it('sem início não tem como importar', () => {
    expect(googleTiming({})).toBeNull();
  });
});

describe('needsGooglePush', () => {
  it('trabalho nunca enviado vai; cancelado nunca enviado não vai', () => {
    expect(needsGooglePush({ id: 'a' })).toBe(true);
    expect(needsGooglePush({ id: 'a', status: 'cancelled' })).toBe(false);
  });

  it('trabalho enviado e não mexido depois não vai de novo', () => {
    expect(needsGooglePush({
      google_event_id: 'g', updated_at: '2026-10-21T10:00:00Z', google_synced_at: '2026-10-21T10:00:01Z',
    })).toBe(false);
  });

  it('trabalho editado depois do envio vai de novo (inclusive cancelado, para avisar no Google)', () => {
    expect(needsGooglePush({
      google_event_id: 'g', status: 'cancelled', updated_at: '2026-10-21T12:00:00Z', google_synced_at: '2026-10-21T10:00:00Z',
    })).toBe(true);
  });

  it('vinculado sem data de envio vai', () => {
    expect(needsGooglePush({ google_event_id: 'g', google_synced_at: null })).toBe(true);
  });
});

describe('changesFromGoogle', () => {
  const event = {
    start_date: '2026-11-01', end_date: '2026-11-01', start_time: '20:00:00', end_time: '23:00:00',
    location: 'Allianz Parque', updated_at: '2026-10-20T10:00:00Z', google_synced_at: '2026-10-20T10:00:00Z',
  };
  const g = {
    updated: '2026-10-21T09:00:00Z',
    start: { dateTime: '2026-11-02T21:00:00-03:00' },
    end: { dateTime: '2026-11-02T23:00:00-03:00' },
    location: 'Allianz Parque',
  };

  it('traz data e horário mudados no Google', () => {
    expect(changesFromGoogle(g, event)).toEqual({
      start_date: '2026-11-02', event_date: '2026-11-02', end_date: '2026-11-02', start_time: '21:00',
    });
  });

  it('não mexe se o app mudou depois do Google', () => {
    expect(changesFromGoogle(g, { ...event, updated_at: '2026-10-21T09:30:00Z' })).toBeNull();
  });

  it('não mexe se nada mudou de verdade', () => {
    const same = { ...g, start: { dateTime: '2026-11-01T20:00:00-03:00' }, end: { dateTime: '2026-11-01T23:00:00-03:00' } };
    expect(changesFromGoogle(same, event)).toBeNull();
  });

  it('dia inteiro no Google não apaga horário do app', () => {
    const allDay = { updated: g.updated, start: { date: '2026-11-01' }, end: { date: '2026-11-02' } };
    expect(changesFromGoogle(allDay, event)).toBeNull();
  });
});

describe('busyItemsFromGoogle', () => {
  it('lista compromissos que ocupam o dia, sem os do app nem os marcados como livres', () => {
    const items = [
      { id: 'b', summary: 'Dentista', start: { dateTime: '2026-11-01T14:00:00-03:00' }, end: { dateTime: '2026-11-01T15:00:00-03:00' } },
      { id: 'a', summary: 'Aniversário da Ana', start: { date: '2026-11-01' }, end: { date: '2026-11-02' } },
      { id: 'own', summary: 'Show', description: `backstage://event/${APP_ID}`, start: { date: '2026-11-01' }, end: { date: '2026-11-02' } },
      { id: 'free', summary: 'Lembrete', transparency: 'transparent', start: { date: '2026-11-01' }, end: { date: '2026-11-02' } },
      { id: 'linked', summary: 'Show importado', start: { date: '2026-11-01' }, end: { date: '2026-11-02' } },
      { id: 'b', summary: 'Dentista', start: { dateTime: '2026-11-01T14:00:00-03:00' }, end: { dateTime: '2026-11-01T15:00:00-03:00' } },
    ];
    const busy = busyItemsFromGoogle(items, new Set(['linked']));
    expect(busy.map((b) => b.title)).toEqual(['Aniversário da Ana', 'Dentista']);
    expect(busy[1]).toMatchObject({ start_time: '14:00', end_time: '15:00', all_day: false });
  });
});
