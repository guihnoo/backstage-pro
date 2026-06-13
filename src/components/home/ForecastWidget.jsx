import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight, CalendarDays } from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { NeonGlass } from '@/components/design/NeonGlass';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { parseISO, addDays, isValid, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { getEventCacheAmount, isCancelledEvent } from '@/lib/eventFinance';
import { getEventStatus } from '@/components/utils/dateUtils';
import { getEventDisplay } from '@/lib/eventDisplay';
import { ptBR } from 'date-fns/locale';

function getWeekLabel(daysFromNow) {
  if (daysFromNow <= 7) return 'Esta semana';
  if (daysFromNow <= 14) return 'Próxima semana';
  return `Em ${Math.ceil(daysFromNow / 7)} semanas`;
}

export default function ForecastWidget({ events = [], isLoading, primaryHex = '#A64AFF', accentHex = '#FFB700', onViewEvent }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [showAll, setShowAll] = useState(false);
  const todayMs = startOfDay(new Date()).getTime();

  const upcoming = useMemo(() => {
    const t = new Date(todayMs);
    const t30 = addDays(t, 30);
    return events
      .filter(ev => {
        if (isCancelledEvent(ev)) return false;
        if (getEventStatus(ev) === 'completed') return false;
        const d = ev.start_date ? parseISO(ev.start_date) : null;
        return d && isValid(d) && d >= t && d <= t30;
      })
      .map(ev => {
        const d = parseISO(ev.start_date);
        const days = differenceInCalendarDays(d, t);
        const value = getEventCacheAmount(ev);
        return { ...ev, days, value };
      })
      .sort((a, b) => a.days - b.days);
  }, [events, todayMs]);

  const totalProjected = useMemo(
    () => upcoming.reduce((sum, ev) => sum + ev.value, 0),
    [upcoming]
  );

  if (isLoading) {
    return (
      <NeonGlass primary={primaryHex} className="mb-8 p-5">
        <div className="h-16 bg-[#1a1d27] rounded animate-pulse" />
      </NeonGlass>
    );
  }

  if (upcoming.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-8"
    >
      <NeonGlass primary={primaryHex} accent={accentHex} className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: accentHex }} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Forecast 30 dias</h3>
          </div>
          <button
            type="button"
            onClick={() => hardNavigate('/calendar')}
            className="text-xs text-[#7c8494] flex items-center gap-1 transition-colors bp-hover-primary"
          >
            Ver agenda <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Resumo */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7c8494] mb-1">
              {upcoming.length} show{upcoming.length !== 1 ? 's' : ''} agendado{upcoming.length !== 1 ? 's' : ''}
            </p>
            <p
              className="text-2xl font-extrabold"
              style={{
                background: `linear-gradient(90deg, ${primaryHex}, ${accentHex})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {isVisible ? formatCurrency(totalProjected) : '•••••'}
            </p>
            <p className="text-[10px] text-[#4a5060] font-mono mt-0.5">receita projetada</p>
          </div>
          <CalendarDays className="w-8 h-8 text-[#2a2d3a]" />
        </div>

        {/* Timeline dos próximos eventos */}
        <div className="space-y-2">
          {(showAll ? upcoming : upcoming.slice(0, 4)).map((ev, i, arr) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * Math.min(i, 4) }}
              onClick={() => onViewEvent?.(ev)}
              className={`flex items-center gap-3 text-sm ${onViewEvent ? 'cursor-pointer hover:bg-white/5 rounded-lg px-1 -mx-1 transition-colors' : ''}`}
            >
              {/* Ponto na timeline */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: ev.color || primaryHex,
                    boxShadow: `0 0 6px ${ev.color || primaryHex}80`,
                  }}
                />
                {i < arr.length - 1 && (
                  <div className="w-px h-4 bg-[#2a2d3a] mt-0.5" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {(() => {
                    const { companyName, eventName, showEventSubtitle } = getEventDisplay(ev, ev.clients);
                    return (
                      <>
                        <p className="text-white font-medium truncate text-xs leading-tight" title={companyName}>{companyName}</p>
                        {showEventSubtitle && (
                          <p className="text-[#7c8494] truncate text-[10px] leading-tight" title={eventName}>{eventName}</p>
                        )}
                      </>
                    );
                  })()}
                  <p className="text-[#5a6070] text-[10px] font-mono truncate">
                    {format(parseISO(ev.start_date), "EEE d/MM", { locale: ptBR })}
                    {' · '}
                    <span style={{ color: accentHex }}>{getWeekLabel(ev.days)}</span>
                  </p>
                </div>
                {ev.value > 0 && (
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: primaryHex }}>
                    {isVisible ? formatCurrency(ev.value) : '•••'}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {upcoming.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              className="text-[10px] text-[#5a6070] font-mono pl-5 transition-colors bp-hover-primary"
            >
              {showAll
                ? '↑ Mostrar menos'
                : `+${upcoming.length - 4} evento${upcoming.length - 4 !== 1 ? 's' : ''} — ver todos`
              }
            </button>
          )}
        </div>
      </NeonGlass>
    </motion.div>
  );
}
