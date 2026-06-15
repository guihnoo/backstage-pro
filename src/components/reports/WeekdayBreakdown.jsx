import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarDays, TrendingUp, Coffee, Star } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { getEventStatus } from '@/components/utils/dateUtils';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function hexToRgb(hex) {
  const h = String(hex || '#A64AFF').replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbaHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ISO weekday: 0=Sun,1=Mon,...,6=Sat → match getDay()

const CustomTooltip = ({ active, payload, label, formatCurrency, isVisible, primaryHex }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs min-w-[140px] space-y-1">
      <p className="font-semibold text-white mb-1.5">{label}</p>
      <div className="flex justify-between gap-4">
        <span style={{ color: primaryHex }}>Receita</span>
        <span className="font-bold text-white">
          {isVisible ? formatCurrency(data?.revenue || 0) : '••••'}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Shows</span>
        <span className="font-bold text-white">{data?.shows}</span>
      </div>
      {data?.shows > 0 && (
        <div className="flex justify-between gap-4 pt-1 border-t border-slate-700">
          <span className="text-slate-500">Média/show</span>
          <span className="text-slate-300">
            {isVisible ? formatCurrency((data.revenue || 0) / data.shows) : '••••'}
          </span>
        </div>
      )}
    </div>
  );
};

export default function WeekdayBreakdown({ events = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex, accentHex } = useCategoryTheme();

  const { data, bestRevDay, busiestDay, idleDay } = useMemo(() => {
    const byDay = Array.from({ length: 7 }, (_, i) => ({
      name: DAYS[i],
      day: i,
      revenue: 0,
      shows: 0,
    }));

    events.forEach(ev => {
      if (getEventStatus(ev) === 'cancelled') return;
      if (!ev.start_date) return;
      const d = new Date(ev.start_date + 'T12:00:00');
      const dayIdx = d.getDay(); // 0=Sun
      byDay[dayIdx].shows += 1;
      if (ev.payment_status === 'paid') {
        byDay[dayIdx].revenue += getEventCacheAmount(ev) || 0;
      }
    });

    const withData = byDay.filter(d => d.shows > 0);
    if (!withData.length) return { data: byDay, bestRevDay: null, busiestDay: null, idleDay: null };

    const maxRev = Math.max(...withData.map(d => d.revenue));
    const maxShows = Math.max(...withData.map(d => d.shows));
    const minShows = Math.min(...withData.map(d => d.shows));

    return {
      data: byDay,
      bestRevDay: byDay.find(d => d.revenue === maxRev && d.shows > 0) || null,
      busiestDay: byDay.find(d => d.shows === maxShows) || null,
      idleDay: byDay.find(d => d.shows === minShows && d.shows > 0) || null,
    };
  }, [events]);

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  if (!events.length) return null;
  if (!data.some(d => d.shows > 0)) return null;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="p-1.5 rounded-lg border"
          style={{ backgroundColor: `${primaryHex}1a`, borderColor: `${primaryHex}33` }}
        >
          <CalendarDays className="w-4 h-4" style={{ color: primaryHex }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Desempenho por Dia da Semana</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">receita paga e volume de shows</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {bestRevDay && (
          <div
            className="rounded-lg px-3 py-2 text-center border"
            style={{ backgroundColor: `${primaryHex}1a`, borderColor: `${primaryHex}33` }}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3" style={{ color: primaryHex }} />
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: primaryHex }}>+ Receita</span>
            </div>
            <p className="text-sm font-bold" style={{ color: primaryHex }}>{bestRevDay.name}</p>
            <p className="text-[10px] text-slate-400">{isVisible ? formatCurrency(bestRevDay.revenue) : '••••'}</p>
          </div>
        )}
        {busiestDay && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wide">+ Shows</span>
            </div>
            <p className="text-sm font-bold text-emerald-300">{busiestDay.name}</p>
            <p className="text-[10px] text-slate-400">{busiestDay.shows} shows</p>
          </div>
        )}
        {idleDay && idleDay.day !== busiestDay?.day && (
          <div className="rounded-lg bg-slate-700/30 border border-slate-700/50 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Coffee className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Mais Livre</span>
            </div>
            <p className="text-sm font-bold text-slate-300">{idleDay.name}</p>
            <p className="text-[10px] text-slate-500">{idleDay.shows} show{idleDay.shows !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip formatCurrency={formatCurrency} isVisible={isVisible} primaryHex={primaryHex} />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="revenue" name="Receita" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {data.map((entry, idx) => {
                const intensity = maxRevenue > 0 ? entry.revenue / maxRevenue : 0;
                const isBest = entry.day === bestRevDay?.day;
                const isBusiest = entry.day === busiestDay?.day && !isBest;
                return (
                  <Cell
                    key={idx}
                    fill={
                      isBest
                        ? accentHex
                        : isBusiest
                          ? '#34d399'
                          : intensity > 0
                            ? rgbaHex(primaryHex, 0.35 + intensity * 0.55)
                            : '#1e293b'
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Shows count below bars */}
      <div className="flex justify-around text-center">
        {data.map(d => (
          <div key={d.day} className="flex-1">
            <p className="text-[10px] text-slate-600">{d.shows > 0 ? d.shows : '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
