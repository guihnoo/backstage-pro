import {
  useDailyWork as useBaseDailyWork,
  mapPayloadToDb,
  mapRowFromDb,
} from '../useDailyWork.js';
import { createOfflineHook } from './createOfflineHook';
import { DAILY_WORK_STORE, mapDailyWorkRow } from './offlineSync';

const useOfflineDailyWorkBase = createOfflineHook({
  useBaseHook: useBaseDailyWork,
  entity: 'daily_work',
  storeName: DAILY_WORK_STORE,
  dataKey: 'dailyWork',
  mapRowFromDb: mapDailyWorkRow,
  sortRows: (a, b) => ((b.work_date || b.date || '') > (a.work_date || a.date || '') ? 1 : -1),
});

export function useDailyWork() {
  return useOfflineDailyWorkBase();
}

export { mapPayloadToDb, mapRowFromDb };
