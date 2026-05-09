import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, HelpCircle } from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MetricCard = ({ title, currentValue, previousValue, formatFn }) => {
  const diff = currentValue - previousValue;
  const percentageChange = previousValue !== 0 ? (diff / Math.abs(previousValue)) * 100 : (currentValue !== 0 ? 100 : 0);

  let Icon, color, text;
  if (Math.abs(percentageChange) < 0.1) {
    Icon = Minus;
    color = 'text-slate-400';
    text = 'Estável';
  } else if (diff > 0) {
    Icon = ArrowUpRight;
    color = 'text-green-400';
    text = `${percentageChange.toFixed(0)}%`;
  } else {
    Icon = ArrowDownRight;
    color = 'text-red-400';
    text = `${percentageChange.toFixed(0)}%`;
  }

  // Inverter lógica para despesas (aumento é ruim, diminuição é bom)
  if (title.toLowerCase().includes('despesas')) {
    if (diff > 0) {
      color = 'text-red-400';
      Icon = ArrowUpRight;
    } else if (diff < 0) {
      color = 'text-green-400';
      Icon = ArrowDownRight;
    }
  }
  
  const tooltipText = `Atual: ${formatFn(currentValue)} | Anterior: ${formatFn(previousValue)}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-slate-800/60 p-4 rounded-lg text-center">
            <p className="text-sm text-slate-300 mb-1">{title}</p>
            <p className="text-xl font-bold text-white">{formatFn(currentValue)}</p>
            <div className={`flex items-center justify-center gap-1 mt-1 text-sm font-medium ${color}`}>
              <Icon className="w-4 h-4" />
              <span>{text}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-white border-slate-700">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


export default function PeriodComparison({ currentSummary, previousSummary, periodName }) {
  const { formatCurrency } = useFinancialVisibility();

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Comparativo de Período
           <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-slate-700 max-w-xs">
                  <p>Compara as métricas do período selecionado ({periodName}) com o período imediatamente anterior de mesma duração.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Receita Realizada" 
          currentValue={currentSummary.realizedRevenue}
          previousValue={previousSummary.realizedRevenue}
          formatFn={formatCurrency}
        />
        <MetricCard 
          title="Despesas" 
          currentValue={currentSummary.totalExpenses}
          previousValue={previousSummary.totalExpenses}
          formatFn={formatCurrency}
        />
        <MetricCard 
          title="Eventos Concluídos" 
          currentValue={currentSummary.events?.filter(e => e.status === 'completed').length || 0}
          previousValue={previousSummary.completedEvents?.length || 0}
          formatFn={(val) => `${val} evento(s)`}
        />
        <MetricCard 
          title="Dias Trabalhados" 
          currentValue={currentSummary.work?.length || 0}
          previousValue={previousSummary.work?.length || 0}
          formatFn={(val) => `${val} dia(s)`}
        />
      </CardContent>
    </Card>
  );
}