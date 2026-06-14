import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Hourglass, CircleDollarSign } from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const COLOR_CLASSES = {
  green:  { bg: 'bg-green-500/20',  text: 'text-green-400'  },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  red:    { bg: 'bg-red-500/20',    text: 'text-red-400'    },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  blue:   { bg: 'bg-blue-500/20',   text: 'text-blue-400'   },
};

const StatCard = ({ icon, title, value, color, delay }) => {
  const Icon = icon;
  const { primaryHex } = useCategoryTheme();
  const isPrimary = color === 'primary';
  const { bg, text } = isPrimary ? {} : (COLOR_CLASSES[color] || COLOR_CLASSES.blue);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="flex-1"
    >
      <Card className="bg-slate-800/50 border-slate-700/80 h-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg flex-shrink-0 ${isPrimary ? '' : bg}`}
              style={isPrimary ? { background: `${primaryHex}33` } : undefined}
            >
              <Icon
                className={`w-6 h-6 ${isPrimary ? '' : text}`}
                style={isPrimary ? { color: primaryHex } : undefined}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-400 truncate">{title}</p>
              <p className="text-xl font-bold text-white truncate">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function FinancialSummary({ stats }) {
  const { formatCurrency, formatValue } = useFinancialVisibility();

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Resumo Detalhado</h3>
      
      {/* Primeira linha: Métricas financeiras principais */}
      <div className="flex flex-col sm:flex-row gap-4">
        <StatCard
          icon={TrendingUp}
          title="Receita Realizada"
          value={formatCurrency(stats.realizedRevenue || 0)}
          color="green"
          delay={0}
        />
        <StatCard
          icon={CircleDollarSign}
          title="A Receber"
          value={formatCurrency(stats.receivableRevenue || 0)}
          color="yellow"
          delay={0.1}
        />
      </div>
      
      {/* Segunda linha: Despesas e lucro */}
      <div className="flex flex-col sm:flex-row gap-4">
        <StatCard
          icon={TrendingDown}
          title="Despesas"
          value={formatCurrency(stats.totalExpenses || 0)}
          color="red"
          delay={0.2}
        />
        <StatCard
          icon={DollarSign}
          title="Lucro Líquido"
          value={formatCurrency(stats.netProfit || 0)}
          color="primary"
          delay={0.3}
        />
      </div>
      
      {/* Terceira linha: Métricas operacionais */}
      <div className="flex flex-col sm:flex-row gap-4">
        <StatCard
          icon={Hourglass}
          title="Horas Trabalhadas"
          value={formatValue(Math.round(stats.totalHours || 0), 'h')}
          color="purple"
          delay={0.4}
        />
        <StatCard
          icon={TrendingUp}
          title="Projetado"
          value={formatCurrency(stats.projectedRevenue || 0)}
          color="blue"
          delay={0.5}
        />
      </div>
    </div>
  );
}