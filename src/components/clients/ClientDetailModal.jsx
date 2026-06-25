import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  X, Edit, Trash2, Phone, Mail, Calendar, TrendingUp,
  Clock, DollarSign, User, MessageCircle,
  CheckCircle2, AlertCircle, ArrowRight, BarChart3,
  Activity, Target, Globe, ExternalLink, Plus
} from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useEvents } from '@/lib/useEvents';
import { useDailyWork } from '@/lib/useDailyWork';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { formatDisplayDate, formatDateWithWeekday, getEventStatus, getEventStatusConfig } from '@/components/utils/dateUtils';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { ClientDraftBadge } from '@/components/clients/ClientDraftBadge';
import EventHeading from '@/components/events/EventHeading';

const EventTimelineItem = ({ event, client, isLast, workData, onClick }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  // Use event.status here, which will now be the calculated real status from clientData
  const eventWork = workData.filter((work) => work.event_id === event.id);
  const totalWorkedHours = eventWork.reduce((sum, work) => sum + (work.total_hours || 0), 0);
  const totalEarned = eventWork.reduce((sum, work) => sum + (work.daily_cache || 0), 0);

  const eventStatus = getEventStatus(event);
  const statusConfig = getEventStatusConfig(event);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${statusConfig.color} shadow-lg border-2 border-slate-800 relative z-10`}>
          {StatusIcon && <StatusIcon className="w-2.5 h-2.5 absolute top-0.5 left-0.5 text-white" />}
        </div>
        {!isLast && <div className="w-px h-20 bg-gradient-to-b from-slate-600 to-slate-700 mt-2" />}
      </div>

      <div className="flex-1 pb-6">
        <div
          role="button"
          tabIndex={0}
          className={`bg-slate-800/50 rounded-lg p-4 border ${statusConfig.borderColor} hover:border-slate-600 cursor-pointer transition-all group-hover:bg-slate-800/70 relative overflow-hidden`}
          onClick={() => onClick && onClick(event)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(event); } }}
        >
          {/* Linha decorativa baseada no status */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusConfig.color}`} />

          <div className="flex items-start justify-between mb-3 gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <EventHeading event={event} client={client} size="sm" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 min-w-0">
                <p className="text-sm text-slate-400 truncate">
                  {event.start_date === event.end_date || !event.end_date
                    ? formatDisplayDate(event.start_date)
                    : `${formatDisplayDate(event.start_date)} - ${formatDisplayDate(event.end_date)}`}
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs w-fit ${statusConfig.textColor} ${statusConfig.borderColor}`}
                >
                  {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Métricas do Evento */}
          {getEventCacheAmount(event) > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-1 bp-text-primary bp-surface-primary px-2 py-1 rounded">
                <DollarSign className="w-3 h-3" />
                {isVisible ? formatCurrency(getEventCacheAmount(event)) : '••••'}
              </div>

              {eventStatus === 'completed' && eventWork.length > 0 && (
                <>
                  <div className="flex items-center gap-1 text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    {totalWorkedHours.toFixed(1)}h
                  </div>
                  <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    <TrendingUp className="w-3 h-3" />
                    {isVisible ? formatCurrency(totalEarned) : '••••'}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Alertas de Pagamento */}
          {event.payment_status === 'unpaid' && eventStatus === 'completed' && (
            <div className="mt-3 flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Pagamento pendente</span>
            </div>
          )}

          {event.payment_status === 'paid' && event.paid_amount && (
            <div className="mt-3 flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                Pago: {isVisible ? formatCurrency(event.paid_amount) : '••••'}
                {event.paid_date && (
                  <span className="text-slate-400 ml-2">
                    em {formatDisplayDate(event.paid_date)}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const METRIC_COLOR_CLASSES = {
  primary: null,
  green:  { value: 'text-green-300',  icon: 'text-green-400'  },
  amber:  { value: 'text-amber-300',  icon: 'text-amber-400'  },
  slate:  { value: 'text-slate-300',  icon: 'text-slate-400'  },
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color = "slate", trend, onClick }) => {
  const { primaryHex } = useCategoryTheme();
  const isPrimary = color === 'primary';
  const cc = isPrimary ? null : (METRIC_COLOR_CLASSES[color] || METRIC_COLOR_CLASSES.slate);
  return (
  <Card
    className={`bg-slate-800/50 border-slate-700 ${onClick ? 'hover:border-slate-600 cursor-pointer' : ''} transition-all`}
    onClick={onClick}>

    <CardContent className="p-4 relative">
      <Icon
        className={`w-10 h-10 absolute right-3 top-3 opacity-10 ${isPrimary ? '' : cc.icon}`}
        style={isPrimary ? { color: primaryHex } : undefined}
      />
      <div className="min-w-0">
        <p className="text-slate-400 text-xs uppercase font-medium mb-1">{title}</p>
        <p
          className={`text-xl font-bold font-mono truncate ${isPrimary ? '' : cc.value}`}
          style={isPrimary ? { color: primaryHex } : undefined}
          title={typeof value === 'string' ? value : undefined}
        >{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1 truncate" title={subtitle}>{subtitle}</p>}
      </div>
      {trend &&
        <div className="flex items-center gap-1 mt-2 text-xs">
          {trend.direction === 'up' ?
            <ArrowRight className="w-3 h-3 text-green-400 rotate-[-45deg]" /> :

            <ArrowRight className="w-3 h-3 text-red-400 rotate-[45deg]" />
          }
          <span className={trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}>
            {trend.value}
          </span>
        </div>
      }
    </CardContent>
  </Card>
  );
};

export default function ClientDetailModal({
  client,
  onClose,
  onEdit,
  onDelete
}) {
  const { events } = useEvents();
  const { dailyWork } = useDailyWork();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const [activeTab, setActiveTab] = useState('overview');

  // Dados enriquecidos do cliente com cálculos financeiros corretos
  const clientData = useMemo(() => {
    if (!client || !events || !dailyWork) {
      return {
        events: [],
        workData: [],
        totalRevenue: 0,
        totalPending: 0,
        totalEvents: 0,
        completedEventsCount: 0,
        scheduledEventsCount: 0,
        inProgressEventsCount: 0,
        upcomingEvents: [],
        paidEventsCount: 0,
        unpaidEvents: [],
        totalHours: 0,
        averageEventValue: 0,
        averageHoursPerEvent: 0,
        paymentConversionRate: 0,
        hourlyRate: 0,
      };
    }

    const clientEvents = events
      .filter(event => event.client_id === client.id)
      .map(event => {
        const realStatus = getEventStatus(event);
        // Overwrite the event's status with the real-time calculated status
        return { ...event, status: realStatus };
      })
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    const workDataFilteredByClientEvents = dailyWork.filter((work) =>
      clientEvents.some((event) => event.id === work.event_id)
    );

    const completedEventsList = clientEvents.filter((event) => getEventStatus(event) === 'completed');
    const upcomingEventsList = clientEvents.filter((event) =>
      ['scheduled', 'in_progress', 'pending', 'confirmed'].includes(getEventStatus(event))
    );

    const paidEventsList = clientEvents.filter((event) =>
      event.payment_status === 'paid' && event.paid_amount !== undefined && event.paid_amount !== null && event.paid_amount > 0
    );

    const totalRevenue = paidEventsList.reduce((sum, event) => {
      return sum + (parseFloat(event.paid_amount) || 0);
    }, 0);

    const totalHours = workDataFilteredByClientEvents.reduce((sum, work) => sum + (work.total_hours || 0), 0);

    const unpaidCompletedEventsList = completedEventsList.filter((event) =>
      event.payment_status === 'unpaid'
    );

    const totalPending = unpaidCompletedEventsList.reduce((sum, event) => {
      const eventWork = workDataFilteredByClientEvents.filter((work) => work.event_id === event.id);
      if (eventWork.length > 0) {
        const fromWork = eventWork.reduce((workSum, work) => workSum + (work.daily_cache || 0), 0);
        if (fromWork > 0) return sum + fromWork;
      }
      return sum + getEventCacheAmount(event);
    }, 0);

    const completedEventsCount = completedEventsList.length;
    const paidEventsCount = paidEventsList.length;

    const averageEventValue = paidEventsCount > 0 ? totalRevenue / paidEventsCount : 0;
    const averageHoursPerEvent = completedEventsCount > 0 ? totalHours / completedEventsCount : 0;
    const paymentConversionRate = completedEventsCount > 0 ? (paidEventsCount / completedEventsCount) * 100 : 0;
    const hourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    return {
      ...client,
      events: clientEvents, // Enriched events with calculated status
      workData: workDataFilteredByClientEvents,
      completedEventsCount: completedEventsCount,
      upcomingEventsCount: upcomingEventsList.length,
      upcomingEvents: upcomingEventsList,
      paidEventsCount: paidEventsCount,
      unpaidEvents: unpaidCompletedEventsList, // List of unpaid completed events
      totalEvents: clientEvents.length,
      totalRevenue,
      totalPending,
      totalHours,
      averageEventValue,
      averageHoursPerEvent,
      paymentConversionRate,
      hourlyRate,
      scheduledEventsCount: clientEvents.filter(e => e.status === 'scheduled').length,
      inProgressEventsCount: clientEvents.filter(e => e.status === 'in_progress').length,
    };
  }, [client, events, dailyWork]);

  // Adicionando ações de contato rápidas
  const handleContactAction = useCallback((action, e) => {
    e.stopPropagation();
    switch (action) {
      case 'call':
        if (client.phone) window.open(`tel:${client.phone}`, '_blank');
        break;
      case 'email':
        if (client.email) window.open(`mailto:${client.email}`, '_blank');
        break;
      case 'whatsapp':
        if (client.phone) {
          const cleanPhone = client.phone.replace(/\D/g, '');
          // Assuming default country code 55 for Brazil if not explicitly international
          const whatsappNumber = cleanPhone.length > 11 ? cleanPhone : `55${cleanPhone}`;
          window.open(`https://wa.me/${whatsappNumber}`, '_blank');
        }
        break;
    }
  }, [client]);

  const handleEventClick = useCallback((event) => {
    onClose();
    // Delay para deixar a animação de saída do Dialog completar antes de navegar
    setTimeout(() => hardNavigate(event?.id ? `/calendar?event=${event.id}` : '/calendar'), 220);
  }, [onClose]);

  const modalAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
  };

  if (!clientData) return null;

  return (
    <AnimatePresence>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent hideDefaultClose className="sm:max-w-4xl h-[95dvh] bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200 flex flex-col p-0 overflow-hidden bp-focus-scope">
          <motion.div variants={modalAnimation} initial="hidden" animate="visible" exit="hidden" className="flex flex-col h-full min-h-0">
            <DialogHeader className="pt-4 px-6 border-b border-slate-800 pb-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-16 w-16 border-2 border-slate-700">
                      <AvatarImage src={client.logo_url} alt={client.name} />
                      <AvatarFallback
                        className={`text-2xl font-bold ${
                          client.client_type === 'pessoa'
                            ? 'bp-person-avatar'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {client.client_type === 'pessoa'
                          ? <User className="w-7 h-7" />
                          : client.name?.charAt(0).toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>
                    {client.client_type === 'pessoa' && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bp-person-pin flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <DialogTitle className="text-xl sm:text-2xl font-bold text-white font-display truncate">
                        {client.name}
                      </DialogTitle>
                      {client.client_type === 'pessoa' ? (
                        <span className="text-[11px] bp-person-badge rounded px-2 py-0.5 flex-shrink-0">
                          Pessoa
                        </span>
                      ) : (
                        <span
                          className="text-[11px] rounded px-2 py-0.5 flex-shrink-0"
                          style={{ background: `${config.primaryHex}18`, color: config.primaryHex, border: `1px solid ${config.primaryHex}33` }}
                        >
                          Empresa
                        </span>
                      )}
                      {client.profile_complete === false && <ClientDraftBadge />}
                    </div>
                    {client.contact_person &&
                      <p className="text-slate-400 truncate">
                        {client.client_type === 'pessoa' ? 'Empresa: ' : 'Contato: '}
                        {client.contact_person}
                      </p>
                    }
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white flex-shrink-0" aria-label="Fechar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {/* Ações Rápidas de Contato */}
              <div className="flex flex-wrap gap-2 pt-4">
                {client.email && (
                  <Button variant="outline" size="sm" onClick={(e) => handleContactAction('email', e)} className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white flex-1 min-w-[120px] h-10">
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </Button>
                )}
                {client.phone && (
                  <>
                    <Button variant="outline" size="sm" onClick={(e) => handleContactAction('call', e)} className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white flex-1 min-w-[120px] h-10">
                      <Phone className="w-4 h-4 mr-2" /> Ligar
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => handleContactAction('whatsapp', e)} className="bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-300 hover:text-green-200 flex-1 min-w-[120px] h-10">
                      <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                  </>
                )}
                {client.invoice_portal_url && (
                  <Button variant="outline" size="sm" onClick={() => window.open(client.invoice_portal_url, '_blank')} className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 flex-1 min-w-[120px] h-10" style={{ color: config.primaryHex }}>
                    <Globe className="w-4 h-4 mr-2" /> Portal NF-e
                  </Button>
                )}
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden pt-4 px-6">
              <TabsList className="grid grid-cols-3 bg-slate-800/50 p-1 h-auto rounded-xl mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2 px-3">
                  <BarChart3 className="w-4 h-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2 px-3">
                  <Activity className="w-4 h-4" />
                  Linha do Tempo
                </TabsTrigger>
                <TabsTrigger value="metrics" className="flex items-center gap-2 px-3">
                  <Target className="w-4 h-4" />
                  Métricas
                </TabsTrigger>
              </TabsList>

              <div className="bp-modal-scroll pr-2 -mr-2 pb-6">
                <AnimatePresence mode="wait">
                  <TabsContent value="overview" className="mt-0">
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6">

                      {/* Métricas Principais CORRIGIDAS */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <MetricCard
                          title="Total de Eventos"
                          value={clientData.totalEvents}
                          subtitle={`${clientData.completedEventsCount} concluídos`}
                          icon={Calendar}
                          color="primary" />

                        <MetricCard
                          title="Faturamento Real"
                          value={isVisible ? formatCurrency(clientData.totalRevenue) : '••••'}
                          subtitle={`${clientData.paidEventsCount} eventos pagos`}
                          icon={DollarSign}
                          color="green" />

                        <MetricCard
                          title="A Receber"
                          value={isVisible ? formatCurrency(clientData.totalPending) : '••••'}
                          subtitle={`${clientData.unpaidEvents.length} evento(s) pendente(s)`}
                          icon={AlertCircle}
                          color="amber" />

                        <MetricCard
                          title="Horas Trabalhadas"
                          value={`${clientData.totalHours.toFixed(1)}h`}
                          subtitle={`Média: ${clientData.averageHoursPerEvent.toFixed(1)}h/evento`}
                          icon={Clock}
                          color="primary" />

                      </div>

                      {/* Próximos Eventos */}
                      {clientData.upcomingEvents.length > 0 &&
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-lg bp-text-primary flex items-center gap-2">
                              <Calendar className="w-5 h-5" />
                              Próximos Eventos ({clientData.upcomingEvents.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {clientData.upcomingEvents.slice(0, 3).map((event) =>
                              <div
                                key={event.id}
                                role="button"
                                tabIndex={0}
                                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 cursor-pointer transition-all gap-3 min-w-0"
                                onClick={() => handleEventClick(event)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEventClick(event); } }}>

                                <div className="min-w-0 flex-1">
                                  <EventHeading event={event} client={client} size="sm" />
                                  <p className="text-sm text-slate-400 truncate">
                                    {formatDateWithWeekday(event.start_date)} - {formatDateWithWeekday(event.end_date)}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {getEventCacheAmount(event) > 0 && (
                                    <p className="text-sm font-medium text-green-400">
                                      {isVisible ? formatCurrency(getEventCacheAmount(event)) : '••••'}
                                    </p>
                                  )}
                                  <ArrowRight className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                                </div>
                              </div>
                            )}
                            {clientData.upcomingEvents.length > 3 &&
                              <p className="text-center text-slate-400 text-sm pt-2">
                                +{clientData.upcomingEvents.length - 3} eventos adicionais
                              </p>
                            }
                          </CardContent>
                        </Card>
                      }

                      {/* Informações do Cliente */}
                      {(client.email || client.phone || client.notes) &&
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-slate-300 flex items-center gap-2">
                              <User className="w-5 h-5" />
                              Informações de Contato
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {client.email &&
                              <div className="flex items-center justify-between gap-3 min-w-0">
                                <span className="text-slate-400 flex-shrink-0">Email:</span>
                                <span className="text-white font-medium break-all text-right min-w-0">{client.email}</span>
                              </div>
                            }
                            {client.phone &&
                              <div className="flex items-center justify-between gap-3 min-w-0">
                                <span className="text-slate-400 flex-shrink-0">Telefone:</span>
                                <span className="text-white font-medium truncate min-w-0" title={client.phone}>{client.phone}</span>
                              </div>
                            }
                            {client.notes &&
                              <>
                                <Separator className="bg-slate-700" />
                                <div>
                                  <span className="text-slate-400 text-sm">Observações:</span>
                                  <p className="text-slate-200 mt-2 whitespace-pre-wrap">{client.notes}</p>
                                </div>
                              </>
                            }
                          </CardContent>
                        </Card>
                      }
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-0">
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-lg bp-text-primary flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Linha do Tempo Completa
                          </CardTitle>
                          <p className="text-sm text-slate-400">
                            {clientData.events.length} evento(s) registrado(s) • Histórico completo de interações
                          </p>
                        </CardHeader>
                        <CardContent>
                          {clientData.events.length > 0 ?
                            <div className="space-y-2">
                              {clientData.events.map((event, index) =>
                                <EventTimelineItem
                                  key={event.id}
                                  event={event}
                                  client={client}
                                  isLast={index === clientData.events.length - 1}
                                  workData={clientData.workData}
                                  onClick={handleEventClick} />

                              )}
                            </div> :

                            <div className="text-center py-8">
                              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                              <p className="text-slate-400">Nenhum evento encontrado para este cliente</p>
                              <p className="text-slate-500 text-sm mt-1">Todos os eventos aparecem aqui automaticamente</p>
                            </div>
                          }
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="metrics" className="mt-0">
                    <motion.div
                      key="metrics"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6">

                      {/* Performance Metrics CORRIGIDAS */}
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-lg text-green-300 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Indicadores de Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-slate-400 text-sm">Valor Médio por Evento Pago</p>
                              <p className="text-2xl font-bold text-green-400">
                                {isVisible ? formatCurrency(clientData.averageEventValue) : '••••'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-sm">Taxa de Conversão de Pagamento</p>
                              <p className="text-2xl font-bold bp-text-primary">
                                {clientData.paymentConversionRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-slate-400 text-sm">Valor por Hora</p>
                              <p className="text-2xl font-bold bp-text-primary">
                                {isVisible ? formatCurrency(clientData.hourlyRate) : '••••'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-sm">Média de Horas por Evento</p>
                              <p className="text-2xl font-bold text-amber-400">
                                {clientData.averageHoursPerEvent.toFixed(1)}h
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Status Breakdown CORRIGIDO */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                          title="Eventos Pagos"
                          value={clientData.paidEventsCount}
                          subtitle={`${clientData.paymentConversionRate.toFixed(0)}% dos concluídos`}
                          icon={CheckCircle2}
                          color="green" />

                        <MetricCard
                          title="Eventos Futuros"
                          value={clientData.upcomingEventsCount}
                          subtitle="Próximos agendamentos"
                          icon={Calendar}
                          color="primary" />

                        <MetricCard
                          title="Pagamentos Pendentes"
                          value={clientData.unpaidEvents.length}
                          subtitle={isVisible ? formatCurrency(clientData.totalPending) : '••••'}
                          icon={AlertCircle}
                          color="amber" />

                      </div>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </div>
            </Tabs>

            <DialogFooter className="p-6 pt-4 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:justify-between gap-3 flex-shrink-0">
              <Button
                variant="destructive"
                onClick={() => onDelete(client.id)}
                className="w-full sm:w-auto order-2 sm:order-1">

                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Cliente
              </Button>
              <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2 flex-wrap">
                <Button variant="outline" onClick={onClose} className="sm:flex-none bg-transparent border-slate-600 hover:bg-slate-800">
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { onClose(); hardNavigate(`/client-detail?id=${client.id}`); }}
                  className="sm:flex-none border-slate-600 hover:bg-slate-800 text-slate-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Página Completa
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { onClose(); hardNavigate(`/calendar?action=new-event&client_id=${client.id}`); }}
                  className="sm:flex-none border-emerald-700/60 hover:bg-emerald-900/20 text-emerald-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar Show
                </Button>
                <Button
                  onClick={() => { onClose(); onEdit(client); }}
                  className="sm:flex-none text-white border-0"
                  style={{ backgroundColor: config.primaryHex }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}
