const DB_NAME = 'backstage-offline-v1';
const DB_VERSION = 1;

const ENTITY_STORES = ['events', 'clients', 'expenses', 'daily_work'];

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      ENTITY_STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          const os = db.createObjectStore(store, { keyPath: 'id' });
          os.createIndex('user_id', 'user_id', { unique: false });
        }
      });

      if (!db.objectStoreNames.contains('sync_queue')) {
        const q = db.createObjectStore('sync_queue', { keyPath: 'id' });
        q.createIndex('user_id', 'user_id', { unique: false });
        q.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('id_map')) {
        const m = db.createObjectStore('id_map', { keyPath: 'tempId' });
        m.createIndex('user_id', 'user_id', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

function tx(storeNames, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeNames, mode);
        const stores = storeNames.map((n) => transaction.objectStore(n));
        let result;
        try {
          result = fn(...stores);
        } catch (err) {
          reject(err);
          return;
        }
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      })
  );
}

export async function replaceMirrorStore(storeName, userId, rows) {
  if (!userId) return;
  await tx([storeName], 'readwrite', (store) => {
    const idx = store.index('user_id');
    const req = idx.openCursor(IDBKeyRange.only(userId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    rows.forEach((row) => {
      if (row?.id) store.put({ ...row, user_id: userId });
    });
  });
}

export async function upsertMirrorRow(storeName, row) {
  if (!row?.id) return;
  await tx([storeName], 'readwrite', (store) => {
    store.put(row);
  });
}

export async function deleteMirrorRow(storeName, id) {
  if (!id) return;
  await tx([storeName], 'readwrite', (store) => {
    store.delete(id);
  });
}

export async function getMirrorRows(storeName, userId) {
  if (!userId) return [];
  return tx([storeName], 'readonly', (store) => {
    const idx = store.index('user_id');
    return new Promise((resolve, reject) => {
      const req = idx.getAll(IDBKeyRange.only(userId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function enqueueSyncItem(item) {
  await tx(['sync_queue'], 'readwrite', (store) => {
    store.put(item);
  });
}

export async function getSyncQueue(userId) {
  if (!userId) return [];
  return tx(['sync_queue'], 'readonly', (store) => {
    const idx = store.index('user_id');
    return new Promise((resolve, reject) => {
      const req = idx.getAll(IDBKeyRange.only(userId));
      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) =>
          a.createdAt > b.createdAt ? 1 : -1
        );
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function removeSyncItem(id) {
  await tx(['sync_queue'], 'readwrite', (store) => {
    store.delete(id);
  });
}

export async function getSyncQueueCount(userId) {
  const items = await getSyncQueue(userId);
  return items.length;
}

export async function saveIdMapping(userId, tempId, realId, entity) {
  await tx(['id_map'], 'readwrite', (store) => {
    store.put({ tempId, userId, realId, entity });
  });
}

export async function resolveRecordId(userId, recordId) {
  if (!recordId) return recordId;
  const mapped = await tx(['id_map'], 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.get(recordId);
      req.onsuccess = () => resolve(req.result?.realId || recordId);
      req.onerror = () => reject(req.error);
    });
  });
  return mapped;
}

export async function clearUserOfflineData(userId) {
  if (!userId) return;
  await openDb();
  await Promise.all([
    ...ENTITY_STORES.map((storeName) => replaceMirrorStore(storeName, userId, [])),
    tx(['sync_queue', 'id_map'], 'readwrite', (queueStore, mapStore) => {
      [queueStore, mapStore].forEach((store) => {
        const idx = store.index('user_id');
        const req = idx.openCursor(IDBKeyRange.only(userId));
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
      });
    }),
  ]);
}
