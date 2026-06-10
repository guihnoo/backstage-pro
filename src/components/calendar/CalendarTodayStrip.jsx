import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, ChevronRight, Radio, Plus } from 'lucide-react';
import {
  todayLocalISO,
  getEventsForDate,
  normalizeDateString,
} from '@/components/utils/dateUtils';
import { isCancelledEvent } from '@/lib/eventFinance';
import { NeonGlass } from '@/components/design/NeonGlass';

function getTodayWorkForEvent(dailyWork, eventId, today) {
  return dailyWork.find(
    (w) => w.event_id === eventId && normalizeDateString(w.date) === today
  );
}

export default function CalendarTodayStrip({
  events = [],
  dailyWork = [],
  primaryHex = '#A64AFF',
  accentHex = '#FFB700',
  onEventClick,
  onRegisterWork,
  onNewEvent,
}) {
  const today = todayLocalISO();
  const todayEvents = getEventsForDate(events, today).filter((e) => !isCancelledEvent(e));

  const liveEvent = todayEvents.find((event) => {
    const work = getTodayWorkForEvent(dailyWork, event.id, today);
    return work?.entry_time && !work?.exit_time;
  });

  if (todayEvents.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <NeonGlass primary={primaryHex} className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#7c8494]">Hoje</p>
            <p className="text-sm text-slate-300 mt-0.5">Nenhum show agendado para hoje.</p>
          </div>
          <button
            type="button"
            onClick={onNewEvent}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 text-cyan-300 hover:bg-cyan-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agendar
          </button>
        </NeonGlass>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <NeonGlass primary={primaryHex} accent={accentHex} glow={Boolean(liveEvent)} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono uppercase tracking-wider text-[#7c8494]">Hoje</p>
            {liveEvent && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: `${primaryHex}33`, color: primaryHex, border: `1px solid ${primaryHex}55` }}
              >
                <Radio className="w-3 h-3 animate-pulse" />
                TURNO AO VIVO
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRegisterWork}
            className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-colors"
          >
            Registrar horas →
          </button>
        </div>

        <div className="space-y-2">
          {todayEvents.map((event) => {
            const work = getTodayWorkForEvent(dailyWork, event.id, today);
            const isLive = work?.entry_time && !work?.exit_time;
            const timeLabel = event.start_time
              ? format(parseISO(`2000-01-01T${event.start_time}`), 'HH:mm', { locale: ptBR })
              : null;

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick?.(event)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isLive
                    ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10'
                    : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                    {timeLabel && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeLabel}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {event.location}
                      </span>
                    )}
                    {work?.entry_time && (
                      <span className="text-emerald-400/90">
                        Entrada {work.entry_time}
                        {work.exit_time ? ` · Saída ${work.exit_time}` : ' · em andamento'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </NeonGlass>
    </motion.div>
  );
}
