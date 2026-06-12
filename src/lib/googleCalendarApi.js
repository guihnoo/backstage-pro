import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function invokeGoogleCalendar(action, extra = {}) {
  if (!isSupabaseConfigured) {
    return { data: { success: false, error: 'Supabase não configurado.' } };
  }
  const { data, error } = await supabase.functions.invoke('google-calendar', {
    body: { action, ...extra },
  });
  if (error) {
    const ctx = error.context;
    let detail = error.message;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      } catch {
        /* ignore parse */
      }
    }
    return { data: { success: false, error: detail } };
  }
  if (data?.error) return { data: { success: false, error: data.error } };
  return { data: data ?? { success: false, error: 'Resposta vazia' } };
}

export const googleAuthStart = () => invokeGoogleCalendar('auth-start');
export const googleDisconnect = () => invokeGoogleCalendar('disconnect');
export const googleListCalendars = () => invokeGoogleCalendar('list-calendars');
export const googleSyncNow = () => invokeGoogleCalendar('sync-now');
export const googleImportEvents = (opts) => invokeGoogleCalendar('import-events', opts);
export const googleDedupeEvents = () => invokeGoogleCalendar('dedupe-events');
export const googlePushEvent = (eventId) => invokeGoogleCalendar('push-event', { event_id: eventId });
export const googleDeleteEvent = (eventId, googleEventId) =>
  invokeGoogleCalendar('delete-event', { event_id: eventId, google_event_id: googleEventId ?? null });
