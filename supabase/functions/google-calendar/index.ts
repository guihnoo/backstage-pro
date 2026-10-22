import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  addDaysISO,
  corsHeaders,
  eventToGooglePayload,
  getAccessToken,
  getEnv,
  getRedirectUri,
  GOOGLE_SCOPES,
  jsonResponse,
  signState,
  normalizeTitleKey,
  pickDefaultClientColor,
} from '../_shared/googleCalendar.ts';
import { pickDuplicateIdsToRemove } from '../_shared/googleEventDedupe.ts';
import {
  backstageIdFromGoogle,
  busyItemsFromGoogle,
  changesFromGoogle,
  googleTiming,
  needsGooglePush,
  parseImportKeywords,
  shouldImportGoogleEvent,
} from '../_shared/googleSyncRules.ts';

// Janela que a sincronização olha no Google
const DAYS_BACK = 30;
const DAYS_FORWARD = 180;
// Limite por rodada para não estourar o tempo da função; o resto vai na próxima (15 min)
const MAX_PUSH_PER_RUN = 50;
const SYNC_ALL_BUDGET_MS = 100_000;

type Svc = ReturnType<typeof serviceClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

class GoogleApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function serviceClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

async function authUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    getEnv('SUPABASE_URL'),
    getEnv('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: authHeader ?? '' } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Chamada do agendador (pg_cron): mesmo esquema do send-push-digest. */
function isCronCall(req: Request) {
  const cronSecret = getEnv('CRON_SECRET');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const headerSecret = req.headers.get('x-cron-secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  return Boolean((cronSecret && headerSecret === cronSecret) || (serviceRoleKey && bearer === serviceRoleKey));
}

async function getUserSettings(svc: Svc, userId: string) {
  const { data } = await svc.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  return data as Row | null;
}

async function googleFetch(accessToken: string, path: string, init?: RequestInit) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) return {};
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new GoogleApiError(body.error?.message || `Google API ${res.status}`, res.status);
  return body;
}

async function listGoogleEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string, maxPages = 4) {
  const items: Row[] = [];
  let pageToken = '';
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      timeZone: 'America/Sao_Paulo',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await googleFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return items;
}

type PushContext = { settings: Row; accessToken: string; clientNames: Map<string, string | null> };

async function clientNameFor(svc: Svc, clientId: string | null, cache?: Map<string, string | null>) {
  if (!clientId) return null;
  if (cache?.has(clientId)) return cache.get(clientId) ?? null;
  const { data: client } = await svc.from('clients').select('name').eq('id', clientId).maybeSingle();
  const name = client?.name ?? null;
  cache?.set(clientId, name);
  return name;
}

/**
 * Manda um trabalho para o Google.
 * - Criado no app: título, descrição, data e local completos, na agenda escolhida.
 * - Veio do Google (google_origin = 'google'): só data, horário e local; título e descrição de quem criou ficam.
 */
