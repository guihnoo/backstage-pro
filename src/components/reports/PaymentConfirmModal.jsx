import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Event } from '@/api/entities';
import { toast } from 'sonner';

export default function PaymentConfirmModal({ event, isOpen, onClose, onSuccess }) {
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      // Preencher com o valor calculado do evento se disponível
      const estimatedValue = event.paid_amount || event.calculatedValue || 0;
      setPaidAmount(estimatedValue.toString());
      setPaidDate(new Date());
    }
  }, [event, isOpen]);

  const handleConfirm = async () => {
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
      toast.error('Informe um valor válido para o pagamento.');
      return;
    }

    setLoading(true);
    try {
      await Event.update(event.id, {
        payment_status: 'paid',
        paid_amount: parseFloat(paidAmount),
        paid_date: format(paidDate, 'yyyy-MM-dd')
      });

      toast.success('Pagamento confirmado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Confirmar Recebimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Evento:</p>
            <p className="font-semibold text-white">{event.title}</p>
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

        <DialogFooter className="gap-2">
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