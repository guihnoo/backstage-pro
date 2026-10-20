import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Loader2, Timer, Zap } from 'lucide-react';
import appToast from '@/lib/appToast';
import { getTimer, getElapsedMs, formatElapsed } from '@/lib/timerStore';
import { computeWorkDay, addMinutesToClock, isSameEntryExit, elapsedMsToMinutes, REGIME_POR_DIA_ATIVO, defaultDayChoice } from '@/lib/workDay';
import DayChoicePicker from '@/components/hours/DayChoicePicker';
import { normalizeDateString, formatDisplayDate } from '@/components/utils/dateUtils';
import { useDailyWork } from '@/lib/useDailyWork';
import { useAuth } from '@/lib/authContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useClients } from '@/lib/useClients';
import { resolveMealPolicy } from '@/lib/mealPolicy';
import { parseBRL, toBRLInput } from '@/lib/money';

const emptyState = {
  date: '',
  entry_time: '',
  exit_time: '',
  notes: '',
  next_day: false,
  duration_min: null, // duração real vinda do cronômetro (permite 24 h ou mais)
  regime: 'cheia',
  hora_extra: true,
  meal: '',
};

export default function DailyWorkModal({ isOpen, onClose, date, event, existingWork, onSuccess }) {
  const { user } = useAuth();
  const { create: createDailyWork, update: updateDailyWork } = useDailyWork();
  const { primaryHex } = useCategoryTheme();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { clients } = useClients();
  const mealClient = (clients || []).find((c) => c.id === event?.client_id) || null;
  const mealPolicy = resolveMealPolicy(event, mealClient);

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
        meal: Number(existingWork.meal_allowance) > 0 ? toBRLInput(existingWork.meal_allowance) : '',
        next_day: isSameEntryExit(existingWork.entry_time, existingWork.exit_time)
          && Number(existingWork.hours_worked ?? existingWork.total_hours) >= 24,
        duration_min: null,
        regime: defaultDayChoice(event, existingWork).regime,
        hora_extra: defaultDayChoice(event, existingWork).horaExtra,
      });
      return;
    }

    setFormData({
      date: normalizeDateString(date || event?.start_date || new Date()),
      entry_time: event?.start_time || '',
      exit_time: event?.end_time || '',
      notes: '',
      meal: '',
      next_day: false,
      duration_min: null,
      regime: defaultDayChoice(event).regime,
      hora_extra: defaultDayChoice(event).horaExtra,
    });
  }, [isOpen, existingWork, date, event]);

  // Regra única de horas e cachê (src/lib/workDay.js)
  const summary = useMemo(() => {
    const day = computeWorkDay({
      event,
      entry: formData.entry_time,
      exit: formData.exit_time,
      nextDay: formData.next_day,
      durationMinutes: formData.duration_min,
      // Lote 2: a escolha do dia só vale com a migration 035 aplicada.
      ...(REGIME_POR_DIA_ATIVO ? { regime: formData.regime, horaExtra: formData.hora_extra } : {}),
    });
    return { ...day, total: day.totalHours, overtime: day.overtimeHours };
  }, [formData.entry_time, formData.exit_time, formData.next_day, formData.duration_min, formData.regime, formData.hora_extra, event]);

  const sameEntryExit = isSameEntryExit(formData.entry_time, formData.exit_time) && formData.duration_min == null;

  const setField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // horário digitado à mão substitui a duração do cronômetro
      ...(field === 'entry_time' || field === 'exit_time' ? { duration_min: null } : {}),
    }));
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

    if (summary.needsNextDayAnswer) {
      appToast.error('Entrada e saída iguais. Se foram 24 horas, marque "Terminou no dia seguinte".');
      return;
    }

    if (summary.minutes <= 0) {
      appToast.error('Confira os horários de entrada e saída.');
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
        // Alimentacao so quando o cliente reembolsa; vazio = valor padrao do cliente.
        ...(mealPolicy === 'reembolso'
          ? { meal_allowance: Math.max(0, Number.isFinite(parseBRL(formData.meal)) ? parseBRL(formData.meal) : Number(mealClient?.meal_daily_value) || 0) }
          : {}),
        ...(REGIME_POR_DIA_ATIVO
          ? { regime: formData.regime, hora_extra: Boolean(formData.hora_extra), origem: 'lancada' }
          : {}),
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
                      // Duração real do cronômetro, em minutos, sem cortar em 24 h (auditoria 1A).
                      const minutes = elapsedMsToMinutes(timerElapsed);
                      const startedAt = new Date(timerForThisEvent.startedAt);
                      const entry = formData.entry_time
                        || `${String(startedAt.getHours()).padStart(2, '0')}:${String(startedAt.getMinutes()).padStart(2, '0')}`;
                      setFormData((prev) => ({
                        ...prev,
                        entry_time: entry,
                        exit_time: addMinutesToClock(entry, minutes),
                        duration_min: minutes,
                      }));
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
                          onClick={() => setField('exit_time', addMinutesToClock(formData.entry_time, h * 60))}
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

              {REGIME_POR_DIA_ATIVO && (
                <DayChoicePicker
                  regime={formData.regime}
                  horaExtra={formData.hora_extra}
                  accentColor={primaryHex}
                  onChange={({ regime, horaExtra }) => setFormData((prev) => ({ ...prev, regime, hora_extra: horaExtra }))}
                />
              )}
              {sameEntryExit && (
                <label className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.next_day}
                    onChange={(e) => setFormData((prev) => ({ ...prev, next_day: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Entrada e saída iguais: terminou no dia seguinte (24 h)?
                </label>
              )}
              {formData.duration_min != null && (
                <p className="text-xs text-amber-300 -mt-1">Usando a duração do cronômetro: {summary.total.toFixed(1)} h.</p>
              )}

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

              {mealPolicy === 'reembolso' && (
                <div className="space-y-2">
                  <Label htmlFor="dw-meal">Alimentação do dia (cliente reembolsa)</Label>
                  <Input
                    id="dw-meal"
                    type="text"
                    inputMode="decimal"
                    value={formData.meal}
                    onChange={(e) => setField('meal', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder={Number(mealClient?.meal_daily_value) > 0 ? `Padrão do cliente: ${toBRLInput(mealClient.meal_daily_value)}` : 'Ex: 45,00'}
                  />
                </div>
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
