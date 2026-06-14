import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, Clock, X } from 'lucide-react';
import { getTimer, stopTimer, getElapsedMs, formatElapsed, elapsedToHours } from '@/lib/timerStore';
import { useDailyWork } from '@/lib/useDailyWork';
import appToast from '@/lib/appToast';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { format } from 'date-fns';

export function FloatingTimer() {
  const { primaryHex } = useCategoryTheme();
  const [timer, setTimer] = useState(() => getTimer());
  const [elapsed, setElapsed] = useState(() => getElapsedMs(getTimer()));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);
  const { create: createWork } = useDailyWork();

  // Sync com localStorage e outros tabs
  useEffect(() => {
    const onTimer = (e) => {
      setTimer(e.detail);
      setElapsed(getElapsedMs(e.detail));
    };
    window.addEventListener('backstage:timer', onTimer);
    return () => window.removeEventListener('backstage:timer', onTimer);
  }, []);

  // Tick
  useEffect(() => {
    if (!timer) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed(getElapsedMs(timer));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timer]);

  const handleStop = () => setConfirming(true);
  const handleCancel = () => setConfirming(false);

  const handleConfirm = async () => {
    if (!timer || saving) return;
    setSaving(true);
    try {
      const ms = getElapsedMs(timer);
      const hours = elapsedToHours(ms);
      const today = format(new Date(), 'yyyy-MM-dd');

      await createWork({
        event_id: timer.eventId,
        date: today,
        total_hours: hours,
        notes: `Registrado via Timer — ${formatElapsed(ms)} de trabalho`,
      });

      stopTimer();
      setConfirming(false);
      appToast.success('Horas registradas!', {
        description: `${hours}h adicionadas ao evento "${timer.eventTitle}".`,
      });
    } catch (err) {
      appToast.error('Erro ao salvar horas', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    stopTimer();
    setConfirming(false);
  };

  if (!timer) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="floating-timer"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[85] w-[calc(100%-2rem)] max-w-sm"
      >
        {!confirming ? (
          /* Pill ativa */
          <div
            className="flex items-center gap-3 bg-slate-900 rounded-2xl px-4 py-3 shadow-xl shadow-black/40"
            style={{ border: `1px solid ${primaryHex}66` }}
          >
            {/* Indicador pulsante */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: primaryHex }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: primaryHex }}
              />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-none mb-0.5">Em andamento</p>
              <p className="text-sm text-white font-medium truncate">{timer.eventTitle}</p>
            </div>

            {/* Cronômetro */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5" style={{ color: primaryHex }} />
              <span className="text-lg font-mono font-bold tabular-nums" style={{ color: primaryHex }}>
                {formatElapsed(elapsed)}
              </span>
            </div>

            {/* Parar */}
            <button
              onClick={handleStop}
              className="shrink-0 p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors"
              title="Parar timer"
            >
              <Square className="w-4 h-4 text-red-400 fill-red-400" />
            </button>
          </div>
        ) : (
          /* Confirmação */
          <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-4 shadow-xl shadow-black/40 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">Parar timer?</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tempo registrado: <span className="font-mono font-bold" style={{ color: primaryHex }}>{formatElapsed(elapsed)}</span>
                  {' '}→ <span className="text-white font-semibold">{elapsedToHours(elapsed)}h</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">"{timer.eventTitle}"</p>
              </div>
              <button onClick={handleCancel} className="text-slate-500 hover:text-slate-300 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="flex-1 text-xs py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 text-xs py-2 rounded-xl text-white font-semibold disabled:opacity-60 transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryHex }}
              >
                {saving ? 'Salvando…' : 'Salvar Horas'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
