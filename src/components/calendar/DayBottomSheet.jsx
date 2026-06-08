import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, CalendarPlus, Timer, Receipt, Eye, 
  Building2, DollarSign, Clock, Play
} from 'lucide-react';
import { formatDisplayDate, getEventStatus } from '../utils/dateUtils';

export default function DayBottomSheet({ 
  isOpen, 
  setIsOpen, 
  date, 
  events = [], 
  work, 
  onAddEvent, 
  onAddWork, 
  onAddExpense, 
  onViewEvent 
}) {
  if (!isOpen || !date) return null;

  const handleAddEvent = () => {
    onAddEvent?.(date);
    setIsOpen(false);
  };

  const handleAddWork = () => {
    onAddWork?.(date, events);
    setIsOpen(false);
  };

  const handleAddExpense = () => {
    onAddExpense?.(date);
    setIsOpen(false);
  };

  const handleViewEvent = (event) => {
    onViewEvent?.(event);
    setIsOpen(false);
  };

  // NOVA FUNCIONALIDADE: Adicionar despesa para evento específico
  const handleAddExpenseForEvent = (event) => {
    onAddExpense?.(date, event);
    setIsOpen(false);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white">
            {formatDisplayDate(date, 'dd \'de\' MMMM')}
          </h3>
          <p className="text-slate-400 text-sm">
            {events.length} evento{events.length !== 1 ? 's' : ''}
            {work ? ` • ${(work.total_hours || 0).toFixed(1)}h trabalhadas` : ''}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            onClick={handleAddEvent}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Evento
          </Button>
          <Button 
            onClick={handleAddWork}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
          >
            <Timer className="w-4 h-4 mr-2" />
            Horas
          </Button>
          <Button 
            onClick={handleAddExpense}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Despesa
          </Button>
        </div>

        {/* Events List */}
        {events.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Eventos do Dia</h4>
            {events.map(event => {
              const status = getEventStatus(event);
              return (
                <Card key={event.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.color || '#22d3ee' }}
                          />
                          <h5 className="font-bold text-white truncate">
                            {event.title || 'Evento sem título'}
                          </h5>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                          {event.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.start_time}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            R$ {(event.daily_cache_value || 0).toFixed(0)}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              status === 'completed' ? 'text-green-400 border-green-400/50' :
                              status === 'in_progress' ? 'text-blue-400 border-blue-400/50' :
                              'text-slate-400 border-slate-600'
                            }`}
                          >
                            {status === 'scheduled' ? 'Agendado' :
                             status === 'in_progress' ? 'Em Andamento' :
                             status === 'completed' ? 'Concluído' : status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Event Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleViewEvent(event)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleAddExpenseForEvent(event)}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/20"
                      >
                        <Receipt className="w-4 h-4 mr-1" />
                        + Despesa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <CalendarPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum evento agendado para este dia</p>
          </div>
        )}

        {/* Work Summary */}
        {work && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-300 text-sm flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Trabalho Registrado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Total:</span>
                  <p className="font-bold text-white">{(work.total_hours || 0).toFixed(1)}h</p>
                </div>
                {work.overtime_hours > 0 && (
                  <div>
                    <span className="text-slate-400">Extras:</span>
                    <p className="font-bold text-pink-300">{work.overtime_hours.toFixed(1)}h</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}