
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
  MessageCircle
} from 'lucide-react';
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { hardNavigate } from '@/lib/hardNavigate';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';

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

const StatCard = ({ icon: Icon, title, value, iconStyle }) => (
  <Card className="bg-[#161923]/60 border-[#23262f]">
    <CardContent className="p-4 flex items-center gap-4">
      <div className="p-3 rounded-lg" style={iconStyle}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-300">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default function ClientDetailPage() {
  const query = useQuery();
  const clientId = query.get('id');

  const { clients, loading: clientsLoading, refetch: refetchClients, update: updateClient } = useClients();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { dailyWork, loading: dailyWorkLoading, refetch: refetchDailyWork } = useDailyWork();
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  const [showClientForm, setShowClientForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  const clientEventIds = useMemo(() => clientEvents.map(e => e.id), [clientEvents]);

  const clientWork = useMemo(() =>
    dailyWork.filter(w => clientEventIds.includes(w.event_id)),
    [dailyWork, clientEventIds]
  );

  const _clientExpenses = useMemo(() =>
    expenses.filter(e => clientEventIds.includes(e.event_id)),
    [expenses, clientEventIds]
  );

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
      avgRevenuePerEvent: clientEvents.length > 0 ? totalRevenue / clientEvents.length : 0
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {client.logo_url ? (
              <img src={client.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white/10 p-1" />
            ) : (
              <div className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-3xl text-[#06070a]" style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})` }}>
                {(client.name?.charAt(0) || '?').toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <p className="text-slate-400">{client.contact_person}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowClientForm(true)} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10">
              <Edit className="w-4 h-4 mr-2" />
              Editar Cliente
            </Button>
            <Button
              className="border-0 text-[#06070a] font-bold"
              style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})` }}
              onClick={() => setShowEventForm(true)}
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
                    <span className="text-white group-hover:text-cyan-300 transition-colors">{client.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const unpaid = clientEvents.filter(e => e.payment_status !== 'paid');
                      if (unpaid.length === 0) {
                        const clean = client.phone.replace(/\D/g, '');
                        window.open(`https://wa.me/${clean.length > 11 ? clean : `55${clean}`}`, '_blank');
                      } else {
                        const msg = buildChargeMessage({ clientName: client.name, events: unpaid.map(e => ({ title: e.title, start_date: e.start_date, amount: 0 })), totalAmount: stats.unpaidAmount });
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
                  <p className="text-slate-300 whitespace-pre-wrap text-sm">{client.notes}</p>
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
          </div>
        </div>

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
            <ReportsChart data={{ events: clientEvents, work: clientWork }} />
          </div>
          <div className="xl:col-span-2">
            <ReportEventList
              events={clientEvents}
              clients={clients}
              onEventClick={handleEventClick}
              title="Histórico de Eventos"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showClientForm && (
          <ClientForm isOpen={showClientForm} client={client} onClose={() => setShowClientForm(false)} onSaveSuccess={handleSuccess} />
        )}
        {showEventForm && (
          <EventForm
            isOpen={showEventForm}
            clients={clients}
            event={null}
            onClose={() => setShowEventForm(false)}
            onSuccess={handleSuccess}
            initialData={{ client_id: clientId }}
          />
        )}
        {showEventDetail && selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setShowEventDetail(false)}
            dailyWork={dailyWork.filter(w => w.event_id === selectedEvent.id)}
            expenses={expenses.filter(e => e.event_id === selectedEvent.id)}
            onPaymentUpdate={handleSuccess}
            onDeleteSuccess={handleSuccess}
            onWorkEdit={handleSuccess}
            onWorkDelete={handleSuccess}
            onAddExpense={handleSuccess}
            onExpenseEdit={handleSuccess}
            onExpenseDelete={handleSuccess}
          />
        )}
      </AnimatePresence>
    </>
  </NeonPageShell>
  );
}
