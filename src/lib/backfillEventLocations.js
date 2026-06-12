import { buildLocationBackfillPatch } from '@/lib/parseEventLocation';

/**
 * Preenche location_city / location_state a partir do campo location (texto legado).
 * Executado uma vez por sessão após o primeiro carregamento de eventos.
 */
export async function backfillEventLocations(events = [], updateFn) {
  const candidates = events
    .map((event) => ({ event, patch: buildLocationBackfillPatch(event) }))
    .filter(({ patch }) => patch);

  if (!candidates.length) {
    return { updated: 0 };
  }

  let updated = 0;
  for (const { event, patch } of candidates) {
    try {
      await updateFn(event.id, patch);
      updated += 1;
    } catch (error) {
      console.warn('[backfill] Falha ao atualizar evento', event.id, error);
    }
  }

  return { updated };
}
