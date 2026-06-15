import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, Zap, Award } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import EventHeading from '@/components/events/EventHeading';
import { getClientDisplayName } from '@/lib/eventDisplay';

function formatCurrencyCompact(v) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

export default function WorkAnalytics({ work = [], events = [], clients = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();

  const stats = useMemo(() => {
    if (!work.length) return null;
    const totalHours = work.reduce((s, w) => s + (w.total_hours || 0), 0);
    const totalEarned = work.reduce((s, w) => s + (w.daily_cache || 0), 0);
    const hourlyRate = totalHours > 0 && totalEarned > 0 ? totalEarned / totalHours : null;
    const eventsWithWork = new Set(work.map(w => w.event_id)).size;
    return { totalHours, totalEarned, hourlyRate, eventsWithWork };
  }, [work]);

  // R$/hora por evento, top 10
  const eventRates = useMemo(() => {
    const byEvent = {};
    work.forEach(w => {
      if (!w.event_id) return;
      if (!byEvent[w.event_id]) byEvent[w.event_id] = { hours: 0, earned: 0 };
      byEvent[w.event_id].hours += w.total_hours || 0;
      byEvent[w.event_id].earned += w.daily_cache || 0;
    });
    return Object.entries(byEvent)
      .map(([eventId, d]) => {
        const ev = events.find(e => e.id === eventId);
        const rate = d.hours > 0 && d.earned > 0 ? d.earned / d.hours : null;
        const client = ev?.client_id ? clients.find(c => c.id === ev.client_id) : null;
        return {
          eventId,
          eventRef: ev,
          clientRef: client,
          title: ev?.title || 'Show sem título',
          clientLabel: getClientDisplayName(client),
          date: ev?.start_date || null,
          hours: d.hours,
          earned: d.earned,
          rate,
        };
      })
      .filter(e => e.rate !== null)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
  }, [work, events, clients]);

  // Horas por mês — últimos 6 meses
  const monthlyHours = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const key = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM', { locale: ptBR });
      const hours = work
        .filter(w => w.date && w.date.startsWith(key))
        .reduce((s, w) => s + (w.total_hours || 0), 0);
      const earned = work
        .filter(w => w.date && w.date.startsWith(key))
        .reduce((s, w) => s + (w.daily_cache || 0), 0);
      const rate = hours > 0 && earned > 0 ? earned / hours : 0;
      return { label, hours, earned, rate };
    });
  }, [work]);

  if (!work.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Clock className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Nenhum registro de trabalho no período</p>
      </div>
    );
  }

  const maxHours = Math.max(...monthlyHours.map(m => m.hours), 1);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 bp-text-primary" />
            <p className="text-xs text-slate-400">Horas trabalhadas</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalHours}h</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-slate-400">Taxa média/hora</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {stats.hourlyRate
              ? (isVisible ? formatCurrency(stats.hourlyRate) : '••••')
              : '—'}
          </p>
          {stats.hourlyRate && <p className="text-[10px] text-slate-500 mt-0.5">por hora</p>}
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-slate-400">Total ganho</p>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {isVisible ? formatCurrencyCompact(stats.totalEarned) : '••••'}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 bp-text-primary" />
            <p className="text-xs text-slate-400">Shows registrados</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.eventsWithWork}</p>
        </div>
      </div>

      {/* Horas por mês */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Horas trabalhadas por mês</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyHours} barSize={28} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, maxHours * 1.2]} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                    <p className="text-white font-semibold">{d.hours}h</p>
                    {d.rate > 0 && (
                      <p className="text-amber-400">{isVisible ? formatCurrency(d.rate) : '••••'}/h</p>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {monthlyHours.map((m, i) => (
                <Cell key={i} fill={m.hours > 0 ? primaryHex : '#1e293b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking R$/hora por show */}
      {eventRates.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Melhores taxas por show
            <span className="ml-2 text-xs text-slate-500 font-normal">(R$/hora)</span>
          </h3>
          <div className="space-y-2">
            {eventRates.map((ev, i) => {
              const maxRate = eventRates[0].rate;
              const pct = maxRate > 0 ? (ev.rate / maxRate) * 100 : 0;
              return (
                <div key={ev.eventId} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      {ev.eventRef ? (
                        <EventHeading event={ev.eventRef} client={ev.clientRef} size="sm" className="flex-1" />
                      ) : (
                        <p className="text-xs text-white truncate">{ev.title}</p>
                      )}
                      <p className="text-xs font-bold text-amber-400 flex-shrink-0">
                        {isVisible ? formatCurrency(ev.rate) : '••••'}/h
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400/70 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 flex-shrink-0">{ev.hours}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
