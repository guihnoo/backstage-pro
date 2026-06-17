import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Hourglass, CircleDollarSign, BarChart3 } from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const CARDS = [
  {
    key: 'realizedRevenue',
    icon: TrendingUp,
    label: 'Realizado',
    color: '#10b981',
    bg: 'bg-emerald-500/8 border-emerald-500/20',
    isCurrency: true,
  },
  {
    key: 'receivableRevenue',
    icon: CircleDollarSign,
    label: 'A Receber',
    color: '#f59e0b',
    bg: 'bg-amber-500/8 border-amber-500/20',
    isCurrency: true,
  },
  {
    key: 'totalExpenses',
    icon: TrendingDown,
    label: 'Despesas',
    color: '#f87171',
    bg: 'bg-red-500/8 border-red-500/20',
    isCurrency: true,
  },
  {
    key: 'netProfit',
    icon: DollarSign,
    label: 'Lucro Líquido',
    color: null, // dynamic based on sign
    bg: null,    // dynamic
    isCurrency: true,
    dynamic: true,
  },
  {
    key: 'totalHours',
    icon: Hourglass,
    label: 'Horas',
    color: '#94a3b8',
    bg: 'bg-slate-500/8 border-slate-500/20',
    isCurrency: false,
    unit: 'h',
    round: true,
  },
  {
    key: 'projectedRevenue',
    icon: BarChart3,
    label: 'Projetado',
    color: '#60a5fa',
    bg: 'bg-blue-500/8 border-blue-500/20',
    isCurrency: true,
  },
];

export default function FinancialSummary({ stats }) {
  const { formatCurrency, formatValue, isVisible } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();

  if (!stats) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Resumo Detalhado</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          const raw = stats[card.key] || 0;

          let color = card.color;
          let bg = card.bg;
          if (card.dynamic) {
            color = raw >= 0 ? '#10b981' : '#f87171';
            bg = raw >= 0 ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-red-500/8 border-red-500/20';
          }
          const isPrimary = card.key === 'netProfit' || card.key === 'realizedRevenue';

          let display;
          if (card.isCurrency) {
            display = isVisible ? formatCurrency(raw) : '•••••';
          } else if (card.round) {
            display = formatValue(Math.round(raw), card.unit || '');
          } else {
            display = formatValue(raw, card.unit || '');
          }

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`rounded-xl p-3 border ${bg}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{card.label}</p>
              </div>
              <p
                className="text-lg font-black leading-tight font-mono truncate"
                style={{ color: isPrimary ? (color || primaryHex) : color }}
              >
                {display}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
