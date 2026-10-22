import { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  Phone,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useClients } from '@/lib/useClients';
import { useEvents } from '@/lib/useEvents';
import { useDailyWork } from '@/lib/useDailyWork';
import { useExpenses } from '@/lib/useExpenses';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';
import { calculateEventReceivableAmount, isReceivableEvent } from '@/lib/eventFinance';
import { getEventReceivedAmount } from '@/lib/financeMetrics';
import { getEventStatus } from '@/components/utils/dateUtils';
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import appToast from '@/lib/appToast';

import LoadingSpinner from '@/components/layout/LoadingSpinner';
import EmptyState from '@/components/layout/EmptyState';
import ClientForm from '@/components/clients/ClientForm';
import EventForm from '@/components/calendar/EventForm';
import EventDetailModal from '@/components/calendar/EventDetailModal';
import ConfirmDialog from '@/components/layout/ConfirmDialog';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ClientDetailPage() {
  const query = useQuery();
  const clientId = query.get('id');

  const { clients, loading: clientsLoading, refetch: refetchClients, update: updateClient, delete: deleteClient } = useClients();
  const { events, loading: eventsLoading, refetch: refetchEvents, delete: deleteEvent } = useEvents();
  const { dailyWork, loading: dailyWorkLoading, refetch: refetchDailyWork } = useDailyWork();
  const { loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { formatCurrency, isVisible } = useFinancialVisibility();

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

  // "Novo trabalho" daqui já vem com o cliente escolhido. Memo: o formulário recomeça
  // quando esse objeto muda, então não pode ser um objeto novo a cada render.
  const newEventPrefill = useMemo(() => (clientId ? { client_id: clientId } : undefined), [clientId]);

  const clientEvents = useMemo(() =>
    events.filter(e => e.client_id === clientId).sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0)),
    [events, clientId]
  );

  const clientEventIds = useMemo(() => clientEvents.map(e => e.id), [clientEvents]);

  const clientWork = useMemo(() =>
    dailyWork.filter(w => clientEventIds.includes(w.event_id)),
    [dailyWork, clientEventIds]
  );

  const stats = useMemo(() => {
    const getEventRevenue = (event) => {
      const workForEvent = clientWork.filter(w => w.event_id === event.id);
      return calculateEventReceivableAmount(event, workForEvent);
    };

    const totalRevenue = clientEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);
    const paidEvents = clientEvents.filter(e => e.payment_status === 'paid');
    const unpaidEvents = clientEvents.filter(isReceivableEvent);

    const paidAmount = paidEvents.reduce(
      (sum, e) => sum + getEventReceivedAmount(e, clientWork.filter(w => w.event_id === e.id)),
      0
    );
    const unpaidAmount = unpaidEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);

    const completedEvents = clientEvents.filter(e => getEventStatus(e) === 'completed');
    const completedPaid = completedEvents.filter(e => e.payment_status === 'paid').length;
    const paymentPct = completedEvents.length > 0 ? Math.round((completedPaid / completedEvents.length) * 100) : null;

    return {
      totalEvents: clientEvents.length,
      totalRevenue,
      paidAmount,
      unpaidAmount,
      avgRevenuePerEvent: clientEvents.length > 0 ? totalRevenue / clientEvents.length : 0,
      paymentScore: paymentPct === null ? 'Em dia' : paymentPct >= 80 ? 'Paga em dia' : 'Atrasado',
      paymentColor: unpaidAmount > 0 ? '#ff2e88' : '#ffd400',
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

  const handleSaveNotes = async () => {
    if (!client) return;
    setSavingNotes(true);
    try {
      await updateClient(client.id, { notes: notesValue });
      appToast.success('Anotações atualizadas!');
      setEditingNotes(false);
      refetchClients();
    } catch (_e) {
      appToast.error('Erro ao salvar anotações.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    try {
      await deleteClient(client.id);
      appToast.success('Cliente excluído com sucesso.');
      hardNavigate('/clients');
    } catch (_e) {
      appToast.error('Erro ao excluir cliente. Verifique se existem eventos vinculados.');
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="Cliente não encontrado"
          description="O cliente solicitado não existe ou foi removido."
          action={() => hardNavigate('/clients')}
          actionLabel="Voltar para Clientes"
        />
      </div>
    );
  }

  const phoneClean = client.phone ? client.phone.replace(/\D/g, '') : '';
  const hasPhone = Boolean(phoneClean);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="p-4 md:p-6 space-y-5 max-w-2xl xl:max-w-4xl mx-auto w-full min-w-0">
        
        {/* Top bar: Back to Clientes + Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => hardNavigate('/clients')}
            className="h-9 px-3.5 rounded-full bg-[#161616] border border-[#333333] hover:border-[#ffd400] text-white font-sans text-[13px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#ffd400]" />
            Clientes
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClientForm(true)}
              className="h-9 px-3 rounded-xl bg-[#161616] border border-[#333333] hover:border-[#ffd400] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-[#ffd400]" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteClient(true)}
              className="h-9 px-3 rounded-xl bg-[#161616] border border-[#333333] hover:border-[#ff2e88] text-[#ff2e88] text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </div>
        </div>

        {/* Client Credential Card (All Access style) */}
        <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
          {client.logo_url ? (
            <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-white overflow-hidden flex items-center justify-center flex-shrink-0 p-2 shadow-inner">
              <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-[#ffd400] text-[#0a0a0a] font-poster text-[30px] sm:text-[34px] flex items-center justify-center flex-shrink-0 shadow-md">
              {getInitials(client.name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-poster text-[28px] sm:text-[34px] leading-tight text-white uppercase truncate">
                {client.name}
              </h1>
            </div>
            <div className="text-[13px] text-[#a8a8a8] mt-1 flex items-center gap-2 flex-wrap">
              <span>{client.contact_person || 'Sem contato principal'}</span>
              {client.phone && <span>· {client.phone}</span>}
              {client.email && <span>· {client.email}</span>}
            </div>
            <div className="mt-2">
              <span
                style={{ color: stats.paymentColor }}
                className="font-tag text-[11px] font-bold uppercase tracking-wider bg-[#0a0a0a] px-2.5 py-1 rounded-full border border-[#262626]"
              >
                {stats.unpaidAmount > 0
                  ? `${formatCurrency(stats.unpaidAmount)} PENDENTE`
                  : 'PAGA EM DIA'}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Quick Action CTAs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (!hasPhone) {
                appToast.info('Cliente sem telefone cadastrado.');
                return;
              }
              if (stats.unpaidEventsWithAmounts.length > 0) {
                const msg = buildChargeMessage({
                  clientName: client.name,
                  events: stats.unpaidEventsWithAmounts,
                  totalAmount: stats.unpaidAmount,
                });
                openWhatsAppCharge(client.phone, msg);
              } else {
                window.open(`https://wa.me/${phoneClean.length > 11 ? phoneClean : `55${phoneClean}`}`, '_blank');
              }
            }}
            className="h-11 rounded-xl bg-[#ffd400] hover:bg-[#ffe033] text-[#0a0a0a] font-sans text-[13px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            WhatsApp
          </button>

          <a
            href={hasPhone ? `tel:${phoneClean}` : undefined}
            onClick={(e) => {
              if (!hasPhone) {
                e.preventDefault();
                appToast.info('Cliente sem telefone cadastrado.');
              }
            }}
            className={`h-11 rounded-xl border border-[#333333] hover:border-[#ffd400] bg-transparent text-white font-sans text-[13px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
              !hasPhone ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <Phone className="w-4 h-4" />
            Ligar
          </a>

          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setShowEventForm(true);
            }}
            className="h-11 rounded-xl border border-[#333333] hover:border-[#ffd400] bg-transparent text-white font-sans text-[13px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#ffd400]" />
            Novo job
          </button>
        </div>

        {/* 4 Metric Cards (2x2 Grid All Access) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3 sm:p-4">
            <div className="font-tag text-[10px] uppercase tracking-wider text-[#a8a8a8]">JÁ TE PAGOU</div>
            <div className="font-poster text-[24px] sm:text-[28px] text-white leading-tight mt-0.5">
              {isVisible ? formatCurrency(stats.paidAmount) : '•••••'}
            </div>
            <div className="text-[11px] text-[#a8a8a8] mt-0.5">{stats.totalEvents} shows realizados</div>
          </div>

          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3 sm:p-4">
            <div className="font-tag text-[10px] uppercase tracking-wider text-[#a8a8a8]">COSTUMA PAGAR EM</div>
            <div
              style={{ color: stats.paymentColor }}
              className="font-poster text-[24px] sm:text-[28px] leading-tight mt-0.5"
            >
              {stats.paymentScore}
            </div>
            <div className="text-[11px] text-[#a8a8a8] mt-0.5">depois do show</div>
          </div>

          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3 sm:p-4">
            <div className="font-tag text-[10px] uppercase tracking-wider text-[#a8a8a8]">CACHÊ COMBINADO</div>
            <div className="font-poster text-[24px] sm:text-[28px] text-white leading-tight mt-0.5">
              {isVisible
                ? client.default_rate
                  ? formatCurrency(client.default_rate)
                  : formatCurrency(stats.avgRevenuePerEvent)
                : '•••••'}
            </div>
            <div className="text-[11px] text-[#a8a8a8] mt-0.5">por diária</div>
          </div>

          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3 sm:p-4">
            <div className="font-tag text-[10px] uppercase tracking-wider text-[#a8a8a8]">ALIMENTAÇÃO</div>
            <div className="font-poster text-[24px] sm:text-[28px] text-white leading-tight mt-0.5">
              {isVisible
                ? client.default_meal_allowance
                  ? formatCurrency(client.default_meal_allowance)
                  : 'R$ 40'
                : '•••••'}
            </div>
            <div className="text-[11px] text-[#a8a8a8] mt-0.5">padrão deste cliente</div>
          </div>
        </div>

        {/* Shows History Card */}
        <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-tag text-[11px] tracking-widest uppercase text-[#a8a8a8]">
              HISTÓRICO DE SHOWS ({clientEvents.length})
            </div>
            {clientEvents.length > 0 && (
              <span className="text-[11px] text-[#a8a8a8] font-tag">Toque para abrir</span>
            )}
          </div>

          {clientEvents.length > 0 ? (
            <div className="divide-y divide-[#222222]">
              {clientEvents.map((ev) => {
                const isPaid = ev.payment_status === 'paid';
                const isConfirmed = ev.status === 'confirmed';
                const dotColor = isPaid ? '#5a5a5a' : isConfirmed ? '#ffd400' : '#ff2e88';
                const dateStr = ev.start_date
                  ? format(parseISO(ev.start_date.slice(0, 10)), 'dd MMM', { locale: ptBR }).toUpperCase()
                  : '—';

                const eventAmount = calculateEventReceivableAmount(
                  ev,
                  clientWork.filter((w) => w.event_id === ev.id)
                );

                return (
                  <div
                    key={ev.id}
                    onClick={() => handleEventClick(ev)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#1f1f1f] px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-tag text-[11px] text-[#a8a8a8] w-14 flex-shrink-0">
                        {dateStr}
                      </span>
                      <span className="text-[13px] font-bold text-white truncate min-w-0">
                        {ev.title || 'Show sem título'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-poster text-[16px] text-white">
                        {isVisible ? formatCurrency(eventAmount) : '•••••'}
                      </span>
                      <span
                        style={{ background: dotColor }}
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        title={isPaid ? 'Pago' : isConfirmed ? 'Confirmado' : 'A receber'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-[#888888] text-xs">
              Nenhum evento registrado com este cliente ainda.
            </div>
          )}
        </div>

        {/* Notes Card */}
        <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-tag text-[11px] tracking-widest uppercase text-[#a8a8a8]">
              ANOTAÇÕES DO CLIENTE
            </span>
            {!editingNotes ? (
              <button
                type="button"
                onClick={() => {
                  setNotesValue(client.notes || '');
                  setEditingNotes(true);
                }}
                aria-label="Editar anotações"
                className="text-[#ffd400] hover:text-white transition-colors p-1"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  aria-label="Salvar anotações"
                  className="text-[#ffd400] hover:text-white transition-colors p-1"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNotes(false)}
                  aria-label="Cancelar edição das anotações"
                  className="text-[#ff2e88] hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {editingNotes ? (
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333333] rounded-xl p-3 text-sm text-white resize-none min-h-[90px] outline-none focus:border-[#ffd400] transition-colors"
              placeholder="Adicione preferências de palco, regras de cachê ou alimentação deste cliente..."
            />
          ) : (
            <p className="text-[13px] text-[#d6d6d6] leading-relaxed whitespace-pre-wrap">
              {client.notes || 'Nenhuma anotação registrada.'}
            </p>
          )}
        </div>

      </div>

      {/* Modais */}
      {showClientForm && (
        <ClientForm
          client={client}
          onSuccess={handleSuccess}
          onCancel={() => setShowClientForm(false)}
        />
      )}

      {showEventForm && (
        <EventForm
          isOpen={showEventForm}
          onClose={() => setShowEventForm(false)}
          event={editingEvent}
          clients={clients}
          prefillData={newEventPrefill}
          onSuccess={handleSuccess}
        />
      )}

      {showEventDetail && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          client={client}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
          onEdit={(ev) => {
            setShowEventDetail(false);
            setEditingEvent(ev);
            setShowEventForm(true);
          }}
          onDelete={(id) => {
            setShowEventDetail(false);
            setConfirmDeleteEventId(id);
          }}
          onDuplicate={() => {
            setShowEventDetail(false);
            handleSuccess();
          }}
          onMarkPaid={() => handleSuccess()}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteClient}
        onOpenChange={setConfirmDeleteClient}
        title={`Excluir "${client.name}"?`}
        description="Esta ação não pode ser desfeita. Todos os dados vinculados a este cliente serão afetados."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDeleteClient}
      />

      <ConfirmDialog
        open={!!confirmDeleteEventId}
        onOpenChange={(open) => !open && setConfirmDeleteEventId(null)}
        title="Excluir evento?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!confirmDeleteEventId) return;
          try {
            await deleteEvent(confirmDeleteEventId);
            appToast.success('Evento excluído.');
            handleSuccess();
          } catch (_e) {
            appToast.error('Erro ao excluir evento.');
          } finally {
            setConfirmDeleteEventId(null);
          }
        }}
      />
    </div>
  );
}
