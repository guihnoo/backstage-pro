import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, ImagePlus, Loader2, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import appToast from '@/lib/appToast';

import { normalizeDateString } from '@/components/utils/dateUtils';
import { useExpenses } from '@/lib/useExpenses';
import { UploadFile } from '@/api/integrations';
import { analyzeReceipt } from '@/lib/analyzeReceiptApi';

function fileToCompressedDataUrl(file, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / (img.width || maxWidth));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round((img.width || maxWidth) * scale);
          canvas.height = Math.round((img.height || maxWidth) * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(String(reader.result || ''));
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

const CATEGORIES = [
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'outros', label: 'Outros' },
];

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'cartao_debito', label: 'Cartão de débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
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
  is_reimbursable: false,
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
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
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
      is_reimbursable: seed.is_reimbursable ?? Boolean(initialEvent),
    });
  }, [open, expense, prefillData, initialEvent]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReceiptSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    let savedUrl = '';
    try {
      const res = await UploadFile({ file, folder: 'receipts' });
      savedUrl = res?.file_url || '';
    } catch {
      // Fallback local para imagem comprimida em Data URL (funciona offline e no PDF)
      try {
        savedUrl = await fileToCompressedDataUrl(file);
      } catch {
        appToast.error('Não foi possível anexar o comprovante.');
      }
    } finally {
      setUploadingReceipt(false);
    }

    if (!savedUrl) return;
    setField('receipt_url', savedUrl);
    appToast.success('Comprovante anexado!');

    if (savedUrl.startsWith('http') && (!formData.title || !formData.amount)) {
      setAnalyzingReceipt(true);
      try {
        const extracted = await analyzeReceipt(savedUrl);
        setFormData((prev) => ({
          ...prev,
          title: prev.title || extracted.title || '',
          amount: prev.amount || (extracted.amount > 0 ? String(extracted.amount) : ''),
          date: extracted.date || prev.date,
          category: extracted.category || prev.category,
          notes: prev.notes || extracted.notes || '',
        }));
        appToast.success('Dados do recibo preenchidos pela IA!');
      } catch {
        // Silencioso caso OCR não esteja configurado
      } finally {
        setAnalyzingReceipt(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.date) {
      appToast.error('Preencha título, valor e data da despesa.');
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
        is_reimbursable: formData.is_reimbursable,
      };

      if (expense?.id) {
        await updateExpense(expense.id, payload);
        appToast.success('Despesa atualizada com sucesso.');
      } else {
        await createExpense(payload);
        appToast.success('Despesa criada com sucesso.');
      }

      onSuccess?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      appToast.error('Não foi possível salvar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white p-0 flex flex-col overflow-hidden max-h-[90dvh] bp-focus-scope">
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-slate-700 flex-shrink-0">
          <DialogTitle>{expense?.id ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
          <ScrollArea fill>
            <div className="space-y-4 p-4 sm:p-6 pb-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={formData.title} onChange={(e) => setField('title', e.target.value)} className="bg-slate-800 border-slate-700 h-12 text-base" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setField('amount', e.target.value)} className="bg-slate-800 border-slate-700 h-12 text-base" />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setField('date', e.target.value)} className="bg-slate-800 border-slate-700 h-12 text-base" />
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
                  <SelectTrigger className="bg-slate-800 border-slate-700 min-w-0 truncate">
                    <SelectValue placeholder="Sem vínculo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-w-[min(100vw-2rem,24rem)]">
                    {events.map((evt) => (
                      <SelectItem key={evt.id} value={evt.id} title={evt.title}>
                        <span className="truncate block">{evt.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="button"
                onClick={() => setField('is_reimbursable', !formData.is_reimbursable)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  formData.is_reimbursable
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${formData.is_reimbursable ? 'bg-amber-500' : 'bg-slate-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formData.is_reimbursable ? 'left-4' : 'left-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Reembolsável pelo contratante</p>
                  <p className="text-xs opacity-70">Será incluído no PDF de Fechamento e na cobrança via WhatsApp</p>
                </div>
                <RefreshCw className={`w-4 h-4 ml-auto flex-shrink-0 ${formData.is_reimbursable ? 'text-amber-400' : 'text-slate-600'}`} />
              </button>

              <div className="space-y-2 rounded-xl border border-slate-700/80 bg-slate-800/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Comprovante / Recibo (opcional)</p>
                    <p className="text-[11px] text-slate-400">
                      Anexe foto do Uber, alimentação ou pedágio para sair no PDF de Fechamento
                    </p>
                  </div>
                  {analyzingReceipt && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Lendo IA...
                    </span>
                  )}
                </div>

                {formData.receipt_url ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={formData.receipt_url}
                        alt="Comprovante"
                        className="w-11 h-11 rounded-md object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-300 truncate">Comprovante anexado</p>
                        <p className="text-[11px] text-slate-400 truncate">Incluído automaticamente no Fechamento</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setField('receipt_url', '')}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        disabled={uploadingReceipt || analyzingReceipt}
                        onChange={handleReceiptSelect}
                      />
                      <span className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors">
                        {uploadingReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-amber-400" />}
                        Tirar Foto
                      </span>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingReceipt || analyzingReceipt}
                        onChange={handleReceiptSelect}
                      />
                      <span className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors">
                        {uploadingReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 text-sky-400" />}
                        Galeria / Arquivo
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={formData.description} onChange={(e) => setField('description', e.target.value)} className="bg-slate-800 border-slate-700" />
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={formData.notes} onChange={(e) => setField('notes', e.target.value)} className="bg-slate-800 border-slate-700" />
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-3 px-4 py-3 sm:px-6 border-t border-slate-700 flex-shrink-0 pb-safe">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
