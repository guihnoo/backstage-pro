import { motion } from 'framer-motion';
import { Target, ChevronRight, Trophy } from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { Skeleton } from '@/components/ui/skeleton';

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

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();

  const metaReceita = Number(profile?.monthly_goal_revenue) || 0;
  const metaDiarias = Number(profile?.monthly_goal_events) || 0;
  const hasGoals = metaReceita > 0 || metaDiarias > 0;

  if (!hasGoals && !isLoading) {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => hardNavigate('/goals')}
        className="mb-8 w-full text-left p-5 rounded-2xl border border-dashed border-gray-700/60 bg-gray-900/40 hover:border-gray-600/80 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: accentColor }} />
            <div>
              <span className="text-sm font-bold text-white block">Defina sua meta do mês</span>
              <span className="text-xs text-gray-500">Faturamento e diárias — acompanhe o progresso aqui</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </div>
      </motion.button>
    );
  }

  const receitaAtual = stats?.faturamento_pago ?? 0;
  const diariasAtual = stats?.diarias_count ?? 0;
  const pctReceita = metaReceita > 0 ? Math.min((receitaAtual / metaReceita) * 100, 100) : 0;
  const pctDiarias = metaDiarias > 0 ? Math.min((diariasAtual / metaDiarias) * 100, 100) : 0;
  const goalReached = pctReceita >= 100 || pctDiarias >= 100;
  const bothGoalsReached = (metaReceita === 0 || pctReceita >= 100) && (metaDiarias === 0 || pctDiarias >= 100);

  const pctMes = Math.round((dayOfMonth / daysInMonth) * 100);
  const projecaoReceita = dayOfMonth > 0 && receitaAtual > 0
    ? Math.round((receitaAtual / dayOfMonth) * daysInMonth)
    : 0;

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
          <div className="flex justify-between mb-1.5">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between mb-1.5 mt-1">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-2 w-2/3 rounded-full" />
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
          {metaDiarias > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Diárias</span>
                <span>
                  {diariasAtual} / {metaDiarias}
                  <span className={`ml-1 ${pctDiarias >= 100 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>({Math.round(pctDiarias)}%)</span>
                </span>
              </div>
              <ProgressBar value={diariasAtual} max={metaDiarias} color={pctDiarias >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : accentColor} />
            </div>
          )}

          {/* Ritmo do mês */}
          {!bothGoalsReached && (
            <div className="pt-3 mt-1 border-t border-gray-800/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-600">
                Dia {dayOfMonth}/{daysInMonth} · {pctMes}% do mês
              </span>
              {metaReceita > 0 && projecaoReceita > 0 && (
                <span className={`text-[10px] font-mono ${
                  projecaoReceita >= metaReceita ? 'text-emerald-500' :
                  projecaoReceita >= metaReceita * 0.75 ? 'text-amber-500' : 'text-red-500/80'
                }`}>
                  projeção {formatMoney(projecaoReceita, !isVisible)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </motion.button>
  );
}
