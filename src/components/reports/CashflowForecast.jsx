import { useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Clock, CalendarDays, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import EventHeading from '@/components/events/EventHeading';

const STATUS_CONFIG_BASE = {
  confirmed: { label: 'Confirmado', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
  scheduled: { label: 'Agendado', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  pending:   { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
};

const STATUS_CONFIG_COMPLETED = {
  label: 'A receber',
  color: 'bp-text-primary',
  bg: 'bp-today-surface-soft',
  dot: 'bg-[var(--bp-primary)]',
};

function getStatusKey(ev) {
  const s = ev.status || 'scheduled';
  if (s === 'cancelled') return null;
  if (s === 'completed' && ev.payment_status !== 'paid') return 'completed';
  if (s === 'completed') return null;
  return STATUS_CONFIG_BASE[s] ? s : 'scheduled';
}

export default function CashflowForecast({ events = [], work = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const STATUS_CONFIG = useMemo(() => getStatusConfig(), []);

  const workByEvent = useMemo(() => {
    const map = {};
    work.forEach(w => {
      if (!w.event_id) return;
      if (!map[w.event_id]) map[w.event_id] = [];
      map[w.event_id].push(w);
    });
    return map;
  }, [work]);

  const today = startOfDay(new Date());

  // Eventos futuros ou concluídos não pagos relevantes
  const forecastEvents = useMemo(() => {
    const cutoff = addDays(today, 90);
    return events
      .filter(ev => {
        if (!ev.start_date) return false;
        const statusKey = getStatusKey(ev);
        if (!statusKey) return false;
        const date = parseISO(ev.start_date);
        // completed+unpaid podem ser passados mas ainda contam como a receber
        if (statusKey === 'completed') return true;
        return !isBefore(date, today) && !isAfter(date, cutoff);
      })
      .map(ev => {
        const wk = workByEvent[ev.id] || [];
        const fromWork = wk.reduce((s, w) => s + (w.daily_cache || 0), 0);
        const value = fromWork > 0 ? fromWork : getEventCacheAmount(ev);
        return { ...ev, _value: value, _statusKey: getStatusKey(ev) };
      })
      .filter(ev => ev._value > 0)
      .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  }, [events, workByEvent, today]);

  // KPIs: total em 30 / 60 / 90 dias
  const kpis = useMemo(() => {
    const inDays = (n) => {
      const limit = addDays(today, n);
      return forecastEvents
        .filter(ev => {
          const d = parseISO(ev.start_date);
          return !isAfter(d, limit) || ev._statusKey === 'completed';
        })
        .reduce((s, ev) => s + ev._value, 0);
    };
    return { d30: inDays(30), d60: inDays(60), d90: inDays(90) };
  }, [forecastEvents, today]);

  // Agrupar por mês (3 meses)
  const months = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const monthDate = addMonths(today, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, 'MMMM yyyy', { locale: ptBR });
      const labelShort = format(monthDate, 'MMM yy', { locale: ptBR });
      const evs = forecastEvents.filter(ev => {
        if (ev._statusKey === 'completed') return i === 0;
        const d = parseISO(ev.start_date);
        return isWithinInterval(d, { start, end });
      });
      const total = evs.reduce((s, ev) => s + ev._value, 0);
      return { label, labelShort, evs, total, isCurrentMonth: i === 0 };
    });
  }, [forecastEvents, today]);

  const hasAnyEvents = forecastEvents.length > 0;

  if (!hasAnyEvents) {
    return (
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 flex flex-col items-center gap-3 text-slate-500">
        <CalendarDays className="w-10 h-10 opacity-30" />
        <p className="text-sm">Nenhum evento futuro com valor no horizonte de 90 dias</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h3 className="text-base font-semibold text-white">Previsão de Caixa</h3>
        <span className="text-xs text-slate-500 ml-1">— próximos 90 dias</span>
      </div>

      {/* KPI Pills */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '30 dias', value: kpis.d30, color: 'text-emerald-400' },
          { label: '60 dias', value: kpis.d60, color: 'bp-text-primary' },
          { label: '90 dias', value: kpis.d90, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 mb-1">{label}</p>
            <p className={`text-sm font-bold ${color}`}>
              {isVisible ? formatCurrency(value) : '••••'}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly sections */}
      <div className="space-y-3">
        {months.map(({ label, evs, total, isCurrentMonth }) => {
          if (!evs.length) return null;
          return (
            <div key={label} className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
              {/* Month header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-white capitalize">{label}</span>
                  {isCurrentMonth && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide">
                      Atual
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${isVisible ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isVisible ? formatCurrency(total) : '••••'}
                </span>
              </div>

              {/* Events */}
              <div className="divide-y divide-slate-700/30">
                {evs.map(ev => {
                  const cfg = STATUS_CONFIG[ev._statusKey] || STATUS_CONFIG.scheduled;
                  const dateStr = ev.start_date
                    ? format(parseISO(ev.start_date), "dd/MM", { locale: ptBR })
                    : '—';
                  return (
                    <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <EventHeading event={ev} className="text-xs font-medium text-white truncate" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">{dateStr}</span>
                          <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                          {ev.location_city && (
                            <span className="text-[10px] text-slate-600 truncate">{ev.location_city}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-white flex-shrink-0">
                        {isVisible ? formatCurrency(ev._value) : '••••'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Month footer: total bar */}
              {total > 0 && kpis.d90 > 0 && (
                <div className="px-4 pb-2 pt-1">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/60"
                      style={{ width: `${Math.min((total / kpis.d90) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] text-slate-500">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
