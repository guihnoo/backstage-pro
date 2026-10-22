import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { hardNavigate } from '@/lib/hardNavigate';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileOfflineContext';
import { getCategoryConfig, getCategoryMotivation } from '@/lib/categoryConfig';
import { useHomeDashboard, deriveDashboard } from '@/lib/useHomeDashboard';
import { enrichEventsWithClients } from '@/lib/eventDisplay';
import { todayLocalISO, isDateBetween, getWorkForDate } from '@/components/utils/dateUtils';
import { isCancelledEvent } from '@/lib/eventFinance';
import ProximoShow from '@/components/home/ProximoShow';
import MetaMensalBar from '@/components/home/MetaMensalBar';
import AReceber from '@/components/home/AReceber';
import PipelineFinanceiro from '@/components/home/PipelineFinanceiro';
import ProximosEventos from '@/components/home/ProximosEventos';
import LiveClockBar from '@/components/home/LiveClockBar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import { ClampedText } from '@/components/ui/overflowText';
import appToast from '@/lib/appToast';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useExpenses } from '@/lib/useExpenses';
import { useDailyWork } from '@/lib/useDailyWork';
import { findRecentMissingHours } from '@/lib/homeSummary';
import HomeMonthSummary from '@/components/home/HomeMonthSummary';
import LoadErrorBanner from '@/components/layout/LoadErrorBanner';

const EventDetailModal = lazy(() => import('@/components/calendar/EventDetailModal'));
const EventForm = lazy(() => import('@/components/calendar/EventForm'));

// Bloco da Início no visual "All Access": etiqueta de credencial + conteúdo.
function HomeSection({ label, children }) {
  return (
    <section className="mb-7 min-w-0">
      <p className="font-tag text-[11px] font-bold tracking-[0.2em] text-[#a8a8a8] mb-2">{label}</p>
      {children}
    </section>
  );
}

function PalcoSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-10 rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

function FinanceiroSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[0,1].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
          <Skeleton className="w-20 h-7 rounded-lg" />
        </div>
      ))}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[0,1,2,3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-2 h-2 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 rounded" style={{ width: `${70 - i * 8}%` }} />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="w-14 h-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const profile = useProfile();
  const [detailEvent, setDetailEvent] = useState(null);
  const [detailInitialTab, setDetailInitialTab] = useState('resumo');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);
  const { clients } = useClients();
  const { events, delete: deleteEvent } = useEvents();
  const { dailyWork: hookDailyWork } = useDailyWork();
  const { expenses } = useExpenses();
  const userId = user?.id;
  const categoryId = profile?.category || 'lighting';
  const config = getCategoryConfig(categoryId);
  const motivation = getCategoryMotivation(categoryId);
  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profissional';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Boa noite'; // saindo do show de madrugada
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const today = todayLocalISO();
  const todayLabel = format(new Date(), 'EEE d MMM', { locale: ptBR }).replace('.', '').toUpperCase();
  const {
    stats,
    proximoEvento,
    receivableRows,
    totalReceivable,
    upcomingEvents,
    dailyWork,
    loading,
    error,
    refetch,
    markClientPaid,
  } = useHomeDashboard(userId);

  const enrichedEvents = useMemo(
    () => enrichEventsWithClients(events || [], clients || []),
    [events, clients]
  );

  const fallbackDashboard = useMemo(() => {
    if (!userId) return null;
    const hasEvents = Array.isArray(events) && events.length > 0;
    const hasWork = Array.isArray(hookDailyWork) && hookDailyWork.length > 0;
    if (!hasEvents && !hasWork) return null;
    return deriveDashboard(enrichedEvents, hookDailyWork || []);
  }, [userId, events, enrichedEvents, hookDailyWork]);

  const useFallback = Boolean((loading || error) && fallbackDashboard);
  const cockpitLoading = loading && !fallbackDashboard;

  const cockpitStats = useFallback ? fallbackDashboard.stats : stats;
  const cockpitProximo = useFallback ? fallbackDashboard.proximoEvento : proximoEvento;
  const cockpitReceivableRows = useFallback ? fallbackDashboard.receivableRows : receivableRows;
  const cockpitUpcoming = useFallback ? fallbackDashboard.upcomingEvents : upcomingEvents;
  const cockpitDailyWork = useFallback ? fallbackDashboard.dailyWork : dailyWork;
  const cockpitTotalReceivable = useFallback
    ? fallbackDashboard.receivableRows.reduce((sum, r) => sum + r.totalAmount, 0)
    : totalReceivable;

  // Exclui o próximo evento já exibido em destaque no bloco Palco para não duplicar na lista Agenda
  const proximosEventos = useMemo(
    () =>
      cockpitUpcoming
        .filter((e) => !isCancelledEvent(e) && e.id !== cockpitProximo?.id)
        .slice(0, 5),
    [cockpitUpcoming, cockpitProximo?.id]
  );

  const todayWork = useMemo(() => getWorkForDate(cockpitDailyWork, today), [cockpitDailyWork, today]);

  const missingHours = useMemo(
    () => findRecentMissingHours(events || [], hookDailyWork || [], today),
    [events, hookDailyWork, today],
  );

  const currentMonth = today.substring(0, 7); // 'YYYY-MM'
  const despesasMes = useMemo(
    () => (expenses || [])
      .filter(e => (e.expense_date || e.date || '').startsWith(currentMonth))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses, currentMonth]
  );

  const isShowToday = cockpitProximo
    ? isDateBetween(
        today,
        cockpitProximo.start_date || cockpitProximo.event_date,
        cockpitProximo.end_date || cockpitProximo.start_date || cockpitProximo.event_date
      ) && !isCancelledEvent(cockpitProximo)
    : false;

  const isLiveShift = Boolean(
    isShowToday &&
      cockpitProximo?.id &&
      todayWork?.event_id === cockpitProximo.id &&
      todayWork?.entry_time &&
      !todayWork?.exit_time
  );

  const palcoAtivo = isLiveShift || isShowToday;

  const refreshCockpit = useCallback(async () => {
    await refetch({ silent: true });
    appToast.success('Cockpit atualizado');
  }, [refetch]);

  const handleConfirmDeleteEvent = useCallback(async () => {
    if (!confirmDeleteEventId) return;
    try {
      await deleteEvent(confirmDeleteEventId);
      appToast.success('Evento excluído com sucesso.');
      setDetailEvent(null);
      await refetch();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      appToast.error('Não foi possível excluir o evento.');
    } finally {
      setConfirmDeleteEventId(null);
    }
  }, [confirmDeleteEventId, deleteEvent, refetch]);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(refreshCockpit);

  const handleMarkPaid = useCallback(
    async (clientId, paidAmount) => {
      await markClientPaid(clientId, paidAmount);
    },
    [markClientPaid]
  );

  return (
    <div className="relative min-h-full overflow-x-clip bg-[#0a0a0a] text-white">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        primaryHex="#ffd400"
      />
      <header data-tour="home-header" className="relative">
        <div className="px-4 pt-2 pb-4 max-w-2xl mx-auto">
          <div className="pr-28">
            <LiveClockBar primaryHex="#ffd400" isLive={isLiveShift} />
            <p className="font-tag text-[11px] font-bold uppercase tracking-[0.16em] mt-1 text-[#a8a8a8]">
              {todayLabel} · {config.label}
            </p>
          </div>
          <h1 className="font-poster text-[40px] leading-[0.95] uppercase tracking-wide mt-3 break-words">
            {greeting},{' '}
            <span className="text-[#ffd400]" title={firstName}>{firstName}</span>
            .
          </h1>
          {palcoAtivo ? (
            <span
              className="inline-flex items-center gap-1.5 mt-3 h-7 px-3 rounded-full font-tag text-[11px] font-bold w-fit"
              style={{ background: '#ff2e88', color: '#0a0a0a' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] animate-pulse" />
              {isLiveShift ? 'TURNO AO VIVO' : 'SHOW HOJE'}
            </span>
          ) : (
            <ClampedText lines={2} className="mt-2 text-sm text-[#a8a8a8]">
              {motivation}
            </ClampedText>
          )}
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0 pb-28">
        {/* Alerta enxuto apenas quando houver dias recentes sem horas lançadas */}
        {!cockpitLoading && (
          <HomeMonthSummary
            missing={missingHours}
            onOpenEvent={(ev) => {
              const full = enrichedEvents.find((x) => x.id === ev.id) || ev;
              setDetailInitialTab('trabalho');
              setDetailEvent(full);
            }}
          />
        )}

        {/* Bloco 1 — Palco */}
        <HomeSection label="PRÓXIMO SHOW">
          {cockpitLoading ? (
            <PalcoSkeleton />
          ) : (
            <ProximoShow
              event={cockpitProximo}
              userCategory={categoryId}
              isOnStage={isShowToday}
              isLiveShift={isLiveShift}
              isLoading={false}
              loadError={Boolean(error) && !(events?.length)}
              onViewEvent={(ev) => {
                setDetailInitialTab('resumo');
                setDetailEvent(ev);
              }}
              onCreateEvent={() => {
                setEditingEvent(null);
                setShowEventForm(true);
              }}
              onRefresh={refreshCockpit}
            />
          )}
        </HomeSection>

        {/* Bloco 2 — Financeiro */}
        <HomeSection label="DINHEIRO">
          {cockpitLoading ? (
            <FinanceiroSkeleton />
          ) : error && !(events?.length) ? (
            // Sem conexão os valores viriam zerados ("ninguém te devendo") — avisa em vez disso
            <LoadErrorBanner what="seu dinheiro" onRetry={refreshCockpit} />
          ) : (
            <AReceber
              rows={cockpitReceivableRows}
              totalReceivable={cockpitTotalReceivable}
              isLoading={false}
              onMarkPaid={handleMarkPaid}
              onOpenEvent={(ev, tab = 'fiscal') => {
                const full = enrichedEvents.find((x) => x.id === ev.id) || ev;
                setDetailInitialTab(tab);
                setDetailEvent(full);
              }}
            />
          )}
          <PipelineFinanceiro
            stats={cockpitStats}
            despesasMes={despesasMes}
            isLoading={cockpitLoading}
            primaryHex="#ffd400"
            accentHex="#ff2e88"
          />
          <div data-tour="home-meta">
            <MetaMensalBar
              profile={profile}
              stats={cockpitStats}
              isLoading={cockpitLoading}
              accentColor="#ffd400"
            />
          </div>
        </HomeSection>

        {/* Bloco 3 — Agenda (apenas se houver outros eventos além do Próximo Show já exibido acima) */}
        {(cockpitLoading || proximosEventos.length > 0 || !cockpitProximo) && (
          <HomeSection label="AGENDA">
            {cockpitLoading ? (
              <AgendaSkeleton />
            ) : (
              <ProximosEventos
                events={proximosEventos}
                isLoading={false}
                userCategory={categoryId}
                onRefresh={refreshCockpit}
                onViewEvent={(ev) => {
                  setDetailInitialTab('resumo');
                  setDetailEvent(ev);
                }}
              />
            )}
          </HomeSection>
        )}
      </div>

      {detailEvent && (
        <Suspense fallback={null}>
          <EventDetailModal
            event={detailEvent}
            client={detailEvent.clients || null}
            initialTab={detailInitialTab}
            onClose={() => setDetailEvent(null)}
            onEdit={(event) => {
              setDetailEvent(null);
              setEditingEvent(event);
              setShowEventForm(true);
            }}
            onDelete={(eventId) => setConfirmDeleteEventId(eventId)}
            onMarkPaid={() => {
              setDetailEvent(null);
              refreshCockpit();
            }}
            onAddWork={() => {
              setDetailEvent(null);
              hardNavigate('/calendar');
            }}
          />
        </Suspense>
      )}

      {showEventForm && (
        <Suspense fallback={null}>
          <EventForm
            isOpen={showEventForm}
            clients={clients}
            event={editingEvent}
            onClose={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            onSuccess={async () => {
              setShowEventForm(false);
              setEditingEvent(null);
              await refetch();
            }}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={!!confirmDeleteEventId}
        onOpenChange={(open) => !open && setConfirmDeleteEventId(null)}
        title="Excluir evento?"
        description="O evento será removido permanentemente da sua agenda."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDeleteEvent}
      />
    </div>
  );
}
