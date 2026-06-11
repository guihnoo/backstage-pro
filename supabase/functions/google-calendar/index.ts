import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  eventToGooglePayload,
  getAccessToken,
  getEnv,
  getRedirectUri,
  GOOGLE_SCOPES,
  jsonResponse,
  signState,
  normalizeGoogleDay,
  normalizeTitleKey,
  pickDefaultClientColor,
} from '../_shared/googleCalendar.ts';

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

async function getUserSettings(svc: ReturnType<typeof serviceClient>, userId: string) {
  const { data } = await svc.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  return data;
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
  if (!res.ok) throw new Error(body.error?.message || `Google API ${res.status}`);
  return body;
}

async function pushOneEvent(svc: ReturnType<typeof serviceClient>, userId: string, eventId: string) {
  const settings = await getUserSettings(svc, userId);
  if (!settings?.google_calendar_connected) throw new Error('Google Calendar não conectado');

  const { data: event, error } = await svc.from('events').select('*').eq('id', eventId).eq('user_id', userId).single();
  if (error || !event) throw new Error('Evento não encontrado');

  let clientName: string | null = null;
  if (event.client_id) {
    const { data: client } = await svc.from('clients').select('name').eq('id', event.client_id).maybeSingle();
    clientName = client?.name ?? null;
  }

  const accessToken = await getAccessToken(svc, userId);
  const calendarId = encodeURIComponent(settings.google_calendar_id || 'primary');
  const includeFinancial = settings.financial_visibility !== false;
  const payload = eventToGooglePayload(event, clientName, includeFinancial);

  let googleEventId = event.google_event_id as string | null;
  if (googleEventId) {
    await googleFetch(accessToken, `/calendars/${calendarId}/events/${encodeURIComponent(googleEventId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    const created = await googleFetch(accessToken, `/calendars/${calendarId}/events`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    googleEventId = created.id;
  }

  const now = new Date().toISOString();
  await svc.from('events').update({
    google_event_id: googleEventId,
    google_calendar_id: settings.google_calendar_id || 'primary',
    google_synced_at: now,
  }).eq('id', eventId);

  return googleEventId;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findOrCreateClientByName(svc: any, userId: string, name: string) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importGoogleEventsForUser(
  svc: any,
  userId: string,
  daysBack = 30,
  daysForward = 90,
) {
  const settings = await getUserSettings(svc, userId);
  if (!settings?.google_calendar_connected) throw new Error('Google Calendar não conectado');

  const now = new Date();
  const timeMin = new Date(now.getTime() - daysBack * 86400000).toISOString();
  const timeMax = new Date(now.getTime() + daysForward * 86400000).toISOString();
  const accessToken = await getAccessToken(svc, userId);
  const calendarId = encodeURIComponent(settings.google_calendar_id || 'primary');
  const data = await googleFetch(
    accessToken,
    `/calendars/${calendarId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`,
  );

  const { data: existingEvents } = await svc.from('events').select('id, title, start_date, google_event_id, client_id, clients(name)').eq('user_id', userId);
  const byGoogleId = new Map<string, { id: string }>();
  const byDateTitle = new Map<string, { id: string }>();
  for (const ev of existingEvents ?? []) {
    if (ev.google_event_id) byGoogleId.set(ev.google_event_id, ev);
    const clientName = (ev as { clients?: { name?: string } }).clients?.name || '';
    const key = `${ev.start_date}|${normalizeTitleKey(clientName || ev.title)}`;
    byDateTitle.set(key, ev);
  }

  let imported = 0;
  let linked = 0;
  let skipped = 0;

  for (const g of data.items ?? []) {
    const desc = String(g.description || '');
    const backstageMatch = desc.match(/backstage:\/\/event\/([a-f0-9-]+)/i);
    if (backstageMatch) {
      skipped++;
      continue;
    }
    if (g.id && byGoogleId.has(g.id)) {
      skipped++;
      continue;
    }

    const start = g.start?.dateTime || g.start?.date;
    if (!start) continue;
    const end = g.end?.dateTime || g.end?.date || start;
    const startDate = normalizeGoogleDay(start);
    const endDate = normalizeGoogleDay(end);
    const summary = String(g.summary || '').trim() || 'Evento Google';
    const titleKey = normalizeTitleKey(summary);

    const existingByMeta = byDateTitle.get(`${startDate}|${titleKey}`);
    if (existingByMeta) {
      await svc.from('events').update({
        google_event_id: g.id,
        google_calendar_id: settings.google_calendar_id || 'primary',
        google_synced_at: new Date().toISOString(),
      }).eq('id', existingByMeta.id);
      linked++;
      continue;
    }

    const clientId = await findOrCreateClientByName(svc, userId, summary);
    const { city: parsedCity, state: parsedState } = parseLocationForCity(g.location || '');
    const { error } = await svc.from('events').insert({
      user_id: userId,
      client_id: clientId,
      title: summary,
      start_date: startDate,
      end_date: endDate,
      start_time: g.start?.dateTime ? start.slice(11, 16) : null,
      end_time: g.end?.dateTime ? end.slice(11, 16) : null,
      location: g.location || null,
      location_city: parsedCity,
      location_state: parsedState,
      google_event_id: g.id,
      google_calendar_id: settings.google_calendar_id || 'primary',
      google_synced_at: new Date().toISOString(),
      status: 'confirmado',
    });
    if (!error) imported++;
  }

  await svc.from('user_settings').update({ google_last_sync_at: new Date().toISOString() }).eq('user_id', userId);
  return { imported_count: imported, linked_count: linked, skipped_count: skipped };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dedupeEventsForUser(svc: any, userId: string) {
  const { data: events } = await svc
    .from('events')
    .select('id, title, start_date, google_event_id, client_id, created_at, clients(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const { data: workRows } = await svc.from('daily_work').select('event_id').eq('user_id', userId);
  const withWork = new Set((workRows ?? []).map((w: { event_id: string }) => w.event_id));

  const groups = new Map<string, Array<Record<string, unknown>>>();
  for (const ev of events ?? []) {
    const clientName = (ev as { clients?: { name?: string } }).clients?.name || '';
    const key = `${ev.start_date}|${normalizeTitleKey(String(clientName || ev.title))}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev as Record<string, unknown>);
  }

  let removed = 0;
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    group.sort((a, b) => {
      const score = (e: Record<string, unknown>) =>
        (e.google_event_id ? 4 : 0) + (withWork.has(String(e.id)) ? 2 : 0);
      return score(b) - score(a);
    });
    for (let i = 1; i < group.length; i++) {
      const dup = group[i];
      if (withWork.has(String(dup.id))) continue;
      await svc.from('events').delete().eq('id', dup.id).eq('user_id', userId);
      removed++;
    }
  }
  return { removed_count: removed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await authUser(req);
    if (!user) return jsonResponse({ success: false, error: 'Não autorizado' }, 401);

    const body = req.method === 'POST' ? await req.json() : {};
    const action = body.action as string;
    const svc = serviceClient();
    const jwtSecret = getEnv('SUPABASE_JWT_SECRET', getEnv('SUPABASE_SERVICE_ROLE_KEY'));

    if (action === 'auth-start') {
      const state = await signState(user.id, jwtSecret);
      const params = new URLSearchParams({
        client_id: getEnv('GOOGLE_CLIENT_ID'),
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
        google_last_sync_at: null,
      }).eq('user_id', user.id);
      return jsonResponse({ success: true });
    }

    if (action === 'list-calendars') {
      const accessToken = await getAccessToken(svc, user.id);
      const data = await googleFetch(accessToken, '/users/me/calendarList');
      const calendars = (data.items ?? []).map((c: { id: string; summary: string; primary?: boolean }) => ({
        id: c.id,
        summary: c.summary,
        primary: Boolean(c.primary),
      }));
      return jsonResponse({ success: true, calendars });
    }

    if (action === 'push-event') {
      const eventId = body.event_id as string;
      if (!eventId) return jsonResponse({ success: false, error: 'event_id obrigatório' }, 400);
      const googleEventId = await pushOneEvent(svc, user.id, eventId);
      return jsonResponse({ success: true, google_event_id: googleEventId });
    }

    if (action === 'delete-event') {
      const settings = await getUserSettings(svc, user.id);
      const googleEventId = (body.google_event_id as string) || null;
      if (settings?.google_calendar_connected && googleEventId) {
        const accessToken = await getAccessToken(svc, user.id);
        const calendarId = encodeURIComponent(settings.google_calendar_id || 'primary');
        await googleFetch(accessToken, `/calendars/${calendarId}/events/${encodeURIComponent(googleEventId)}`, {
          method: 'DELETE',
        }).catch(() => null);
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

    if (action === 'sync-now') {
      const settings = await getUserSettings(svc, user.id);
      if (!settings?.google_calendar_connected) {
        return jsonResponse({ success: false, error: 'Google Calendar não conectado' });
      }
      const importResult = await importGoogleEventsForUser(svc, user.id);
      const { data: events } = await svc.from('events').select('id').eq('user_id', user.id);
      let synced = 0;
      for (const ev of events ?? []) {
        try {
          await pushOneEvent(svc, user.id, ev.id);
          synced++;
        } catch { /* continue */ }
      }
      return jsonResponse({ success: true, synced_events: synced, ...importResult });
    }

    if (action === 'import-events') {
      const daysBack = Number(body.days_back ?? 30);
      const daysForward = Number(body.days_forward ?? 90);
      const result = await importGoogleEventsForUser(svc, user.id, daysBack, daysForward);
      return jsonResponse({ success: true, ...result });
    }

    if (action === 'dedupe-events') {
      const result = await dedupeEventsForUser(svc, user.id);
      return jsonResponse({ success: true, ...result });
    }

    return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
