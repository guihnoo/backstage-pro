import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import QuickStats from '@/components/home/QuickStats';
import AReceber from '@/components/home/AReceber';
import AlertasBastidao from '@/components/home/AlertasBastidao';
import PipelineFinanceiro from '@/components/home/PipelineFinanceiro';
import ProximosEventos from '@/components/home/ProximosEventos';
import FloatingActions from '@/components/home/FloatingActions';
import LiveClockBar from '@/components/home/LiveClockBar';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';
import { LightingBeams } from '@/components/design/LightingBeams';
import { NeonLevelBars } from '@/components/design/NeonLevelBars';
import { NeonSectionFrame } from '@/components/design/NeonSectionFrame';
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

const EventDetailModal = lazy(() => import('@/components/calendar/EventDetailModal'));
const EventForm = lazy(() => import('@/components/calendar/EventForm'));
const ForecastWidget = lazy(() => import('@/components/home/ForecastWidget'));

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
      {/* AReceber rows */}
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
      {/* QuickStats grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      {/* MetaMensalBar */}
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
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const today = todayLocalISO();
  const {
    stats,
    proximoEvento,
    alerts,
    receivableRows,
    totalReceivable,
    upcomingEvents,
    dailyWork,
    loading,
    error,
    refetch,
    markClientPaid,
  } = useHomeDashboard(userId);

  const fallbackDashboard = useMemo(() => {
    if (!userId) return null;
    const hasEvents = Array.isArray(events) && events.length > 0;
    const hasWork = Array.isArray(hookDailyWork) && hookDailyWork.length > 0;
    if (!hasEvents && !hasWork) return null;
    const enriched = enrichEventsWithClients(events || [], clients || []);
    return deriveDashboard(enriched, hookDailyWork || []);
  }, [userId, events, clients, hookDailyWork]);

  const useFallback = Boolean((loading || error) && fallbackDashboard);
  const cockpitLoading = loading && !fallbackDashboard;

  const cockpitStats = useFallback ? fallbackDashboard.stats : stats;
  const cockpitProximo = useFallback ? fallbackDashboard.proximoEvento : proximoEvento;
  const cockpitAlerts = useFallback ? fallbackDashboard.alerts : alerts;
  const cockpitReceivableRows = useFallback ? fallbackDashboard.receivableRows : receivableRows;
  const cockpitUpcoming = useFallback ? fallbackDashboard.upcomingEvents : upcomingEvents;
  const cockpitDailyWork = useFallback ? fallbackDashboard.dailyWork : dailyWork;
  const cockpitTotalReceivable = useFallback
    ? fallbackDashboard.receivableRows.reduce((sum, r) => sum + r.totalAmount, 0)
    : totalReceivable;

  const proximosEventos = useMemo(
    () => cockpitUpcoming.filter((e) => !isCancelledEvent(e)).slice(0, 5),
    [cockpitUpcoming]
  );

  const forecastEvents = useMemo(
    () => cockpitUpcoming.filter((e) => !isCancelledEvent(e)),
    [cockpitUpcoming]
  );

  const todayWork = useMemo(() => getWorkForDate(cockpitDailyWork, today), [cockpitDailyWork, today]);

  const currentMonth = today.substring(0, 7); // 'YYYY-MM'
  const despesasMes = useMemo(
    () => (expenses || [])
      .filter(e => (e.expense_date || e.date || '').startsWith(currentMonth))
      .reduce((sum, e) => sum + (e.amount || 0), 0),
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
  const hasAlerts = cockpitAlerts.length > 0;

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
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} stage={palcoAtivo}>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        primaryHex={config.primaryHex}
      />
      <motion.header
        data-tour="home-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
        style={{
          background: palcoAtivo
            ? `linear-gradient(165deg, ${config.primaryHex}33, ${config.accentHex}14 45%, transparent 80%)`
            : 'linear-gradient(180deg, #11131c 0%, #050609 100%)',
        }}
      >
        {isLiveShift && <LightingBeams primary={config.primaryHex} accent={config.accentHex} />}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 z-10"
          style={{ background: `linear-gradient(90deg, transparent, ${config.primaryHex}, transparent)` }}
          animate={{ opacity: palcoAtivo ? [0.6, 1, 0.6] : 0.4 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="relative z-10 px-4 pt-2 pb-5 max-w-2xl mx-auto">
          <div className="mb-5 pr-28">
            <LiveClockBar primaryHex={config.primaryHex} isLive={isLiveShift} />
            <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: config.primaryHex }}>
              {config.emoji} {config.label}
            </p>
          </div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold leading-tight tracking-tight truncate"
          >
            {greeting},{' '}
            <span
              className="inline-block max-w-[min(100%,14rem)] truncate align-bottom"
              style={{
                WebkitTextStroke: `1px ${config.primaryHex}`,
                textShadow: `0 0 30px ${config.primaryHex}60`,
              }}
              title={firstName}
            >
              {firstName}
            </span>
            .
          </motion.h1>
          <AnimatePresence initial={false}>
            {palcoAtivo ? (
              <motion.div
                key="palco"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-3 mt-3"
              >
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit"
                  style={{ background: `${config.primaryHex}33`, border: `1px solid ${config.primaryHex}66` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: config.primaryHex }} />
                  {isLiveShift ? 'TURNO AO VIVO' : 'SHOW HOJE'}
                </motion.span>
                {isLiveShift && (
                  <NeonLevelBars primary={config.primaryHex} accent={config.accentHex} className="max-w-[200px]" />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="motivation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-2"
              >
                <ClampedText lines={2} className="text-sm text-[#8a91a1] italic font-mono">
                  &ldquo;{motivation}&rdquo;
                </ClampedText>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <div className="px-4 py-6 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0 pb-28">
        {/* Bloco 1 — Palco */}
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Palco">
          {cockpitLoading ? (
            <PalcoSkeleton />
          ) : (
            <ProximoShow
              event={cockpitProximo}
              userCategory={categoryId}
              isOnStage={isShowToday}
              isLiveShift={isLiveShift}
              isLoading={false}
              onViewEvent={setDetailEvent}
              onRefresh={refreshCockpit}
            />
          )}
          {hasAlerts && (
            <div className="mt-3">
              <AlertasBastidao
                alerts={cockpitAlerts}
                isLoading={cockpitLoading}
                primaryHex={config.primaryHex}
                accentHex={config.accentHex}
              />
            </div>
          )}
        </NeonSectionFrame>

        {/* Bloco 2 — Financeiro */}
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Financeiro">
          {cockpitLoading ? (
            <FinanceiroSkeleton />
          ) : (
            <AReceber
              rows={cockpitReceivableRows}
              totalReceivable={cockpitTotalReceivable}
              isLoading={false}
              onMarkPaid={handleMarkPaid}
            />
          )}
          <QuickStats
            stats={cockpitStats}
            isLoading={cockpitLoading}
            primaryHex={config.primaryHex}
            accentHex={config.accentHex}
          />
          <div data-tour="home-meta">
            <MetaMensalBar
              profile={profile}
              stats={cockpitStats}
              isLoading={cockpitLoading}
              accentColor={config.primaryHex}
            />
          </div>
          <PipelineFinanceiro
            stats={cockpitStats}
            despesasMes={despesasMes}
            isLoading={cockpitLoading}
            primaryHex={config.primaryHex}
            accentHex={config.accentHex}
          />
          <Suspense
            fallback={
              <NeonGlass primary={config.primaryHex} className="mb-8 p-5">
                <Skeleton className="h-4 w-32 rounded mb-2" />
                <Skeleton className="h-8 w-24 rounded" />
              </NeonGlass>
            }
          >
            <ForecastWidget
              events={forecastEvents}
              isLoading={cockpitLoading}
              primaryHex={config.primaryHex}
              accentHex={config.accentHex}
              metaReceita={profile?.monthly_goal_revenue || 0}
            />
          </Suspense>
        </NeonSectionFrame>

        {/* Bloco 3 — Agenda */}
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Agenda">
          {cockpitLoading ? (
            <AgendaSkeleton />
          ) : (
            <ProximosEventos
              events={proximosEventos}
              isLoading={false}
              userCategory={categoryId}
              onRefresh={refreshCockpit}
              onViewEvent={setDetailEvent}
            />
          )}
        </NeonSectionFrame>
      </div>

      <FloatingActions />

      {detailEvent && (
        <Suspense fallback={null}>
          <EventDetailModal
            event={detailEvent}
            client={detailEvent.clients || null}
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
    </NeonPageShell>
  );
}
