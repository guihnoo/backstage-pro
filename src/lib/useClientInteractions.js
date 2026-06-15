import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

export const INTERACTION_TYPES = {
  whatsapp: { label: 'WhatsApp', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  call:      { label: 'Ligação',  color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
  email:     { label: 'E-mail',   color: 'bp-text-primary', bg: 'bp-surface-primary border' },
  meeting:   { label: 'Reunião',  color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  other:     { label: 'Outro',    color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export function useClientInteractions(clientId) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user?.id || !clientId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('client_interactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setInteractions(data || []);
    setLoading(false);
  }, [user?.id, clientId]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('client_interactions')
      .insert({ ...payload, user_id: user.id, client_id: clientId })
      .select()
      .single();
    if (error) throw error;
    setInteractions(prev => [data, ...prev]);
    return data;
  }, [user?.id, clientId]);

  const remove = useCallback(async (id) => {
    const { error } = await supabase.from('client_interactions').delete().eq('id', id);
    if (error) throw error;
    setInteractions(prev => prev.filter(i => i.id !== id));
  }, []);

  return { interactions, loading, refetch, create, remove };
}

// Para o AlertsPanel — busca follow-ups pendentes de todos os clientes
export async function fetchPendingFollowUps(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('client_interactions')
    .select('*, clients(name)')
    .eq('user_id', userId)
    .not('follow_up_date', 'is', null)
    .lte('follow_up_date', today)
    .order('follow_up_date', { ascending: true })
    .limit(10);
  return data || [];
}
