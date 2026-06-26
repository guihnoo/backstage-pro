import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import appToast from '@/lib/appToast';
import { getSyncQueueCount } from '@/lib/offline/offlineDb';
import { processOfflineQueue } from '@/lib/offline/offlineSync';
import { OFFLINE_QUEUE_EVENT, OFFLINE_SYNC_EVENT } from '@/lib/offline/offlineUtils';

const OfflineSyncContext = createContext({ pendingCount: 0, syncing: false });

export function useOfflineSync() {
  return useContext(OfflineSyncContext);
}

export function OfflineSyncProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const flushingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    if (!userId) {
      setPendingCount(0);
      return;
    }
    const count = await getSyncQueueCount(userId);
    setPendingCount(count);
  }, [userId]);

  const flushQueue = useCallback(async () => {
    if (!userId || flushingRef.current) return;
    flushingRef.current = true;
    setSyncing(true);
    try {
      const result = await processOfflineQueue(userId);
      await refreshCount();
      if (result.synced > 0) {
        appToast.success(
          result.synced === 1
            ? '1 alteração sincronizada'
            : `${result.synced} alterações sincronizadas`
        );
        window.dispatchEvent(new CustomEvent('backstage:reconnect'));
      }
      if (result.failed > 0) {
        appToast.error(
          result.failed === 1
            ? '1 alteração não sincronizou — tentaremos de novo'
            : `${result.failed} alterações não sincronizaram`
        );
      }
      if (result.synced > 0 || result.failed > 0) {
        window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT, { detail: result }));
      }
    } finally {
      flushingRef.current = false;
      setSyncing(false);
    }
  }, [userId, refreshCount]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    const onQueueChange = () => refreshCount();
    window.addEventListener(OFFLINE_QUEUE_EVENT, onQueueChange);
    return () => window.removeEventListener(OFFLINE_QUEUE_EVENT, onQueueChange);
  }, [refreshCount]);

  useEffect(() => {
    if (!userId) return undefined;

    const onReconnect = () => {
      flushQueue();
    };

    window.addEventListener('backstage:reconnect', onReconnect);
    window.addEventListener('online', onReconnect);

    return () => {
      window.removeEventListener('backstage:reconnect', onReconnect);
      window.removeEventListener('online', onReconnect);
    };
  }, [userId, flushQueue]);

  const value = { pendingCount, syncing, flushQueue };

  return (
    <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>
  );
}
