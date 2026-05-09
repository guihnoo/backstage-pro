
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, BarChart2 } from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function PeriodSummary({ 
  period = 'month', 
  realizedRevenueEvents = [], 
  expenses = [], 
  accountsReceivable = 0,
  projectedRevenue = 0,
  loading = false,
  onCardClick 
}) {
  const { formatCurrency } = useFinancialVisibility();

  const financialData = useMemo(() => {
    const periodRevenueEvents = Array.isArray(realizedRevenueEvents) ? realizedRevenueEvents : [];
    const periodExpenses = Array.isArray(expenses) ? expenses : [];
    
    const realizedRevenue = periodRevenueEvents.reduce((sum, event) => sum + (event.paid_amount || 0), 0);
    const totalExpenses = periodExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const profit = realizedRevenue - totalExpenses;

    return {
      revenue: realizedRevenue,
      expenses: totalExpenses,
      profit,
    };
  }, [realizedRevenueEvents, expenses]);

  const cards = [
    { id: 'realizedRevenue', title: `Receita (${period === 'week' ? 'Semana' : 'Mês'})`, value: financialData.revenue, icon: DollarSign, color: "text-green-400" },
    { id: 'totalExpenses', title: `Despesas (${period === 'week' ? 'Semana' : 'Mês'})`, value: financialData.expenses, icon: TrendingDown, color: "text-red-400" },
    { id: 'netProfit', title: `Lucro (${period === 'week' ? 'Semana' : 'Mês'})`, value: financialData.profit, icon: TrendingUp, color: financialData.profit >= 0 ? "text-cyan-400" : "text-orange-400" },
    { id: 'accountsReceivable', title: "A Receber (Total)", value: accountsReceivable, icon: AlertCircle, color: "text-amber-400" },
    { id: 'projectedRevenue', title: "Projetado (Total)", value: projectedRevenue, icon: BarChart2, color: "text-indigo-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800 p-4">
            <Skeleton className="h-5 w-24 mb-3 bg-slate-700" />
            <Skeleton className="h-8 w-32 bg-slate-700" />
          </Card>
        ))
      ) : (
        cards.map((card, index) => (
          <div 
            key={card.id} 
            onClick={() => onCardClick && onCardClick(card.id)} 
            className={`${onCardClick ? 'cursor-pointer' : ''} group`} // Added 'group' class for group-hover effect
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 text-white p-4 h-full transition-all group-hover:border-cyan-400/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300 font-medium">{card.title}</p>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className={`text-2xl font-bold font-mono mt-2 ${card.color}`}>
                  {formatCurrency(card.value)}
                </p>
              </Card>
            </motion.div>
          </div>
        ))
      )}
    </div>
  );
}
