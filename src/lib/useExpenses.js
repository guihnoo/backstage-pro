import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

const mapPayloadToDb = (payload = {}) => {
  const mapped = {
    ...payload,
    amount: payload.amount != null ? Number(payload.amount) : payload.amount,
    expense_date: payload.expense_date || payload.date || null,
    notes: payload.notes ?? payload.description ?? null,
    event_id: payload.event_id || null,
  };

  delete mapped.id;
  delete mapped.owner_id;
  delete mapped.date;
  delete mapped.is_reimbursable;

  return mapped;
};

const mapRowFromDb = (row = {}) => {
  const { is_reimbursable, ...rest } = row;
  const expenseDate = rest.expense_date || rest.date || null;

  return {
    ...rest,
    expense_date: expenseDate,
    date: expenseDate,
    notes: rest.notes ?? rest.description ?? '',
  };
};

export function useExpenses() {
  const { user } = useAuth();
  const userId = user?.id;

  const [expenses, setExpenses] = useState([]);
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
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false });

      if (err) throw err;
      setExpenses((data || []).map(mapRowFromDb));
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
