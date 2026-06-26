import { useCallback, useState } from 'react';
import { supabase } from './supabase';
import appToast from '@/lib/appToast';
import { haptics } from '@/lib/haptics';

export function usePaymentToggle() {
  const [toggling, setToggling] = useState(null);

  const togglePayment = useCallback(async (event, onSuccess) => {
    if (!event?.id) return;
    const newStatus = event.payment_status === 'paid' ? 'unpaid' : 'paid';
    haptics[newStatus === 'paid' ? 'success' : 'light']();
    setToggling(event.id);
    try {
      const updateData = { payment_status: newStatus };
      if (newStatus === 'paid') updateData.paid_date = new Date().toISOString().split('T')[0];
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
