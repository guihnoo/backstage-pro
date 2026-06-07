import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

const mapPayloadToDb = (payload = {}) => {
  const mapped = {
    ...payload,
    event_date: payload.event_date || payload.start_date || null,
  };

  delete mapped.id;
  delete mapped.owner_id;

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

  const refetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  }, [userId]);

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
    return mapped;
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('events').delete().eq('id', id);
    if (err) throw err;

    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, []);

  return { events, loading, error, refetch, create, update, delete: remove };
}

export { mapPayloadToDb };
