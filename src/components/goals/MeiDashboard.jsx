import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, TrendingUp, Calendar, Info, ExternalLink } from 'lucide-react';
import { MEI_LIMIT, MEI_DAS } from '@/lib/useBackstageData';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';

const THRESHOLDS = [
  { pct: 95, color: '#ef4444', label: 'Crítico',  bg: 'from-red-900/30 to-red-900/10',    border: 'border-red-500/40' },
  { pct: 85, color: '#f97316', label: 'Atenção',  bg: 'from-orange-900/30 to-orange-900/10', border: 'border-orange-500/40' },
  { pct: 70, color: '#eab308', label: 'Alerta',   bg: 'from-yellow-900/20 to-yellow-900/5',  border: 'border-yellow-500/30' },
  { pct:  0, color: '#22d3ee', label: 'Normal',   bg: 'from-cyan-900/20 to-slate-900/20',    border: 'border-cyan-700/30' },
];

function getThreshold(pct) {
  return THRESHOLDS.find(t => pct >= t.pct) || THRESHOLDS[THRESHOLDS.length - 1];
}

function formatBRL(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function DasCard({ dasType, color }) {
  const das = MEI_DAS[dasType] || MEI_DAS.services;
  const today = new Date();
  const dueMonth = new Date(today.getFullYear(), today.getMonth() + 1, 20);
  const daysUntilDue = Math.ceil((dueMonth - today) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">DAS Mensal</p>
        </div>
        <span
          className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}
        >
          dia 20
        </span>
      </div>
      <p className="text-2xl font-black text-white">
        R$ {das.monthly.toFixed(2).replace('.', ',')}
        <span className="text-sm font-normal text-slate-400">/mês</span>
      </p>
      <p className="text-xs text-slate-400 mt-1">{das.label}</p>
      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
        {daysUntilDue <= 0 ? (
          <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> DAS do mês venceu — regularize agora
          </p>
        ) : daysUntilDue <= 5 ? (
          <p className="text-xs text-orange-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Vence em {daysUntilDue} dia{daysUntilDue !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-xs text-slate-500">Próximo vencimento em {daysUntilDue} dias</p>
        )}
        {daysUntilDue <= 7 && (
          <a
            href="https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=17"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-bold border transition-colors"
            style={{ borderColor: `${color}50`, color, background: `${color}15` }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Pagar DAS no Portal MEI
          </a>
        )}
      </div>
    </div>
  );
}

export default function MeiDashboard({ annualRevenue = 0, loading = false, dasType = 'services', accentColor = '#22d3ee' }) {
  const { formatCurrency } = useFinancialVisibility();
  const pct = useMemo(() => Math.min((annualRevenue / MEI_LIMIT) * 100, 100), [annualRevenue]);
  const remaining = Math.max(MEI_LIMIT - annualRevenue, 0);
  const threshold = getThreshold(pct);

  const now = new Date();
  const monthsElapsed = now.getMonth() + 1;
  const monthsRemaining = 12 - monthsElapsed;
  const monthlyAvg = monthsElapsed > 0 ? annualRevenue / monthsElapsed : 0;
  const projectedYear = monthlyAvg * 12;
  const projectedPct = Math.min((projectedYear / MEI_LIMIT) * 100, 100);

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (pct / 100) * circumference;

  const alertMsg = useMemo(() => {
    if (pct >= 100) return { text: 'Limite MEI atingido! Consulte um contador urgentemente.', icon: AlertTriangle, color: '#ef4444' };
    if (pct >= 95) return { text: `Apenas ${formatBRL(remaining)} de margem restante.`, icon: AlertTriangle, color: '#ef4444' };
    if (pct >= 85) return { text: `Cuidado: ${formatBRL(remaining)} restantes no limite anual.`, icon: AlertTriangle, color: '#f97316' };
    if (pct >= 70) return { text: `Você já usou mais de 70% do limite MEI.`, icon: Info, color: '#eab308' };
    if (projectedPct >= 90) return { text: `Na média atual você atingirá ${Math.round(projectedPct)}% do limite até dezembro.`, icon: Info, color: '#f97316' };
    return null;
  }, [pct, remaining, projectedPct]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Alert banner */}
      {alertMsg && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-start gap-3 p-4 rounded-xl border bg-gradient-to-r ${threshold.bg} ${threshold.border}`}
        >
          <alertMsg.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: alertMsg.color }} />
          <p className="text-sm font-semibold" style={{ color: alertMsg.color }}>{alertMsg.text}</p>
        </motion.div>
      )}

      {/* Main revenue meter */}
      <div className={`p-5 rounded-2xl border bg-gradient-to-br ${threshold.bg} ${threshold.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-0.5">Faturamento Anual {now.getFullYear()}</p>
            <p className="text-xs text-slate-500">Limite MEI: {formatBRL(MEI_LIMIT)}/ano</p>
          </div>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${threshold.color}22`, color: threshold.color }}
          >
            {threshold.label}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* SVG circular progress */}
          <div className="relative flex-shrink-0" style={{ width: 124, height: 124 }}>
            <svg width={124} height={124} className="-rotate-90">
              <circle cx={62} cy={62} r={52} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
              <motion.circle
                cx={62} cy={62} r={52}
                fill="none"
                stroke={threshold.color}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${threshold.color}60)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loading ? (
                <div className="w-8 h-2 bg-slate-700 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-2xl font-black text-white">{Math.round(pct)}%</span>
                  <span className="text-[9px] text-slate-500 font-mono">do limite</span>
                </>
              )}
            </div>
          </div>

          {/* Stats column */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Faturado</p>
              <p className="text-xl font-black text-white">
                {loading ? '—' : formatCurrency(annualRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Margem restante</p>
              <p className="text-lg font-bold" style={{ color: threshold.color }}>
                {loading ? '—' : formatCurrency(remaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${threshold.color}cc, ${threshold.color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
          <span>R$ 0</span>
          <span>70% ({formatBRL(MEI_LIMIT * 0.7)})</span>
          <span>{formatBRL(MEI_LIMIT)}</span>
        </div>
      </div>

      {/* Projeção */}
      <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Projeção para Dezembro</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500 mb-1">Média/mês</p>
            <p className="text-sm font-bold text-white">{loading ? '—' : formatCurrency(monthlyAvg)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Projeção ano</p>
            <p className="text-sm font-bold" style={{ color: projectedPct >= 85 ? '#f97316' : '#22d3ee' }}>
              {loading ? '—' : formatCurrency(projectedYear)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">% projetada</p>
            <p className="text-sm font-bold" style={{ color: projectedPct >= 85 ? '#f97316' : '#22d3ee' }}>
              {loading ? '—' : `${Math.round(projectedPct)}%`}
            </p>
          </div>
        </div>
        {monthsRemaining > 0 && !loading && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            Você ainda pode faturar {formatCurrency(remaining)} até {formatBRL(MEI_LIMIT)} nos próximos {monthsRemaining} {monthsRemaining === 1 ? 'mês' : 'meses'}
          </p>
        )}
      </div>

      {/* DAS card */}
      <DasCard dasType={dasType} color={accentColor} />

      {/* CTA */}
      <button
        type="button"
        onClick={() => hardNavigate('/reports')}
        className="w-full py-3 rounded-xl border border-slate-700/50 bg-slate-800/30 text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-700/40 transition-all flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Ver todos os pagamentos recebidos
      </button>

      <p className="text-[10px] text-slate-600 text-center font-mono leading-relaxed">
        Valores baseados no limite MEI 2025 (R$ 81.000/ano). Consulte um contador para decisões fiscais.
      </p>
    </motion.div>
  );
}
