

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ArrowRight,
  Receipt
} from
'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isFuture, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import PeriodSummary from '@/components/dashboard/PeriodSummary';
import EventStatusSummary from '@/components/dashboard/EventStatusSummary'; // Importado

const MobileDashboardSkeleton = () =>
<div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-xl bg-slate-800/80" />
        <Skeleton className="h-28 rounded-xl bg-slate-800/80" />
        <Skeleton className="h-28 rounded-xl bg-slate-800/80" />
        <Skeleton className="h-28 rounded-xl bg-slate-800/80" />
        <Skeleton className="h-28 rounded-xl bg-slate-800/80" />
      </div>
      <Skeleton className="h-48 rounded-xl bg-slate-800/80" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-14 rounded-lg bg-slate-800/80" />
        <Skeleton className="h-14 rounded-lg bg-slate-800/80" />
      </div>
    </div>;


const MobileEventItem = ({ event, clientName, onEventClick }) =>
<div onClick={() => onEventClick(event)} className="cursor-pointer">
  <motion.div
    whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
    className="flex items-center justify-between p-3 rounded-lg transition-colors border border-slate-800"
  >
    <div className="flex items-center gap-3">
      <div
      className="w-3 h-8 rounded-full"
      style={{ backgroundColor: event.color || '#22d3ee' }} />

      <div>
        <p className="font-bold text-white text-sm">{clientName}</p>
        <p className="text-xs text-slate-400">{event.title}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-mono text-white text-xs">{format(parseISO(event.start_date), 'dd/MM')}</p>
      <p className="text-xs text-slate-500">{format(parseISO(event.start_date), "EEE", { locale: ptBR })}</p>
    </div>
  </motion.div>
</div>;


const MobileDashboard = ({
  events = [],
  realizedRevenueEvents = [],
  expenses = [],
  clients = [],
  onEventClick,
  loading = false,
  globalFinancials,
  onMetricClick,
  period
}) => {
  if (loading) {
    return <MobileDashboardSkeleton />;
  }

  const upcomingEvents = events.filter((e) => {
    try {
      return e.start_date && isValid(parseISO(e.start_date)) && isFuture(parseISO(e.start_date));
    } catch {
      return false;
    }
  }).slice(0, 3);
  
  const getClientName = (clientId) => {
    const client = clients.find((c) => c && c.id === clientId);
    return client ? client.name : 'Cliente';
  };

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro Unificado */}
      <PeriodSummary
          period={period}
          realizedRevenueEvents={realizedRevenueEvents}
          expenses={expenses}
          accountsReceivable={globalFinancials.totalAccountsReceivable}
          projectedRevenue={globalFinancials.totalProjectedRevenue}
          loading={loading}
          onCardClick={onMetricClick}
      />

      {/* Próximos Eventos */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-cyan-300 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximos Eventos
          </CardTitle>
          <Link to={createPageUrl('Calendar')}>
            <Button variant="ghost" size="sm" className="text-slate-400">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingEvents.length > 0 ?
          upcomingEvents.map((event) =>
          <MobileEventItem
            key={event.id}
            event={event}
            clientName={getClientName(event.client_id)}
            onEventClick={onEventClick} />

          ) :

          <p className="text-slate-400 text-center py-4">Nenhum evento próximo</p>
          }
        </CardContent>
      </Card>
      
      {/* NOVO: Status dos Eventos */}
      <EventStatusSummary
        events={events}
        clients={clients}
        onEventClick={onEventClick}
        loading={loading}
        onCardClick={onMetricClick}
      />

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Link to={createPageUrl('Calendar')}>
          <Button className="w-full bg-cyan-600 hover:bg-cyan-700 h-14">
            <Calendar className="w-5 h-5 mr-2" />
            Novo Evento
          </Button>
        </Link>
        <Link to={createPageUrl('Expenses')}>
          <Button variant="outline" className="bg-slate-800 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground w-full h-14 border-slate-600 hover:bg-slate-800">
            <Receipt className="w-5 h-5 mr-2" />
            Nova Despesa
          </Button>
        </Link>
      </div>
    </div>);

};

export default MobileDashboard;

