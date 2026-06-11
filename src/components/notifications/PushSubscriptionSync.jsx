import { useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ensurePushSubscription, isPushSupported } from '@/lib/pushNotifications';

/** Mantém a subscription Web Push válida após updates do PWA ou reinstalação. */
export default function PushSubscriptionSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || !isPushSupported()) return;

    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('push_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled || !data?.push_enabled) return;
        await ensurePushSubscription(user.id);
      } catch {
        /* silencioso — usuário pode reativar no perfil */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return null;
}
