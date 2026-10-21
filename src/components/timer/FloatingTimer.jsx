import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimer, stopTimer, getElapsedMs, formatElapsed, elapsedToHours } from '@/lib/timerStore';
import { useDailyWork } from '@/lib/useDailyWork';
import appToast from '@/lib/appToast';
import { format } from 'date-fns';
import { LITE_MOTION } from '@/lib/liteMotion';
import { supabase } from '@/lib/supabase';
import { computeWorkDay, defaultDayChoice, elapsedMsToMinutes, REGIME_POR_DIA_ATIVO } from '@/lib/workDay';

export function FloatingTimer() {
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
      const startedAt = new Date(timer.startedAt || Date.now() - ms);
      const endedAt = new Date();
      const durationMinutes = elapsedMsToMinutes(ms);
      // Data do turno = dia em que o cronômetro foi iniciado (turno pode virar a meia-noite).
      const workDate = format(startedAt, 'yyyy-MM-dd');
      const entry = format(startedAt, 'HH:mm');
      const exit = format(endedAt, 'HH:mm');

      // Regra única de horas e cachê (src/lib/workDay.js) — mesma do Modo Palco / DailyWorkModal.
      let event = null;
      if (timer.eventId) {
        const { data, error } = await supabase.from('events').select('*').eq('id', timer.eventId).maybeSingle();
        if (error) throw error;
        event = data;
      }
      const choice = event ? defaultDayChoice(event, null) : null;
      const day = computeWorkDay({
        event: event || {},
        entry,
        exit,
        durationMinutes,
        ...(REGIME_POR_DIA_ATIVO && choice ? { regime: choice.regime, horaExtra: choice.horaExtra } : {}),
      });
      const hours = day.totalHours ?? elapsedToHours(ms);

      await createWork({
        event_id: timer.eventId,
        date: workDate,
        entry_time: entry,
        exit_time: exit,
        total_hours: hours,
        ...(event ? { overtime_hours: day.overtimeHours, daily_cache: day.cache } : {}),
        ...(event && REGIME_POR_DIA_ATIVO && choice
          ? { regime: choice.regime, hora_extra: Boolean(choice.horaExtra), origem: 'lancada' }
          : {}),
        notes: `Registrado via Timer — ${formatElapsed(ms)} de trabalho`,
      });

      stopTimer();
      setConfirming(false);
      appToast.success('Horas registradas!', {
        description: event
          ? `${hours}h · cachê do dia ${Number(day.cache || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em "${timer.eventTitle}".`
          : `${hours}h registradas.`,
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
        style={{ x: '-50%' }}
        className="fixed bottom-20 left-1/2 z-[85] w-[calc(100%-2rem)] max-w-sm"
      >
        {!confirming ? (
          /* Pílula ativa (visual All Access) */
          <div className="flex items-center gap-2.5 bg-[#0a0a0a] rounded-[26px] pl-3 pr-2 py-2 border-2 border-[#ff2e88] shadow-[0_8px_24px_rgba(0,0,0,0.6)] text-white">
            <span className={`w-3 h-3 rounded-full bg-[#ff2e88] shrink-0 ${LITE_MOTION ? '' : 'animate-pulse'}`} />
            <div className="flex-1 min-w-0">
              <div className="font-poster text-[22px] leading-none tabular-nums">{formatElapsed(elapsed)}</div>
              <div className="font-tag text-[9px] text-[#a8a8a8] truncate uppercase">
                {timer.eventTitle} · em andamento
              </div>
            </div>
            <button
              type="button"
              onClick={handleStop}
              className="shrink-0 h-10 px-4 rounded-full bg-[#ff2e88] text-[#0a0a0a] text-xs font-extrabold active:scale-95 transition-transform"
              title="Parar timer"
              aria-label="Parar timer"
            >
              Bater saída
            </button>
          </div>
        ) : (
          /* Confirmação */
          <div className="bg-[#161616] border-2 border-[#ff2e88] rounded-[18px] p-3 flex flex-col gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] text-white">
            <div className="flex justify-between font-tag text-[10px] text-[#a8a8a8]">
              <span>PARAR TIMER?</span>
              <button type="button" onClick={handleCancel} className="text-[#a8a8a8]" aria-label="Voltar">✕</button>
            </div>
            <div>
              <div className="font-poster text-[28px] leading-none tabular-nums">
                {formatElapsed(elapsed)} <span className="font-sans text-sm font-extrabold text-[#ffd400]">→ {elapsedToHours(elapsed)}h</span>
              </div>
              <div className="text-xs text-[#c8c8c8] mt-0.5 truncate">&quot;{timer.eventTitle}&quot;</div>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 h-10 rounded-full border border-[#333333] bg-transparent text-white text-xs font-extrabold"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 h-10 rounded-full bg-[#ff2e88] text-[#0a0a0a] text-xs font-extrabold disabled:opacity-60"
              >
                {saving ? 'Salvando…' : 'Salvar horas'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
