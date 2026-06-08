import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Receipt
} from 'lucide-react';

import { 
  normalizeDateString, 
  stringToLocalDate, 
  isSameDay, 
  isToday,
  formatDisplayDate,
  getEventsForDate,
  getWorkForDate,
  getEventStatus,
  daysDifference
} from '../utils/dateUtils';

export default function AgendaView({ 
  currentDate, 
  events = [], 
  dailyWork = [], 
  clients = [], 
  onEventClick,
  onAddExpense
}) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  
  const currentWeek = useMemo(() => {
    const baseDate = new Date(currentDate);
    const adjustedDate = addWeeks(baseDate, weekOffset);
    const weekStart = startOfWeek(adjustedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(adjustedDate, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, weekOffset]);

  const getClientName = (clientId) => {
    if (!Array.isArray(clients) || !clients.length) return 'Cliente';
    const client = clients.find(c => c && c.id === clientId);
    return client ? client.name : 'Cliente';
  };

  const weekData = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    const safeDailyWork = Array.isArray(dailyWork) ? dailyWork : [];
    
    return currentWeek.map(day => {
      const dayEvents = getEventsForDate(safeEvents, day);
      const dayWork = getWorkForDate(safeDailyWork, day);
      
      return {
        date: day,
        events: dayEvents || [],
        work: dayWork,
        isToday: isToday(day)
      };
    });
  }, [currentWeek, events, dailyWork]);

  const navigateWeek = (direction) => {
    setWeekOffset(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  const handleAddExpenseForEvent = (event, date) => {
    if (onAddExpense) {
      onAddExpense(date, event);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header da Semana */}
      <Card className="bg-slate-900/50 border border-slate-800">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-cyan-300 font-display flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agenda Semanal
            </CardTitle>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateWeek('prev')}
                className="bg-slate-700 border-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToCurrentWeek}
                className="bg-cyan-400/20 text-cyan-300 border-cyan-400/30"
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateWeek('next')}
                className="bg-slate-700 border-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-slate-400 mt-2">
            {formatDisplayDate(currentWeek[0], 'dd MMM')} - {formatDisplayDate(currentWeek[6], 'dd MMM yyyy')}
          </p>
        </CardHeader>
      </Card>

      {/* Dias da Semana */}
      <div className="space-y-4 sm:space-y-6">
        {weekData.map((dayData) => (
          <motion.div
            key={normalizeDateString(dayData.date)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              rounded-2xl
              ${dayData.isToday ? 'ring-2 ring-cyan-400' : ''}
            `}
          >
            <Card className={`
              bg-slate-900/50 border border-slate-800 overflow-hidden
              ${dayData.isToday ? 'bg-cyan-400/5 border-cyan-400/30' : ''}
            `}>
              <CardHeader className="pb-3 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      text-center p-2 rounded-lg w-14
                      ${dayData.isToday ? 'bg-cyan-400 text-slate-900' : 'bg-slate-800'}
                    `}>
                      <div className="text-xs font-medium">
                        {format(dayData.date, 'EEE', { locale: ptBR }).toUpperCase()}
                      </div>
                      <div className="text-lg font-bold">
                        {format(dayData.date, 'dd')}
                      </div>
                    </div>
                    <CardTitle className="text-white font-display text-base sm:text-lg">
                      {formatDisplayDate(dayData.date, 'dd \'de\' MMMM')}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {dayData.events.length > 0 && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs">
                        {dayData.events.length} evento{dayData.events.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {dayData.work && (
                      <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-400/50 text-xs">
                        {(dayData.work.total_hours || 0).toFixed(1)}h
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 pt-0">
                {dayData.events.length > 0 ? (
                  <div className="space-y-3">
                    {dayData.events.map(event => {
                      if (!event) return null;
                      
                      const eventWork = Array.isArray(dailyWork) 
                        ? dailyWork.find(w => w && w.event_id === event.id && isSameDay(new Date(w.date), dayData.date))
                        : null;
                      const status = getEventStatus(event);
                      const duration = daysDifference(event.start_date, event.end_date);
                      
                      return (
                        <div
                          key={event.id}
                          className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700 hover:border-cyan-400/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div 
                              className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                              onClick={() => onEventClick && onEventClick(event)}
                            >
                              <div 
                                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: event.color || '#22d3ee' }}
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-base sm:text-lg mb-1 truncate">
                                  {getClientName(event.client_id)}
                                </h3>
                                <p className="text-slate-300 mb-3 text-sm break-words">{event.title || 'Evento sem título'}</p>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>{duration} dia{duration > 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <DollarSign className="w-4 h-4" />
                                    <span>R$ {(event.daily_cache_value || 0).toFixed(0)}/dia</span>
                                  </div>
                                  {eventWork && (
                                    <div className="flex items-center gap-2 text-green-400">
                                      <Clock className="w-4 h-4" />
                                      <span>{(eventWork.total_hours || 0).toFixed(1)}h</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {status === 'completed' ? (
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : status === 'in_progress' ? (
                                      <Play className="w-4 h-4 text-blue-400" />
                                    ) : (
                                      <Calendar className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className="text-slate-300 capitalize text-xs sm:text-sm">
                                      {status === 'scheduled' ? 'Agendado' :
                                       status === 'in_progress' ? 'Em Andamento' :
                                       status === 'completed' ? 'Concluído' : status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Quick Action for Add Expense */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAddExpenseForEvent(event, dayData.date)}
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/20 h-8 px-3"
                              >
                                <Receipt className="w-4 h-4 mr-1" />
                                + Despesa
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum evento agendado para este dia</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}