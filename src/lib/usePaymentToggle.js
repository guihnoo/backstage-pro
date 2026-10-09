import { useCallback, useState } from 'react';
import { supabase } from './supabase';
import appToast from '@/lib/appToast';
import { haptics } from '@/lib/haptics';
import { buildMarkPaidUpdate, buildMarkUnpaidUpdate } from '@/lib/financeMetrics';

export function usePaymentToggle() {
  const [toggling, setToggling] = useState(null);

  const togglePayment = useCallback(async (event, onSuccess) => {
    if (!event?.id) return;
    const newStatus = event.payment_status === 'paid' ? 'unpaid' : 'paid';
    haptics[newStatus === 'paid' ? 'success' : 'light']();
    setToggling(event.id);
    try {
      let updateData = buildMarkUnpaidUpdate();
      if (newStatus === 'paid') {
        const { data: eventWork } = await supabase
          .from('daily_work')
          .select('daily_cache')
          .eq('event_id', event.id);
        updateData = buildMarkPaidUpdate(event, eventWork || []);
      }
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id);
      if (error) throw error;
      appToast.success(
        newStatus === 'paid'
          ? `"${event.title}" marcado como pago!`
          : `"${event.title}" desmarcado — pagamento pendente`
      );
      onSuccess?.();
    } catch {
      appToast.error('Erro ao atualizar status de pagamento');
    } finally {
      setToggling(null);
    }
  }, []);

  return { togglePayment, toggling };
}
