import { useEvents as useBaseEvents, mapPayloadToDb } from '../useEvents.js';
import { createOfflineHook } from './createOfflineHook';
import { EVENT_STORE, mapEventRow } from './offlineSync';

const useOfflineEventsBase = createOfflineHook({
  useBaseHook: useBaseEvents,
  entity: 'events',
  storeName: EVENT_STORE,
  dataKey: 'events',
  mapRowFromDb: mapEventRow,
  sortRows: (a, b) => ((a.start_date || '') > (b.start_date || '') ? 1 : -1),
});

export function useEvents() {
  return useOfflineEventsBase();
}

export { mapPayloadToDb };
