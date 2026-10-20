import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';
import { useRealtimeRefetch } from './useRealtimeRefetch';
import { dedupeRequest } from './requestDedupe';

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
    // Alimentacao do dia (migration 041). So vai quando a tela manda (regra = reembolso).
    meal_allowance: payload.meal_allowance != null ? Number(payload.meal_allowance) : null,
    notes: payload.description ?? payload.notes ?? null,
    photo_url: payload.photo_url ?? null,
    status: payload.status || 'completed',
    // Lote 2 (migration 035). Só são enviados quando definidos — com a escolha por dia
    // desligada (VITE_REGIME_POR_DIA), nada muda no que é gravado.
    regime: payload.regime ?? null,
    hora_extra: typeof payload.hora_extra === 'boolean' ? payload.hora_extra : null,
    origem: payload.origem ?? null,
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
      const { data, error: err } = await dedupeRequest(`daily_work:${userId}`, () => supabase
        .from('daily_work')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false }));

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

      // Um registro por dia (Lote 3): se o dia já tem registro neste evento
      // (outra aba, outro aparelho), atualiza esse registro em vez de duplicar.
      if (payload.event_id && payload.date) {
        const { data: sameDay, error: findErr } = await supabase
          .from('daily_work')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', payload.event_id)
          .eq('date', payload.date)
          .order('updated_at', { ascending: false })
          .limit(1);
        if (findErr) throw findErr;
        if (sameDay?.[0]?.id) {
          const patch = { ...payload };
          delete patch.user_id;
          const { data: updated, error: updErr } = await supabase
            .from('daily_work')
            .update(patch)
            .eq('id', sameDay[0].id)
            .select()
            .single();
          if (updErr) throw updErr;
          const mappedUpdate = mapRowFromDb(updated);
          setDailyWork((prev) => [mappedUpdate, ...prev.filter((w) => w.id !== mappedUpdate.id)]);
          return mappedUpdate;
        }
      }

      const { data: result, error: err } = await supabase
        .from('daily_work')
        .insert(payload)
        .select()
        .single();

      if (err) {
        // Corrida entre abas com o índice único (migration 036): vira atualização do dia.
        if (err.code === '23505' && payload.event_id && payload.date) {
          const patch = { ...payload };
          delete patch.user_id;
          const { data: raced, error: racedErr } = await supabase
            .from('daily_work')
            .update(patch)
            .eq('user_id', userId)
            .eq('event_id', payload.event_id)
            .eq('date', payload.date)
            .select()
            .single();
          if (racedErr) throw racedErr;
          const mappedRaced = mapRowFromDb(raced);
          setDailyWork((prev) => [mappedRaced, ...prev.filter((w) => w.id !== mappedRaced.id)]);
          return mappedRaced;
        }
        throw err;
      }

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
