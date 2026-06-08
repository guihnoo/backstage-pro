import { motion } from 'framer-motion';
import { Target, ChevronRight, Trophy } from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

function formatMoney(value, hidden) {
  if (hidden) return '•••••';
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

export default function MetaMensalBar({ profile, stats, isLoading, accentColor = '#EAB308' }) {
  const { isVisible } = useFinancialVisibility();

  const metaReceita = Number(profile?.monthly_goal_revenue) || 0;
  const metaEventos = Number(profile?.monthly_goal_events) || 0;
  const hasGoals = metaReceita > 0 || metaEventos > 0;

  if (!hasGoals && !isLoading) return null;

  const receitaAtual = stats?.faturamento_pago ?? 0;
  const eventosAtual = stats?.eventos_count ?? 0;
  const pctReceita = metaReceita > 0 ? Math.min((receitaAtual / metaReceita) * 100, 100) : 0;
  const pctEventos = metaEventos > 0 ? Math.min((eventosAtual / metaEventos) * 100, 100) : 0;
  const goalReached = pctReceita >= 100 || pctEventos >= 100;
  const bothGoalsReached = (metaReceita === 0 || pctReceita >= 100) && (metaEventos === 0 || pctEventos >= 100);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => hardNavigate('/goals')}
      className={`mb-8 w-full text-left p-5 rounded-2xl border transition-all group ${
        bothGoalsReached
          ? 'bg-gradient-to-br from-amber-900/30 to-yellow-900/20 border-amber-500/40 hover:border-amber-400/60'
          : goalReached
          ? 'bg-gradient-to-br from-emerald-900/20 to-gray-800/40 border-emerald-600/40 hover:border-emerald-500/50'
          : 'bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 hover:border-gray-600/60'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {bothGoalsReached
            ? <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}><Trophy className="w-4 h-4 text-amber-400" /></motion.div>
            : <Target className="w-4 h-4" style={{ color: accentColor }} />
          }
          <span className="text-sm font-bold text-white">Meta do mês</span>
          {bothGoalsReached && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30"
            >
              META BATIDA
            </motion.span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-2 bg-gray-800 rounded animate-pulse" />
          <div className="h-2 bg-gray-800 rounded animate-pulse w-2/3" />
        </div>
      ) : (
        <div className="space-y-4">
          {metaReceita > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Faturamento</span>
                <span>
                  {formatMoney(receitaAtual, !isVisible)} / {formatMoney(metaReceita, !isVisible)}
                  <span className={`ml-1 ${pctReceita >= 100 ? 'text-amber-400 font-bold' : 'text-gray-500'}`}>({Math.round(pctReceita)}%)</span>
                </span>
              </div>
              <ProgressBar value={receitaAtual} max={metaReceita} color={pctReceita >= 100 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : accentColor} />
            </div>
          )}
          {metaEventos > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Shows</span>
                <span>
                  {eventosAtual} / {metaEventos}
                  <span className={`ml-1 ${pctEventos >= 100 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>({Math.round(pctEventos)}%)</span>
                </span>
              </div>
              <ProgressBar value={eventosAtual} max={metaEventos} color={pctEventos >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : '#00D9FF'} />
            </div>
          )}
        </div>
      )}
    </motion.button>
  );
}
