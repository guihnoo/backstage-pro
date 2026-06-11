import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { buildPushDigest } from '../_shared/pushDigest.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function todayUtcDateStr() {
  return new Date().toISOString().split('T')[0];
}

function monthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    monthStart: start.toISOString().split('T')[0],
    monthEnd: end.toISOString().split('T')[0],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const headerSecret = req.headers.get('x-cron-secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';

  const authorized =
    (cronSecret && headerSecret === cronSecret) ||
    (serviceRoleKey && bearer === serviceRoleKey);

  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:backstage@backstagepro.app';

  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const sentDate = todayUtcDateStr();
  const { monthStart, monthEnd } = monthBounds();

  const { data: settingsRows, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, push_events, push_payments, push_goals')
    .eq('push_enabled', true);

  if (settingsError) {
    return new Response(JSON.stringify({ error: settingsError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  let skipped = 0;
  let users = 0;

  for (const settings of settingsRows || []) {
    const userId = settings.user_id;
    users += 1;

    const [subsRes, eventsRes, clientsRes, profileRes, workRes, sentRes] = await Promise.all([
      supabase.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', userId),
      supabase
        .from('events')
        .select('id, title, client_id, start_date, end_date, payment_status, status, daily_cache_value, actual_revenue, estimated_revenue')
        .eq('user_id', userId),
      supabase.from('clients').select('id, name').eq('user_id', userId),
      supabase.from('profiles').select('monthly_goal_events').eq('id', userId).maybeSingle(),
      supabase
        .from('daily_work')
        .select('date')
        .eq('user_id', userId)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      supabase
        .from('push_sent_log')
        .select('notification_key')
        .eq('user_id', userId)
        .eq('sent_date', sentDate),
    ]);

    const subscriptions = subsRes.data || [];
    if (!subscriptions.length) continue;

    const alreadySent = new Set((sentRes.data || []).map((r) => r.notification_key));
    const uniqueDays = new Set((workRes.data || []).map((w) => w.date));

    const payloads = buildPushDigest({
      events: eventsRes.data || [],
      clients: clientsRes.data || [],
      profile: profileRes.data,
      diariasCount: uniqueDays.size,
      prefs: {
        push_events: settings.push_events,
        push_payments: settings.push_payments,
        push_goals: settings.push_goals,
      },
    }).filter((p) => !alreadySent.has(p.key));

    for (const payload of payloads) {
      let delivered = false;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              url: payload.url,
              tag: payload.key,
            }),
          );
          delivered = true;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }

      if (delivered) {
        await supabase.from('push_sent_log').upsert({
          user_id: userId,
          notification_key: payload.key,
          sent_date: sentDate,
        });
        sent += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, users, sent, skipped, date: sentDate }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
