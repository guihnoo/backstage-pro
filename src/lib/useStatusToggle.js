import { useCallback, useState } from 'react';
import { supabase } from './supabase';
import appToast from '@/lib/appToast';
import { haptics } from '@/lib/haptics';

export function useStatusToggle() {
  const [toggling, setToggling] = useState(null);

  const confirmEvent = useCallback(async (event, onSuccess) => {
    if (!event?.id) return;
    haptics.confirm();
    setToggling(event.id);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'confirmed' })
        .eq('id', event.id);
      if (error) throw error;
      appToast.success(`"${event.title}" confirmado!`);
      onSuccess?.();
    } catch {
      appToast.error('Erro ao confirmar evento');
    } finally {
      setToggling(null);
    }
  }, []);

  return { confirmEvent, toggling };
}
