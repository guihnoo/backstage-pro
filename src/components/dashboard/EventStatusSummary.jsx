import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getEventStatusConfig, formatShortDate } from '../utils/dateUtils';
import { parseISO, isValid } from 'date-fns';

export default function EventStatusSummary({ stats = {}, events = [], clients = [], onEventClick }) {
  const { scheduled = 0, in_progress = 0, completed = 0, pending_payment = 0 } = stats;

  const statusGroups = [
    { 
      label: 'Agendados', 
      count: scheduled, 
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/30'
    },
    { 
      label: 'Em Andamento', 
      count: in_progress, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/30'
    },
    { 
      label: 'Concluídos', 
      count: completed, 
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/30'
    },
    { 
      label: 'Pagamento Pendente', 
      count: pending_payment, 
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/30'
    }
  ];

  // NOVA LÓGICA: Eventos mais próximos da data atual (passados recentes + futuros próximos)
  const recentEvents = React.useMemo(() => {
    const now = new Date();
    
    // Filtrar eventos com datas válidas
    const validEvents = events.filter(e => {
      if (!e.start_date) return false;
      try {
        const eventDate = parseISO(e.start_date);
        return isValid(eventDate);
      } catch {
        return false;
      }
    });

    // Ordenar por proximidade da data atual (distância absoluta)
    const sortedByProximity = validEvents.sort((a, b) => {
      const dateA = parseISO(a.start_date);
      const dateB = parseISO(b.start_date);
      
      // Calcular distância absoluta em relação à data atual
      const distanceA = Math.abs(dateA.getTime() - now.getTime());
      const distanceB = Math.abs(dateB.getTime() - now.getTime());
      
      return distanceA - distanceB;
    });

    // Retornar os 5 eventos mais próximos da data atual
    return sortedByProximity.slice(0, 5);
  }, [events]);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-white">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          <span className="truncate">Status dos Eventos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {statusGroups.map((status) => (
            <div
              key={status.label}
              className={`p-3 sm:p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}
            >
              <p className="text-xs text-slate-400 mb-1 truncate">{status.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${status.color}`}>
                {status.count}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Events - Agora com lógica correta */}
        {recentEvents.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs sm:text-sm font-medium text-slate-400 mb-3">
              Eventos Próximos
            </h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {recentEvents.map((event) => {
                  const client = clients.find(c => c.id === event.client_id);
                  const statusConfig = getEventStatusConfig(event);
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left p-2 sm:p-3 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700 hover:border-cyan-400/50 rounded-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-white text-sm truncate flex-1">
                          {event.title}
                        </p>
                        <Badge 
                          className={`text-xs ${statusConfig.badgeClass} flex-shrink-0`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate">
                          {client?.name || 'Cliente'}
                        </span>
                        <span className="flex-shrink-0 ml-2">
                          {formatShortDate(event.start_date)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {recentEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">
              Nenhum evento encontrado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}