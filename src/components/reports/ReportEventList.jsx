import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { formatDisplayDate, getEventStatusConfig } from '@/components/utils/dateUtils';
import EventHeading from '@/components/events/EventHeading';
import { Ellipsis } from '@/components/ui/overflowText';

const EventItem = ({ event, client, work, onClick }) => {
  const { formatCurrency } = useFinancialVisibility();

  // MUDANÇA CRÍTICA: O cálculo do valor deve usar o 'work' completo, filtrado por ID do evento
  const eventWork = work.filter(w => w.event_id === event.id);
  const eventValue = eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);

  const statusConfig = getEventStatusConfig(event);
  const StatusIcon = {
    'Concluído': CheckCircle2,
    'Em Andamento': PlayCircle,
    'Agendado': Clock,
    'Arquivado': Clock
  }[statusConfig.label] || Clock;

  return (
    <div
      className="flex items-center gap-4 px-2 py-3 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer min-w-0"
      onClick={() => onClick(event)}
    >
      <Avatar className="h-10 w-10 border-2 border-slate-700 hidden sm:flex flex-shrink-0">
        <AvatarImage src={client?.logo_url} />
        <AvatarFallback className="bg-cyan-900/50 text-cyan-300">
          {client?.name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center min-w-0">
        <div className="col-span-2 md:col-span-1 min-w-0">
          <EventHeading event={event} client={client} size="sm" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-slate-300">{formatDisplayDate(event.start_date)}</p>
          <p className="text-xs text-slate-500">Início</p>
        </div>
        <div className="text-right md:text-left">
          <Badge variant="outline" className={`border-transparent ${statusConfig.color}`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="text-right">
          <p className="font-bold text-base text-white">{formatCurrency(eventValue)}</p>
          <p className="text-xs text-slate-500">Valor Gerado</p>
        </div>
      </div>
    </div>
  );
};

export default function ReportEventList({ events, clients, dailyWork = [], title, onEventClick }) {
  const clientMap = new Map(clients.map(c => [c.id, c]));

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white min-w-0">
          <Ellipsis>{title}</Ellipsis>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-slate-800">
            {events.map(event => (
              <EventItem
                key={event.id}
                event={event}
                client={clientMap.get(event.client_id)}
                work={dailyWork}
                onClick={onEventClick}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}