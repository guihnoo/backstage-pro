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
      const { data: events } = await svc.from('events').select('id').eq('user_id', user.id);
      let synced = 0;
      for (const ev of events ?? []) {
        try {
          await pushOneEvent(svc, user.id, ev.id);
          synced++;
        } catch { /* continue */ }
      }
      await svc.from('user_settings').update({ google_last_sync_at: new Date().toISOString() }).eq('user_id', user.id);
      return jsonResponse({ success: true, synced_events: synced });
    }

    if (action === 'import-events') {
      const settings = await getUserSettings(svc, user.id);
      if (!settings?.google_calendar_connected) {
        return jsonResponse({ success: false, error: 'Google Calendar não conectado' });
      }
      const daysBack = Number(body.days_back ?? 30);
      const daysForward = Number(body.days_forward ?? 90);
      const now = new Date();
      const timeMin = new Date(now.getTime() - daysBack * 86400000).toISOString();
      const timeMax = new Date(now.getTime() + daysForward * 86400000).toISOString();
      const accessToken = await getAccessToken(svc, user.id);
      const calendarId = encodeURIComponent(settings.google_calendar_id || 'primary');
      const data = await googleFetch(
        accessToken,
        `/calendars/${calendarId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`,
      );
      let imported = 0;
      for (const g of data.items ?? []) {
        const desc = String(g.description || '');
        if (desc.includes('backstage://event/')) continue;
        const start = g.start?.dateTime || g.start?.date;
        if (!start) continue;
        const end = g.end?.dateTime || g.end?.date || start;
        const { error } = await svc.from('events').insert({
          user_id: user.id,
          title: g.summary || 'Evento Google',
          start_date: start.slice(0, 10),
          end_date: end.slice(0, 10),
          start_time: g.start?.dateTime ? start.slice(11, 16) : null,
          end_time: g.end?.dateTime ? end.slice(11, 16) : null,
          location: g.location || null,
          google_event_id: g.id,
          google_calendar_id: settings.google_calendar_id || 'primary',
          google_synced_at: new Date().toISOString(),
          status: 'confirmado',
        });
        if (!error) imported++;
      }
      await svc.from('user_settings').update({ google_last_sync_at: new Date().toISOString() }).eq('user_id', user.id);
      return jsonResponse({ success: true, imported_count: imported });
    }

    return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
