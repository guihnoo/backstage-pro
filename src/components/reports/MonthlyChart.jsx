import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp } from 'lucide-react';
import ReportsChart from './ReportsChart';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { parseISO, isValid } from 'date-fns';
import { getEventCacheAmount } from '@/lib/eventFinance';

export default function MonthlyChart({ events = [], dailyWork = [], expenses = [], _periodStart }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();

  // LÓGICA ALINHADA: Calcular dados para o gráfico (memoizado para performance)
  const chartInput = useMemo(() => {
    const now = new Date();

    // RECEITA REALIZADA: eventos pagos pelo paid_date
    const realized = events
      .filter(e => e.payment_status === 'paid' && e.paid_date && e.paid_amount)
      .map(e => ({
        paid_date: e.paid_date,
        calculated_value: e.paid_amount
      }));

    // A RECEBER: eventos não pagos pelo payment_due_date ou end_date
    const receivable = events
      .filter(e => {
        if (e.payment_status === 'paid') return false;
        const referenceDate = e.payment_due_date || e.end_date;
        return referenceDate;
      })
      .map(e => {
        // Calcular valor baseado no trabalho ou estimativa
        const eventWork = dailyWork.filter(w => w.event_id === e.id);
        let calculated_value = 0;
        
        if (eventWork.length > 0) {
          calculated_value = eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
        } else {
          calculated_value = getEventCacheAmount(e);
        }

        return {
          end_date: e.payment_due_date || e.end_date,
          calculated_value
        };
      });

    // PROJETADO: eventos futuros (scheduled)
    const projected = events
      .filter(e => {
        if (e.payment_status === 'paid') return false;
        try {
          const startDate = parseISO(e.start_date);
          return isValid(startDate) && startDate > now;
        } catch {
          return false;
        }
      })
      .map(e => {
        return {
          start_date: e.start_date,
          calculated_value: getEventCacheAmount(e)
        };
      });

    return { realized, receivable, projected, expenses };
  }, [events, dailyWork, expenses]);

  const { totalRevenue, totalExpenses } = useMemo(() => {
    const revenue = chartInput.realized.reduce((sum, r) => sum + r.calculated_value, 0);
    const expenses = chartInput.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return { totalRevenue: revenue, totalExpenses: expenses };
  }, [chartInput]);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 text-white">
            <BarChart className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 flex-shrink-0" />
            <span className="truncate">Evolução Mensal</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-slate-400">Receita:</span>
              <span className="font-bold text-green-400">
                {isVisible ? formatCurrency(totalRevenue) : '•••••'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Despesas:</span>
              <span className="font-bold text-red-400">
                {isVisible ? formatCurrency(totalExpenses) : '•••••'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6">
        <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
          <div className="min-w-[300px] sm:min-w-0">
            <ReportsChart chartInput={chartInput} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}