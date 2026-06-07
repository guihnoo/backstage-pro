import { motion } from 'framer-motion';
import { Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { isVisible } = useFinancialVisibility();

  const metaReceita = Number(profile?.monthly_goal_revenue) || 0;
  const metaEventos = Number(profile?.monthly_goal_events) || 0;
  const hasGoals = metaReceita > 0 || metaEventos > 0;

  if (!hasGoals && !isLoading) return null;

  const receitaAtual = stats?.faturamento_pago ?? 0;
  const eventosAtual = stats?.eventos_count ?? 0;
  const pctReceita = metaReceita > 0 ? Math.min((receitaAtual / metaReceita) * 100, 100) : 0;
  const pctEventos = metaEventos > 0 ? Math.min((eventosAtual / metaEventos) * 100, 100) : 0;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate('/goals')}
      className="mb-8 w-full text-left p-5 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/40 hover:border-gray-600/60 transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-sm font-bold text-white">Meta do mês</span>
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
                  <span className="text-gray-500 ml-1">({Math.round(pctReceita)}%)</span>
                </span>
              </div>
              <ProgressBar value={receitaAtual} max={metaReceita} color={accentColor} />
            </div>
          )}
          {metaEventos > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Eventos</span>
                <span>
                  {eventosAtual} / {metaEventos}
                  <span className="text-gray-500 ml-1">({Math.round(pctEventos)}%)</span>
                </span>
              </div>
              <ProgressBar value={eventosAtual} max={metaEventos} color="#00D9FF" />
            </div>
          )}
        </div>
      )}
    </motion.button>
  );
}
