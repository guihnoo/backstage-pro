import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';
import { useRealtimeRefetch } from './useRealtimeRefetch';

const mapPayloadToDb = (payload = {}) => {
  const mapped = {
    ...payload,
    amount: payload.amount != null ? Number(payload.amount) : payload.amount,
    expense_date: payload.expense_date || payload.date || null,
    notes: payload.notes || null,
    description: payload.description || null,
    event_id: payload.event_id || null,
  };

  delete mapped.id;
  delete mapped.owner_id;
  delete mapped.date;

  return mapped;
};

const mapRowFromDb = (row = {}) => {
  const expenseDate = row.expense_date || row.date || null;

  return {
    ...row,
    expense_date: expenseDate,
    date: expenseDate,
    notes: row.notes ?? '',
    description: row.description ?? '',
  };
};

export function useExpenses() {
  const { user } = useAuth();
  const userId = user?.id;

  const [expenses, setExpenses] = useState([]);
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
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false });

      if (err) throw err;
      setExpenses((data || []).map(mapRowFromDb));
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useRealtimeRefetch('expenses', refetch);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (data) => {
      const payload = mapPayloadToDb({ ...data, user_id: userId });
      const { data: result, error: err } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single();

      if (err) throw err;

      const mapped = mapRowFromDb(result);
      setExpenses((prev) => [mapped, ...prev]);
      return mapped;
    },
    [userId]
  );

  const update = useCallback(async (id, data) => {
    const payload = mapPayloadToDb(data);
    delete payload.user_id;

    const { data: result, error: err } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (err) throw err;

    const mapped = mapRowFromDb(result);
    setExpenses((prev) => prev.map((expense) => (expense.id === id ? mapped : expense)));
    return mapped;
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('expenses').delete().eq('id', id);
    if (err) throw err;

    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }, []);

  return { expenses, loading, error, refetch, create, update, delete: remove };
}

export { mapPayloadToDb, mapRowFromDb };
