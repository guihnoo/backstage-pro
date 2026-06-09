
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  DollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Edit,
  Eye,
  Timer
} from 'lucide-react';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import EventLocationChip from '@/components/events/EventLocationChip';
import { hardNavigate } from '@/lib/hardNavigate';

// Helper to check if a day is within an event's range
const isDayInEvent = (day, event) => {
  if (!event || !event.start_date || !event.end_date) return false;
  const eventStart = new Date(event.start_date + 'T00:00:00');
  const eventEnd = new Date(event.end_date + 'T00:00:00');
  const checkDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return checkDay >= eventStart && checkDay <= eventEnd;
};

const DailyView = ({ currentDate, onDateChange, events, dailyWork, clients, onEdit, onDetails, onRegisterWork }) => {
  const { formatCurrency } = useFinancialVisibility();

  const dayData = useMemo(() => {
    const eventsForDay = events.filter(event => isDayInEvent(currentDate, event));
    const workForDay = dailyWork.filter(work => work && work.date && isSameDay(new Date(work.date + 'T00:00:00'), currentDate));
    
    const totalHours = workForDay.reduce((sum, w) => sum + (w.total_hours || 0), 0);
    const totalEarnings = workForDay.reduce((sum, w) => sum + (w.daily_cache || 0), 0);

    return { eventsForDay, workForDay, totalHours, totalEarnings };
  }, [currentDate, events, dailyWork]);
  
  const getClientData = (clientId) => {
    return clients.find(c => c.id === clientId) || { name: 'Cliente', logo_url: null };
  };

  const navigateDay = (direction) => {
    const newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
    onDateChange(newDate);
  };
  
  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <motion.div 
      key={format(currentDate, 'yyyy-MM-dd')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header com Navegação */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4 flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => navigateDay('prev')} className="bg-slate-800/80 border-slate-700">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white font-display capitalize">
              {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <Button variant="link" size="sm" onClick={goToToday} className="text-cyan-400 hover:text-cyan-300 h-auto p-0">
              Ir para hoje
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateDay('next')} className="bg-slate-800/80 border-slate-700">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium text-slate-300">Horas Registradas</CardTitle>
            <Clock className="w-5 h-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{dayData.totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium text-slate-300">Faturamento do Dia</CardTitle>
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{formatCurrency(dayData.totalEarnings)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Eventos e Atividades */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white font-display">Atividades do Dia</h3>
        {dayData.eventsForDay.length > 0 ? (
          dayData.eventsForDay.map(event => {
            const client = getClientData(event.client_id);
            const workForEvent = dayData.workForDay.find(w => w.event_id === event.id);

            return (
              <Card key={event.id} onClick={() => onDetails(event)} className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border-slate-700 overflow-hidden cursor-pointer hover:border-cyan-700/50 transition-colors">
                <CardHeader className="flex flex-row items-start gap-4 p-4" style={{borderLeft: `5px solid ${event.color || '#22d3ee'}`}}>
                   {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} className="w-12 h-12 rounded-lg object-contain bg-white/10 p-1"/>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 bg-cyan-400/10 rounded-lg flex items-center justify-center border border-cyan-400/20">
                      <Building2 className="w-6 h-6 text-cyan-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); hardNavigate(`/client-detail?id=${event.client_id}`); }}
                      className="font-bold text-lg text-cyan-300 hover:text-cyan-200 transition-colors text-left"
                    >
                      {client.name}
                    </button>
                    <p className="text-white font-medium">{event.title}</p>
                    <EventLocationChip event={event} className="mt-2" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {workForEvent ? (
                    <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                       <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-slate-400">Horário</p>
                            <p className="font-mono text-white">{workForEvent.entry_time} - {workForEvent.exit_time}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Horas</p>
                            <p className="font-bold text-white text-lg">{workForEvent.total_hours.toFixed(1)}h</p>
                          </div>
                       </div>
                       {workForEvent.overtime_hours > 0 && (
                          <Badge className="bg-pink-500/20 text-pink-300 border-pink-400/30">
                            <Timer className="w-3 h-3 mr-1"/>
                            {workForEvent.overtime_hours.toFixed(1)}h extras
                          </Badge>
                       )}
                    </div>
                  ) : (
                    <div className="text-center p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg">
                      <p className="text-amber-300 text-sm font-medium">Nenhum registro de horas para este evento hoje.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => onDetails(event)}>
                        <Eye className="w-4 h-4 mr-2"/> Detalhes
                      </Button>
                      <Button variant="outline" size="sm" className="bg-slate-700" onClick={() => onEdit(event)}>
                        <Edit className="w-4 h-4 mr-2"/> Editar Evento
                      </Button>
                      <Button size="sm" className="bg-cyan-400/90 text-black font-bold hover:bg-cyan-300" onClick={() => onRegisterWork(event)}>
                        <Clock className="w-4 h-4 mr-2"/>
                        {workForEvent ? 'Editar Horas' : 'Registrar Horas'}
                      </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-700">
            <Sun className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-lg font-semibold text-slate-400">Nenhuma atividade agendada.</p>
            <p className="text-sm text-slate-500">Aproveite seu dia de folga!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(DailyView);
