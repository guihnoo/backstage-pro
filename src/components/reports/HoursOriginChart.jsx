import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { hoursOriginStats } from '@/lib/hoursReview';
import { REGIME_POR_DIA_DESDE } from '@/lib/workDay';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

// Cores validadas (dataviz validate_palette, modo escuro): verde = horas lançadas,
// âmbar = 12 h automáticas (mesmas cores dos dias do evento). Identidade também por
// legenda e rótulo, nunca só pela cor.
const COR_LANCADO = '#059669';
const COR_ESTIMADO = '#d97706';
const SUPERFICIE = '#0f172a';

function TooltipConteudo({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-lg">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{p.value} dia{p.value === 1 ? '' : 's'}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Lote 4 — telemetria: dias com horas lançadas x dias fechados com 12 h automáticas.
 * Conta só a partir da ativação do Lote 2 (VITE_REGIME_POR_DIA_DESDE), quando a
 * marca "estimada" passou a existir. Mostra fatos, sem tom de bronca.
 */
export default function HoursOriginChart({ dailyWork = [], since = REGIME_POR_DIA_DESDE }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const reducedMotion = useReducedMotion();
  const stats = useMemo(() => hoursOriginStats(dailyWork, since), [dailyWork, since]);

  if (!stats) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Horas lançadas × 12 h automáticas
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Este gráfico começa a contar quando a escolha por dia (½ / 1 / 2) for ativada.
        </p>
      </div>
    );
  }

  const data = stats.months.map((m) => ({
    mes: format(parseISO(`${m.month}-01`), 'MMM', { locale: ptBR }),
    lancados: m.lancados,
    estimados: m.estimados,
  }));
  const total = stats.totalLancados + stats.totalEstimados;
  const money = (v) => (isVisible ? formatCurrency(v) : '••••');

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> Horas lançadas × 12 h automáticas
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Neste período, desde {format(parseISO(stats.periodStart), 'dd/MM/yyyy')} · {total} dia{total === 1 ? '' : 's'} de trabalho
        </p>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg border border-slate-800 p-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Com horas lançadas</p>
            <p className="text-lg font-bold text-white">{stats.totalLancados}</p>
            <p className="text-[11px] text-slate-400">média {money(stats.mediaLancado)} por dia</p>
          </div>
          <div className="rounded-lg border border-slate-800 p-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">12 h automáticas</p>
            <p className="text-lg font-bold text-white">{stats.totalEstimados}</p>
            <p className="text-[11px] text-slate-400">média {money(stats.mediaEstimado)} por dia</p>
          </div>
        </div>
      )}

      <div className="h-48" role="img" aria-label="Dias por mês com horas lançadas e com 12 horas automáticas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<TooltipConteudo />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="square"
              formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
            />
            <Bar dataKey="lancados" name="Horas lançadas" stackId="dias" fill={COR_LANCADO}
                 isAnimationActive={!reducedMotion} stroke={SUPERFICIE} strokeWidth={2} maxBarSize={28} />
            <Bar dataKey="estimados" name="12 h automáticas" stackId="dias" fill={COR_ESTIMADO}
                 isAnimationActive={!reducedMotion} stroke={SUPERFICIE} strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {stats.horasExtrasLancadas > 0 && (
        <p className="text-xs text-slate-400">
          Nos dias com horas lançadas você registrou <span className="text-white font-semibold">{stats.horasExtrasLancadas} h extras</span>.
          Nos dias de 12 h automáticas, horas extras não entram.
        </p>
      )}
    </div>
  );
}
