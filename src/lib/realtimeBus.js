/** Pub/sub leve para eventos postgres_changes → refetch nos hooks. */
const listeners = new Map();

function ensureSet(table) {
  if (!listeners.has(table)) listeners.set(table, new Set());
  return listeners.get(table);
}

export const realtimeBus = {
  subscribe(table, handler) {
    const set = ensureSet(table);
    set.add(handler);
    return () => set.delete(handler);
  },

  emit(table, payload) {
    const set = listeners.get(table);
    if (!set?.size) return;
    set.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error('[realtime]', table, err);
      }
    });
  },
};
