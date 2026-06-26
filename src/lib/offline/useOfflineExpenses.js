import {
  useExpenses as useBaseExpenses,
  mapPayloadToDb,
  mapRowFromDb,
} from '../useExpenses.js';
import { createOfflineHook } from './createOfflineHook';
import { EXPENSE_STORE, mapExpenseRow } from './offlineSync';

const useOfflineExpensesBase = createOfflineHook({
  useBaseHook: useBaseExpenses,
  entity: 'expenses',
  storeName: EXPENSE_STORE,
  dataKey: 'expenses',
  mapRowFromDb: mapExpenseRow,
  sortRows: (a, b) => ((b.expense_date || b.date || '') > (a.expense_date || a.date || '') ? 1 : -1),
});

export function useExpenses() {
  return useOfflineExpensesBase();
}

export { mapPayloadToDb, mapRowFromDb };
