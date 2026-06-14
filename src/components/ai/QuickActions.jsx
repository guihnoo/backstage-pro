import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Calendar,
  Users,
  Receipt,
  BarChart3,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const quickActions = [
  {
    id: 'monthly_summary',
    label: 'Resumo do Mês',
    icon: BarChart3,
    prompt: 'Me dê um resumo completo deste mês: faturamento, despesas, eventos e principais insights.',
    themeGradient: 'primary',
  },
  {
    id: 'pending_payments',
    label: 'Pagamentos Pendentes',
    icon: AlertCircle,
    prompt: 'Quais eventos estão com pagamento pendente? Liste por ordem de prioridade.',
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'upcoming_events',
    label: 'Próximos Eventos',
    icon: Calendar,
    prompt: 'Quais são meus próximos 5 eventos? Me dê detalhes de cada um.',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'top_clients',
    label: 'Melhores Clientes',
    icon: Users,
    prompt: 'Analise meus top 3 clientes: quem mais gerou receita e quais padrões você identifica?',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'expenses_analysis',
    label: 'Análise de Despesas',
    icon: Receipt,
    prompt: 'Analise minhas despesas este mês por categoria. Onde posso economizar?',
    color: 'from-orange-500 to-yellow-600'
  },
  {
    id: 'revenue_forecast',
    label: 'Projeção de Receita',
    icon: TrendingUp,
    prompt: 'Com base nos eventos agendados, qual a projeção de faturamento para o próximo mês?',
    themeGradient: 'accent',
  },
  {
    id: 'missing_hours',
    label: 'Horas Não Registradas',
    icon: Clock,
    prompt: 'Quais eventos finalizados ainda não têm horas registradas?',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'client_insights',
    label: 'Insights de Clientes',
    icon: Users,
    prompt: 'Me dê insights sobre meus clientes: quem está ativo, quem está em risco, oportunidades de upsell.',
    color: 'from-violet-500 to-purple-600'
  }
];

export default function QuickActions({ onSelectAction, limit = null }) {
  const { primaryHex, accentHex } = useCategoryTheme();
  const actionsToShow = limit ? quickActions.slice(0, limit) : quickActions;

  const getIconBackground = (action) => {
    if (action.themeGradient === 'primary') {
      return { background: `linear-gradient(to bottom right, ${primaryHex}, #2563eb)` };
    }
    if (action.themeGradient === 'accent') {
      return { background: `linear-gradient(to bottom right, ${accentHex}, ${primaryHex})` };
    }
    return undefined;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {actionsToShow.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              className="w-full h-auto flex flex-col items-center gap-3 p-4 bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700 group"
              onClick={() => onSelectAction(action.prompt)}
            >
              <div
                className={`p-3 rounded-xl bg-opacity-10 group-hover:scale-110 transition-transform ${action.themeGradient ? '' : `bg-gradient-to-br ${action.color}`}`}
                style={getIconBackground(action)}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white text-center leading-tight">
                {action.label}
              </span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}