import { googlePushEvent, googleDeleteEvent } from '@/lib/googleCalendarApi';

export async function syncEventToGoogleCalendar(eventId, mode = 'upsert', googleEventId = null) {
  if (!eventId) return;
  try {
    if (mode === 'delete') await googleDeleteEvent(eventId, googleEventId);
    else await googlePushEvent(eventId);
  } catch (err) {
    console.warn('[Google Calendar]', err?.message || err);
  }
}
