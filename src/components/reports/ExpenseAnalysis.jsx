import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Wallet } from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

const COLORS = ['#ec4899', '#38bdf8', '#818cf8', '#facc15', '#4ade80', '#a78bfa', '#f87171'];
const categoryLabels = {
  'transporte': 'Transporte',
  'alimentacao': 'Alimentação', 
  'equipamento': 'Equipamento',
  'hospedagem': 'Hospedagem',
  'combustivel': 'Combustível',
  'manutencao': 'Manutenção',
  'outros': 'Outros'
};

const CustomTooltip = ({ active, payload }) => {
  const { formatCurrency } = useFinancialVisibility();
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-3 rounded-lg shadow-lg text-white">
        <p className="font-bold">{data.name}</p>
        <p style={{ color: data.payload.fill }}>
          {`${formatCurrency(data.value)} (${data.payload.percent.toFixed(0)}%)`}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpenseAnalysis({ expenses = [], onSliceClick }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();

  const expenseData = useMemo(() => {
    if (!isVisible || !Array.isArray(expenses) || expenses.length === 0) {
      return [];
    }

    const grouped = expenses.reduce((acc, expense) => {
      const category = categoryLabels[expense.category] || 'Outros';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {});
    
    const total = Object.values(grouped).reduce((sum, value) => sum + value, 0);

    return Object.entries(grouped)
      .map(([name, value], index) => ({
        name,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, isVisible]);
  
  if (!isVisible) {
      return null; // Don't render the component if financials are hidden
  }
  
  if (expenseData.length === 0) {
      return (
          <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                  <CardTitle className="text-pink-300 font-display flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Análise de Despesas
                  </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                  <p className="text-slate-400">Nenhuma despesa no período selecionado.</p>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-pink-300 font-display flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Análise de Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={5}
              >
                {expenseData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    onClick={() => onSliceClick && onSliceClick(entry.name)}
                    style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="overflow-y-auto max-h-[250px] text-sm space-y-2 pr-2">
            {expenseData.map((entry) => (
              <div
                key={entry.name}
                className="flex justify-between items-center hover:bg-slate-800/40 rounded px-2 py-1 transition-colors"
                onClick={() => onSliceClick && onSliceClick(entry.name)}
                style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300">{entry.name}</span>
                </div>
                <div className="font-mono text-white text-right">
                  <span className="font-bold">{formatCurrency(entry.value)}</span>
                  <span className="text-xs text-slate-400 ml-2">({entry.percent.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}