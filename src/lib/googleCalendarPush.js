import { googlePushEvent, googleDeleteEvent } from '@/lib/googleCalendarApi';

/**
 * Na exclusão a linha some do banco logo em seguida, então quem chama manda junto
 * de onde o evento veio (`google_origin`) e em qual agenda está (`google_calendar_id`).
 */
export async function syncEventToGoogleCalendar(eventId, mode = 'upsert', googleEventId = null, googleMeta = {}) {
  if (!eventId) return;
  try {
    if (mode === 'delete') await googleDeleteEvent(eventId, googleEventId, googleMeta);
    else await googlePushEvent(eventId);
  } catch (err) {
    console.warn('[Google Calendar]', err?.message || err);
  }
}
