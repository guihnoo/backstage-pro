import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Building2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getEventStatusConfig, formatDisplayDate, formatShortDate } from '../utils/dateUtils';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsInPeriod({ events = [], clients = [], onEventClick, loading = false }) {
  // Memoizar eventos ordenados
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      return new Date(a.start_date) - new Date(b.start_date);
    });
  }, [events]);

  // Memoizar mapa de clientes
  const clientsMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c]));
  }, [clients]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-white">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            Eventos no Período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full bg-slate-800" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-white">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
          <span className="truncate">Eventos no Período</span>
          <Badge variant="secondary" className="ml-auto flex-shrink-0">
            {events.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <ScrollArea className="h-[400px] sm:h-[450px] pr-2 sm:pr-4">
          {sortedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">
                Nenhum evento encontrado neste período.
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {sortedEvents.map((event) => {
                const client = clientsMap.get(event.client_id);
                const statusConfig = getEventStatusConfig(event);
                
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full text-left p-3 sm:p-4 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700 hover:border-cyan-400/50 rounded-lg transition-all duration-200 group min-h-[80px] touch-manipulation"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-full rounded-full flex-shrink-0 min-h-[60px]"
                        style={{ backgroundColor: event.color || '#22d3ee' }}
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-white text-sm sm:text-base truncate group-hover:text-cyan-400 transition-colors">
                            {event.title}
                          </h4>
                          <Badge className={`${statusConfig.badgeClass} text-xs flex-shrink-0`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        {client && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{client.name}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {formatShortDate(event.start_date)}
                            </span>
                          </div>
                          {event.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {event.start_time.substring(0, 5)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}