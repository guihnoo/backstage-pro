import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sunrise, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventStatus } from '@/components/utils/dateUtils';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
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

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CustomTooltip = ({ active, payload, label, formatCurrency, isVisible }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-bold text-white">
            {p.dataKey === 'shows' ? `${p.value} show${p.value !== 1 ? 's' : ''}` : isVisible ? formatCurrency(p.value) : '••••'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SeasonalityChart({ events = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();

  const { monthlyData, bestMonth, worstMonth, bestCount, years } = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, (_, i) => ({
      name: MONTHS[i],
      month: i,
      revenue: 0,
      shows: 0,
    }));

    const yearsSet = new Set();

    events.forEach(ev => {
      const st = getEventStatus(ev);
      if (st === 'cancelled') return;
      if (!ev.start_date) return;
      const m = parseInt(ev.start_date.slice(5, 7), 10) - 1;
      const y = ev.start_date.slice(0, 4);
      if (m < 0 || m > 11) return;
      yearsSet.add(y);
      byMonth[m].shows += 1;
      if (ev.payment_status === 'paid') {
        byMonth[m].revenue += getEventCacheAmount(ev) || 0;
      }
    });

    const withData = byMonth.filter(m => m.shows > 0);
    if (!withData.length) return { monthlyData: byMonth, bestMonth: null, worstMonth: null, bestCount: null, years: [] };

    const maxRev = Math.max(...withData.map(m => m.revenue));
    const minRev = Math.min(...withData.map(m => m.revenue));
    const maxShows = Math.max(...withData.map(m => m.shows));

    const best = byMonth.find(m => m.revenue === maxRev && m.shows > 0) || null;
    const worst = byMonth.find(m => m.revenue === minRev && m.shows > 0) || null;
    const bestC = byMonth.find(m => m.shows === maxShows) || null;

    return {
      monthlyData: byMonth,
      bestMonth: best,
      worstMonth: worst,
      bestCount: bestC,
      years: [...yearsSet].sort(),
    };
  }, [events]);

  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  if (!events.length) return null;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Sunrise className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Sazonalidade</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">
            receita histórica por mês{years.length > 0 ? ` · ${years.join(', ')}` : ''}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {bestMonth && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wide">Melhor Mês</span>
            </div>
            <p className="text-sm font-bold text-emerald-300">{bestMonth.name}</p>
            <p className="text-[10px] text-slate-400">{isVisible ? formatCurrency(bestMonth.revenue) : '••••'}</p>
          </div>
        )}
        {bestCount && (
          <div
            className="rounded-lg border px-3 py-2 text-center"
            style={{ backgroundColor: `${primaryHex}1a`, borderColor: `${primaryHex}33` }}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <CalendarDays className="w-3 h-3" style={{ color: primaryHex }} />
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: primaryHex }}>+ Shows</span>
            </div>
            <p className="text-sm font-bold" style={{ color: primaryHex }}>{bestCount.name}</p>
            <p className="text-[10px] text-slate-400">{bestCount.shows} shows</p>
          </div>
        )}
        {worstMonth && worstMonth.month !== bestMonth?.month && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-red-400 font-medium uppercase tracking-wide">Baixa Temporada</span>
            </div>
            <p className="text-sm font-bold text-red-300">{worstMonth.name}</p>
            <p className="text-[10px] text-slate-400">{isVisible ? formatCurrency(worstMonth.revenue) : '••••'}</p>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip formatCurrency={formatCurrency} isVisible={isVisible} />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="revenue" name="Receita" radius={[3, 3, 0, 0]} maxBarSize={28}>
              {monthlyData.map((entry, idx) => {
                const intensity = maxRevenue > 0 ? entry.revenue / maxRevenue : 0;
                const isBest = entry.month === bestMonth?.month;
                return (
                  <Cell
                    key={idx}
                    fill={isBest
                      ? '#34d399'
                      : intensity > 0.6
                        ? primaryHex
                        : intensity > 0.3
                          ? rgbaHex(primaryHex, 0.65)
                          : intensity > 0
                            ? rgbaHex(primaryHex, 0.35)
                            : '#1e293b'
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda de intensidade */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1e293b] inline-block" />
          <span>Sem dados</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: rgbaHex(primaryHex, 0.35) }} />
          <span>Baixo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: primaryHex }} />
          <span>Alto</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#34d399] inline-block" />
          <span>Melhor</span>
        </div>
      </div>
    </div>
  );
}
