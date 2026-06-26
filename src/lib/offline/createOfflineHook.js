import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../authContext';
import {
  getMirrorRows,
  getSyncQueue,
  replaceMirrorStore,
} from './offlineDb';
import {
  applyQueueToRows,
  isNetworkError,
  OFFLINE_QUEUE_EVENT,
} from './offlineUtils';
import { markConnectivityOnline } from './connectivityStore';
import { useConnectivity } from './useConnectivity';
import {
  queueOfflineCreate,
  queueOfflineDelete,
  queueOfflineUpdate,
} from './offlineSync';

/**
 * Factory para hooks offline-first (espelho IDB + fila de mutações).
 */
export function createOfflineHook({
  useBaseHook,
  entity,
  storeName,
  dataKey,
  mapRowFromDb,
  sortRows,
}) {
  return function useOfflineEntityHook() {
    const base = useBaseHook();
    const { user } = useAuth();
    const userId = user?.id;
    const { offline: isOffline } = useConnectivity();

    const baseRows = base[dataKey];
    const [mirrorRows, setMirrorRows] = useState([]);
    const [queueItems, setQueueItems] = useState([]);
    const [mirrorReady, setMirrorReady] = useState(false);

    const refreshLocal = useCallback(async () => {
      if (!userId) return;
      const [rows, queue] = await Promise.all([
        getMirrorRows(storeName, userId),
        getSyncQueue(userId),
      ]);
      setMirrorRows(rows.map(mapRowFromDb));
      setQueueItems(queue);
      setMirrorReady(true);
    }, [userId, storeName, mapRowFromDb]);

    useEffect(() => {
      refreshLocal();
    }, [refreshLocal]);

    useEffect(() => {
      const handler = () => refreshLocal();
      window.addEventListener(OFFLINE_QUEUE_EVENT, handler);
      window.addEventListener('backstage:reconnect', handler);
      return () => {
        window.removeEventListener(OFFLINE_QUEUE_EVENT, handler);
        window.removeEventListener('backstage:reconnect', handler);
      };
    }, [refreshLocal]);

    useEffect(() => {
      if (!userId || base.loading) return;
      replaceMirrorStore(storeName, userId, (baseRows || []).map((r) => ({ ...r, user_id: userId }))).catch(
        () => {}
      );
    }, [userId, baseRows, base.loading, storeName]);

    const entityQueue = queueItems.filter((q) => q.entity === entity);
    const hasPending = entityQueue.length > 0;

    const effectiveRows = useMemo(() => {
      let source = baseRows || [];

      if ((isOffline || base.error) && mirrorRows.length) {
        source = mirrorRows;
      }

      if (hasPending) {
        source = applyQueueToRows(source, queueItems, entity, mapRowFromDb);
      }

      if (!sortRows) return source;
      return [...source].sort(sortRows);
    }, [
      baseRows,
      base.error,
      mirrorRows,
      queueItems,
      entity,
      mapRowFromDb,
      sortRows,
      hasPending,
      isOffline,
    ]);

    const pendingCount = useMemo(
      () => queueItems.filter((q) => q.entity === entity).length,
      [queueItems, entity]
    );

    const runOnlineOrQueue = useCallback(
      async (onlineFn, queueFn) => {
        if (!isOffline) {
          try {
            const result = await onlineFn();
            markConnectivityOnline();
            return result;
          } catch (err) {
            if (!isNetworkError(err)) throw err;
          }
        }
        return queueFn();
      },
      [isOffline]
    );

    const create = useCallback(
      async (data) => {
        return runOnlineOrQueue(
          () => base.create(data),
          () => queueOfflineCreate(userId, entity, data, storeName, mapRowFromDb)
        ).then(async (result) => {
          await refreshLocal();
          return result;
        });
      },
      [base, userId, entity, storeName, mapRowFromDb, runOnlineOrQueue, refreshLocal]
    );

    const update = useCallback(
      async (id, data) => {
        return runOnlineOrQueue(
          () => base.update(id, data),
          () => queueOfflineUpdate(userId, entity, id, data, storeName, mapRowFromDb)
        ).then(async (result) => {
          await refreshLocal();
          return result;
        });
      },
      [base, userId, entity, storeName, mapRowFromDb, runOnlineOrQueue, refreshLocal]
    );

    const remove = useCallback(
      async (id) => {
        return runOnlineOrQueue(
          () => base.delete(id),
          async () => {
            await queueOfflineDelete(userId, entity, id, storeName);
          }
        ).then(async () => {
          await refreshLocal();
        });
      },
      [base, userId, entity, storeName, runOnlineOrQueue, refreshLocal]
    );

    const loading = base.loading && !mirrorReady && !(mirrorRows.length && (isOffline || base.error));
    const offlinePending = pendingCount > 0;

    return {
      [dataKey]: effectiveRows,
      loading,
      error: isOffline && mirrorRows.length ? null : base.error,
      refetch: base.refetch,
      create,
      update,
      delete: remove,
      offlinePending,
      pendingCount,
    };
  };
}
