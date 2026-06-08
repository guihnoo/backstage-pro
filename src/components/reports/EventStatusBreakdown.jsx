import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Calendar, Clock, CheckCircle2, Archive, PieChart as PieChartIcon } from 'lucide-react';
import { getEventStatus } from '../utils/dateUtils';
import { motion } from 'framer-motion';

const statusConfig = {
  scheduled: { 
    label: 'Agendados', 
    color: '#3b82f6', 
    icon: Calendar,
    hoverColor: '#2563eb'
  },
  in_progress: { 
    label: 'Em Andamento', 
    color: '#f59e0b', 
    icon: Clock,
    hoverColor: '#d97706'
  },
  completed: { 
    label: 'Concluídos', 
    color: '#10b981', 
    icon: CheckCircle2,
    hoverColor: '#059669'
  },
  archived: { 
    label: 'Arquivados', 
    color: '#6b7280', 
    icon: Archive,
    hoverColor: '#4b5563'
  }
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const config = statusConfig[data.payload.status];
    const Icon = config.icon;
    
    return (
      <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4" style={{ color: config.color }} />
          <p className="font-bold text-cyan-300">{data.payload.name}</p>
        </div>
        <p className="text-sm text-slate-300">
          <span className="font-semibold">{data.value}</span> evento{data.value !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-slate-400 mt-1">Clique para ver detalhes</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload, onLegendClick }) => (
  <div className="flex flex-wrap justify-center gap-4 mt-4">
    {payload.map((entry, index) => {
      const config = statusConfig[entry.payload.status];
      const Icon = config.icon;
      
      return (
        <motion.button
          key={index}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onLegendClick && onLegendClick(entry.payload.status)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all cursor-pointer border border-slate-700 hover:border-slate-600"
        >
          <Icon className="w-4 h-4" style={{ color: entry.color }} />
          <span className="text-sm text-slate-200">{entry.value}</span>
          <span className="text-xs text-slate-400">({entry.payload.value})</span>
        </motion.button>
      );
    })}
  </div>
);

export default function EventStatusBreakdown({ events, onStatusClick }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(events)) return [];

    const statusCounts = events.reduce((acc, event) => {
      if (!event) return acc;
      const status = getEventStatus(event);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusConfig[status]?.label || status,
      value: count,
      status: status,
      color: statusConfig[status]?.color || '#6b7280'
    })).filter(item => item.value > 0);
  }, [events]);

  const handlePieClick = (data) => {
    if (onStatusClick && data?.status) {
      onStatusClick(data.status);
    }
  };

  const handleLegendClick = (status) => {
    if (onStatusClick) {
      onStatusClick(status);
    }
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-cyan-400" />
            Distribuição de Status dos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-slate-400">Nenhum evento encontrado para o período selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-cyan-400" />
          Distribuição de Status dos Eventos
          <span className="text-sm text-slate-400 font-normal ml-2">
            ({events?.length || 0} evento{events?.length !== 1 ? 's' : ''} total)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onClick={handlePieClick}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover:brightness-110"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              content={<CustomLegend onLegendClick={handleLegendClick} />} 
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}