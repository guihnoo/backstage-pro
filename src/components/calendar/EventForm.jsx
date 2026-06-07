import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { normalizeDateString } from '@/components/utils/dateUtils';
import { useEvents } from '@/lib/useEvents';

const PAYMENT_MODELS = [
  { value: 'HORAS_EXTRAS', label: 'Horas Extras' },
  { value: 'MEIO_CACHE_E_DOBRA', label: 'Meio Cache e Dobra' },
];

const defaultState = {
  client_id: '',
  title: '',
  start_date: '',
  end_date: '',
  start_time: '09:00',
  end_time: '18:00',
  payment_due_date: '',
  payment_status: 'unpaid',
  payment_model: 'HORAS_EXTRAS',
  daily_cache_value: '',
  cache_valor_base: '',
  color: '#22d3ee',
  observacoes_md: '',
};

export default function EventForm({
  isOpen = false,
  onClose,
  event,
  clients = [],
  prefillData,
  initialData,
  onSuccess,
}) {
  const navigate = useNavigate();
  const { create: createEvent, update: updateEvent } = useEvents();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(defaultState);

  useEffect(() => {
    if (!isOpen) return;

    const seed = event || prefillData || initialData || {};
    setFormData({
      ...defaultState,
      client_id: seed.client_id || '',
      title: seed.title || '',
      start_date: seed.start_date ? normalizeDateString(seed.start_date) : '',
      end_date: seed.end_date ? normalizeDateString(seed.end_date) : '',
      start_time: seed.start_time || '09:00',
      end_time: seed.end_time || '18:00',
      payment_due_date: seed.payment_due_date ? normalizeDateString(seed.payment_due_date) : '',
      payment_status: seed.payment_status || 'unpaid',
      payment_model: seed.payment_model || 'HORAS_EXTRAS',
      daily_cache_value: seed.daily_cache_value ?? '',
      cache_valor_base: seed.cache_valor_base ?? '',
      color: seed.color || '#22d3ee',
      observacoes_md: seed.observacoes_md || '',
    });
  }, [isOpen, event, prefillData, initialData]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_id || !formData.title || !formData.start_date) {
      toast.error('Preencha cliente, titulo e data inicial.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        client_id: formData.client_id,
        title: formData.title.trim(),
        start_date: normalizeDateString(formData.start_date),
        end_date: formData.end_date ? normalizeDateString(formData.end_date) : normalizeDateString(formData.start_date),
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        payment_due_date: formData.payment_due_date ? normalizeDateString(formData.payment_due_date) : null,
        payment_status: formData.payment_status || 'pending',
        status: 'pending',
        payment_model: formData.payment_model || 'HORAS_EXTRAS',
        daily_cache_value: formData.daily_cache_value === '' ? 0 : Number(formData.daily_cache_value),
        cache_valor_base: formData.cache_valor_base === '' ? null : Number(formData.cache_valor_base),
        color: formData.color || '#22d3ee',
        observacoes_md: formData.observacoes_md || null,
      };

      if (event?.id) {
        await updateEvent(event.id, payload);
        toast.success('Evento atualizado com sucesso.');
      } else {
        await createEvent(payload);
        toast.success('Evento criado com sucesso.');
      }

      onSuccess?.();
      onClose?.(false);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Nao foi possivel salvar o evento.', {
        description: error?.message || 'Verifique cliente, datas e conexao.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Cliente</Label>
            {clients.length === 0 ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                <p className="text-sm text-amber-100">
                  Cadastre um cliente antes de criar um evento na agenda.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
                  onClick={() => {
                    onClose?.(false);
                    navigate('/clients?action=new-client');
                  }}
                >
                  Cadastrar primeiro cliente
                </Button>
              </div>
            ) : (
              <Select value={formData.client_id} onValueChange={(value) => setField('client_id', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input value={formData.title} onChange={(e) => setField('title', e.target.value)} className="bg-slate-800 border-slate-700" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setField('start_date', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setField('end_date', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horario inicial</Label>
              <Input type="time" value={formData.start_time} onChange={(e) => setField('start_time', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Horario final</Label>
              <Input type="time" value={formData.end_time} onChange={(e) => setField('end_time', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cachê diario</Label>
              <Input type="number" step="0.01" min="0" value={formData.daily_cache_value} onChange={(e) => setField('daily_cache_value', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Modelo de pagamento</Label>
              <Select value={formData.payment_model} onValueChange={(value) => setField('payment_model', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PAYMENT_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea value={formData.observacoes_md} onChange={(e) => setField('observacoes_md', e.target.value)} className="bg-slate-800 border-slate-700" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose?.(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : event?.id ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
