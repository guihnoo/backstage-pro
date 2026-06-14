import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useEvents } from '@/lib/useEvents';
import { useDailyWork } from '@/lib/useDailyWork';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { getEventStatus, formatDisplayDate } from '../utils/dateUtils';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { parseISO, differenceInDays, isValid } from 'date-fns';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import EventHeading from '@/components/events/EventHeading';
import { Ellipsis } from '@/components/ui/overflowText';

export default function ClientInsightsModal({ client, isOpen, onClose }) {
  const { events } = useEvents();
  const { dailyWork } = useDailyWork();
  const { formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  const insights = useMemo(() => {
    if (!client || !events || !dailyWork) return null;

    const clientEvents = events.filter(e => e.client_id === client.id);
    const clientEventIds = new Set(clientEvents.map(e => e.id));
    const clientWork = dailyWork.filter(w => clientEventIds.has(w.event_id));

    const getEventRevenue = (event) => {
      const fromWork = clientWork
        .filter(w => w.event_id === event.id)
        .reduce((sum, w) => sum + (w.daily_cache || 0), 0);
      return fromWork > 0 ? fromWork : getEventCacheAmount(event);
    };

    // Receita total
    const totalRevenue = clientEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);

    // Eventos por status
    const eventsByStatus = {
      scheduled: clientEvents.filter(e => getEventStatus(e) === 'scheduled').length,
      in_progress: clientEvents.filter(e => getEventStatus(e) === 'in_progress').length,
      completed: clientEvents.filter(e => getEventStatus(e) === 'completed').length,
    };

    // Pagamentos
    const paidEvents = clientEvents.filter(e => e.payment_status === 'paid');
    const unpaidEvents = clientEvents.filter(e => e.payment_status !== 'paid' && getEventStatus(e) === 'completed');

    const paidAmount = paidEvents.reduce((sum, e) => sum + (e.paid_amount || getEventRevenue(e)), 0);
    const pendingAmount = unpaidEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);

    // Média de receita por evento
    const avgRevenuePerEvent = clientEvents.length > 0 ? totalRevenue / clientEvents.length : 0;

    // Total de horas trabalhadas
    const totalHours = clientWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);

    // Último evento
    const sortedEvents = clientEvents
      .filter(e => e.start_date)
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    const lastEvent = sortedEvents[0];
    
    // Dias desde o último evento
    let daysSinceLastEvent = null;
    if (lastEvent && lastEvent.start_date) {
      try {
        const eventDate = parseISO(lastEvent.start_date);
        if (isValid(eventDate)) {
          daysSinceLastEvent = differenceInDays(new Date(), eventDate);
        }
      } catch { /* ignore invalid date */ }
    }

    // Frequência média (eventos por mês)
    const firstEvent = sortedEvents[sortedEvents.length - 1];
    let avgEventsPerMonth = 0;
    if (firstEvent && lastEvent && firstEvent.start_date && lastEvent.start_date) {
      try {
        const firstDate = parseISO(firstEvent.start_date);
        const lastDate = parseISO(lastEvent.start_date);
        if (isValid(firstDate) && isValid(lastDate)) {
          const monthsDiff = Math.max(1, differenceInDays(lastDate, firstDate) / 30);
          avgEventsPerMonth = clientEvents.length / monthsDiff;
        }
      } catch { /* ignore invalid date */ }
    }

    return {
      totalRevenue,
      eventsByStatus,
      paidAmount,
      pendingAmount,
      avgRevenuePerEvent,
      totalHours,
      lastEvent,
      daysSinceLastEvent,
      avgEventsPerMonth: avgEventsPerMonth.toFixed(1),
      totalEvents: clientEvents.length,
    };
  }, [client, events, dailyWork]);

  if (!client || !insights) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideDefaultClose className="sm:max-w-2xl h-[90dvh] max-h-[90dvh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white min-w-0 flex-1">
              <span className="text-slate-400 font-normal">Insights: </span>
              <Ellipsis as="span">{client.name}</Ellipsis>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea fill>
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Resumo Financeiro */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Resumo Financeiro
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Receita Total</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(insights.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Média/Evento</p>
                    <p className="text-xl font-bold" style={{ color: config.primaryHex }}>
                      {formatCurrency(insights.avgRevenuePerEvent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Recebido</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(insights.paidAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">A Receber</p>
                    <p className="text-lg font-bold text-amber-400">
                      {formatCurrency(insights.pendingAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eventos */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 bp-text-primary" />
                  Estatísticas de Eventos
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total de Eventos</span>
                    <Badge variant="secondary" className="text-base font-bold">
                      {insights.totalEvents}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Agendados</span>
                    <Badge style={{ backgroundColor: `${config.primaryHex}cc` }}>{insights.eventsByStatus.scheduled}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Em Andamento</span>
                    <Badge className="bg-amber-600/80">{insights.eventsByStatus.in_progress}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Concluídos</span>
                    <Badge className="bg-green-600/80">{insights.eventsByStatus.completed}</Badge>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-sm text-slate-400">Frequência Média</span>
                    <span className="text-sm font-bold text-white">
                      {insights.avgEventsPerMonth} eventos/mês
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Atividade Recente
                </h3>
                {insights.lastEvent ? (
                  <div className="space-y-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 mb-1">Último Evento</p>
                      <EventHeading event={insights.lastEvent} client={client} size="sm" />
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDisplayDate(insights.lastEvent.start_date)}
                      </p>
                    </div>
                    {insights.daysSinceLastEvent !== null && (
                      <div className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg">
                        {insights.daysSinceLastEvent <= 30 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-sm text-green-400">
                              Cliente ativo (último evento há {insights.daysSinceLastEvent} dias)
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span className="text-sm text-amber-400">
                              Sem eventos há {insights.daysSinceLastEvent} dias
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Total de Horas Trabalhadas</p>
                      <p className="text-lg font-bold" style={{ color: config.primaryHex }}>
                        {insights.totalHours.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum evento registrado ainda.</p>
                )}
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
        <div className="p-4 pt-3 border-t border-slate-800 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={onClose}
          >
            Fechar
          </Button>
          <Button
            className="flex-1 font-bold text-[#06070a]"
            style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})` }}
            onClick={() => { onClose(); hardNavigate(`/client-detail?id=${client?.id}`); }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Detalhes Completos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}