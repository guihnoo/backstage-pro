import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';
import { useRealtimeRefetch } from './useRealtimeRefetch';

export function useClients() {
  const { user } = useAuth();
  const userId = user?.id;

  const [clients, setClients] = useState([]);
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
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      if (err) throw err;
      setClients(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useRealtimeRefetch('clients', refetch);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (data) => {
    const payload = { ...data, user_id: userId };
    delete payload.owner_id;

    let { data: result, error: err } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single();

    if (err && payload.client_type && /client_type/i.test(err.message || '')) {
      const fallback = { ...payload };
      delete fallback.client_type;
      ({ data: result, error: err } = await supabase
        .from('clients')
        .insert(fallback)
        .select()
        .single());
    }

    if (err) throw err;
    setClients(prev => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
    return result;
  }, [userId]);

  const update = useCallback(async (id, data) => {
    const payload = { ...data };
    delete payload.id;
    delete payload.user_id;
    delete payload.owner_id;
    const { data: result, error: err } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    setClients(prev => prev.map(c => (c.id === id ? result : c)));
    return result;
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('clients').delete().eq('id', id);
    if (err) throw err;
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  return { clients, loading, error, refetch, create, update, delete: remove };
}
