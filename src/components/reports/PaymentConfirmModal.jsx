import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import appToast from '@/lib/appToast';
import { useEvents } from '@/lib/useEvents';
import { getEventCacheAmount } from '@/lib/eventFinance';
import EventHeading from '@/components/events/EventHeading';

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'cheque', label: 'Cheque' },
];

export default function PaymentConfirmModal({ event, client, isOpen, onClose, onSuccess }) {
  const { update: updateEvent } = useEvents();
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      const estimatedValue = event.paid_amount || getEventCacheAmount(event) || 0;
      setPaidAmount(estimatedValue > 0 ? estimatedValue.toString() : '');
      setPaidDate(new Date());
      setPaymentMethod(event.payment_method || 'pix');
    }
  }, [event, isOpen]);

  const handleConfirm = async () => {
    if (!paidAmount || Number(paidAmount) <= 0) {
      appToast.error('Informe um valor válido para o pagamento.');
      return;
    }

    setLoading(true);
    try {
      await updateEvent(event.id, {
        payment_status: 'paid',
        paid_amount: Number(paidAmount),
        paid_date: format(paidDate, 'yyyy-MM-dd'),
        payment_method: paymentMethod,
      });

      appToast.success('Pagamento confirmado com sucesso!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      appToast.error('Erro ao confirmar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] bg-slate-900 border-slate-700 text-white flex flex-col overflow-hidden p-0 bp-focus-scope">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Confirmar Recebimento
          </DialogTitle>
        </DialogHeader>

        <div className="bp-modal-scroll px-6 space-y-4">
          <div className="space-y-2 min-w-0">
            <p className="text-sm text-slate-400">Evento:</p>
            <EventHeading event={event} client={client} size="sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_amount" className="text-slate-300">
              Valor Recebido (R$)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Forma de recebimento</Label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    paymentMethod === m.value
                      ? 'border-green-500/60 bg-green-500/15 text-green-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Data do Recebimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paidDate ? format(paidDate, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <Calendar
                  mode="single"
                  selected={paidDate}
                  onSelect={(date) => date && setPaidDate(date)}
                  locale={ptBR}
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 py-4 border-t border-slate-700 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
