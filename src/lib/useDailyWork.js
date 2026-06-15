import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';
import { useRealtimeRefetch } from './useRealtimeRefetch';

/** Mapeia payload da UI para colunas reais do Supabase (date, total_hours, notes). */
export function mapPayloadToDb(payload = {}) {
  const workDate = payload.work_date || payload.date || null;
  const hours =
    payload.hours_worked != null
      ? Number(payload.hours_worked)
      : Number(payload.total_hours ?? 0);

  const mapped = {
    user_id: payload.user_id,
    event_id: payload.event_id || null,
    work_date: workDate,
    date: workDate,
    entry_time: payload.entry_time ?? null,
    exit_time: payload.exit_time ?? null,
    total_hours: hours,
    overtime_hours:
      payload.overtime_hours != null ? Number(payload.overtime_hours) : null,
    daily_cache: payload.daily_cache != null ? Number(payload.daily_cache) : null,
    notes: payload.description ?? payload.notes ?? null,
    photo_url: payload.photo_url ?? null,
    status: payload.status || 'completed',
  };

  Object.keys(mapped).forEach((key) => {
    if (mapped[key] === null || mapped[key] === undefined) delete mapped[key];
  });

  return mapped;
}

export function mapRowFromDb(row = {}) {
  const workDate = row.date || row.work_date || null;
  const hoursWorked = Number(row.total_hours ?? row.hours_worked ?? 0);

  return {
    ...row,
    work_date: workDate,
    date: workDate,
    hours_worked: hoursWorked,
    total_hours: hoursWorked,
    description: row.notes ?? row.description ?? '',
    notes: row.notes ?? row.description ?? '',
    status: row.status || 'completed',
  };
}

export function useDailyWork() {
  const { user } = useAuth();
  const userId = user?.id;

  const [dailyWork, setDailyWork] = useState([]);
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
        .from('daily_work')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (err) throw err;
      setDailyWork((data || []).map(mapRowFromDb));
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useRealtimeRefetch('daily_work', refetch);

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
