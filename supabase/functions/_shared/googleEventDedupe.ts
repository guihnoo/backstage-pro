export function normalizeTitleKey(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function dedupeGroupKey(event: {
  title: string;
  start_date: string;
  clients?: { name?: string } | null;
}) {
  const clientName = event.clients?.name || '';
  return `${event.start_date}|${normalizeTitleKey(String(clientName || event.title))}`;
}

export function keepScore(
  event: { id: string; google_event_id?: string | null },
  withWork: Set<string>,
) {
  return (event.google_event_id ? 4 : 0) + (withWork.has(String(event.id)) ? 2 : 0);
}

export function pickDuplicateIdsToRemove(
  events: Array<{
    id: string;
    title: string;
    start_date: string;
    google_event_id?: string | null;
    clients?: { name?: string } | null;
    created_at?: string;
  }>,
  eventIdsWithWork: Set<string>,
): string[] {
  const groups = new Map<string, typeof events>();
  for (const ev of events ?? []) {
    const key = dedupeGroupKey(ev);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  }

  const toRemove: string[] = [];
  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const sorted = [...group].sort((a, b) => {
      const scoreDiff = keepScore(b, eventIdsWithWork) - keepScore(a, eventIdsWithWork);
      if (scoreDiff !== 0) return scoreDiff;
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aCreated - bCreated;
    });

    for (let i = 1; i < sorted.length; i++) {
      const dup = sorted[i];
      if (eventIdsWithWork.has(String(dup.id))) continue;
      toRemove.push(String(dup.id));
    }
  }

  return toRemove;
}
