import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getEventCacheAmount, isCancelledEvent } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label: _label, formatCurrency, isVisible }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d.shows === 0) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-white mb-2 capitalize">{d.fullLabel}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Shows</span>
        <span className="font-bold text-white">{d.shows}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Cachê médio</span>
        <span className="font-bold text-white">
          {isVisible ? formatCurrency(d.avgCache) : '•••••'}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Total</span>
        <span className="font-bold text-white">
          {isVisible ? formatCurrency(d.total) : '•••••'}
        </span>
      </div>
    </div>
  );
};

export default function CacheEvolutionChart({ events = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();

  const { chartData, trend, firstAvg, lastAvg, hasData } = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => subMonths(now, 11 - i));

    const chartData = months.map((m) => {
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const label = format(m, 'MMM', { locale: ptBR });
      const fullLabel = format(m, 'MMMM yyyy', { locale: ptBR });

      const monthEvents = events.filter((e) => {
        if (isCancelledEvent(e)) return false;
        if (!e.start_date) return false;
        try {
          const d = parseISO(e.start_date);
          return isValid(d) && d >= mStart && d <= mEnd;
        } catch {
          return false;
        }
      });

      const shows = monthEvents.length;
      const total = monthEvents.reduce((sum, e) => sum + getEventCacheAmount(e), 0);
      const avgCache = shows > 0 ? total / shows : 0;

      return { label, fullLabel, shows, total, avgCache };
    });

    const withData = chartData.filter((d) => d.shows > 0);
    const hasData = withData.length >= 2;

    let trend = 0;
    let firstAvg = 0;
    let lastAvg = 0;

    if (hasData) {
      firstAvg = withData[0].avgCache;
      lastAvg = withData[withData.length - 1].avgCache;
      trend = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;
    }

    return { chartData, trend, firstAvg, lastAvg, hasData };
  }, [events]);

  if (!hasData) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 bp-text-primary" style={{ color: primaryHex }} />
          Evolução do Cachê
        </h3>
        <p className="text-xs text-slate-500 text-center py-6">
          Registre pelo menos 2 meses de shows para ver a evolução.
        </p>
      </div>
    );
  }

  const TrendIcon = trend > 5 ? TrendingUp : trend < -5 ? TrendingDown : Minus;
  const trendColor = trend > 5 ? 'text-emerald-400' : trend < -5 ? 'text-rose-400' : 'text-slate-400';
  const trendBg = trend > 5 ? 'bg-emerald-500/10 border-emerald-500/30' : trend < -5 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800 border-slate-700';

  const overallAvg = chartData.filter(d => d.shows > 0).reduce((sum, d) => sum + d.avgCache, 0) /
    chartData.filter(d => d.shows > 0).length;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 bp-text-primary" style={{ color: primaryHex }} />
            Evolução do Cachê
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Cachê médio por show nos últimos 12 meses</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${trendBg} ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {Math.abs(trend).toFixed(0)}%
          <span className="font-normal text-slate-400">{trend > 0 ? 'alta' : trend < 0 ? 'queda' : ''}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            hide
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={<CustomTooltip formatCurrency={formatCurrency} isVisible={isVisible} />}
            cursor={{ stroke: primaryHex, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {overallAvg > 0 && (
            <ReferenceLine
              y={overallAvg}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{ value: 'média', fill: '#475569', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="avgCache"
            stroke={primaryHex}
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.shows === 0) return null;
              return (
                <circle
                  key={`dot-${payload.label}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={primaryHex}
                  stroke="#0f172a"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, fill: primaryHex, stroke: '#0f172a', strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {isVisible ? (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Primeiro: <span className="text-white font-medium">{formatCurrency(firstAvg)}</span></span>
          <span>Média: <span className="text-white font-medium">{formatCurrency(overallAvg)}</span></span>
          <span>Atual: <span className={`font-medium ${trendColor}`}>{formatCurrency(lastAvg)}</span></span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Primeiro: <span className="text-white font-medium">•••••</span></span>
          <span>Média: <span className="text-white font-medium">•••••</span></span>
          <span>Atual: <span className="text-white font-medium">•••••</span></span>
        </div>
      )}
    </div>
  );
}
