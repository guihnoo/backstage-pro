import { useClients as useBaseClients } from '../useClients.js';
import { createOfflineHook } from './createOfflineHook';
import { CLIENT_STORE } from './offlineSync';

const mapClientRow = (row) => row;

const useOfflineClientsBase = createOfflineHook({
  useBaseHook: useBaseClients,
  entity: 'clients',
  storeName: CLIENT_STORE,
  dataKey: 'clients',
  mapRowFromDb: mapClientRow,
  sortRows: (a, b) => (a.name || '').localeCompare(b.name || ''),
});

export function useClients() {
  return useOfflineClientsBase();
}
