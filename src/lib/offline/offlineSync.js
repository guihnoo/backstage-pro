import { supabase } from '../supabase';
import { mapPayloadToDb as mapEventPayload } from '../useEvents.js';
import { mapPayloadToDb as mapExpensePayload, mapRowFromDb as mapExpenseRow } from '../useExpenses.js';
import {
  mapPayloadToDb as mapDailyWorkPayload,
  mapRowFromDb as mapDailyWorkRow,
} from '../useDailyWork.js';
import { linkClientToCompanyAfterCreate } from '../useClients.js';
import { syncEventToGoogleCalendar } from '@/lib/googleCalendarPush';
import {
  deleteMirrorRow,
  enqueueSyncItem,
  getSyncQueue,
  removeSyncItem,
  resolveRecordId,
  saveIdMapping,
  upsertMirrorRow,
} from './offlineDb';
import { newTempId, notifyQueueChanged } from './offlineUtils';
import { isAppOnline } from './connectivityStore';

const EVENT_STORE = 'events';
const CLIENT_STORE = 'clients';
const EXPENSE_STORE = 'expenses';
const DAILY_WORK_STORE = 'daily_work';

function mapEventRow(row) {
  return {
    ...row,
    start_date: row.start_date || row.event_date || null,
    event_date: row.event_date || row.start_date || null,
  };
}

export async function queueOfflineCreate(userId, entity, payload, storeName, mapRow) {
  const tempId = newTempId();
  const item = {
    id: newTempId(),
    userId,
    entity,
    op: 'create',
    tempId,
    recordId: tempId,
    payload,
    createdAt: new Date().toISOString(),
  };
  await enqueueSyncItem(item);
  const row = mapRow({
    ...payload,
    id: tempId,
    user_id: userId,
    _offlinePending: true,
    _offlineTempId: tempId,
  });
  await upsertMirrorRow(storeName, row);
  notifyQueueChanged();
  return row;
}

export async function queueOfflineUpdate(userId, entity, recordId, payload, storeName, mapRow) {
  const item = {
    id: newTempId(),
    userId,
    entity,
    op: 'update',
    recordId,
    tempId: null,
    payload,
    createdAt: new Date().toISOString(),
  };
  await enqueueSyncItem(item);
  const existing = await resolveRecordId(userId, recordId);
  const row = mapRow({
    ...payload,
    id: recordId,
    user_id: userId,
    _offlinePending: true,
  });
  await upsertMirrorRow(storeName, { ...row, id: recordId });
  notifyQueueChanged();
  return { ...row, id: recordId, _resolvedId: existing };
}

export async function queueOfflineDelete(userId, entity, recordId, storeName) {
  const queue = await getSyncQueue(userId);
  const pendingCreate = queue.find(
    (q) => q.entity === entity && q.op === 'create' && q.tempId === recordId
  );

  if (pendingCreate) {
    await removeSyncItem(pendingCreate.id);
  } else {
    await enqueueSyncItem({
      id: newTempId(),
      userId,
      entity,
      op: 'delete',
      recordId,
      tempId: null,
      payload: {},
      createdAt: new Date().toISOString(),
    });
  }

  await deleteMirrorRow(storeName, recordId);
  notifyQueueChanged();
}

async function syncEventCreate(userId, payload, tempId) {
  const dbPayload = mapEventPayload({ ...payload, user_id: userId });
  const { data, error } = await supabase.from('events').insert(dbPayload).select().single();
  if (error) throw error;
  const mapped = mapEventRow(data);
  if (tempId) await saveIdMapping(userId, tempId, mapped.id, 'events');
  syncEventToGoogleCalendar(mapped.id, 'upsert');
  return mapped;
}

async function syncEventUpdate(userId, recordId, payload) {
  const id = await resolveRecordId(userId, recordId);
  const dbPayload = mapEventPayload(payload);
  delete dbPayload.user_id;
  const { data, error } = await supabase.from('events').update(dbPayload).eq('id', id).select().single();
  if (error) throw error;
  syncEventToGoogleCalendar(id, 'upsert');
  return mapEventRow(data);
}

