import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

export function useUserSettings() {
  const { user } = useAuth();
  const userId = user?.id;

  const [settings, setSettings] = useState(null);
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
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (err) throw err;
      setSettings(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upsert = useCallback(async (updates) => {
    if (!userId) throw new Error('Usuário não autenticado');
    const payload = { ...updates, user_id: userId };
    delete payload.id;
    const { data, error: err } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (err) throw err;
    setSettings(data);
    return data;
  }, [userId]);

  return { settings, loading, error, refetch, upsert };
}
