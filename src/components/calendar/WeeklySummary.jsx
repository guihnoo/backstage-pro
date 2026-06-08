
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, TrendingUp, Users, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

export default function WeeklySummary({ currentDate, events, dailyWork, clients }) {
  const { formatCurrency } = useFinancialVisibility();
  // Calcular início e fim da semana
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filtrar eventos da semana
  const weekEvents = events.filter(event => {
    if (!event || !event.start_date || !event.end_date) return false;
    try {
      const eventStart = new Date(event.start_date + 'T00:00:00');
      const eventEnd = new Date(event.end_date + 'T00:00:00');
      return eventStart <= weekEnd && eventEnd >= weekStart;
    } catch (error) {
      return false;
    }
  });

  // Filtrar trabalho da semana
  const weekWork = dailyWork.filter(work => {
    if (!work || !work.date) return false;
    try {
      const workDate = new Date(work.date + 'T00:00:00');
      return workDate >= weekStart && workDate <= weekEnd;
    } catch (error) {
      return false;
    }
  });

  // Calcular estatísticas da semana
  const weekStats = {
    totalHours: parseFloat(weekWork.reduce((sum, w) => sum + (w.total_hours || 0), 0).toFixed(1)),
    totalEarnings: weekWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0),
    overtimeHours: parseFloat(weekWork.reduce((sum, w) => sum + (w.overtime_hours || 0), 0).toFixed(1)),
    workDays: weekWork.length,
    totalEvents: weekEvents.length,
    completedEvents: weekEvents.filter(e => e.status === 'completed').length,
    inProgressEvents: weekEvents.filter(e => e.status === 'in_progress').length,
    scheduledEvents: weekEvents.filter(e => e.status === 'scheduled').length
  };

  // Dados por dia da semana
  const weeklyBreakdown = weekDays.map(day => {
    const dayEvents = weekEvents.filter(event => {
      try {
        const eventStart = new Date(event.start_date + 'T00:00:00');
        const eventEnd = new Date(event.end_date + 'T00:00:00');
        return day >= eventStart && day <= eventEnd;
      } catch (error) {
        return false;
      }
    });

    const dayWork = weekWork.filter(work => {
      try {
        return isSameDay(new Date(work.date + 'T00:00:00'), day);
      } catch (error) {
        return false;
      }
    });

    const dayHours = parseFloat(dayWork.reduce((sum, w) => sum + (w.total_hours || 0), 0).toFixed(1));
    const dayEarnings = dayWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);

    return {
      date: day,
      events: dayEvents,
      work: dayWork,
      hours: dayHours,
      earnings: dayEarnings,
      isToday: isToday(day),
      hasWork: dayWork.length > 0,
      hasEvents: dayEvents.length > 0
    };
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c && c.id === clientId);
    return client ? client.name : 'Cliente';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header da Semana */}
      <Card className="bg-slate-900/50 border-slate-800 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span className="font-display">Resumo Semanal</span>
            </div>
            <Badge className="bg-cyan-400/20 text-cyan-300 border-cyan-400/30 text-xs">
              {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(weekEnd, 'dd/MM', { locale: ptBR })}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/30 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-cyan-300">{weekStats.totalHours.toFixed(1)}h</p>
              <p className="text-xs text-slate-400">Total Trabalhadas</p>
            </div>
            <div className="bg-slate-800/30 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-green-300">{formatCurrency(weekStats.totalEarnings)}</p>
              <p className="text-xs text-slate-400">Faturamento</p>
            </div>
          </div>

          {/* Horas Extras se houver */}
          {weekStats.overtimeHours > 0 && (
            <div className="bg-pink-500/20 border border-pink-400/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-pink-300 mb-2">
                <Zap className="w-4 h-4" />
                <span className="font-bold text-sm">Horas Extras</span>
              </div>
              <p className="text-lg font-bold text-pink-300">{weekStats.overtimeHours.toFixed(1)}h</p>
              <p className="text-xs text-pink-200">Acima de 12h/dia</p>
            </div>
          )}

          {/* Status dos Projetos */}
          {weekStats.totalEvents > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Users className="w-4 h-4" />
                <span>Projetos da Semana</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {weekStats.completedEvents > 0 && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {weekStats.completedEvents} Concluído{weekStats.completedEvents > 1 ? 's' : ''}
                  </Badge>
                )}
                {weekStats.inProgressEvents > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {weekStats.inProgressEvents} Em Andamento
                  </Badge>
                )}
                {weekStats.scheduledEvents > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {weekStats.scheduledEvents} Agendado{weekStats.scheduledEvents > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Diário */}
      <Card className="bg-slate-900/50 border-slate-800 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-300">Breakdown Diário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {weeklyBreakdown.map((day, index) => (
            <motion.div
              key={day.date.toISOString()}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                day.isToday 
                  ? 'bg-cyan-400/20 border border-cyan-400/30' 
                  : day.hasWork || day.hasEvents
                  ? 'bg-slate-800/30 hover:bg-slate-800/50'
                  : 'bg-slate-800/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[50px]">
                  <p className={`text-xs font-bold ${day.isToday ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {format(day.date, 'EEE', { locale: ptBR }).toUpperCase()}
                  </p>
                  <p className={`text-sm font-bold ${day.isToday ? 'text-cyan-200' : 'text-slate-300'}`}>
                    {format(day.date, 'dd')}
                  </p>
                </div>
                
                <div className="flex-1">
                  {day.hasEvents ? (
                    <div className="space-y-1">
                      {day.events.slice(0, 2).map((event, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: event.color || '#22d3ee' }}
                          />
                          <span className="text-xs text-slate-300 truncate">
                            {getClientName(event.client_id)}
                          </span>
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <p className="text-xs text-slate-400">
                          +{day.events.length - 2} mais
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Nenhum evento</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                {day.hasWork ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-cyan-300">
                      {day.hours.toFixed(1)}h
                    </p>
                    <p className="text-xs text-green-400">
                      {formatCurrency(day.earnings)}
                    </p>
                  </div>
                ) : day.hasEvents ? (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Média e Eficiência */}
      <Card className="bg-slate-900/50 border-slate-800 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-300">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Média Diária</span>
            <span className="text-sm font-bold text-slate-200">
              {weekStats.workDays > 0 ? (weekStats.totalHours / weekStats.workDays).toFixed(1) : '0.0'}h
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Eficiência</span>
            <span className="text-sm font-bold text-green-300">
              {weekStats.totalHours > 0 
                ? `${(((weekStats.totalHours - weekStats.overtimeHours) / weekStats.totalHours) * 100).toFixed(0)}%`
                : '100%'
              }
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Dias Ativos</span>
            <span className="text-sm font-bold text-blue-300">
              {weekStats.workDays}/7
            </span>
          </div>

          {/* Barra de progresso da semana */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400">Progresso da Semana</span>
              <span className="text-xs text-slate-300">
                {Math.round((weekStats.workDays / 7) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-cyan-300 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((weekStats.workDays / 7) * 100, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
