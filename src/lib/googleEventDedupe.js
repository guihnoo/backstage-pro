/**
 * Lógica pura de deduplicação de eventos (espelha supabase/functions/google-calendar).
 * Mantém o registro com google_event_id ou com horas lançadas; remove os demais duplicados.
 */

export function normalizeTitleKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function dedupeGroupKey(event) {
  const clientName = event.clients?.name || '';
  return `${event.start_date}|${normalizeTitleKey(String(clientName || event.title))}`;
}

export function keepScore(event, eventIdsWithWork) {
  return (event.google_event_id ? 4 : 0) + (eventIdsWithWork.has(String(event.id)) ? 2 : 0);
}

/**
 * @param {Array<{ id: string, title: string, start_date: string, google_event_id?: string|null, clients?: { name?: string }|null, created_at?: string }>} events
 * @param {Set<string>|string[]} eventIdsWithWork
 * @returns {string[]} IDs a remover (duplicatas de menor prioridade)
 */
export function pickDuplicateIdsToRemove(events, eventIdsWithWork) {
  const withWork = eventIdsWithWork instanceof Set
    ? eventIdsWithWork
    : new Set(eventIdsWithWork);

  const groups = new Map();
  for (const ev of events ?? []) {
    const key = dedupeGroupKey(ev);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ev);
  }

  const toRemove = [];
  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const sorted = [...group].sort((a, b) => {
      const scoreDiff = keepScore(b, withWork) - keepScore(a, withWork);
      if (scoreDiff !== 0) return scoreDiff;
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aCreated - bCreated;
    });

    for (let i = 1; i < sorted.length; i++) {
      const dup = sorted[i];
      if (withWork.has(String(dup.id))) continue;
      toRemove.push(String(dup.id));
    }
  }

  return toRemove;
}
