import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEventStatus, formatDisplayDate } from '../utils/dateUtils';
import { CheckCircle, Play, Calendar, Archive } from 'lucide-react';

const statusConfig = {
  scheduled: { label: 'Agendados', icon: Calendar, color: 'text-blue-400' },
  in_progress: { label: 'Em Andamento', icon: Play, color: 'text-amber-400' },
  completed: { label: 'Finalizados', icon: CheckCircle, color: 'text-green-400' },
  archived: { label: 'Arquivados', icon: Archive, color: 'text-slate-500' },
};

export default function EventsStatusList({ events, clients }) {
  const getClientName = (id) => clients.find(c => c && c.id === id)?.name || 'Cliente';

  const eventsByStatus = useMemo(() => {
    const grouped = { scheduled: [], in_progress: [], completed: [], archived: [] };
    events.forEach(event => {
      const status = getEventStatus(event);
      if (grouped[status]) {
        grouped[status].push(event);
      }
    });
    return grouped;
  }, [events]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(eventsByStatus).map(([status, eventList]) => {
        const config = statusConfig[status];
        return (
          <Card key={status} className="bg-slate-800/80 border-slate-700">
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${config.color}`}>
                <config.icon className="w-6 h-6" />
                {config.label}
                <Badge variant="secondary" className="ml-auto">{eventList.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 h-64 overflow-y-auto">
              {eventList.length > 0 ? (
                eventList.map(event => (
                  <div key={event.id} className="p-3 bg-slate-700/50 rounded-lg text-sm">
                    <p className="font-bold text-white truncate">{event.title}</p>
                    <p className="text-slate-300 truncate">{getClientName(event.client_id)}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDisplayDate(event.start_date, 'dd MMM')} - {formatDisplayDate(event.end_date, 'dd MMM')}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center pt-8">Nenhum evento neste status.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}