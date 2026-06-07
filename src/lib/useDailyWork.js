import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

const mapPayloadToDb = (payload = {}) => {
  const mapped = {
    ...payload,
    work_date: payload.work_date || payload.date || null,
    hours_worked: payload.hours_worked != null ? Number(payload.hours_worked) : Number(payload.total_hours || 0),
    description: payload.description ?? payload.notes ?? null,
    status: payload.status || 'completed',
    event_id: payload.event_id || null,
  };

  delete mapped.id;
  delete mapped.owner_id;
  delete mapped.date;
  delete mapped.total_hours;
  delete mapped.notes;

  return mapped;
};

const mapRowFromDb = (row = {}) => {
  const workDate = row.work_date || row.date || null;
  const hoursWorked = Number(row.hours_worked ?? row.total_hours ?? 0);

  return {
    ...row,
    work_date: workDate,
    date: workDate,
    hours_worked: hoursWorked,
    total_hours: hoursWorked,
    description: row.description ?? row.notes ?? '',
    notes: row.description ?? row.notes ?? '',
    status: row.status || 'completed',
  };
};

export function useDailyWork() {
  const { user } = useAuth();
  const userId = user?.id;

  const [dailyWork, setDailyWork] = useState([]);
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
        .from('daily_work')
        .select('*')
        .eq('user_id', userId)
        .order('work_date', { ascending: false });

      if (err) throw err;
      setDailyWork((data || []).map(mapRowFromDb));
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
        .from('daily_work')
        .insert(payload)
        .select()
        .single();

      if (err) throw err;

      const mapped = mapRowFromDb(result);
      setDailyWork((prev) => [mapped, ...prev]);
      return mapped;
    },
    [userId]
  );

  const update = useCallback(async (id, data) => {
    const payload = mapPayloadToDb(data);
    delete payload.user_id;

    const { data: result, error: err } = await supabase
      .from('daily_work')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (err) throw err;

    const mapped = mapRowFromDb(result);
    setDailyWork((prev) => prev.map((work) => (work.id === id ? mapped : work)));
    return mapped;
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('daily_work').delete().eq('id', id);
    if (err) throw err;

    setDailyWork((prev) => prev.filter((work) => work.id !== id));
  }, []);

  return { dailyWork, loading, error, refetch, create, update, delete: remove };
}

export { mapPayloadToDb, mapRowFromDb };
