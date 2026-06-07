import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeDateString, formatDisplayDate } from '@/components/utils/dateUtils';
import { useDailyWork } from '@/lib/useDailyWork';
import { useAuth } from '@/lib/authContext';

const emptyState = {
  date: '',
  entry_time: '',
  exit_time: '',
  notes: '',
};

const calculateHours = (entry, exit) => {
  if (!entry || !exit) return { total: 0, overtime: 0 };

  const [entryH, entryM] = entry.split(':').map(Number);
  const [exitH, exitM] = exit.split(':').map(Number);
  let entryMinutes = entryH * 60 + entryM;
  let exitMinutes = exitH * 60 + exitM;

  if (exitMinutes < entryMinutes) exitMinutes += 24 * 60;

  const total = (exitMinutes - entryMinutes) / 60;
  const overtime = Math.max(0, total - 12);

  return {
    total: Math.round(total * 10) / 10,
    overtime: Math.round(overtime * 10) / 10,
  };
};

const calculateCache = (event, totalHours, overtimeHours) => {
  if (!event) return 0;

  const baseValue = Number(event.daily_cache_value || 0);
  const paymentModel = event.payment_model || 'HORAS_EXTRAS';

  if (paymentModel === 'MEIO_CACHE_E_DOBRA') {
    const base = Number(event.cache_valor_base || baseValue);
    if (totalHours <= 6) return Math.round((base / 2) * 100) / 100;
    if (totalHours <= 12) return Math.round(baseValue * 100) / 100;
    return Math.round(base * 2 * 100) / 100;
  }

  const overtimeRate = baseValue / 12;
  return Math.round((baseValue + overtimeHours * overtimeRate) * 100) / 100;
};

export default function DailyWorkModal({ isOpen, onClose, date, event, existingWork, onSuccess }) {
  const { user } = useAuth();
  const { create: createDailyWork, update: updateDailyWork } = useDailyWork();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyState);

  useEffect(() => {
    if (!isOpen) return;

    if (existingWork?.id) {
      setFormData({
        date: normalizeDateString(existingWork.work_date || existingWork.date || new Date()),
        entry_time: existingWork.entry_time || '',
        exit_time: existingWork.exit_time || '',
        notes: existingWork.description || existingWork.notes || '',
      });
      return;
    }

    setFormData({
      date: normalizeDateString(date || event?.start_date || new Date()),
      entry_time: event?.start_time || '',
      exit_time: event?.end_time || '',
      notes: '',
    });
  }, [isOpen, existingWork, date, event]);

  const summary = useMemo(() => {
    const worked = calculateHours(formData.entry_time, formData.exit_time);
    return {
      ...worked,
      cache: calculateCache(event, worked.total, worked.overtime),
    };
  }, [formData.entry_time, formData.exit_time, event]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!event?.id) {
      toast.error('Nenhum evento selecionado para registrar horas.');
      return;
    }

    if (!formData.date || !formData.entry_time || !formData.exit_time) {
      toast.error('Preencha data, entrada e saida.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: user?.id,
        event_id: event.id,
        work_date: normalizeDateString(formData.date),
        hours_worked: summary.total,
        status: 'completed',
        entry_time: formData.entry_time,
        exit_time: formData.exit_time,
        overtime_hours: summary.overtime,
        daily_cache: summary.cache,
        description: formData.notes || null,
      };

      if (existingWork?.id) {
        await updateDailyWork(existingWork.id, payload);
        toast.success('Registro atualizado com sucesso.');
      } else {
        await createDailyWork(payload);
        toast.success('Registro criado com sucesso.');
      }

      onSuccess?.();
      onClose?.(false);
    } catch (error) {
      console.error('Erro ao salvar registro de trabalho:', error);
      toast.error('Nao foi possivel salvar o registro de trabalho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            {existingWork?.id ? 'Editar Registro de Trabalho' : 'Novo Registro de Trabalho'}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Data do trabalho</Label>
            <Input type="date" value={formData.date} onChange={(e) => setField('date', e.target.value)} className="bg-slate-800 border-slate-700" />
            <p className="text-xs text-slate-400">{formData.date ? `Trabalho em ${formatDisplayDate(formData.date)}` : 'Selecione a data'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input type="time" value={formData.entry_time} onChange={(e) => setField('entry_time', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Saida</Label>
              <Input type="time" value={formData.exit_time} onChange={(e) => setField('exit_time', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>

          {summary.total > 0 && (
            <Alert className="bg-cyan-900/20 border-cyan-700/40">
              <Info className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-cyan-200 text-sm">
                Total: <strong>{summary.total.toFixed(1)}h</strong> | Extras: <strong>{summary.overtime.toFixed(1)}h</strong> | Cachê estimado: <strong>R$ {summary.cache.toFixed(2)}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea value={formData.notes} onChange={(e) => setField('notes', e.target.value)} className="bg-slate-800 border-slate-700" placeholder="Detalhes do turno..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose?.(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
