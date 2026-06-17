import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Loader2, Timer, Zap } from 'lucide-react';
import appToast from '@/lib/appToast';
import { getTimer, getElapsedMs, formatElapsed, elapsedToHours } from '@/lib/timerStore';
import { normalizeDateString, formatDisplayDate } from '@/components/utils/dateUtils';
import { useDailyWork } from '@/lib/useDailyWork';
import { useAuth } from '@/lib/authContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

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
  const { primaryHex } = useCategoryTheme();
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyState);

  // Timer ativo para este evento
  const [activeTimer, setActiveTimer] = useState(() => getTimer());
  useEffect(() => {
    const handler = (e) => setActiveTimer(e.detail);
    window.addEventListener('backstage:timer', handler);
    return () => window.removeEventListener('backstage:timer', handler);
  }, []);
  const timerForThisEvent = activeTimer?.eventId === event?.id ? activeTimer : null;
  const [timerElapsed, setTimerElapsed] = useState(0);
  useEffect(() => {
    if (!timerForThisEvent) { setTimerElapsed(0); return; }
    const tick = () => setTimerElapsed(getElapsedMs(timerForThisEvent));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerForThisEvent]);

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
      appToast.error('Nenhum evento selecionado para registrar horas.');
      return;
    }

    if (!formData.date || !formData.entry_time || !formData.exit_time) {
      appToast.error('Preencha data, entrada e saída.');
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
        appToast.success('Registro atualizado com sucesso.');
      } else {
        await createDailyWork(payload);
        appToast.success('Registro criado com sucesso.');
      }

      onSuccess?.();
      onClose?.(false);
    } catch (error) {
      console.error('Erro ao salvar registro de trabalho:', error);
      appToast.error('Não foi possível salvar o registro de trabalho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-700 text-white p-0 flex flex-col overflow-hidden max-h-[90dvh] bp-focus-scope">
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 border-b border-slate-700 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 bp-text-primary" />
            {existingWork?.id ? 'Editar Registro de Trabalho' : 'Novo Registro de Trabalho'}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
          <ScrollArea fill>
            <div className="space-y-4 p-4 sm:p-6 pb-2">
              <div className="space-y-2">
                <Label htmlFor="dw-date">Data do trabalho</Label>
                <Input
                  id="dw-date"
                  type="date"
                  value={formData.date}
                  min={event?.start_date || undefined}
                  max={normalizeDateString(new Date())}
                  onChange={(e) => setField('date', e.target.value)}
                  className="bg-slate-800 border-slate-700 h-12 text-base"
                />
                {event?.end_date && event.end_date !== event.start_date && (
                  <p className="text-xs bp-text-primary">
                    Evento multi-dia: {formatDisplayDate(event.start_date)} – {formatDisplayDate(event.end_date)}. Você pode registrar qualquer dia do evento.
                  </p>
                )}
                {formData.date && (
                  <p className="text-xs text-slate-400">Registrando para {formatDisplayDate(formData.date)}</p>
                )}
              </div>

              {/* Banner de timer ativo */}
              {timerForThisEvent && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <Timer className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span>Timer ativo: <span className="font-mono font-bold">{formatElapsed(timerElapsed)}</span></span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20 flex-shrink-0"
                    onClick={() => {
                      const hours = elapsedToHours(timerElapsed);
                      const totalMin = Math.round(hours * 60);
                      const h = Math.floor(totalMin / 60);
                      const m = totalMin % 60;
                      const exitH = (parseInt(formData.entry_time?.split(':')[0] || '0', 10) + h) % 24;
                      const exitM = (parseInt(formData.entry_time?.split(':')[1] || '0', 10) + m) % 60;
                      setField('exit_time', `${String(exitH).padStart(2,'0')}:${String(exitM).padStart(2,'0')}`);
                    }}
                  >
                    Usar tempo
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Entrada / Saída</Label>
                  {/* Atalhos rápidos de duração */}
                  {formData.entry_time && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-slate-600" />
                      {[8, 10, 12].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            const [entH, entM] = formData.entry_time.split(':').map(Number);
                            const totalMin = entH * 60 + entM + h * 60;
                            const exitH = Math.floor(totalMin / 60) % 24;
                            const exitM = totalMin % 60;
                            setField('exit_time', `${String(exitH).padStart(2,'0')}:${String(exitM).padStart(2,'0')}`);
                          }}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="time" value={formData.entry_time} onChange={(e) => setField('entry_time', e.target.value)} className="bg-slate-800 border-slate-700 h-12 text-base" aria-label="Horário de entrada" />
                  <Input type="time" value={formData.exit_time} onChange={(e) => setField('exit_time', e.target.value)} className="bg-slate-800 border-slate-700 h-12 text-base" aria-label="Horário de saída" />
                </div>
              </div>

              {summary.total > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-3 text-center border border-slate-700/60 bg-slate-800/40">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Horas</p>
                    <p className="text-lg font-black" style={{ color: primaryHex }}>{summary.total.toFixed(1)}h</p>
                  </div>
                  <div className="rounded-lg p-3 text-center border border-pink-500/25 bg-pink-500/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Extras</p>
                    <p className="text-lg font-black text-pink-400">{summary.overtime.toFixed(1)}h</p>
                  </div>
                  <div className="rounded-lg p-3 text-center border border-emerald-500/25 bg-emerald-500/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cachê</p>
                    <p className="text-base font-black text-emerald-400 leading-tight">
                      {isVisible ? formatCurrency(summary.cache) : '••••'}
                    </p>
                  </div>
                </div>
              )}
              {event?.payment_model && (
                <p className="text-[11px] text-slate-600 -mt-1">
                  Modelo: {event.payment_model === 'MEIO_CACHE_E_DOBRA' ? 'Meio Cache e Dobra' : 'Cachê + Horas Extras'}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="dw-notes">Observações</Label>
                <Textarea id="dw-notes" value={formData.notes} onChange={(e) => setField('notes', e.target.value)} className="bg-slate-800 border-slate-700" placeholder="Detalhes do turno..." rows={3} />
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-3 px-4 py-3 sm:px-6 border-t border-slate-700 flex-shrink-0 pb-safe">
            <Button type="button" variant="outline" onClick={() => onClose?.(false)} disabled={loading} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 text-white h-11 hover:opacity-90"
              style={{ backgroundColor: primaryHex }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
