import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import { realtimeBus } from '@/lib/realtimeBus';

const SYNC_TABLES = [
  { table: 'events', column: 'user_id' },
  { table: 'clients', column: 'user_id' },
  { table: 'expenses', column: 'user_id' },
  { table: 'daily_work', column: 'user_id' },
  { table: 'user_settings', column: 'user_id' },
  { table: 'profiles', column: 'id' },
];

/**
 * Um canal Realtime por usuário — propaga mudanças remotas para todos os hooks via realtimeBus.
 */
export function RealtimeSyncProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;

    const channel = supabase.channel(`backstage-sync:${userId}`, {
      config: { broadcast: { self: false } },
    });

    SYNC_TABLES.forEach(({ table, column }) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${column}=eq.${userId}`,
        },
        (payload) => realtimeBus.emit(table, payload)
      );
    });

    channel.subscribe((status, err) => {
      if (import.meta.env.DEV) {
        if (status === 'SUBSCRIBED') {
          console.debug('[realtime] conectado');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[realtime]', status, err?.message);
        }
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return children;
}