async function syncEventDelete(userId, recordId) {
  const id = await resolveRecordId(userId, recordId);
  const { data: existing } = await supabase.from('events').select('google_event_id').eq('id', id).maybeSingle();
  if (existing?.google_event_id) {
    syncEventToGoogleCalendar(id, 'delete', existing.google_event_id);
  }
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

async function syncClientCreate(userId, payload, tempId) {
  const dbPayload = { ...payload, user_id: userId };
  delete dbPayload.owner_id;

  let { data, error } = await supabase.from('clients').insert(dbPayload).select().single();

  if (error && dbPayload.client_type && /client_type/i.test(error.message || '')) {
    const fallback = { ...dbPayload };
    delete fallback.client_type;
    ({ data, error } = await supabase.from('clients').insert(fallback).select().single());
  }

  if (error) throw error;
  const enriched = await linkClientToCompanyAfterCreate(data, userId);
  if (tempId) await saveIdMapping(userId, tempId, enriched.id, 'clients');
  return enriched;
}

async function syncClientUpdate(userId, recordId, payload) {
  const id = await resolveRecordId(userId, recordId);
  const dbPayload = { ...payload };
  delete dbPayload.id;
  delete dbPayload.user_id;
  delete dbPayload.owner_id;
  const { data, error } = await supabase.from('clients').update(dbPayload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function syncClientDelete(userId, recordId) {
  const id = await resolveRecordId(userId, recordId);
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

async function syncExpenseCreate(userId, payload, tempId) {
  const dbPayload = mapExpensePayload({ ...payload, user_id: userId });
  const { data, error } = await supabase.from('expenses').insert(dbPayload).select().single();
  if (error) throw error;
  const mapped = mapExpenseRow(data);
  if (tempId) await saveIdMapping(userId, tempId, mapped.id, 'expenses');
  return mapped;
}

async function syncExpenseUpdate(userId, recordId, payload) {
  const id = await resolveRecordId(userId, recordId);
  const dbPayload = mapExpensePayload(payload);
  delete dbPayload.user_id;
  const { data, error } = await supabase.from('expenses').update(dbPayload).eq('id', id).select().single();
  if (error) throw error;
  return mapExpenseRow(data);
}

async function syncExpenseDelete(userId, recordId) {
  const id = await resolveRecordId(userId, recordId);
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

async function syncDailyWorkCreate(userId, payload, tempId) {
  const dbPayload = mapDailyWorkPayload({ ...payload, user_id: userId });
  const { data, error } = await supabase.from('daily_work').insert(dbPayload).select().single();
  if (error) throw error;
  const mapped = mapDailyWorkRow(data);
  if (tempId) await saveIdMapping(userId, tempId, mapped.id, 'daily_work');
  return mapped;
}

async function syncDailyWorkUpdate(userId, recordId, payload) {
  const id = await resolveRecordId(userId, recordId);
  const dbPayload = mapDailyWorkPayload(payload);
  delete dbPayload.user_id;
  const { data, error } = await supabase.from('daily_work').update(dbPayload).eq('id', id).select().single();
  if (error) throw error;
  return mapDailyWorkRow(data);
}

async function syncDailyWorkDelete(userId, recordId) {
  const id = await resolveRecordId(userId, recordId);
  const { error } = await supabase.from('daily_work').delete().eq('id', id);
  if (error) throw error;
}

const SYNC_HANDLERS = {
  events: {
    create: syncEventCreate,
    update: syncEventUpdate,
    delete: syncEventDelete,
  },
  clients: {
    create: syncClientCreate,
    update: syncClientUpdate,
    delete: syncClientDelete,
  },
  expenses: {
    create: syncExpenseCreate,
    update: syncExpenseUpdate,
    delete: syncExpenseDelete,
  },
  daily_work: {
    create: syncDailyWorkCreate,
    update: syncDailyWorkUpdate,
    delete: syncDailyWorkDelete,
  },
};

export async function processOfflineQueue(userId) {
  if (!userId || !isAppOnline()) return { synced: 0, failed: 0, skipped: true };

  const items = await getSyncQueue(userId);
  if (!items.length) return { synced: 0, failed: 0, skipped: false };

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    const handlers = SYNC_HANDLERS[item.entity];
    if (!handlers) {
      await removeSyncItem(item.id);
      continue;
    }

    try {
      if (item.op === 'create') {
        await handlers.create(item.userId, item.payload, item.tempId);
      } else if (item.op === 'update') {
        await handlers.update(item.userId, item.recordId, item.payload);
      } else if (item.op === 'delete') {
        await handlers.delete(item.userId, item.recordId);
      }
      await removeSyncItem(item.id);
      synced += 1;
    } catch (err) {
      console.error('[offline-sync] falha ao sincronizar item', item, err);
      failed += 1;
    }
  }

  notifyQueueChanged();
  return { synced, failed, skipped: false };
}

export {
  EVENT_STORE,
  CLIENT_STORE,
  EXPENSE_STORE,
  DAILY_WORK_STORE,
  mapEventRow,
  mapExpenseRow,
  mapDailyWorkRow,
};
