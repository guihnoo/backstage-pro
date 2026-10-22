import { useMemo } from 'react';
import { projectYearEnd } from '@/lib/yearProjection';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, TrendingUp, Calendar, Info, ExternalLink } from 'lucide-react';
import { MEI_LIMIT, MEI_DAS, MEI_VALUES_YEAR } from '@/lib/useBackstageData';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';

const THRESHOLDS = [
  { pct: 95, color: '#ef4444', label: 'Crítico',  bg: 'from-[#ff2e88]/30 to-[#ff2e88]/10',    border: 'border-[#ff2e88]/40' },
  { pct: 85, color: '#f97316', label: 'Atenção',  bg: 'from-[#ffd400]/30 to-[#ffd400]/10', border: 'border-[#ffd400]/40' },
  { pct: 70, color: '#eab308', label: 'Alerta',   bg: 'from-[#ffd400]/20 to-[#ffd400]/5',  border: 'border-[#ffd400]/30' },
];

function getThreshold(pct, accentColor) {
  const match = THRESHOLDS.find(t => pct >= t.pct);
  if (match) return match;
  return {
    pct: 0,
    color: accentColor,
    label: 'Normal',
    bg: '',
    border: '',
    isAccent: true,
  };
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
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#a8a8a8]" />
          <p className="font-tag text-[11px] tracking-[2px] uppercase text-[#a8a8a8]">DAS mensal</p>
        </div>
        <span
          className="text-xs font-tag font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}
        >
          dia 20
        </span>
      </div>
      <p className="text-2xl font-black text-white">
        R$ {das.monthly.toFixed(2).replace('.', ',')}
        <span className="text-sm font-normal text-[#a8a8a8]">/mês</span>
      </p>
      <p className="text-xs text-[#a8a8a8] mt-1">{das.label}</p>
      <div className="mt-3 pt-3 border-t border-[#2a2a2a] space-y-2">
        {daysUntilDue <= 0 ? (
          <p className="text-xs text-[#ff2e88] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> DAS do mês venceu — regularize agora
          </p>
        ) : daysUntilDue <= 5 ? (
          <p className="text-xs text-[#ffd400] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Vence em {daysUntilDue} dia{daysUntilDue !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-xs text-[#888888]">Próximo vencimento em {daysUntilDue} dias</p>
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

import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';

export default function MeiDashboard({ annualRevenue = 0, loading = false, dasType = 'services', accentColor = getCategoryConfig(AUTH_HERO_CATEGORY).primaryHex }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const pct = useMemo(() => Math.min((annualRevenue / MEI_LIMIT) * 100, 100), [annualRevenue]);
  const remaining = Math.max(MEI_LIMIT - annualRevenue, 0);
  const threshold = getThreshold(pct, accentColor);
  // All Access: alerta do MEI e so a borda rosa (sem degrade).
  const accentSurfaceStyle = undefined;

  const now = new Date();
  const monthsElapsed = now.getMonth() + 1;
  const monthsRemaining = 12 - monthsElapsed;
  const projectedYear = projectYearEnd(annualRevenue, monthsElapsed);
  const monthlyAvg = projectedYear / 12;
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
          className={`flex items-start gap-3 p-4 rounded-2xl border bg-[#161616] ${threshold.isAccent ? 'border-[#ff2e88]/60' : 'border-[#222222]'}`}
          style={accentSurfaceStyle}
        >
          <alertMsg.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: alertMsg.color }} />
          <p className="text-sm font-semibold min-w-0 flex-1 truncate" style={{ color: alertMsg.color }}>
            {alertMsg.text}
          </p>
        </motion.div>
      )}

      {/* Main revenue meter */}
      <div
        className={`p-5 rounded-2xl border bg-[#161616] ${threshold.isAccent ? 'border-[#ff2e88]/60' : 'border-[#222222]'}`}
        style={accentSurfaceStyle}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-tag text-[11px] tracking-[2px] uppercase text-[#a8a8a8] mb-0.5">Faturamento {now.getFullYear()}</p>
            <p className="text-xs text-[#888888]">Limite MEI: {formatBRL(MEI_LIMIT)}/ano</p>
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
                <Skeleton className="w-10 h-3 rounded" />
              ) : (
                <>
                  <span className="text-2xl font-black text-white">{Math.round(pct)}%</span>
                  <span className="text-[9px] text-[#888888] font-tag">do limite</span>
                </>
              )}
            </div>
          </div>

          {/* Stats column */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="min-w-0">
              <p className="text-xs text-[#a8a8a8] mb-0.5">Faturado</p>
              <p className="text-xl font-black text-white truncate">
                {loading ? '—' : (isVisible ? formatCurrency(annualRevenue) : '••••')}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#a8a8a8] mb-0.5">Margem restante</p>
              <p className="text-lg font-bold truncate" style={{ color: threshold.color }}>
                {loading ? '—' : (isVisible ? formatCurrency(remaining) : '••••')}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-[#1f1f1f] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${threshold.color}cc, ${threshold.color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#666666] mt-1 font-tag">
          <span>R$ 0</span>
          <span>70% ({formatBRL(MEI_LIMIT * 0.7)})</span>
          <span>{formatBRL(MEI_LIMIT)}</span>
        </div>
      </div>

      {/* Projeção */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
          <p className="font-tag text-[11px] tracking-[2px] uppercase text-[#a8a8a8]">Projeção para dezembro</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-[#888888] mb-1">Média/mês</p>
            <p className="text-sm font-bold text-white">{loading ? '—' : (isVisible ? formatCurrency(monthlyAvg) : '••••')}</p>
          </div>
          <div>
            <p className="text-xs text-[#888888] mb-1">Projeção ano</p>
            <p className="text-sm font-bold" style={{ color: projectedPct >= 85 ? '#f97316' : accentColor }}>
              {loading ? '—' : (isVisible ? formatCurrency(projectedYear) : '••••')}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#888888] mb-1">% projetada</p>
            <p className="text-sm font-bold" style={{ color: projectedPct >= 85 ? '#f97316' : accentColor }}>
              {loading ? '—' : `${Math.round(projectedPct)}%`}
            </p>
          </div>
        </div>
        {monthsRemaining > 0 && !loading && (
          <p className="text-xs text-[#888888] mt-3 text-center">
            Você ainda pode faturar {isVisible ? formatCurrency(remaining) : '••••'} até {formatBRL(MEI_LIMIT)} nos próximos {monthsRemaining} {monthsRemaining === 1 ? 'mês' : 'meses'}
          </p>
        )}
      </div>

      {/* DAS card */}
      <DasCard dasType={dasType} color={accentColor} />

      {/* CTA */}
      <button
        type="button"
        onClick={() => hardNavigate('/reports?aba=fiscal')}
        className="w-full py-3 rounded-xl border border-[#2a2a2a] bg-[#1f1f1f] text-xs text-[#a8a8a8] transition-all flex items-center justify-center gap-2 bp-hover-primary"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Ver todos os pagamentos recebidos
      </button>

      <p className="text-[10px] text-[#666666] text-center font-tag leading-relaxed">
        Valores do MEI de {MEI_VALUES_YEAR} (limite de R$ 81.000/ano). Consulte um contador para decisões fiscais.
      </p>
    </motion.div>
  );
}
