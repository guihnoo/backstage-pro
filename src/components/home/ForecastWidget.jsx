import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight, CalendarDays } from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { NeonGlass } from '@/components/design/NeonGlass';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { parseISO, addDays, isValid, startOfDay } from 'date-fns';
import { getEventCacheAmount, isCancelledEvent } from '@/lib/eventFinance';
import { getEventStatus } from '@/components/utils/dateUtils';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

export default function ForecastWidget({ events = [], isLoading, primaryHex = AUTH_HERO_PRIMARY, accentHex = AUTH_HERO_ACCENT }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
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
        const value = getEventCacheAmount(ev);
        return { ...ev, value };
      });
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: accentHex }} />
            <div>
              <p className="text-sm font-bold text-white">Próximos 30 dias</p>
              <p className="text-[10px] font-mono text-[#7c8494] mt-0.5">
                {upcoming.length} show{upcoming.length !== 1 ? 's' : ''} agendado{upcoming.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p
                className="text-xl font-extrabold"
                style={{
                  background: `linear-gradient(90deg, ${primaryHex}, ${accentHex})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {isVisible ? formatCurrency(totalProjected) : '•••••'}
              </p>
              <p className="text-[10px] text-[#4a5060] font-mono">receita projetada</p>
            </div>
            <CalendarDays className="w-6 h-6 text-[#2a2d3a] flex-shrink-0" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => hardNavigate('/calendar')}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-[#7c8494] transition-colors bp-hover-primary"
        >
          Ver agenda completa <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </NeonGlass>
    </motion.div>
  );
}
