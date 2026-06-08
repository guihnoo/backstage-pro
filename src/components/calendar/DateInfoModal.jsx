import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Building2,
  X
} from 'lucide-react';
import { formatDisplayDate, getEventStatusConfig } from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

export default function DateInfoModal({ 
  isOpen, 
  onClose, 
  date, 
  events = [], 
  workRecords = [],
  clients = [],
  onAddWork,
  onEditWork,
  onViewEvent
}) {
  const { formatCurrency } = useFinancialVisibility();

  const clientMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c]));
  }, [clients]);

  const totalHours = useMemo(() => {
    return workRecords.reduce((sum, work) => sum + (work.total_hours || 0), 0);
  }, [workRecords]);

  const totalCache = useMemo(() => {
    return workRecords.reduce((sum, work) => sum + (work.daily_cache || 0), 0);
  }, [workRecords]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[95vh] max-h-[95vh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              {formatDisplayDate(date, 'eeee, dd/MM/yyyy')}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Resumo do Dia */}
            {workRecords.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Total de Horas</p>
                      <p className="text-xl font-bold text-cyan-400">{totalHours.toFixed(1)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Cachê Total</p>
                      <p className="text-xl font-bold text-green-400">{formatCurrency(totalCache)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Eventos do Dia */}
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Eventos ({events.length})
              </h3>
              {events.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nenhum evento agendado para este dia.
                </p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const client = clientMap.get(event.client_id);
                    const statusConfig = getEventStatusConfig(event);
                    
                    return (
                      <Card 
                        key={event.id}
                        className="bg-slate-800/50 border-slate-700 hover:border-cyan-400/50 cursor-pointer transition-all"
                        onClick={() => onViewEvent?.(event)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{event.title}</h4>
                              {client && (
                                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{client.name}</span>
                                </div>
                              )}
                            </div>
                            <Badge className={`${statusConfig.badgeClass} text-xs flex-shrink-0`}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          {event.start_time && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {event.start_time.substring(0, 5)}
                                {event.end_time && ` - ${event.end_time.substring(0, 5)}`}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Registros de Trabalho */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Registros de Trabalho ({workRecords.length})
                </h3>
                {events.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => onAddWork?.(date, events[0])}
                    className="bg-cyan-600 hover:bg-cyan-700 h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                )}
              </div>
              
              {workRecords.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nenhum registro de trabalho para este dia.
                </p>
              ) : (
                <div className="space-y-3">
                  {workRecords.map((work) => {
                    const event = events.find(e => e.id === work.event_id);
                    
                    return (
                      <Card 
                        key={work.id}
                        className="bg-slate-800/50 border-slate-700"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-white text-sm">
                              {event?.title || 'Evento'}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditWork?.(work)}
                              className="h-7 px-2"
                            >
                              <Edit className="w-3 h-3 mr-1" /> Editar
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="text-slate-400 mb-1">Horário</p>
                              <p className="text-white font-medium">
                                {work.entry_time?.substring(0, 5)} - {work.exit_time?.substring(0, 5)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Total</p>
                              <p className="text-cyan-400 font-bold">{work.total_hours?.toFixed(1)}h</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Cachê</p>
                              <p className="text-green-400 font-bold">{formatCurrency(work.daily_cache)}</p>
                            </div>
                          </div>
                          
                          {work.notes && (
                            <p className="text-xs text-slate-400 mt-3 p-2 bg-slate-900/50 rounded">
                              {work.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 sm:p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900/50">
          <Button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}