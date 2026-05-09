
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, Calendar, Timer } from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import EmptyState from '@/components/layout/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductivityAnalysis({ events = [], dailyWork = [], clients = [], loading = false, onBarClick }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const analysis = useMemo(() => {
    const safeWork = Array.isArray(dailyWork) ? dailyWork : [];
    const safeEvents = Array.isArray(events) ? events : [];
    const safeClients = Array.isArray(clients) ? clients : [];
    
    if (safeWork.length === 0 || safeEvents.length === 0) return null;

    // Mapas para busca rápida e eficiente de dados
    const clientNameMap = safeClients ? new Map(safeClients.map(c => [c.id, c.name])) : new Map();
    const eventClientMap = new Map(safeEvents.map(e => [e.id, e.client_id]));
    
    const clientAnalysis = {};
    safeWork.forEach(w => {
      if (!w || !w.event_id) return;
      const clientId = eventClientMap.get(w.event_id);
      if (!clientId) return; // Pula trabalho de eventos que não estão na lista atual

      if (!clientAnalysis[clientId]) {
        clientAnalysis[clientId] = {
          id: clientId,
          name: clientNameMap.get(clientId) || 'Cliente Desconhecido',
          totalHours: 0,
          overtimeHours: 0,
          generatedRevenue: 0, // Changed from 'revenue' to 'generatedRevenue'
          workDays: 0
        };
      }
      
      clientAnalysis[clientId].totalHours += w.total_hours || 0;
      clientAnalysis[clientId].overtimeHours += w.overtime_hours || 0;
      clientAnalysis[clientId].generatedRevenue += w.daily_cache || 0; // Changed from 'revenue' to 'generatedRevenue'
      clientAnalysis[clientId].workDays += 1;
    });

    const clientData = Object.values(clientAnalysis)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 8); // Top 8 clientes

    // Estatísticas gerais
    const totalHours = safeWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);
    const totalOvertimeHours = safeWork.reduce((sum, w) => sum + (w.overtime_hours || 0), 0);
    const totalGeneratedRevenue = safeWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0); // Changed from 'totalRevenue' to 'totalGeneratedRevenue'
    const averageHoursPerDay = safeWork.length > 0 ? totalHours / safeWork.length : 0;
    const revenuePerHour = totalHours > 0 ? totalGeneratedRevenue / totalHours : 0; // Uses 'totalGeneratedRevenue'
    const overtimePercentage = totalHours > 0 ? (totalOvertimeHours / totalHours) * 100 : 0;

    return {
      clientData,
      stats: {
        totalHours: totalHours.toFixed(1),
        totalOvertimeHours: totalOvertimeHours.toFixed(1),
        averageHoursPerDay: averageHoursPerDay.toFixed(1),
        revenuePerHour,
        overtimePercentage: overtimePercentage.toFixed(1)
      }
    };
  }, [events, dailyWork, clients]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-amber-300 font-display flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Análise de Produtividade
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full bg-slate-800/50" />
                ))}
            </div>
            <Skeleton className="h-[250px] w-full bg-slate-800/50" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-amber-300 font-display flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Análise de Produtividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="Sem dados para análise"
            description="Registre horas de trabalho para ver a análise de produtividade."
            className="py-10"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-amber-300 font-display flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Análise de Produtividade
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Estatísticas de Produtividade */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 p-3 rounded-lg text-center">
            <Timer className="w-5 h-5 mx-auto mb-2 text-blue-400" />
            <p className="text-xs text-slate-400">Total de Horas</p>
            <p className="text-lg font-bold text-white">{analysis.stats.totalHours}h</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg text-center">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-green-400" />
            <p className="text-xs text-slate-400">Média por Dia</p>
            <p className="text-lg font-bold text-white">{analysis.stats.averageHoursPerDay}h</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-purple-400" />
            <p className="text-xs text-slate-400">Gerado/Hora</p>
            <p className="text-lg font-bold text-white">
              {isVisible ? formatCurrency(analysis.stats.revenuePerHour) : '•••••'}
            </p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 text-pink-400" />
            <p className="text-xs text-slate-400">% Extras</p>
            <p className="text-lg font-bold text-white">{analysis.stats.overtimePercentage}%</p>
          </div>
        </div>

        {/* Gráfico de Horas por Cliente */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.clientData} margin={{ top: 5, right: 20, left: 5, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => {
                  if (name === 'totalHours') return [`${value.toFixed(1)}h`, 'Horas Totais'];
                  if (name === 'overtimeHours') return [`${value.toFixed(1)}h extras`, 'Horas Extras'];
                  // Preserve financial visibility for generated revenue
                  if (name === 'generatedRevenue') {
                    return [isVisible ? formatCurrency(value) : '•••••', 'Receita Gerada'];
                  }
                  return [value, name]; // Fallback for other data keys (e.g., id, workDays)
                }}
              />
              <Bar
                dataKey="totalHours"
                fill="#f59e0b"
                name="totalHours"
                radius={[2, 2, 0, 0]}
                stackId="a"
                onClick={(_, idx) => {
                  const item = analysis.clientData[idx];
                  onBarClick && onBarClick(item);
                }}
                cursor={onBarClick ? 'pointer' : 'default'}
              />
              <Bar
                dataKey="overtimeHours"
                fill="#ec4899"
                name="overtimeHours"
                radius={[2, 2, 0, 0]}
                stackId="a"
                onClick={(_, idx) => {
                  const item = analysis.clientData[idx];
                  onBarClick && onBarClick(item);
                }}
                cursor={onBarClick ? 'pointer' : 'default'}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
