import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, BadgeCheck, Clock, PlayCircle } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { formatDisplayDate, getEventStatusConfig } from '@/components/utils/dateUtils';
import { getEventCacheAmount } from '@/lib/eventFinance';
import EventHeading from '@/components/events/EventHeading';
import { Ellipsis } from '@/components/ui/overflowText';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const EventItem = ({ event, client, work, onClick }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();

  const eventWork = work.filter(w => w.event_id === event.id);
  const workCacheTotal = eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
  const eventValue = workCacheTotal > 0
    ? workCacheTotal
    : event.paid_amount > 0
      ? event.paid_amount
      : getEventCacheAmount(event);

  const isPaid = event.payment_status === 'paid';
  const isConfirmed = event.status === 'confirmed' || event.status === 'scheduled';
  const PayIcon = isPaid ? CheckCircle2 : isConfirmed ? BadgeCheck : Clock;
  const payColor = isPaid ? '#10b981' : isConfirmed ? '#f59e0b' : '#64748b';

  const statusConfig = getEventStatusConfig(event);
  const StatusIcon = {
    'Concluído': CheckCircle2,
    'Em Andamento': PlayCircle,
    'Agendado': Clock,
    'Arquivado': Clock
  }[statusConfig.label] || Clock;

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center gap-4 px-2 py-3 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer min-w-0"
      onClick={() => onClick(event)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(event); } }}
    >
      <Avatar className="h-10 w-10 border-2 border-slate-700 hidden sm:flex flex-shrink-0">
        <AvatarImage src={client?.logo_url} />
        <AvatarFallback
          className="bp-chip-badge-active"
          style={{ background: `${primaryHex}33` }}
        >
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
          <Badge variant="outline" className={`border-transparent ${statusConfig.textColor || statusConfig.color}`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="text-right flex flex-col items-end gap-0.5">
          <p className="font-bold text-base text-white font-mono">
            {isVisible ? formatCurrency(eventValue) : '••••'}
          </p>
          <div className="flex items-center gap-1">
            <PayIcon className="w-3 h-3 flex-shrink-0" style={{ color: payColor }} />
            <p className="text-[10px]" style={{ color: payColor }}>
              {isPaid ? 'Pago' : isConfirmed ? 'Confirmado' : 'Pendente'}
            </p>
          </div>
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