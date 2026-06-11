import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Wallet, LineChart as LineChartIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

const CHART_ANIM_MS = 900;

const CustomTooltip = ({ active, payload, label, chartView }) => {
  const { formatCurrency } = useFinancialVisibility();
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-white font-bold text-sm mb-1">{label}</p>
        {chartView === 'overview' ? (
          <>
            {payload[0] && <p className="text-cyan-400 text-xs">{`Receita: ${formatCurrency(payload[0].value)}`}</p>}
            {payload[1] && <p className="text-rose-400 text-xs">{`Despesas: ${formatCurrency(payload[1].value)}`}</p>}
          </>
        ) : (
          <p className="text-xs" style={{ color: payload[0].color }}>{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
        )}
      </div>
    );
  }
  return null;
};

const GradientDefs = () => (
  <defs>
    <linearGradient id="gradRealized" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
    </linearGradient>
    <linearGradient id="gradReceivable" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.5} />
    </linearGradient>
    <linearGradient id="gradProjected" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
    </linearGradient>
    <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.5} />
    </linearGradient>
    <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.5} />
    </linearGradient>
  </defs>
);

const xAxisProps = {
  dataKey: 'name',
  stroke: '#94a3b8',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const yAxisProps = {
  stroke: '#94a3b8',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  tickFormatter: v => `R$${(v / 1000).toFixed(0)}k`,
};

const gridProps = { strokeDasharray: '3 3', stroke: '#1e293b' };
const legendStyle = { fontSize: '12px', color: '#cbd5e1' };

const chartVariants = {
  enter: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
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
        dataByDate[dateKey] = { date: dateKey, overview_receita: 0, overview_despesas: 0, realized: 0, receivable: 0, projected: 0 };
      }
      dataByDate[dateKey][type] += value || 0;
    };

    realized.forEach(e => {
      processItem(e.paid_date, e.calculated_value, 'overview_receita');
      processItem(e.paid_date, e.calculated_value, 'realized');
    });
    expenses.forEach(e => processItem(e.date, e.amount, 'overview_despesas'));
    receivable.forEach(e => processItem(e.end_date, e.calculated_value, 'receivable'));
    projected.forEach(e => processItem(e.end_date, e.calculated_value, 'projected'));

    return Object.values(dataByDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => {
        let displayName;
        try {
          const [_year, _month, _day] = item.date.split('-');
          displayName = format(parseISO(item.date), 'dd/MM', { locale: ptBR });
        } catch {
          displayName = item.date;
        }
        return { name: displayName, ...item };
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
    if (onDataClick && data?.activePayload?.length > 0) {
      onDataClick({ date: data.activePayload[0].payload.date, view: chartView });
    }
  };

  const renderChart = () => {
    switch (chartView) {
      case 'realized':
        return (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <GradientDefs />
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={legendStyle} />
            <Area
              type="monotone"
              dataKey="realized"
              name="Receita Realizada"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill="url(#gradRealized)"
              dot={{ r: 3, fill: '#22d3ee', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#fff', stroke: '#22d3ee', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
            />
          </AreaChart>
        );
      case 'receivable':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <GradientDefs />
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="receivable" name="A Receber" fill="url(#gradReceivable)" radius={[6, 6, 0, 0]}
              isAnimationActive animationDuration={CHART_ANIM_MS} animationEasing="ease-out" maxBarSize={40}>
              {chartData.map((_, i) => <Cell key={i} fill="url(#gradReceivable)" />)}
            </Bar>
          </BarChart>
        );
      case 'projected':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <GradientDefs />
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="projected" name="Projetado" fill="url(#gradProjected)" radius={[6, 6, 0, 0]}
              isAnimationActive animationDuration={CHART_ANIM_MS} animationEasing="ease-out" maxBarSize={40}>
              {chartData.map((_, i) => <Cell key={i} fill="url(#gradProjected)" />)}
            </Bar>
          </BarChart>
        );
      default:
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} onClick={handleChartElementClick}>
            <GradientDefs />
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip chartView={chartView} />} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="overview_receita" name="Receita" fill="url(#gradReceita)" radius={[4, 4, 0, 0]}
              isAnimationActive animationDuration={CHART_ANIM_MS} animationEasing="ease-out" maxBarSize={28} />
            <Bar dataKey="overview_despesas" name="Despesas" fill="url(#gradDespesas)" radius={[4, 4, 0, 0]}
              isAnimationActive animationDuration={CHART_ANIM_MS} animationBegin={120} animationEasing="ease-out" maxBarSize={28} />
          </BarChart>
        );
    }
  };

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={chartView}
            variants={chartVariants}
            initial="enter"
            animate="visible"
            exit="exit"
          >
            <ResponsiveContainer width="100%" height={300}>
              {renderChart()}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
