/** Utilitários compartilhados da camada offline. */

export function isBrowserOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

export function isNetworkError(err) {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return (
    isBrowserOffline() ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('load failed') ||
    msg.includes('networkerror') ||
    err.name === 'TypeError'
  );
}

export function newTempId() {
  return crypto.randomUUID();
}

export function stampOfflineRow(row, tempId) {
  return {
    ...row,
    id: tempId,
    _offlinePending: true,
    _offlineTempId: tempId,
    _offlineUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Mescla fila pendente sobre linhas espelhadas para exibição offline.
 */
export function applyQueueToRows(rows, queueItems, entity, mapRow) {
  const byId = new Map((rows || []).map((r) => [r.id, { ...r }]));

  queueItems
    .filter((q) => q.entity === entity)
    .forEach((item) => {
      if (item.op === 'create') {
        const id = item.tempId || item.recordId;
        const base = byId.get(id) || {};
        byId.set(
          id,
          mapRow(
            stampOfflineRow(
              {
                ...item.payload,
                ...base,
                user_id: item.userId,
                id,
              },
              id
            )
          )
        );
      } else if (item.op === 'update') {
        const id = item.recordId;
        const prev = byId.get(id) || { id, user_id: item.userId };
        byId.set(id, mapRow({ ...prev, ...item.payload, id, _offlinePending: true }));
      } else if (item.op === 'delete') {
        byId.delete(item.recordId);
      }
    });

  return Array.from(byId.values());
}

export const OFFLINE_SYNC_EVENT = 'backstage:offline-sync-complete';
export const OFFLINE_QUEUE_EVENT = 'backstage:offline-queue-changed';

export function notifyQueueChanged() {
  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT));
}

export function notifySyncComplete(detail) {
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT, { detail }));
}
