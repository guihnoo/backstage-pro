import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import {
  DollarSign,
  TrendingDown,
  Wallet,
  Briefcase,
  Percent,
  Hourglass,
  CalendarDays,
  BarChartBig,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

const MetricCard = ({ icon: Icon, title, value, colorClass, size = 'small', comparison = null }) => {
  const ComparisonIcon = comparison?.trend === 'up' ? ArrowUp : comparison?.trend === 'down' ? ArrowDown : Minus;
  const comparisonColor = comparison?.trend === 'up' ? 'text-green-400' : comparison?.trend === 'down' ? 'text-red-400' : 'text-slate-400';
  
  if (size === 'large') {
    return (
      <div className="bg-slate-800/60 p-4 rounded-lg flex-grow text-center border-b-2 border-slate-700">
        <Icon className={`w-6 h-6 mx-auto mb-2 ${colorClass}`} />
        <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">{title}</p>
        <p className={`text-2xl lg:text-3xl font-bold font-mono ${colorClass}`}>{value}</p>
        {comparison && (
          <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${comparisonColor}`}>
            <ComparisonIcon className="w-4 h-4" />
            <span>{comparison.text}</span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="bg-slate-800/60 p-3 rounded-lg flex items-center gap-3">
      <div className={`p-2 rounded-md bg-slate-700/50`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400">{title}</p>
        <p className="text-base font-bold text-white">{value}</p>
        {comparison && (
          <div className={`flex items-center gap-1 text-xs ${comparisonColor}`}>
            <ComparisonIcon className="w-3 h-3" />
            <span>{comparison.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ReportOverview({ data, previousData }) {
  const { formatCurrency } = useFinancialVisibility();

  const stats = useMemo(() => {
    const { events = [], work = [], expenses = [], clients = [] } = data;
    const { work: prevWork = [], expenses: prevExpenses = [] } = previousData;
    
    if (events.length === 0 && work.length === 0 && expenses.length === 0) {
      return null;
    }

    const totalRevenue = work.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    
    // Cálculos do período anterior
    const prevTotalRevenue = prevWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
    const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const prevNetProfit = prevTotalRevenue - prevTotalExpenses;
    
    // Comparações
    const revenueComparison = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
    const expenseComparison = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;
    const profitComparison = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0;
    
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const averageRevenuePerEvent = events.length > 0 ? totalRevenue / events.length : 0;
    const averageRevenuePerDay = work.length > 0 ? totalRevenue / work.length : 0;
    
    const totalWorkDays = work.length;
    const totalWorkHours = work.reduce((sum, w) => sum + (w.total_hours || 0), 0);
    const totalOvertimeHours = work.reduce((sum, w) => sum + (w.overtime_hours || 0), 0);
    const averageHoursPerDay = totalWorkDays > 0 ? totalWorkHours / totalWorkDays : 0;
    
    const clientEventCounts = events.reduce((acc, event) => {
      acc[event.client_id] = (acc[event.client_id] || 0) + 1;
      return acc;
    }, {});
    
    let busiestClientId = null;
    let maxEvents = 0;
    for (const clientId in clientEventCounts) {
      if (clientEventCounts[clientId] > maxEvents) {
        maxEvents = clientEventCounts[clientId];
        busiestClientId = clientId;
      }
    }
    
    const busiestClient = clients.find(c => c && c.id === busiestClientId);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalEvents: events.length,
      averageRevenuePerEvent,
      averageRevenuePerDay,
      profitMargin: profitMargin.toFixed(1) + '%',
      totalWorkDays,
      totalWorkHours: totalWorkHours.toFixed(1) + 'h',
      totalOvertimeHours: totalOvertimeHours.toFixed(1) + 'h',
      averageHoursPerDay: averageHoursPerDay.toFixed(1) + 'h',
      busiestClient: busiestClient ? `${busiestClient.name} (${maxEvents} eventos)` : 'N/A',
      // Comparações
      revenueComparison: {
        trend: revenueComparison > 0 ? 'up' : revenueComparison < 0 ? 'down' : 'neutral',
        text: `${Math.abs(revenueComparison).toFixed(1)}% vs. período anterior`
      },
      expenseComparison: {
        trend: expenseComparison > 0 ? 'up' : expenseComparison < 0 ? 'down' : 'neutral',
        text: `${Math.abs(expenseComparison).toFixed(1)}% vs. período anterior`
      },
      profitComparison: {
        trend: profitComparison > 0 ? 'up' : profitComparison < 0 ? 'down' : 'neutral',
        text: `${Math.abs(profitComparison).toFixed(1)}% vs. período anterior`
      }
    };
  }, [data, previousData]);
  
  if (!stats) return null;

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-300 font-display flex items-center gap-2">
          <BarChartBig className="w-5 h-5" />
          Visão Geral do Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Financial Metrics with Comparisons */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <MetricCard 
            icon={DollarSign} 
            title="Faturamento Bruto" 
            value={formatCurrency(stats.totalRevenue)} 
            colorClass="text-green-400" 
            size="large"
            comparison={stats.revenueComparison}
          />
          <MetricCard 
            icon={TrendingDown} 
            title="Total de Despesas" 
            value={formatCurrency(stats.totalExpenses)} 
            colorClass="text-red-400" 
            size="large"
            comparison={stats.expenseComparison}
          />
          <MetricCard 
            icon={Wallet} 
            title="Lucro Líquido" 
            value={formatCurrency(stats.netProfit)} 
            colorClass="text-cyan-400" 
            size="large"
            comparison={stats.profitComparison}
          />
        </div>
        
        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard icon={Briefcase} title="Total de Eventos" value={stats.totalEvents} colorClass="text-purple-400" />
          <MetricCard icon={DollarSign} title="Média por Evento" value={formatCurrency(stats.averageRevenuePerEvent)} colorClass="text-amber-400" />
          <MetricCard icon={DollarSign} title="Média por Dia" value={formatCurrency(stats.averageRevenuePerDay)} colorClass="text-emerald-400" />
          <MetricCard icon={Percent} title="Margem de Lucro" value={stats.profitMargin} colorClass="text-violet-400" />
          <MetricCard icon={CalendarDays} title="Dias Trabalhados" value={`${stats.totalWorkDays}`} colorClass="text-blue-400" />
          <MetricCard icon={Hourglass} title="Média h/dia" value={stats.averageHoursPerDay} colorClass="text-pink-400" />
        </div>
      </CardContent>
    </Card>
  );
}