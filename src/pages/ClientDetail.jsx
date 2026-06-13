
import { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useClients } from '@/lib/useClients';
import { useEvents } from '@/lib/useEvents';
import { useDailyWork } from '@/lib/useDailyWork';
import { useExpenses } from '@/lib/useExpenses';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  User,
  Mail,
  Phone,
  Clock,
  DollarSign,
  Briefcase,
  Edit,
  Plus,
  PieChart,
  Pencil,
  Check,
  X,
  MessageCircle,
  CalendarDays,
  MapPin,
  Star,
  Trash2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { hardNavigate } from '@/lib/hardNavigate';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { getEventStatus } from '@/components/utils/dateUtils';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';

import LoadingSpinner from '@/components/layout/LoadingSpinner';
import EmptyState from '@/components/layout/EmptyState';
import ClientForm from '@/components/clients/ClientForm';
import EventForm from '@/components/calendar/EventForm';
import EventDetailModal from '@/components/reports/EventDetailModal';
import ReportEventList from '@/components/reports/ReportEventList';
import ReportsChart from '@/components/reports/ReportsChart';
import { ClampedText } from '@/components/ui/overflowText';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import appToast from '@/lib/appToast';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const StatCard = ({ icon: Icon, title, value, iconStyle }) => (
  <Card className="bg-[#161923]/60 border-[#23262f] min-w-0 overflow-hidden">
    <CardContent className="p-4 flex items-center gap-4 min-w-0">
      <div className="p-3 rounded-lg flex-shrink-0" style={iconStyle}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300 truncate">{title}</p>
        <p className="text-xl font-bold text-white truncate" title={typeof value === 'string' ? value : undefined}>{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default function ClientDetailPage() {
  const query = useQuery();
  const clientId = query.get('id');

  const { clients, loading: clientsLoading, refetch: refetchClients, update: updateClient, delete: deleteClient } = useClients();
  const { events, loading: eventsLoading, refetch: refetchEvents, delete: deleteEvent } = useEvents();
  const { dailyWork, loading: dailyWorkLoading, refetch: refetchDailyWork } = useDailyWork();
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  const [showClientForm, setShowClientForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const isLoading = clientsLoading || eventsLoading || dailyWorkLoading || expensesLoading;

  const client = useMemo(() =>
    !clientsLoading && Array.isArray(clients) ? clients.find(c => c.id === clientId) : null,
    [clients, clientId, clientsLoading]
  );

  const clientEvents = useMemo(() =>
    events.filter(e => e.client_id === clientId).sort((a, b) => new Date(b.start_date) - new Date(a.start_date)),
    [events, clientId]
  );

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const upcomingEvents = useMemo(() =>
    clientEvents
      .filter(e => {
        if (!e.start_date) return false;
        const st = getEventStatus(e);
        if (st === 'cancelled' || st === 'archived') return false;
        return e.start_date >= todayIso;
      })
      .sort((a, b) => (a.start_date > b.start_date ? 1 : -1)),
    [clientEvents, todayIso]
  );

  const clientEventIds = useMemo(() => clientEvents.map(e => e.id), [clientEvents]);

  const avgRating = useMemo(() => {
    const rated = clientEvents.filter(e => e.client_rating != null);
    if (rated.length === 0) return null;
    return (rated.reduce((s, e) => s + e.client_rating, 0) / rated.length).toFixed(1);
  }, [clientEvents]);

  const clientWork = useMemo(() =>
    dailyWork.filter(w => clientEventIds.includes(w.event_id)),
    [dailyWork, clientEventIds]
  );

  const _clientExpenses = useMemo(() =>
    expenses.filter(e => clientEventIds.includes(e.event_id)),
    [expenses, clientEventIds]
  );

  const getEventRevenue = useCallback((event) => {
    const fromWork = clientWork
      .filter(w => w.event_id === event.id)
      .reduce((sum, w) => sum + (w.daily_cache || 0), 0);
    return fromWork > 0 ? fromWork : getEventCacheAmount(event);
  }, [clientWork]);

  const chartInput = useMemo(() => ({
    realized: clientEvents
      .filter(e => e.payment_status === 'paid')
      .map(e => ({ ...e, calculated_value: e.paid_amount || getEventRevenue(e) })),
    receivable: clientEvents
      .filter(e => e.payment_status !== 'paid' && getEventStatus(e) === 'completed')
      .map(e => ({ ...e, calculated_value: getEventRevenue(e) })),
    projected: clientEvents
      .filter(e => ['scheduled', 'pending', 'confirmed'].includes(getEventStatus(e)))
      .map(e => ({ ...e, calculated_value: getEventRevenue(e) })),
    expenses: _clientExpenses.map(e => ({ date: e.expense_date || e.date, amount: e.amount })),
  }), [clientEvents, _clientExpenses, getEventRevenue]);

  const stats = useMemo(() => {
    const getEventRevenue = (event) => {
      const fromWork = clientWork
        .filter(w => w.event_id === event.id)
        .reduce((sum, w) => sum + (w.daily_cache || 0), 0);
      return fromWork > 0 ? fromWork : getEventCacheAmount(event);
    };

    const totalRevenue = clientEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);
    const totalHours = clientWork.reduce((sum, work) => sum + (work.total_hours || 0), 0);
    const paidEvents = clientEvents.filter(e => e.payment_status === 'paid');
    const unpaidEvents = clientEvents.filter(e => e.payment_status !== 'paid');

    const paidAmount = paidEvents.reduce((sum, e) => sum + (e.paid_amount || getEventRevenue(e)), 0);
    const unpaidAmount = unpaidEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);

    return {
      totalEvents: clientEvents.length,
      totalHours: totalHours.toFixed(1),
      totalRevenue,
      paidAmount,
      unpaidAmount,
      avgRevenuePerEvent: clientEvents.length > 0 ? totalRevenue / clientEvents.length : 0,
      unpaidEventsWithAmounts: unpaidEvents.map(e => ({
        id: e.id,
        title: e.title,
        start_date: e.start_date,
        amount: getEventRevenue(e),
      })),
    };
  }, [clientEvents, clientWork]);

  const handleSuccess = useCallback(() => {
    refetchClients();
    refetchEvents();
    refetchDailyWork();
    refetchExpenses();
    setShowClientForm(false);
    setShowEventForm(false);
    setShowEventDetail(false);
  }, [refetchClients, refetchEvents, refetchDailyWork, refetchExpenses]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleEditEvent = useCallback((event) => {
    setShowEventDetail(false);
    setEditingEvent(event);
    setShowEventForm(true);
  }, []);

  const handleDeleteEvent = useCallback((eventId) => {
    setConfirmDeleteEventId(eventId);
  }, []);

  const handleConfirmDeleteEvent = useCallback(async () => {
    if (!confirmDeleteEventId) return;
    try {
      await deleteEvent(confirmDeleteEventId);
      appToast.success('Evento excluído com sucesso.');
      handleSuccess();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      appToast.error('Não foi possível excluir o evento.');
    } finally {
      setConfirmDeleteEventId(null);
    }
  }, [confirmDeleteEventId, deleteEvent, handleSuccess]);

  const handleConfirmDeleteClient = useCallback(async () => {
    if (!client?.id) return;
    try {
      await deleteClient(client.id);
      appToast.success('Cliente excluído com sucesso.');
      hardNavigate('/clients');
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      appToast.error('Não foi possível excluir o cliente.', {
        description: 'Verifique se não há eventos associados.',
      });
    } finally {
      setConfirmDeleteClient(false);
    }
  }, [client?.id, deleteClient]);

  const saveNotes = useCallback(async () => {
    if (!client?.id) return;
    setSavingNotes(true);
    try {
      await updateClient(client.id, { notes: notesValue });
      await refetchClients();
      setEditingNotes(false);
    } catch {
      // silent — useClients shows its own toast
    } finally {
      setSavingNotes(false);
    }
  }, [client?.id, notesValue, updateClient, refetchClients]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[80vh]"><LoadingSpinner text="Carregando dados do cliente..." /></div>;
  }

  if (!client) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <EmptyState
          icon={Building}
          title="Cliente não encontrado"
          description="Não foi possível encontrar o cliente. Ele pode ter sido excluído ou o link está incorreto."
        >
          <Button variant="outline" onClick={() => hardNavigate('/clients')}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Clientes</Button>
        </EmptyState>
      </div>
    );
  }

  return (
  <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-24">
    <>
      <div className="space-y-6 p-4 md:p-6">
        <button onClick={() => hardNavigate('/clients')} className="inline-flex items-center text-sm hover:opacity-80 transition-colors font-mono" style={{ color: config.primaryHex }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para todos os clientes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {client.logo_url ? (
              <img src={client.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white/10 p-1" />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-3xl"
                style={
                  client.client_type === 'pessoa'
                    ? { background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff' }
                    : { background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`, color: '#06070a' }
                }
              >
                {client.client_type === 'pessoa'
                  ? <User className="w-8 h-8" />
                  : (client.name?.charAt(0) || '?').toUpperCase()
                }
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 min-w-0">
                <h1 className="text-2xl font-bold text-white truncate min-w-0" title={client.name}>{client.name}</h1>
                {client.client_type === 'pessoa' ? (
                  <span className="text-[11px] bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded px-2 py-0.5">Pessoa</span>
                ) : (
                  <span className="text-[11px] bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 rounded px-2 py-0.5">Empresa</span>
                )}
              </div>
              {client.contact_person && (
                <p className="text-slate-400 truncate min-w-0" title={client.contact_person}>
                  {client.client_type === 'pessoa' ? 'Empresa: ' : 'Contato: '}
                  {client.contact_person}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowClientForm(true)} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10">
              <Edit className="w-4 h-4 mr-2" />
              Editar Cliente
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteClient(true)}
              className="border-red-800/60 text-red-400 hover:bg-red-900/20 h-10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
            <Button
              className="border-0 text-[#06070a] font-bold"
              style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})` }}
              onClick={() => { setEditingEvent(null); setShowEventForm(true); }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NeonGlass primary={config.primaryHex} glow className="md:col-span-1 p-5">
            <h2 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: config.primaryHex }}>Informações de Contato</h2>
            <div className="space-y-2 text-sm">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-800/60 transition-colors group"
                >
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-white break-all group-hover:text-cyan-300 transition-colors">{client.email}</span>
                </a>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-800/60 transition-colors group flex-1"
                  >
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-white truncate min-w-0 group-hover:text-cyan-300 transition-colors" title={client.phone}>{client.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (stats.unpaidEventsWithAmounts.length === 0) {
                        const clean = client.phone.replace(/\D/g, '');
                        window.open(`https://wa.me/${clean.length > 11 ? clean : `55${clean}`}`, '_blank');
                      } else {
                        const msg = buildChargeMessage({ clientName: client.name, events: stats.unpaidEventsWithAmounts, totalAmount: stats.unpaidAmount });
                        openWhatsAppCharge(client.phone, msg);
                      }
                    }}
                    className="flex-shrink-0 p-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 transition-colors"
                    title={stats.unpaidAmount > 0 ? 'Cobrar via WhatsApp' : 'WhatsApp'}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="pt-3 border-t border-[#23262f]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">Observações</span>
                  {!editingNotes ? (
                    <button onClick={() => { setNotesValue(client.notes || ''); setEditingNotes(true); }} className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button onClick={saveNotes} disabled={savingNotes} className="text-green-400 hover:text-green-300 disabled:opacity-50 p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingNotes(false)} className="text-slate-500 hover:text-red-400 transition-colors p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 focus:border-cyan-500/50 rounded-lg p-2 text-sm text-white resize-none min-h-[80px] outline-none transition-colors"
                    placeholder="Adicione observações sobre este cliente..."
                  />
                ) : client.notes ? (
                  <ClampedText lines={4} className="text-slate-300 text-sm">
                    {client.notes}
                  </ClampedText>
                ) : (
                  <p className="text-slate-600 text-xs italic">Sem observações</p>
                )}
              </div>
            </div>
          </NeonGlass>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <StatCard icon={Briefcase} title="Total de Eventos" value={stats.totalEvents} iconStyle={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})` }} />
            <StatCard icon={DollarSign} title="Receita Total" value={formatCurrency(stats.totalRevenue)} iconStyle={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }} />
            <StatCard icon={Clock} title="Total de Horas" value={`${stats.totalHours}h`} iconStyle={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }} />
            <StatCard icon={PieChart} title="Receita Média / Evento" value={formatCurrency(stats.avgRevenuePerEvent)} iconStyle={{ background: `linear-gradient(135deg, ${config.primaryHex}99, ${config.accentHex})` }} />
            {avgRating && (
              <div className="col-span-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-700/30">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-4 h-4" fill={parseFloat(avgRating) >= s ? '#fbbf24' : 'none'} stroke={parseFloat(avgRating) >= s ? '#fbbf24' : '#475569'} />
                  ))}
                </div>
                <span className="text-sm font-bold text-amber-300">{avgRating}</span>
                <span className="text-xs text-slate-500">
                  média de {clientEvents.filter(e => e.client_rating != null).length} avaliação{clientEvents.filter(e => e.client_rating != null).length > 1 ? 'ões' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <Card className="bg-indigo-950/30 border-indigo-700/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Próximos Shows ({upcomingEvents.length})
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditingEvent(null); setShowEventForm(true); }}
                  className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" /> Novo
                </Button>
              </div>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 4).map((ev) => {
                  const statusStyles = {
                    pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                    completed: 'bg-green-500/15 text-green-400 border-green-500/30',
                  };
                  const statusLabels = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído' };
                  const st = getEventStatus(ev);
                  const dateLabel = ev.start_date
                    ? format(parseISO(ev.start_date), "d 'de' MMM", { locale: ptBR })
                    : '—';
                  const amount = getEventRevenue(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => handleEventClick(ev)}
                      className="w-full text-left flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg px-3 py-2.5 transition-colors"
                    >
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0"
                        style={{ backgroundColor: ev.color || '#6366f1' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{ev.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                          <span>{dateLabel}</span>
                          {ev.start_time && <span>{ev.start_time.slice(0, 5)}</span>}
                          {ev.location_city && (
                            <>
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{ev.location_city}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusStyles[st] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                          {statusLabels[st] || st}
                        </span>
                        {amount > 0 && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            {formatCurrency(amount)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {upcomingEvents.length > 4 && (
                  <p className="text-xs text-center text-slate-600 pt-1">
                    +{upcomingEvents.length - 4} evento{upcomingEvents.length - 4 === 1 ? '' : 's'} futuros
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <div className="xl:col-span-3">
            <ReportsChart chartInput={chartInput} />
          </div>
          <div className="xl:col-span-2">
            <ReportEventList
              events={clientEvents}
              clients={clients}
              dailyWork={clientWork}
              onEventClick={handleEventClick}
              title="Histórico de Eventos"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showClientForm && (
          <ClientForm client={client} onSuccess={handleSuccess} onCancel={() => setShowClientForm(false)} />
        )}
        {showEventForm && (
          <EventForm
            isOpen={showEventForm}
            clients={clients}
            event={editingEvent}
            onClose={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            onSuccess={() => {
              setEditingEvent(null);
              handleSuccess();
            }}
            initialData={editingEvent ? undefined : { client_id: clientId }}
          />
        )}
        {showEventDetail && selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            client={client}
            onClose={() => setShowEventDetail(false)}
            dailyWork={dailyWork.filter(w => w.event_id === selectedEvent.id)}
            expenses={expenses.filter(e => e.event_id === selectedEvent.id)}
            onPaymentUpdate={handleSuccess}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onWorkEdit={handleSuccess}
            onAddExpense={handleSuccess}
            onExpenseEdit={handleSuccess}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDeleteClient}
        onOpenChange={setConfirmDeleteClient}
        title="Excluir cliente?"
        description="Esta ação não pode ser desfeita. Verifique se o cliente não possui eventos associados."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDeleteClient}
      />
      <ConfirmDialog
        open={!!confirmDeleteEventId}
        onOpenChange={(open) => !open && setConfirmDeleteEventId(null)}
        title="Excluir evento?"
        description="O evento e registros vinculados serão removidos permanentemente."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDeleteEvent}
      />
    </>
  </NeonPageShell>
  );
}
