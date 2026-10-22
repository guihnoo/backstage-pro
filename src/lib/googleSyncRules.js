/**
 * Regras da sincronização com o Google Agenda (o que entra, o que sai, o que mudou).
 * Espelho de supabase/functions/_shared/googleSyncRules.ts — manter os dois iguais.
 */

const OWN_EVENT_MARKER = /backstage:\/\/event\/([a-f0-9-]+)/i;
// Relógios do Google e do Supabase não batem ao milissegundo.
const SYNC_TOLERANCE_MS = 2000;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCancelled(event) {
  return event?.status === 'cancelled' || event?.status === 'cancelado';
}

function shiftDay(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "show, montagem; evento" → ['show', 'montagem', 'evento'] (sem acento, minúsculo). */
export function parseImportKeywords(text) {
  return String(text || '')
    .split(/[,;\n]/)
    .map(normalizeText)
    .filter((k) => k.length >= 2);
}

/** Id do trabalho do app quando o evento do Google foi criado pelo próprio app. */
export function backstageIdFromGoogle(g) {
  const match = String(g?.description || '').match(OWN_EVENT_MARKER);
  return match ? match[1] : null;
}

/**
 * Só entra no app o que é show: evento comum da agenda escolhida e, se o usuário
 * preencheu palavras, com uma delas no nome, local ou descrição.
 */
export function shouldImportGoogleEvent(g, keywords = []) {
  if (!g || g.status === 'cancelled') return false;
  if (backstageIdFromGoogle(g)) return false;
  if (!g.start?.dateTime && !g.start?.date) return false;
  // Aniversário, "fora do escritório", "tempo de foco" etc. nunca são show
  if (g.eventType && g.eventType !== 'default') return false;
  if (!keywords.length) return true;
  const haystack = normalizeText(`${g.summary || ''} ${g.location || ''} ${g.description || ''}`);
  return keywords.some((k) => haystack.includes(k));
}

/** Datas e horários do evento do Google no formato do app (no Google o fim do dia inteiro é exclusivo). */
export function googleTiming(g) {
  const startRaw = g?.start?.dateTime || g?.start?.date;
  if (!startRaw) return null;
  const endRaw = g?.end?.dateTime || g?.end?.date || startRaw;
  const allDay = !g.start?.dateTime;
  const startDate = String(startRaw).slice(0, 10);
  let endDate = String(endRaw).slice(0, 10);
  if (allDay && g.end?.date) endDate = shiftDay(endDate, -1);
  if (endDate < startDate) endDate = startDate;
  return {
    start_date: startDate,
    end_date: endDate,
    start_time: allDay ? null : String(startRaw).slice(11, 16),
    end_time: allDay || !g.end?.dateTime ? null : String(endRaw).slice(11, 16),
    all_day: allDay,
  };
}

/** O trabalho precisa ir (de novo) para o Google: nunca foi, ou mudou depois do último envio. */
export function needsGooglePush(event) {
  if (!event) return false;
  if (!event.google_event_id) return !isCancelled(event);
  if (!event.google_synced_at) return true;
  const updated = Date.parse(event.updated_at || '') || 0;
  const synced = Date.parse(event.google_synced_at) || 0;
  return updated > synced + SYNC_TOLERANCE_MS;
}

/**
 * Mudanças feitas no Google (data, horário, local) que voltam para o app.
 * Só vale se a mudança no Google for mais nova que a última edição e o último envio do app.
 */
export function changesFromGoogle(g, event) {
  if (!g || !event || g.status === 'cancelled') return null;
  const googleUpdated = Date.parse(g.updated || '') || 0;
  const lastLocal = Math.max(
    Date.parse(event.google_synced_at || '') || 0,
    Date.parse(event.updated_at || '') || 0,
  );
  if (googleUpdated <= lastLocal + SYNC_TOLERANCE_MS) return null;
  const timing = googleTiming(g);
  if (!timing) return null;

  const patch = {};
  if (timing.start_date !== String(event.start_date || '').slice(0, 10)) {
    patch.start_date = timing.start_date;
    patch.event_date = timing.start_date;
  }
  if (timing.end_date !== String(event.end_date || event.start_date || '').slice(0, 10)) {
    patch.end_date = timing.end_date;
  }
  if (!timing.all_day) {
    if (timing.start_time && timing.start_time !== String(event.start_time || '').slice(0, 5)) patch.start_time = timing.start_time;
    if (timing.end_time && timing.end_time !== String(event.end_time || '').slice(0, 5)) patch.end_time = timing.end_time;
  }
  const location = String(g.location || '').trim();
  if (location && location !== String(event.location || '').trim()) patch.location = location;
  return Object.keys(patch).length ? patch : null;
}

/**
 * Compromissos do Google que ocupam o dia (para o aviso no "Novo trabalho").
 * Fora: o que o próprio app criou, o que já está ligado a um trabalho e o que está marcado como "livre".
 */
export function busyItemsFromGoogle(items, linkedGoogleIds = new Set()) {
  const seen = new Set();
  const out = [];
  for (const g of items || []) {
    if (!g || g.status === 'cancelled' || g.transparency === 'transparent') continue;
    if (backstageIdFromGoogle(g) || (g.id && linkedGoogleIds.has(g.id))) continue;
    if (g.eventType && !['default', 'outOfOffice'].includes(g.eventType)) continue;
    const timing = googleTiming(g);
    if (!timing) continue;
    const key = g.id || `${g.summary}|${timing.start_date}|${timing.start_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: key, title: String(g.summary || '').trim() || 'Compromisso', ...timing });
  }
  return out.sort((a, b) =>
    `${a.start_date} ${a.start_time || ''}`.localeCompare(`${b.start_date} ${b.start_time || ''}`),
  );
}
