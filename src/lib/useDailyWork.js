import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

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
        .order('date', { ascending: false });
      if (err) throw err;
      setDailyWork(data || []);
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
      .from('daily_work')
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    setDailyWork(prev => [result, ...prev]);
    return result;
  }, [userId]);

  const update = useCallback(async (id, data) => {
    const payload = { ...data };
    delete payload.id;
    delete payload.user_id;
    delete payload.owner_id;
    const { data: result, error: err } = await supabase
      .from('daily_work')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    setDailyWork(prev => prev.map(w => (w.id === id ? result : w)));
    return result;
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('daily_work').delete().eq('id', id);
    if (err) throw err;
    setDailyWork(prev => prev.filter(w => w.id !== id));
  }, []);

  return { dailyWork, loading, error, refetch, create, update, delete: remove };
}
