
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppData } from '@/components/context/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Building, User, Mail, Phone, Calendar, Clock, DollarSign,
  Briefcase, Edit, Plus, ChevronDown, ChevronUp, AlertCircle, PieChart, BarChart3, Receipt } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import LoadingSpinner from '@/components/layout/LoadingSpinner';
import EmptyState from '@/components/layout/EmptyState';
import ClientForm from '@/components/clients/ClientForm';
import EventForm from '@/components/calendar/EventForm';
import EventDetailModal from '@/components/reports/EventDetailModal';
import ReportEventList from '@/components/reports/ReportEventList';
import ReportsChart from '@/components/reports/ReportsChart';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const StatCard = ({ icon: Icon, title, value, color }) =>
<Card className="bg-slate-800/50 border-slate-700">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-gradient-to-tr ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-300">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </CardContent>
  </Card>;


export default function ClientDetailPage() {
  const query = useQuery();
  const clientId = query.get('id');
  const { data, loading, refreshData, loadClients, loadEvents, loadDailyWork, loadExpenses } = useAppData();
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const [showClientForm, setShowClientForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // CORREÇÃO: Carregar todos os dados necessários para a página de detalhes
  useEffect(() => {
    loadClients();
    loadEvents();
    loadDailyWork();
    loadExpenses();
  }, [clientId, loadClients, loadEvents, loadDailyWork, loadExpenses]);

  const client = useMemo(() =>
  !loading.clients && Array.isArray(data.clients) ? data.clients.find((c) => c.id === clientId) : null,
  [data.clients, clientId, loading.clients]);

  const clientEvents = useMemo(() =>
  data.events?.filter((e) => e.client_id === clientId).sort((a, b) => new Date(b.start_date) - new Date(a.start_date)) || [],
  [data.events, clientId]);

  const clientEventIds = useMemo(() => clientEvents.map((e) => e.id), [clientEvents]);

  const clientWork = useMemo(() =>
  data.dailyWork?.filter((w) => clientEventIds.includes(w.event_id)) || [],
  [data.dailyWork, clientEventIds]);

  const clientExpenses = useMemo(() =>
  data.expenses?.filter((e) => clientEventIds.includes(e.event_id)) || [],
  [data.expenses, clientEventIds]);

  const stats = useMemo(() => {
    // CORREÇÃO: Lógica de cálculo de receita total para estatísticas
    const totalRevenue = clientWork.reduce((sum, work) => sum + (work.daily_cache || 0), 0);
    const totalHours = clientWork.reduce((sum, work) => sum + (work.total_hours || 0), 0);
    const paidEvents = clientEvents.filter((e) => e.payment_status === 'paid');
    const unpaidEvents = clientEvents.filter((e) => e.payment_status !== 'paid');

    const calculateEventRevenue = (event) => {
      const works = clientWork.filter((w) => w.event_id === event.id);
      return works.reduce((sum, work) => sum + (work.daily_cache || 0), 0);
    };

    const paidAmount = paidEvents.reduce((sum, event) => sum + (event.paid_amount || calculateEventRevenue(event)), 0);
    const unpaidAmount = unpaidEvents.reduce((sum, event) => sum + calculateEventRevenue(event), 0);

    return {
      totalEvents: clientEvents.length,
      totalHours: totalHours.toFixed(1),
      totalRevenue: totalRevenue,
      paidAmount: paidAmount,
      unpaidAmount: unpaidAmount,
      avgRevenuePerEvent: clientEvents.length > 0 ? totalRevenue / clientEvents.length : 0
    };
  }, [clientEvents, clientWork]);

  const handleSuccess = useCallback(() => {
    refreshData();
    setShowClientForm(false);
    setShowEventForm(false);
    setShowEventDetail(false);
  }, [refreshData]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  // CORREÇÃO: Lógica de carregamento e estado de erro
  const isLoading = loading.clients || loading.events || loading.dailyWork || loading.expenses;

  if (isLoading) {
    return <div className="flex justify-center items-center h-[80vh]"><LoadingSpinner text="Carregando dados do cliente..." /></div>;
  }

  if (!client) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <EmptyState
          icon={Building}
          title="Cliente não encontrado"
          description="Não foi possível encontrar o cliente que você está procurando. Ele pode ter sido excluído ou o link está incorreto.">

          <Link to={createPageUrl('Clients')}>
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Clientes</Button>
          </Link>
        </EmptyState>
      </div>);

  }

  return (
    <>
    <div className="space-y-6">
      <Link to={createPageUrl('Clients')} className="inline-flex items-center text-sm text-slate-300 hover:text-cyan-400 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para todos os clientes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {client.logo_url ?
            <img src={client.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white/10 p-1" /> :

            <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-cyan-400 font-bold text-3xl">
              {client.name.charAt(0)}
            </div>
            }
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <p className="text-slate-400">{client.contact_person}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowClientForm(true)} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">
            <Edit className="w-4 h-4 mr-2" />
            Editar Cliente
          </Button>
          <Button onClick={() => setShowEventForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>
      
      {/* Cards de Contato e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 text-slate-50 rounded-lg border shadow-sm md:col-span-1 border-slate-800">
            <CardHeader><CardTitle className="text-3xl text-2xl font-semibold underline leading-none tracking-tight">Informações de Contato</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                {client.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /> <span className="text-white break-all">{client.email}</span></div>}
                {client.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /> <span className="text-white">{client.phone}</span></div>}
                {client.notes && <p className="text-slate-300 pt-3 border-t border-slate-700 whitespace-pre-wrap">{client.notes}</p>}
            </CardContent>
        </Card>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <StatCard icon={Briefcase} title="Total de Eventos" value={stats.totalEvents} color="from-cyan-500 to-blue-500" />
            <StatCard icon={DollarSign} title="Receita Total" value={formatCurrency(stats.totalRevenue)} color="from-green-500 to-emerald-500" />
            <StatCard icon={Clock} title="Total de Horas" value={`${stats.totalHours}h`} color="from-amber-500 to-orange-500" />
            <StatCard icon={PieChart} title="Receita Média / Evento" value={formatCurrency(stats.avgRevenuePerEvent)} color="from-purple-500 to-violet-500" />
        </div>
      </div>
      
       {/* Seção Financeira */}
      <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
              <CardTitle className="text-slate-50 text-lg font-semibold tracking-tight flex items-center gap-2">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                  <p className="text-sm text-slate-300">FATURAMENTO PAGO</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <div>
                  <p className="text-sm text-slate-300">FATURAMENTO PENDENTE</p>
                  <p className="text-2xl font-bold text-amber-400">{formatCurrency(stats.unpaidAmount)}</p>
              </div>
              <div>
                  <p className="text-sm text-slate-300">FATURAMENTO TOTAL</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
          </CardContent>
      </Card>


      {/* Gráfico e Lista de Eventos */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div className="xl:col-span-3">
          <ReportsChart data={{ events: clientEvents, work: clientWork }} />
        </div>
        <div className="xl:col-span-2">
            <ReportEventList
              events={clientEvents}
              clients={data.clients || []}
              onEventClick={handleEventClick}
              title="Histórico de Eventos" />

        </div>
      </div>

    </div>

    {/* Modais */}
    <AnimatePresence>
        {showClientForm &&
        <ClientForm isOpen={showClientForm} client={client} onClose={() => setShowClientForm(false)} onSaveSuccess={handleSuccess} />
        }
        {showEventForm &&
        <EventForm
          isOpen={showEventForm}
          clients={data.clients || []}
          event={null}
          onClose={() => setShowEventForm(false)}
          onSuccess={handleSuccess}
          // Pré-seleciona o cliente atual
          initialData={{ client_id: clientId }} />

        }
        {showEventDetail && selectedEvent &&
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setShowEventDetail(false)}
          dailyWork={data.dailyWork?.filter((w) => w.event_id === selectedEvent.id) || []}
          expenses={data.expenses?.filter((e) => e.event_id === selectedEvent.id) || []}
          onPaymentUpdate={handleSuccess}
          onDeleteSuccess={handleSuccess}
          onWorkEdit={handleSuccess}
          onWorkDelete={handleSuccess}
          onAddExpense={handleSuccess}
          onExpenseEdit={handleSuccess}
          onExpenseDelete={handleSuccess} />

        }
    </AnimatePresence>
    </>);

}