async function pushOneEvent(svc: Svc, userId: string, eventId: string, ctx?: PushContext) {
  const settings = ctx?.settings ?? await getUserSettings(svc, userId);
  if (!settings?.google_calendar_connected || settings.google_push_enabled === false) {
    return { skipped: true, google_event_id: null as string | null };
  }

  const { data: event, error } = await svc.from('events').select('*').eq('id', eventId).eq('user_id', userId).single();
  if (error || !event) throw new Error('Evento não encontrado');

  const accessToken = ctx?.accessToken ?? await getAccessToken(svc, userId);
  const targetCalendar = settings.google_calendar_id || 'primary';
  const eventCalendar = event.google_calendar_id || targetCalendar;
  const clientName = await clientNameFor(svc, event.client_id, ctx?.clientNames);
  const payload = eventToGooglePayload(event, clientName, settings.financial_visibility !== false);
  const now = () => new Date().toISOString();

  let googleEventId = event.google_event_id as string | null;
  let calendarUsed = eventCalendar;

  if (googleEventId && event.google_origin === 'google') {
    try {
      await googleFetch(accessToken, `/calendars/${encodeURIComponent(eventCalendar)}/events/${encodeURIComponent(googleEventId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ start: payload.start, end: payload.end, ...(event.location ? { location: event.location } : {}) }),
      });
    } catch (err) {
      // Agenda só de leitura (de outra pessoa) ou evento apagado lá: o trabalho segue só no app
      if (!(err instanceof GoogleApiError) || ![403, 404, 410].includes(err.status)) throw err;
    }
  } else {
    let created = !googleEventId;
    if (googleEventId) {
      try {
        await googleFetch(accessToken, `/calendars/${encodeURIComponent(eventCalendar)}/events/${encodeURIComponent(googleEventId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        // Apagado no Google: o app manda de novo (o app é quem manda nos trabalhos criados nele)
        if (!(err instanceof GoogleApiError) || ![404, 410].includes(err.status)) throw err;
        created = true;
      }
    }
    if (created) {
      calendarUsed = targetCalendar;
      const res = await googleFetch(accessToken, `/calendars/${encodeURIComponent(targetCalendar)}/events`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      googleEventId = res.id;
    }
  }

  await svc.from('events').update({
    google_event_id: googleEventId,
    google_calendar_id: calendarUsed,
    google_synced_at: now(),
  }).eq('id', eventId);

  return { skipped: false, google_event_id: googleEventId };
}

const BR_STATES = new Set([
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
]);

function parseLocationForCity(location: string): { city: string | null; state: string | null } {
  if (!location) return { city: null, state: null };
  const statesPattern = Array.from(BR_STATES).join('|');
  // Matches "City, SP" / "City - SP" / "City/SP" / "City SP" near end of string
  const re = new RegExp(
    `([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s]{1,40}?)\\s*[,\\-\\/\\s]\\s*(${statesPattern})(?:\\b|,|$|\\s)`,
    'i'
  );
  const m = location.match(re);
  if (m) {
    const state = m[2].toUpperCase();
    if (BR_STATES.has(state)) {
      const raw = m[1].trim();
      const cityParts = raw.split(',');
      const city = cityParts[cityParts.length - 1].trim().replace(/^\d+\s*/, '');
      return { city: city.length >= 2 ? city : null, state };
    }
  }
  return { city: null, state: null };
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function findOrCreateClientByName(svc: Svc, userId: string, name: string) {
  const trimmed = name.trim();
  // Ignore empty or generic fallback titles
  if (!trimmed || trimmed === 'Evento Google') return null;

  // 1. Exact match (case-insensitive)
  const { data: exact } = await svc
    .from('clients').select('id, name')
    .eq('user_id', userId).ilike('name', trimmed).maybeSingle();
  if (exact?.id) return exact.id;

  // 2. Partial/fuzzy: load all clients, match if one name is contained in the other
  const { data: allClients } = await svc
    .from('clients').select('id, name').eq('user_id', userId);
  if (allClients?.length) {
    const normTitle = normalizeForMatch(trimmed);
    for (const client of allClients) {
      const normClient = normalizeForMatch(client.name);
      if (normClient.length < 4 || normTitle.length < 4) continue;
      if (normTitle.includes(normClient) || normClient.includes(normTitle)) {
        return client.id;
      }
    }
  }

  // 3. Create draft client
  const { data: created, error } = await svc.from('clients').insert({
    user_id: userId,
    name: trimmed,
    brand_color: pickDefaultClientColor(trimmed),
    profile_complete: false,
  }).select('id').single();
  if (error) return null;
  return created?.id ?? null;
}

type SyncCounts = {
  imported_count: number;
  linked_count: number;
  skipped_count: number;
  updated_from_google: number;
  synced_events: number;
  pending_push: number;
};

function emptyCounts(): SyncCounts {
  return { imported_count: 0, linked_count: 0, skipped_count: 0, updated_from_google: 0, synced_events: 0, pending_push: 0 };
}

async function loadUserEvents(svc: Svc, userId: string) {
  const { data } = await svc
    .from('events')
    .select('id, title, status, start_date, end_date, start_time, end_time, location, updated_at, google_event_id, google_calendar_id, google_synced_at, google_origin, client_id, clients(name)')
    .eq('user_id', userId);
  return (data ?? []) as Row[];
}

/** Novos shows da agenda escolhida entram no app; os que o usuário já tem ficam só vinculados. */
async function importNewShows(svc: Svc, userId: string, settings: Row, items: Row[], events: Row[], counts: SyncCounts) {
  const calendarId = settings.google_import_calendar_id as string;
  const keywords = parseImportKeywords(settings.google_import_keywords);
  const byGoogleId = new Set(events.filter((e) => e.google_event_id).map((e) => e.google_event_id));
  const byDateTitle = new Map<string, Row>();
  for (const ev of events) {
    if (ev.google_event_id) continue;
    const key = `${ev.start_date}|${normalizeTitleKey(ev.clients?.name || ev.title)}`;
    byDateTitle.set(key, ev);
  }

  for (const g of items) {
    if (g.id && byGoogleId.has(g.id)) continue;
    if (!shouldImportGoogleEvent(g, keywords)) {
      if (!backstageIdFromGoogle(g)) counts.skipped_count++;
      continue;
    }
    const timing = googleTiming(g);
    if (!timing) continue;
    const summary = String(g.summary || '').trim() || 'Evento Google';
    const now = new Date().toISOString();

    const sameShow = byDateTitle.get(`${timing.start_date}|${normalizeTitleKey(summary)}`);
    if (sameShow) {
      await svc.from('events').update({
        google_event_id: g.id,
        google_calendar_id: calendarId,
        google_synced_at: now,
        google_origin: 'google',
      }).eq('id', sameShow.id);
      byDateTitle.delete(`${timing.start_date}|${normalizeTitleKey(summary)}`);
      counts.linked_count++;
      continue;
    }

    const clientId = await findOrCreateClientByName(svc, userId, summary);
    const { city, state } = parseLocationForCity(g.location || '');
    const { error } = await svc.from('events').insert({
      user_id: userId,
      client_id: clientId,
      title: summary,
      event_date: timing.start_date,
      start_date: timing.start_date,
      end_date: timing.end_date,
      start_time: timing.start_time,
      end_time: timing.end_time,
      location: g.location || null,
      location_city: city,
      location_state: state,
      google_event_id: g.id,
      google_calendar_id: calendarId,
      google_synced_at: now,
      google_origin: 'google',
      status: 'confirmed',
    });
    if (!error) {
      counts.imported_count++;
      byGoogleId.add(g.id);
    }
  }
}

/** Data, horário ou local mudados no Google voltam para os trabalhos já ligados. */
async function applyChangesFromGoogle(svc: Svc, items: Row[], events: Row[], counts: SyncCounts) {
  const byId = new Map(events.map((e) => [e.id, e]));
  const byGoogleId = new Map(events.filter((e) => e.google_event_id).map((e) => [e.google_event_id, e]));
  for (const g of items) {
    const ev = byId.get(backstageIdFromGoogle(g) || '') || (g.id ? byGoogleId.get(g.id) : null);
    if (!ev) continue;
    const patch = changesFromGoogle(g, ev);
    if (!patch) continue;
    const { error } = await svc.from('events').update({ ...patch, google_synced_at: new Date().toISOString() }).eq('id', ev.id);
    if (!error) counts.updated_from_google++;
  }
}

async function pushPendingEvents(svc: Svc, userId: string, ctx: PushContext, counts: SyncCounts) {
  const events = await loadUserEvents(svc, userId);
  const pending = events.filter(needsGooglePush);
  for (const ev of pending.slice(0, MAX_PUSH_PER_RUN)) {
    try {
      const res = await pushOneEvent(svc, userId, ev.id, ctx);
      if (!res.skipped) counts.synced_events++;
    } catch { /* tenta de novo na próxima rodada */ }
  }
  counts.pending_push = Math.max(0, pending.length - counts.synced_events);
}

/** Uma rodada completa para um usuário: trazer do Google (se ligado) e mandar o que mudou no app. */
async function syncUser(svc: Svc, userId: string) {
  const counts = emptyCounts();
  const settings = await getUserSettings(svc, userId);
  if (!settings?.google_calendar_connected) throw new Error('Google Calendar não conectado');

  try {
    const accessToken = await getAccessToken(svc, userId);
    const pushOn = settings.google_push_enabled !== false;
    const importOn = settings.google_import_enabled === true && Boolean(settings.google_import_calendar_id);
    const pushCalendar = settings.google_calendar_id || 'primary';
    const today = new Date().toISOString().slice(0, 10);
    const timeMin = `${addDaysISO(today, -DAYS_BACK)}T00:00:00-03:00`;
    const timeMax = `${addDaysISO(today, DAYS_FORWARD)}T00:00:00-03:00`;

    const calendars = new Set<string>();
    if (pushOn) calendars.add(pushCalendar);
    if (importOn) calendars.add(settings.google_import_calendar_id);

    const events = await loadUserEvents(svc, userId);
    for (const calendarId of calendars) {
      const items = await listGoogleEvents(accessToken, calendarId, timeMin, timeMax);
      await applyChangesFromGoogle(svc, items, events, counts);
      if (importOn && calendarId === settings.google_import_calendar_id) {
        await importNewShows(svc, userId, settings, items, events, counts);
      }
    }

    if (pushOn) {
      await pushPendingEvents(svc, userId, { settings, accessToken, clientNames: new Map() }, counts);
    }

    await svc.from('user_settings').update({
      google_last_sync_at: new Date().toISOString(),
      google_last_sync_error: null,
    }).eq('user_id', userId);
    return counts;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro na sincronização';
    if (!/não conectado/i.test(message)) {
      await svc.from('user_settings').update({ google_last_sync_error: message.slice(0, 300) }).eq('user_id', userId);
    }
    throw err;
  }
}

async function syncAllUsers(svc: Svc) {
  const startedAt = Date.now();
  const { data: rows } = await svc
    .from('user_settings')
    .select('user_id')
    .eq('google_calendar_connected', true);
  const result = { users: 0, ok: 0, failed: 0, deferred: 0 };
  for (const row of rows ?? []) {
    if (Date.now() - startedAt > SYNC_ALL_BUDGET_MS) {
      result.deferred++;
      continue;
    }
    result.users++;
    try {
      await syncUser(svc, row.user_id);
      result.ok++;
    } catch {
      result.failed++;
    }
  }
  return result;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Compromissos do Google nos dias do trabalho (aviso de "dia ocupado" no Novo trabalho). */
async function busyDays(svc: Svc, userId: string, startDate: string, endDate: string) {
  const settings = await getUserSettings(svc, userId);
  if (!settings?.google_calendar_connected || settings.google_busy_check_enabled === false) return [];

  const accessToken = await getAccessToken(svc, userId);
  const calendars = new Set<string>(['primary', settings.google_calendar_id || 'primary']);
  if (settings.google_import_enabled && settings.google_import_calendar_id) calendars.add(settings.google_import_calendar_id);

  const timeMin = `${startDate}T00:00:00-03:00`;
  const timeMax = `${addDaysISO(endDate, 1)}T00:00:00-03:00`;
  const items: Row[] = [];
  for (const calendarId of calendars) {
    try {
      items.push(...await listGoogleEvents(accessToken, calendarId, timeMin, timeMax, 1));
    } catch { /* agenda removida ou sem acesso: ignora */ }
  }
  const ids = items.map((g) => g.id).filter(Boolean);
  const linked = new Set<string>();
  if (ids.length) {
    const { data } = await svc.from('events').select('google_event_id').eq('user_id', userId).in('google_event_id', ids);
    for (const row of data ?? []) linked.add(row.google_event_id);
  }
  return busyItemsFromGoogle(items, linked).slice(0, 10);
}

async function dedupeEventsForUser(svc: Svc, userId: string) {
  const { data: events } = await svc
    .from('events')
    .select('id, title, start_date, google_event_id, client_id, created_at, clients(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const { data: workRows } = await svc.from('daily_work').select('event_id').eq('user_id', userId);
  const withWork = new Set((workRows ?? []).map((w: { event_id: string }) => w.event_id));

  const toRemove = pickDuplicateIdsToRemove(events ?? [], withWork);
  let removed = 0;
  for (const id of toRemove) {
    await svc.from('events').delete().eq('id', id).eq('user_id', userId);
    removed++;
  }
  return { removed_count: removed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action as string;
    const svc = serviceClient();

    if (action === 'sync-all') {
      if (!isCronCall(req)) return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
      const result = await syncAllUsers(svc);
      return jsonResponse({ success: true, ...result });
    }

    const user = await authUser(req);
    if (!user) return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
    const jwtSecret = getEnv('SUPABASE_JWT_SECRET', getEnv('SUPABASE_SERVICE_ROLE_KEY'));

    if (action === 'auth-start') {
      const clientId = getEnv('GOOGLE_CLIENT_ID');
      if (!clientId) {
        return jsonResponse({ success: false, error: 'GOOGLE_CLIENT_ID não configurado nos Supabase Secrets.' }, 500);
      }
      const state = await signState(user.id, jwtSecret);
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: getRedirectUri(),
        response_type: 'code',
        scope: GOOGLE_SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        state,
      });
      return jsonResponse({ success: true, authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    if (action === 'disconnect') {
      await svc.from('google_calendar_connections').delete().eq('user_id', user.id);
      await svc.from('user_settings').update({
        google_calendar_connected: false,
        google_account_email: null,
        google_calendar_id: null,
        google_import_calendar_id: null,
        google_last_sync_at: null,
        google_last_sync_error: null,
      }).eq('user_id', user.id);
      return jsonResponse({ success: true });
    }

    if (action === 'list-calendars') {
      const accessToken = await getAccessToken(svc, user.id);
      const data = await googleFetch(accessToken, '/users/me/calendarList');
      const calendars = (data.items ?? []).map((c: Row) => ({
        id: c.id,
        summary: c.summaryOverride || c.summary,
        primary: Boolean(c.primary),
        // owner/writer: dá para o app escrever nela
        writable: c.accessRole === 'owner' || c.accessRole === 'writer',
        color: c.backgroundColor || null,
      }));
      return jsonResponse({ success: true, calendars });
    }

    if (action === 'push-event') {
      const eventId = body.event_id as string;
      if (!eventId) return jsonResponse({ success: false, error: 'event_id obrigatório' }, 400);
      const res = await pushOneEvent(svc, user.id, eventId);
      return jsonResponse({ success: true, ...res });
    }

    if (action === 'delete-event') {
      const settings = await getUserSettings(svc, user.id);
      const googleEventId = (body.google_event_id as string) || null;
      if (settings?.google_calendar_connected && googleEventId) {
        // Só apaga no Google o que o app criou; evento de outra pessoa fica lá.
        // O app manda origem e agenda junto porque a linha costuma já ter sido apagada.
        const { data: ev } = body.event_id
          ? await svc.from('events').select('google_origin, google_calendar_id').eq('id', body.event_id).eq('user_id', user.id).maybeSingle()
          : { data: null };
        const origin = body.google_origin ?? ev?.google_origin ?? null;
        if (origin !== 'google') {
          const accessToken = await getAccessToken(svc, user.id);
          const calendarId = encodeURIComponent(body.google_calendar_id || ev?.google_calendar_id || settings.google_calendar_id || 'primary');
          await googleFetch(accessToken, `/calendars/${calendarId}/events/${encodeURIComponent(googleEventId)}`, {
            method: 'DELETE',
          }).catch(() => null);
        }
      }
      if (body.event_id) {
        await svc.from('events').update({
          google_event_id: null,
          google_calendar_id: null,
          google_synced_at: null,
        }).eq('id', body.event_id).eq('user_id', user.id);
      }
      return jsonResponse({ success: true });
    }

    if (action === 'sync-now' || action === 'import-events') {
      const counts = await syncUser(svc, user.id);
      return jsonResponse({ success: true, ...counts });
    }

    if (action === 'busy-days') {
      const startDate = String(body.start_date || '');
      const endDate = String(body.end_date || startDate);
      if (!ISO_DAY.test(startDate) || !ISO_DAY.test(endDate) || endDate < startDate) {
        return jsonResponse({ success: false, error: 'Datas inválidas' }, 400);
      }
      const busy = await busyDays(svc, user.id, startDate, endDate);
      return jsonResponse({ success: true, busy });
    }

    if (action === 'dedupe-events') {
      const result = await dedupeEventsForUser(svc, user.id);
      return jsonResponse({ success: true, ...result });
    }

    return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    // "não conectado" is a precondition failure, not a server error
    const status = /não conectado/i.test(message) ? 400 : 500;
    return jsonResponse({ success: false, error: message }, status);
  }
});
