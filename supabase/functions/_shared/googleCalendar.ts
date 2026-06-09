export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function getEnv(name: string, fallback = '') {
  return Deno.env.get(name) ?? fallback;
}

export function getRedirectUri() {
  const explicit = getEnv('GOOGLE_REDIRECT_URI');
  if (explicit) return explicit;
  return `${getEnv('SUPABASE_URL').replace(/\/$/, '')}/functions/v1/google-calendar-callback`;
}

export function getAppUrl() {
  return getEnv('BACKSTAGE_APP_URL', 'https://backstage-pro-beta.vercel.app').replace(/\/$/, '');
}

export function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export async function signState(userId: string, secret: string) {
  const nonce = crypto.randomUUID();
  const payload = `${userId}:${nonce}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.slice(0, 32).padEnd(32, '0')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${payload}:${sigB64}`;
}

export async function verifyState(state: string, secret: string): Promise<string | null> {
  const parts = state.split(':');
  if (parts.length < 3) return null;
  const sigB64 = parts.pop()!;
  const userId = parts[0];
  const payload = parts.join(':');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.slice(0, 32).padEnd(32, '0')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (sigB64 !== expected) return null;
  return userId;
}

export function eventToGooglePayload(event: Record<string, unknown>, clientName: string | null, includeFinancial: boolean) {
  const startDate = String(event.start_date);
  const endDate = String(event.end_date || event.start_date);
  const lines: string[] = [];
  if (event.location) lines.push(`📍 Local: ${event.location}`);
  if (includeFinancial && Number(event.daily_cache_value) > 0) {
    lines.push(`💰 Cachê/dia: ${formatBRL(Number(event.daily_cache_value))}`);
  }
  if (clientName) lines.push(`🏢 Cliente: ${clientName}`);
  if (event.observacoes_md) lines.push('', String(event.observacoes_md));
  lines.push('', `backstage://event/${event.id}`);
  const title = String(event.title || '');
  const summary = clientName ? (title && title !== clientName ? `${clientName} — ${title}` : clientName) : title;
  const hasTimes = Boolean(event.start_time && event.end_time);
  if (hasTimes) {
    const st = String(event.start_time).split(':');
    const et = String(event.end_time).split(':');
    return {
      summary,
      description: lines.join('\n'),
      location: event.location || undefined,
      start: { dateTime: `${startDate}T${st[0]?.padStart(2, '0')}:${st[1]?.padStart(2, '0')}:00`, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: `${endDate}T${et[0]?.padStart(2, '0')}:${et[1]?.padStart(2, '0')}:00`, timeZone: 'America/Sao_Paulo' },
    };
  }
  return {
    summary,
    description: lines.join('\n'),
    location: event.location || undefined,
    start: { date: startDate },
    end: { date: addDaysISO(endDate, 1) },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Token refresh failed');
  return data as { access_token: string; expires_in: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAccessToken(serviceClient: any, userId: string) {
  const { data: conn, error } = await serviceClient.from('google_calendar_connections').select('*').eq('user_id', userId).single();
  if (error || !conn) throw new Error('Google Calendar não conectado');
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
  if (conn.access_token && expiresAt > Date.now() + 60_000) return conn.access_token;
  const tokens = await refreshAccessToken(conn.refresh_token);
  await serviceClient.from('google_calendar_connections').update({
    access_token: tokens.access_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
  return tokens.access_token;
}
