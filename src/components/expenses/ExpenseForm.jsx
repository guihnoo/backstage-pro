import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeDateString } from '@/components/utils/dateUtils';
import { useExpenses } from '@/lib/useExpenses';

const CATEGORIES = [
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentacao' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'combustivel', label: 'Combustivel' },
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'outros', label: 'Outros' },
];

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartao de credito' },
  { value: 'cartao_debito', label: 'Cartao de debito' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'outros', label: 'Outros' },
];

const defaultState = {
  event_id: '',
  title: '',
  amount: '',
  category: 'outros',
  payment_method: 'cartao_debito',
  date: normalizeDateString(new Date()),
  description: '',
  notes: '',
  receipt_url: '',
};

export default function ExpenseForm({
  open = false,
  onOpenChange,
  expense,
  events = [],
  onSuccess,
  prefillData,
  prefillEventId,
  initialEventId,
}) {
  const { create: createExpense, update: updateExpense } = useExpenses();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(defaultState);

  const initialEvent = useMemo(() => prefillEventId || initialEventId || '', [prefillEventId, initialEventId]);

  useEffect(() => {
    if (!open) return;

    const seed = expense || prefillData || {};

    setFormData({
      ...defaultState,
      event_id: seed.event_id || initialEvent,
      title: seed.title || '',
      amount: seed.amount ?? '',
      category: seed.category || 'outros',
      payment_method: seed.payment_method || 'cartao_debito',
      date: normalizeDateString(seed.expense_date || seed.date || new Date()),
      description: seed.description || '',
      notes: seed.notes || '',
      receipt_url: seed.receipt_url || '',
    });
  }, [open, expense, prefillData, initialEvent]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.date) {
      toast.error('Preencha titulo, valor e data da despesa.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        event_id: formData.event_id || null,
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category || 'outros',
        payment_method: formData.payment_method || null,
        expense_date: normalizeDateString(formData.date),
        description: formData.description || null,
        notes: formData.notes || null,
        receipt_url: formData.receipt_url || null,
      };

      if (expense?.id) {
        await updateExpense(expense.id, payload);
        toast.success('Despesa atualizada com sucesso.');
      } else {
        await createExpense(payload);
        toast.success('Despesa criada com sucesso.');
      }

      onSuccess?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast.error('Nao foi possivel salvar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{expense?.id ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input value={formData.title} onChange={(e) => setField('title', e.target.value)} className="bg-slate-800 border-slate-700" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setField('amount', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={formData.date} onChange={(e) => setField('date', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setField('category', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setField('payment_method', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Evento (opcional)</Label>
            <Select value={formData.event_id || ''} onValueChange={(value) => setField('event_id', value)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Sem vinculo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>
                    {evt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea value={formData.description} onChange={(e) => setField('description', e.target.value)} className="bg-slate-800 border-slate-700" />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={formData.notes} onChange={(e) => setField('notes', e.target.value)} className="bg-slate-800 border-slate-700" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
