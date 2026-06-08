import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Wallet, LineChart as LineChartIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

const CustomTooltip = ({ active, payload, label, chartView }) => {
  const { formatCurrency } = useFinancialVisibility();
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="label text-white font-bold text-sm mb-1">{`${label}`}</p>
        {chartView === 'overview' ? (
          <>
            <p className="text-cyan-400 text-xs">{`Receita: ${formatCurrency(payload[0].value)}`}</p>
            <p className="text-rose-400 text-xs">{`Despesas: ${formatCurrency(payload[1].value)}`}</p>
          </>
        ) : (
          <p className="text-xs" style={{color: payload[0].color}}>{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function ReportsChart({ chartInput, onDataClick }) {
  const { isVisible } = useFinancialVisibility();
  const [chartView, setChartView] = useState('overview');

  const chartData = useMemo(() => {
    const { 
      realized = [], 
      receivable = [], 
      projected = [], 
      expenses = [] 
    } = chartInput || {};
    
    if (!isVisible) return [];

    const dataByDate = {};

    const processItem = (dateStr, value, type) => {
      if (!dateStr || !value) return;
      const dateKey = dateStr.split('T')[0];
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = {
          date: dateKey,
          overview_receita: 0,
          overview_despesas: 0,
          realized: 0,
          receivable: 0,
          projected: 0
        };
      }
      dataByDate[dateKey][type] += value || 0;
    };

    realized.forEach(event => {
      processItem(event.paid_date, event.calculated_value, 'overview_receita');
      processItem(event.paid_date, event.calculated_value, 'realized');
    });
    
    expenses.forEach(e => {
      processItem(e.date, e.amount, 'overview_despesas');
    });
    
    receivable.forEach(event => {
      processItem(event.end_date, event.calculated_value, 'receivable');
    });
    
    projected.forEach(event => {
      processItem(event.start_date, event.calculated_value, 'projected');
    });

    return Object.values(dataByDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => {
        let displayName;
        try {
          const [year, month, day] = item.date.split('-');
          const dateForDisplay = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          displayName = format(dateForDisplay, 'dd/MM', { locale: ptBR });
        } catch (error) {
          console.warn('Erro ao formatar data para exibição:', item.date, error);
          displayName = item.date;
        }
        
        return {
          name: displayName,
          ...item
        };
      });
  }, [chartInput, isVisible]);

  if (!isVisible) {
    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-cyan-300 font-display flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">Análise Financeira</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center px-4">
                <p className="text-slate-400 text-sm">Dados financeiros ocultos.</p>
            </CardContent>
        </Card>
    );
  }
  
  const handleChartElementClick = (data) => {
    if (onDataClick && data && data.activePayload && data.activePayload.length > 0) {
      onDataClick({ date: data.activePayload[0].payload.date, view: chartView });
    }
  };

  const renderChart = () => {
    const yAxisTickFormatter = (value) => `R$${(value / 1000).toFixed(0)}k`;

    const xAxisProps = {
      dataKey: "name",
      stroke: "#94a3b8",
      fontSize: 11,
      tickLine: false,
      axisLine: false,
      angle: 0,
      textAnchor: "middle"
    };

    const gridStroke = "#334155";

    switch(chartView) {
      case 'realized':
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={yAxisTickFormatter} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
            <Line type="monotone" dataKey="realized" name="Receita Realizada" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        );
      case 'receivable':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={yAxisTickFormatter} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
            <Bar dataKey="receivable" name="A Receber" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'projected':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={yAxisTickFormatter} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
            <Bar dataKey="projected" name="Projetado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      default:
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={yAxisTickFormatter} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
            <Bar dataKey="overview_receita" fill="#22d3ee" name="Receita" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overview_despesas" fill="#f43f5e" name="Despesas" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="px-4 sm:px-6 pb-3">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-cyan-300 font-display flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">Análise Financeira</span>
          </CardTitle>
          <Tabs value={chartView} onValueChange={setChartView} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-auto gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1 py-2 px-2 text-xs">
                <BarChart3 className="w-3 h-3" />
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="realized" className="flex items-center gap-1 py-2 px-2 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span className="hidden sm:inline">Realizado</span>
              </TabsTrigger>
              <TabsTrigger value="receivable" className="flex items-center gap-1 py-2 px-2 text-xs">
                <Wallet className="w-3 h-3" />
                <span className="hidden sm:inline">A Receber</span>
              </TabsTrigger>
              <TabsTrigger value="projected" className="flex items-center gap-1 py-2 px-2 text-xs">
                <LineChartIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Projetado</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6">
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}