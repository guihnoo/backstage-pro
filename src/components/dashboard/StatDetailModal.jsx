import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, DollarSign, Clock, X } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { formatShortDate, getEventStatusConfig } from '@/components/utils/dateUtils';

const EventItem = ({ event, client, value, onClick, valueType = 'currency' }) => {
  const { formatCurrency } = useFinancialVisibility();
  const statusConfig = getEventStatusConfig(event);

  // Formatar valor baseado no tipo
  const formattedValue = useMemo(() => {
    if (valueType === 'hours') {
      return `${value.toFixed(1)}h`;
    }
    return formatCurrency(value);
  }, [value, valueType, formatCurrency]);

  return (
    <Card
      className="bg-slate-800/50 border-slate-700 p-4 hover:bg-slate-800 cursor-pointer transition-all touch-manipulation min-h-[80px]"
      onClick={() => onClick(event)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{event.title}</h4>
          {client && (
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{client.name}</span>
            </div>
          )}
        </div>
        <Badge className={`${statusConfig.badgeClass} flex-shrink-0`}>
          {statusConfig.label}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span>{formatShortDate(event.start_date)}</span>
        </div>
        <div className={`flex items-center gap-2 font-semibold ${valueType === 'hours' ? 'text-cyan-400' : 'text-green-400'}`}>
          {valueType === 'hours' ? (
            <Clock className="w-3 h-3 flex-shrink-0" />
          ) : (
            <DollarSign className="w-3 h-3 flex-shrink-0" />
          )}
          <span>{formattedValue}</span>
        </div>
      </div>
    </Card>
  );
};

export default function StatDetailModal({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  events, 
  clients, 
  getEventValue,
  onEventClick,
  valueType = 'currency'
}) {
  const { formatCurrency } = useFinancialVisibility();
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const totalValue = useMemo(() => {
    return events.reduce((sum, event) => sum + getEventValue(event), 0);
  }, [events, getEventValue]);

  // Formatar total baseado no tipo
  const formattedTotal = useMemo(() => {
    if (valueType === 'hours') {
      return `${totalValue.toFixed(1)}h`;
    }
    return formatCurrency(totalValue);
  }, [totalValue, valueType, formatCurrency]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[85vh] max-h-[85vh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl truncate">{title}</DialogTitle>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mt-1">
                  <Badge variant="secondary" className="flex-shrink-0">
                    {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                  </Badge>
                  <span className="text-slate-500">•</span>
                  <span className={`font-bold ${valueType === 'hours' ? 'text-cyan-400' : 'text-green-400'}`}>
                    {formattedTotal}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 min-w-[44px] min-h-[44px] flex-shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-3 pb-safe">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {Icon && <Icon className="w-16 h-16 mx-auto mb-4 text-slate-600" />}
                <p className="text-slate-400">Nenhum evento encontrado para este período.</p>
              </div>
            ) : (
              events.map(event => (
                <EventItem
                  key={event.id}
                  event={event}
                  client={clientMap.get(event.client_id)}
                  value={getEventValue(event)}
                  onClick={onEventClick}
                  valueType={valueType}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}