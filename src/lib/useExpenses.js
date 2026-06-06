import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

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
      setExpenses(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (data) => {
    const payload = { ...data, user_id: userId };
    delete payload.owner_id;
    const { data: result, error: err } = await supabase
      .from('expenses')
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    setExpenses(prev => [result, ...prev]);
    return result;
  }, [userId]);

  const update = useCallback(async (id, data) => {
    const payload = { ...data };
    delete payload.id;
    delete payload.user_id;
    delete payload.owner_id;
    const { data: result, error: err } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    setExpenses(prev => prev.map(e => (e.id === id ? result : e)));
    return result;
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('expenses').delete().eq('id', id);
    if (err) throw err;
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  return { expenses, loading, error, refetch, create, update, delete: remove };
}
