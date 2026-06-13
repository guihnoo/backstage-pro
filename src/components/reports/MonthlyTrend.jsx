import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

const CustomTooltip = ({ active, payload, label }) => {
  const { formatCurrency } = useFinancialVisibility();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800/95 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="font-bold text-white mb-1 capitalize">{label}</p>
      <p className="text-cyan-400">Recebido: <span className="font-bold">{formatCurrency(d.revenue)}</span></p>
      {d.goal > 0 && (
        <p className={d.revenue >= d.goal ? 'text-emerald-400' : 'text-slate-400'}>
          Meta: {formatCurrency(d.goal)} {d.revenue >= d.goal ? '✅' : `(${Math.round((d.revenue / d.goal) * 100)}%)`}
        </p>
      )}
      <p className="text-slate-500 text-xs mt-1">{d.count} show{d.count !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default function MonthlyTrend({ events = [], goalRevenue = 0, onMonthClick }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, 11 - i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthEvents = events.filter(
        e => e.payment_status === 'paid' && (e.start_date || '').startsWith(monthStr)
      );
      const revenue = monthEvents.reduce((s, e) => s + (Number(e.paid_amount) || 0), 0);
      const label = format(d, 'MMM', { locale: ptBR }).replace('.', '');
      return { monthStr, label, revenue, count: monthEvents.length, goal: goalRevenue };
    });
  }, [events, goalRevenue]);

  const maxVal = Math.max(...months.map(m => m.revenue), goalRevenue || 0, 1);
  const total = months.reduce((s, m) => s + m.revenue, 0);
  const activeMonths = months.filter(m => m.revenue > 0).length;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-300">Evolução — últimos 12 meses</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isVisible ? formatCurrency(total) : '•••'} recebidos · {activeMonths} {activeMonths === 1 ? 'mês ativo' : 'meses ativos'}
          </p>
        </div>
        {goalRevenue > 0 && (
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-amber-400/70 border-t border-dashed border-amber-400" />
            meta {isVisible ? formatCurrency(goalRevenue) : '•••'}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={months} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, maxVal * 1.15]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {goalRevenue > 0 && (
            <ReferenceLine
              y={goalRevenue}
              stroke="#f59e0b"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              strokeWidth={1.5}
            />
          )}
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} onClick={(d) => onMonthClick?.(d.monthStr)}>
            {months.map((m) => (
              <Cell
                key={m.monthStr}
                fill={
                  m.revenue === 0
                    ? '#1e293b'
                    : goalRevenue > 0 && m.revenue >= goalRevenue
                    ? '#10b981'
                    : '#22d3ee'
                }
                fillOpacity={m.revenue === 0 ? 0.4 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legenda simples */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/80 inline-block" />Abaixo da meta</span>
        {goalRevenue > 0 && (
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/80 inline-block" />Meta atingida</span>
        )}
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" />Sem shows</span>
      </div>
    </div>
  );
}
