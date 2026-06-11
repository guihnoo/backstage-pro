import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';
import { syncEventToGoogleCalendar } from '@/lib/googleCalendarPush';
import { useRealtimeRefetch } from './useRealtimeRefetch';

function normalizeCoord(value) {
  if (value === '' || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLocationFields(mapped) {
  if ('location' in mapped) {
    const loc = mapped.location;
    mapped.location = typeof loc === 'string' ? loc.trim() || null : loc ?? null;
  }
  if ('location_city' in mapped) {
    mapped.location_city = mapped.location_city?.trim?.() || mapped.location_city || null;
  }
  if ('location_state' in mapped) {
    mapped.location_state = mapped.location_state?.trim?.() || mapped.location_state || null;
  }
  if ('location_lat' in mapped) mapped.location_lat = normalizeCoord(mapped.location_lat);
  if ('location_lng' in mapped) mapped.location_lng = normalizeCoord(mapped.location_lng);
}

const mapPayloadToDb = (payload = {}) => {
  const mapped = { ...payload };

  delete mapped.id;
  delete mapped.owner_id;
  // Não enviar event_date em updates parciais — coluna legada pode não existir ou ser NOT NULL.
  delete mapped.event_date;

  normalizeLocationFields(mapped);

  return mapped;
};

const mapRowFromDb = (row = {}) => ({
  ...row,
  start_date: row.start_date || row.event_date || null,
  event_date: row.event_date || row.start_date || null,
});

export function useEvents() {
  const { user } = useAuth();
  const userId = user?.id;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (err) throw err;
      setEvents((data || []).map(mapRowFromDb));
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useRealtimeRefetch('events', refetch);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (data) => {
      const payload = mapPayloadToDb({ ...data, user_id: userId });
      const { data: result, error: err } = await supabase
        .from('events')
        .insert(payload)
        .select()
        .single();

      if (err) throw err;

      const mapped = mapRowFromDb(result);
      setEvents((prev) => [...prev, mapped].sort((a, b) => (a.start_date > b.start_date ? 1 : -1)));
      syncEventToGoogleCalendar(mapped.id, 'upsert');
      return mapped;
    },
    [userId]
  );

  const update = useCallback(async (id, data) => {
    const payload = mapPayloadToDb(data);
    delete payload.user_id;

    const { data: result, error: err } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (err) throw err;

    const mapped = mapRowFromDb(result);
    setEvents((prev) => prev.map((event) => (event.id === id ? mapped : event)));
    syncEventToGoogleCalendar(id, 'upsert');
    return mapped;
  }, []);

  const remove = useCallback(async (id) => {
    const existing = events.find((e) => e.id === id);
    if (existing?.google_event_id) {
      syncEventToGoogleCalendar(id, 'delete', existing.google_event_id);
    }
    const { error: err } = await supabase.from('events').delete().eq('id', id);
    if (err) throw err;

    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, [events]);

  return { events, loading, error, refetch, create, update, delete: remove };
}

export { mapPayloadToDb };
