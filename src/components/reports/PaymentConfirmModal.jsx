import { confetti } from '@/lib/celebrate';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, CheckCircle } from 'lucide-react';
import appToast from '@/lib/appToast';
import { useEvents } from '@/lib/useEvents';
import { buildMarkPaidUpdate } from '@/lib/financeMetrics';
import EventHeading from '@/components/events/EventHeading';
import { getEventHoursStatus, calculateEventReceivableAmount } from '@/lib/eventFinance';
import { buildHoursGateMessage, shouldBlockPayment } from '@/lib/hoursGate';
import { parseBRL } from '@/lib/money';
import { todayLocalISO } from '@/components/utils/dateUtils';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toInput = (v) => Number(v).toFixed(2).replace('.', ',');

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
  const [paidDate, setPaidDate] = useState(''); // yyyy-MM-dd
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [ackMissingHours, setAckMissingHours] = useState(false);

  // Atalhos do valor: o da nota (lida pela IA) e o calculado no app (sem a escolha da nota).
  const notaValue = Number(event?.nfe_analise?.nfe_valor) > 0 ? Math.round(Number(event.nfe_analise.nfe_valor) * 100) / 100 : null;
  const appValue = event ? calculateEventReceivableAmount({ ...event, nfe_analise: null }, dailyWork) : 0;
  // events.payment_method nasce na migration 034; sem a coluna o PostgREST rejeita o update inteiro
  const canStoreMethod = Boolean(event) && 'payment_method' in event;

  // Lote 3: recebimento só com as horas preenchidas, ou com "cobrar assim mesmo".
  const hoursStatus = event ? getEventHoursStatus(event, dailyWork) : null;
  const hoursMessage = buildHoursGateMessage(hoursStatus);
  const blockedByHours = shouldBlockPayment(hoursStatus) && !ackMissingHours;

  // Limpa só quando a janela ABRE (ou troca de trabalho). Antes limpava a cada recarga do
  // trabalho (ex.: sincronização com o Google logo após salvar) e apagava o valor digitado,
  // deixando o "Confirmar Pagamento" travado.
  const openedFor = useRef(null);
  useEffect(() => {
    if (!isOpen) { openedFor.current = null; return; }
    if (!event || openedFor.current === event.id) return;
    openedFor.current = event.id;
    setPaidAmount('');
    setPaidDate('');
    setPaymentMethod(event.payment_method || 'pix');
    setAckMissingHours(false);
  }, [event, isOpen]);

  const handleConfirm = async () => {
    if (blockedByHours) {
      appToast.error('Faltam horas neste evento.', { description: 'Lance as horas ou marque "cobrar assim mesmo".' });
      return;
    }
    const rawText = String(paidAmount ?? '').trim();
    const parsedAmount = parseBRL(rawText); // aceita 1.200,50 / 1200,50 / 1.200 / 1200.50
    if (!rawText || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      appToast.error('Informe o valor real recebido em conta.');
      return;
    }

    if (!paidDate || paidDate > todayLocalISO()) {
      appToast.error('Selecione o dia em que o dinheiro entrou na sua conta.'); return;
    }
    setLoading(true);
    try {
      const updatePayload = buildMarkPaidUpdate(event, dailyWork, {
        paidAmount: parsedAmount,
        paidDate,
      });
      await updateEvent(event.id, {
        ...updatePayload,
        ...(canStoreMethod ? { payment_method: paymentMethod } : {}),
      });

      appToast.success('Pagamento confirmado com sucesso!');
      confetti();
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      appToast.error('Erro ao confirmar pagamento.', { description: error?.message || 'Tente novamente.' });
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
                <label className="flex items-center gap-2 min-h-[44px] text-[#ffd400]">
                  <input
                    type="checkbox"
                    checked={ackMissingHours}
                    onChange={(e) => setAckMissingHours(e.target.checked)}
                    className="w-6 h-6"
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
              Digite o valor que entrou na sua conta. O cálculo do evento é apenas uma referência e não confirma o depósito.
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
            <div className="grid grid-cols-2 gap-2" data-testid="pagamento-atalhos">
              {notaValue != null && (
                <button type="button" onClick={() => setPaidAmount(toInput(notaValue))}
                  className="min-h-[44px] rounded-lg border border-[#333333] bg-[#161616] px-2 py-1.5 text-left active:bg-[#222]">
                  <span className="block text-[11px] text-[#a8a8a8]">Valor da nota</span>
                  <span className="block text-sm font-bold text-white">{formatCurrency(notaValue)}</span>
                </button>
              )}
              {appValue > 0 && (
                <button type="button" onClick={() => setPaidAmount(toInput(appValue))}
                  className="min-h-[44px] rounded-lg border border-[#333333] bg-[#161616] px-2 py-1.5 text-left active:bg-[#222]">
                  <span className="block text-[11px] text-[#a8a8a8]">Valor do app</span>
                  <span className="block text-sm font-bold text-white">{formatCurrency(appValue)}</span>
                </button>
              )}
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
            <Label htmlFor="paid_date">Data do Recebimento</Label>
            <p className="text-xs text-[#a8a8a8]">Escolha o dia do depósito, mesmo que esteja registrando depois.</p>
            <div className="flex gap-2">
              <Input
                id="paid_date"
                type="date"
                max={todayLocalISO()}
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="flex-1 min-w-0 h-11 [color-scheme:dark]"
              />
              <button type="button" onClick={() => setPaidDate(todayLocalISO())}
                className={`h-11 shrink-0 px-3.5 rounded-lg text-xs font-extrabold border ${paidDate === todayLocalISO() ? 'bg-[#ffd400] border-[#ffd400] text-[#0a0a0a]' : 'border-[#ffd400]/50 text-[#ffd400]'}`}>
                Recebi hoje
              </button>
            </div>
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
            disabled={loading || blockedByHours || !String(paidAmount).trim() || !paidDate}
          >
            {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
