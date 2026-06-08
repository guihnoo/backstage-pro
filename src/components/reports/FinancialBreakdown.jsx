import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp,
  TrendingDown,
  LineChart,
  Loader2
} from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

const MetricCard = ({ icon: Icon, title, value, colorClass, subtitle, onClick, loading }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`bg-slate-800/60 rounded-lg p-4 flex flex-col justify-between border-b-2 ${colorClass.border} hover:bg-slate-800 transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <Icon className={`w-6 h-6 ${colorClass.text}`} />
      </div>
      <div>
        <p className="text-3xl font-bold font-mono text-white">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : value}
        </p>
        {subtitle && <p className={`text-xs ${colorClass.text}`}>{subtitle}</p>}
      </div>
    </motion.div>
  );
};

export default function FinancialBreakdown({ summary, loading, onMetricClick }) {
  const { formatCurrency } = useFinancialVisibility();
  
  const metrics = [
    {
      id: 'realizedRevenue',
      title: 'Receita Realizada',
      value: formatCurrency(summary?.realizedRevenue ?? 0),
      icon: DollarSign,
      colorClass: { text: 'text-green-400', border: 'border-green-400/50' },
      subtitle: 'Valores recebidos no período.'
    },
    {
      id: 'accountsReceivable',
      title: 'A Receber (Concluídos)',
      value: formatCurrency(summary?.accountsReceivable ?? 0),
      icon: Wallet,
      colorClass: { text: 'text-amber-400', border: 'border-amber-400/50' },
      subtitle: 'Eventos finalizados pendentes.'
    },
    {
      id: 'projectedRevenue',
      title: 'Receita Projetada',
      value: formatCurrency(summary?.projectedRevenue ?? 0),
      icon: LineChart,
      colorClass: { text: 'text-blue-400', border: 'border-blue-400/50' },
      subtitle: 'Eventos agendados no período.'
    },
    {
      id: 'totalExpenses',
      title: 'Total de Despesas',
      value: formatCurrency(summary?.totalExpenses ?? 0),
      icon: TrendingDown,
      colorClass: { text: 'text-red-400', border: 'border-red-400/50' },
      subtitle: 'Gastos registrados no período.'
    },
    {
      id: 'netProfit',
      title: 'Lucro Líquido',
      value: formatCurrency(summary?.netProfit ?? 0),
      icon: TrendingUp,
      colorClass: { 
        text: (summary?.netProfit ?? 0) >= 0 ? 'text-cyan-400' : 'text-orange-400',
        border: (summary?.netProfit ?? 0) >= 0 ? 'border-cyan-400/50' : 'border-orange-400/50'
      },
      subtitle: 'Receita Realizada - Despesas.'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map(metric => (
        <MetricCard
          key={metric.id}
          {...metric}
          loading={loading}
          onClick={() => onMetricClick && onMetricClick(metric.id)}
        />
      ))}
    </div>
  );
}