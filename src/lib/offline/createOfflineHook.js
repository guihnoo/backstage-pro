import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
 *
 * Os hooks gerados usam entity/storeName/mapRowFromDb/sortRows do closure do factory —
 * valores estáveis por instância, não deps de render. exhaustive-deps é suprimido de propósito.
 */
/* eslint-disable react-hooks/exhaustive-deps */
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
    const [localSnapshot, setLocalSnapshot] = useState({ userId: null, rows: [], queue: [], ready: false });
    const currentUserRef = useRef(userId);
    currentUserRef.current = userId;
    const mirrorRows = localSnapshot.userId === userId ? localSnapshot.rows : [];
    const queueItems = localSnapshot.userId === userId ? localSnapshot.queue : [];
    const mirrorReady = localSnapshot.userId === userId && localSnapshot.ready;

    const refreshLocal = useCallback(async () => {
      if (!userId) return;
      const [rows, queue] = await Promise.all([
        getMirrorRows(storeName, userId),
        getSyncQueue(userId),
      ]);
      if (currentUserRef.current !== userId) return;
      setLocalSnapshot({ userId, rows: rows.map(mapRowFromDb), queue, ready: true });
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
      if (!userId || base.loading || base.error || isOffline) return;
      // Hooks online podem manter a resposta da conta anterior enquanto recarregam.
      // Não reatribuir essas linhas ao novo usuário nem contaminar seu espelho.
      if ((baseRows || []).some(row => row.user_id !== userId)) return;
      replaceMirrorStore(storeName, userId, baseRows || []).catch(
        () => {}
      );
    }, [userId, baseRows, base.loading, base.error, isOffline, storeName]);

    const entityQueue = queueItems.filter((q) => q.entity === entity);
    const hasPending = entityQueue.length > 0;

    const effectiveRows = useMemo(() => {
      let source = (baseRows || []).filter(row => row.user_id === userId);

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
      userId,
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

    const loading = isOffline
      ? !mirrorReady
      : base.loading && !(baseRows?.length > 0);
    const offlinePending = pendingCount > 0;

    return {
      [dataKey]: effectiveRows,
      loading,
      error: isOffline && (mirrorRows.length || hasPending) ? null : base.error,
      refetch: base.refetch,
      create,
      update,
      delete: remove,
      offlinePending,
      pendingCount,
    };
  };
}
