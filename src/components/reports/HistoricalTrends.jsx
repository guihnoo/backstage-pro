
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { normalizeDateString } from '../utils/dateUtils';

export default function HistoricalTrends({ allData, onPointClick }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const trendsData = useMemo(() => {
    if (!isVisible || !allData || !allData.dailyWork || !allData.expenses || !allData.events) return [];

    const endDate = new Date();
    const startDate = subMonths(endDate, 5);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const monthlyData = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthWork = allData.dailyWork.filter(w => {
        if (!w.date) return false;
        const workDate = new Date(normalizeDateString(w.date));
        return workDate >= monthStart && workDate <= monthEnd;
      });

      const monthExpenses = allData.expenses.filter(e => {
        if (!e.date) return false;
        const expenseDate = new Date(normalizeDateString(e.date));
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const monthPaidEvents = allData.events.filter(e => {
        if (e.payment_status !== 'paid' || !e.paid_date) return false;
        const paidDate = new Date(normalizeDateString(e.paid_date));
        return paidDate >= monthStart && paidDate <= monthEnd;
      });

      const generatedRevenue = monthWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
      const receivedRevenue = monthPaidEvents.reduce((sum, e) => sum + (e.paid_amount || 0), 0);
      const expensesTotal = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netProfit = receivedRevenue - expensesTotal;

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        fullMonth: format(month, 'MMMM yyyy', { locale: ptBR }),
        generatedRevenue,
        receivedRevenue,
        expenses: expensesTotal,
        netProfit,
      };
    });

    return monthlyData;
  }, [allData, isVisible]);

  const CustomTooltip = ({ active, payload, label: _label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 p-4 rounded-lg shadow-lg">
          <p className="text-white font-bold mb-2">{data.fullMonth}</p>
          <div className="space-y-1 text-sm">
            <p className="text-cyan-400">Gerado: {formatCurrency(data.generatedRevenue)}</p>
            <p className="text-green-400">Recebido: {formatCurrency(data.receivedRevenue)}</p>
            <p className="text-red-400">Despesas: {formatCurrency(data.expenses)}</p>
            <p className="text-purple-400 font-bold">Lucro Líquido: {formatCurrency(data.netProfit)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isVisible || !trendsData || trendsData.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-indigo-300 font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tendências Históricas (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-400">
            {!isVisible ? 'Dados financeiros ocultos.' : 'Dados insuficientes para análise de tendências.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-indigo-300 font-display flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tendências Históricas (6 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="generatedRevenue"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{ fill: '#22d3ee', strokeWidth: 2, r: 4 }}
              name="Gerado"
              onClick={(data) => onPointClick && onPointClick({ month: data?.payload?.fullMonth, key: 'generatedRevenue' })}
              cursor={onPointClick ? 'pointer' : 'default'}
            />
             <Line
              type="monotone"
              dataKey="receivedRevenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              name="Recebido"
              onClick={(data) => onPointClick && onPointClick({ month: data?.payload?.fullMonth, key: 'receivedRevenue' })}
              cursor={onPointClick ? 'pointer' : 'default'}
            />
            <Line
              type="monotone"
              dataKey="netProfit"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#a78bfa', strokeWidth: 2, r: 3 }}
              name="Lucro Líquido"
              onClick={(data) => onPointClick && onPointClick({ month: data?.payload?.fullMonth, key: 'netProfit' })}
              cursor={onPointClick ? 'pointer' : 'default'}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
