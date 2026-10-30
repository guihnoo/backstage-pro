import { useCallback, useState } from 'react';
import { supabase } from './supabase';
import appToast from '@/lib/appToast';
import { haptics } from '@/lib/haptics';
import { buildMarkUnpaidUpdate } from '@/lib/financeMetrics';

export function usePaymentToggle() {
  const [toggling, setToggling] = useState(null);

  const togglePayment = useCallback(async (event, onSuccess) => {
    if (!event?.id) return;
    const newStatus = event.payment_status === 'paid' ? 'unpaid' : 'paid';
    haptics[newStatus === 'paid' ? 'success' : 'light']();
    setToggling(event.id);
    try {
      if(newStatus==='paid') {appToast.info('Abra o evento para confirmar o valor e a data do recebimento.');return;}
      const updateData=buildMarkUnpaidUpdate(event);
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
