import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAppUrl, getEnv, getRedirectUri, verifyState } from '../_shared/googleCalendar.ts';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  const appUrl = getAppUrl();

  if (oauthError) {
    return Response.redirect(`${appUrl}/profile?error=${encodeURIComponent(oauthError)}`, 302);
  }
  if (!code || !state) {
    return Response.redirect(`${appUrl}/profile?error=${encodeURIComponent('missing_code_or_state')}`, 302);
  }

  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const jwtSecret = getEnv('SUPABASE_JWT_SECRET', serviceKey);
  const userId = await verifyState(state, jwtSecret);
  if (!userId) {
    return Response.redirect(`${appUrl}/profile?error=${encodeURIComponent('invalid_state')}`, 302);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.refresh_token) {
    const msg = tokens.error_description || tokens.error || 'token_exchange_failed';
    return Response.redirect(`${appUrl}/profile?error=${encodeURIComponent(msg)}`, 302);
  }

  let email: string | null = null;
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (userRes.ok) {
      const info = await userRes.json();
      email = info.email ?? null;
    }
  } catch { /* optional */ }

  const serviceClient = createClient(getEnv('SUPABASE_URL'), serviceKey);
  await serviceClient.from('google_calendar_connections').upsert({
    user_id: userId,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    token_expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    scope: tokens.scope,
    updated_at: new Date().toISOString(),
  });

  const { data: existingSettings } = await serviceClient
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const settingsPayload = {
    google_calendar_connected: true,
    google_account_email: email,
    google_calendar_id: 'primary',
    updated_at: new Date().toISOString(),
  };

  if (existingSettings?.id) {
    await serviceClient.from('user_settings').update(settingsPayload).eq('user_id', userId);
  } else {
    await serviceClient.from('user_settings').insert({ user_id: userId, ...settingsPayload });
  }

  return Response.redirect(`${appUrl}/profile?google_connected=1`, 302);
});
