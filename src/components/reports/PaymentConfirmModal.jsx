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
import { getEventReceivedAmount, buildMarkPaidUpdate } from '@/lib/financeMetrics';
import EventHeading from '@/components/events/EventHeading';
import { getEventHoursStatus } from '@/lib/eventFinance';
import { buildHoursGateMessage, shouldBlockPayment } from '@/lib/hoursGate';
import { parseBRL, toBRLInput } from '@/lib/money';

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'cheque', label: 'Cheque' },
];

export default function PaymentConfirmModal({ event, client, dailyWork = [], isOpen, onClose, onSuccess }) {
  const { update: updateEvent } = useEvents();
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [ackMissingHours, setAckMissingHours] = useState(false);

  const estimatedValue = event ? getEventReceivedAmount(event, dailyWork) : 0;
  // events.payment_method nasce na migration 034; sem a coluna o PostgREST rejeita o update inteiro
  const canStoreMethod = Boolean(event) && 'payment_method' in event;

  // Lote 3: recebimento só com as horas preenchidas, ou com "cobrar assim mesmo".
  const hoursStatus = event ? getEventHoursStatus(event, dailyWork) : null;
  const hoursMessage = buildHoursGateMessage(hoursStatus);
  const blockedByHours = shouldBlockPayment(hoursStatus) && !ackMissingHours;

  useEffect(() => {
    if (event && isOpen) {
      setPaidAmount(estimatedValue > 0 ? toBRLInput(estimatedValue) : '');
      setPaidDate(new Date());
      setPaymentMethod(event.payment_method || 'pix');
      setAckMissingHours(false);
    }
  }, [event, isOpen, estimatedValue]);

  const handleConfirm = async () => {
    if (blockedByHours) {
      appToast.error('Faltam horas neste evento.', { description: 'Lance as horas ou marque "cobrar assim mesmo".' });
      return;
    }
    const rawText = String(paidAmount ?? '').trim();
    const parsedAmount = parseBRL(rawText); // aceita 1.200,50 / 1200,50 / 1.200 / 1200.50
    if (!rawText || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      appToast.error('Informe o valor real recebido em conta.');
      return;
    }

    setLoading(true);
    try {
      const updatePayload = buildMarkPaidUpdate(event, dailyWork, {
        paidAmount: parsedAmount,
        paidDate: format(paidDate, 'yyyy-MM-dd'),
      });
      await updateEvent(event.id, {
        ...updatePayload,
        ...(canStoreMethod ? { payment_method: paymentMethod } : {}),
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
      <DialogContent className="sm:max-w-md max-h-[90dvh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 pr-14">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#ffd400]" />
            Confirmar Recebimento
          </DialogTitle>
        </DialogHeader>

        <div className="bp-modal-scroll px-6 space-y-4">
          <div className="space-y-2 min-w-0">
            <p className="text-sm text-[#a8a8a8]">Evento:</p>
            <EventHeading event={event} client={client} size="sm" />
          </div>

          {hoursMessage && (
            <div className={`p-3 rounded-lg border text-sm space-y-2 ${
              shouldBlockPayment(hoursStatus)
                ? 'border-[#ffd400]/40 bg-[#ffd400]/10 text-[#ffd400]'
                : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#c8c8c8]'
            }`}>
              <p>{hoursMessage}</p>
              {shouldBlockPayment(hoursStatus) && (
                <label className="flex items-center gap-2 text-[#ffd400]">
                  <input
                    type="checkbox"
                    checked={ackMissingHours}
                    onChange={(e) => setAckMissingHours(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Cobrar assim mesmo
                </label>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paid_amount">
              Valor Real Recebido em Conta (R$)
            </Label>
            <p className="text-xs text-[#a8a8a8]">
              Preenchido com o valor total do evento. Se o valor depositado pelo cliente foi diferente, ajuste aqui.
            </p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a8a8]" />
              <Input
                id="paid_amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
          </div>

          {canStoreMethod && (
          <div className="space-y-2">
            <Label>Forma de recebimento</Label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`h-9 text-xs font-extrabold px-3.5 rounded-full border transition-colors ${
                    paymentMethod === m.value
                      ? 'border-[#ffd400] bg-[#ffd400] text-[#0a0a0a]'
                      : 'border-[#333333] bg-transparent text-[#c8c8c8] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="space-y-2">
            <Label>Data do Recebimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-[#1f1f1f] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paidDate ? format(paidDate, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1f1f1f] border-[#2a2a2a]">
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

        <DialogFooter className="gap-2 px-6 py-4 border-t border-[#2a2a2a] flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="bg-[#1f1f1f] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || blockedByHours}
          >
            {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
