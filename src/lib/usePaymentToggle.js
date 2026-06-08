import { useCallback, useState } from 'react';
import { supabase } from './supabase';
import { toast } from 'sonner';

export function usePaymentToggle() {
  const [toggling, setToggling] = useState(null);

  const togglePayment = useCallback(async (event, onSuccess) => {
    if (!event?.id) return;
    const newStatus = event.payment_status === 'paid' ? 'unpaid' : 'paid';
    setToggling(event.id);
    try {
      const { error } = await supabase
        .from('events')
        .update({ payment_status: newStatus })
        .eq('id', event.id);
      if (error) throw error;
      toast.success(
        newStatus === 'paid'
          ? `"${event.title}" marcado como pago!`
          : `"${event.title}" desmarcado — pagamento pendente`
      );
      onSuccess?.();
    } catch {
      toast.error('Erro ao atualizar status de pagamento');
    } finally {
      setToggling(null);
    }
  }, []);

  return { togglePayment, toggling };
}
