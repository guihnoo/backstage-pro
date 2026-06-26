import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hardNavigate } from '@/lib/hardNavigate';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileOfflineContext';
import { getCategoryConfig, getCategoryMotivation } from '@/lib/categoryConfig';
import { useHomeDashboard } from '@/lib/useHomeDashboard';
import { todayLocalISO, isDateBetween, getWorkForDate } from '@/components/utils/dateUtils';
import { isCancelledEvent } from '@/lib/eventFinance';
import ProximoShow from '@/components/home/ProximoShow';
import MetaMensalBar from '@/components/home/MetaMensalBar';
import QuickStats from '@/components/home/QuickStats';
import AReceber from '@/components/home/AReceber';
import AlertasBastidao from '@/components/home/AlertasBastidao';
import PipelineFinanceiro from '@/components/home/PipelineFinanceiro';
import ProximosEventos from '@/components/home/ProximosEventos';
import ForecastWidget from '@/components/home/ForecastWidget';
import FloatingActions from '@/components/home/FloatingActions';
import LiveClockBar from '@/components/home/LiveClockBar';
import { NeonPageShell } from '@/components/design/NeonPageShell';
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

const EventDetailModal = lazy(() => import('@/components/calendar/EventDetailModal'));
const EventForm = lazy(() => import('@/components/calendar/EventForm'));

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
  const { delete: deleteEvent } = useEvents();
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
    refetch,
    markClientPaid,
  } = useHomeDashboard(userId);

  const proximosEventos = useMemo(
    () => upcomingEvents.filter((e) => !isCancelledEvent(e)).slice(0, 5),
    [upcomingEvents]
  );

  const forecastEvents = useMemo(
    () => upcomingEvents.filter((e) => !isCancelledEvent(e)),
    [upcomingEvents]
  );

  const todayWork = useMemo(() => getWorkForDate(dailyWork, today), [dailyWork, today]);

  const currentMonth = today.substring(0, 7); // 'YYYY-MM'
  const despesasMes = useMemo(
    () => (expenses || [])
      .filter(e => (e.expense_date || e.date || '').startsWith(currentMonth))
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses, currentMonth]
  );

  const isShowToday = proximoEvento
    ? isDateBetween(
        today,
        proximoEvento.start_date || proximoEvento.event_date,
        proximoEvento.end_date || proximoEvento.start_date || proximoEvento.event_date
      ) && !isCancelledEvent(proximoEvento)
    : false;

  const isLiveShift = Boolean(
    isShowToday &&
      proximoEvento?.id &&
      todayWork?.event_id === proximoEvento.id &&
      todayWork?.entry_time &&
      !todayWork?.exit_time
  );

  const palcoAtivo = isLiveShift || isShowToday;
  const hasAlerts = alerts.length > 0;

  const refreshCockpit = useCallback(async () => {
    await refetch();
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
          <AnimatePresence mode="wait">
            {palcoAtivo ? (
              <motion.div
                key="palco"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
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
          {loading ? (
            <PalcoSkeleton />
          ) : (
            <ProximoShow
              event={proximoEvento}
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
                alerts={alerts}
                isLoading={loading}
                primaryHex={config.primaryHex}
                accentHex={config.accentHex}
              />
            </div>
          )}
        </NeonSectionFrame>

        {/* Bloco 2 — Financeiro */}
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Financeiro">
          {loading ? (
            <FinanceiroSkeleton />
          ) : (
            <AReceber
              rows={receivableRows}
              totalReceivable={totalReceivable}
              isLoading={false}
              onMarkPaid={handleMarkPaid}
            />
          )}
          <QuickStats
            stats={stats}
            isLoading={loading}
            primaryHex={config.primaryHex}
            accentHex={config.accentHex}
          />
          <div data-tour="home-meta">
            <MetaMensalBar
              profile={profile}
              stats={stats}
              isLoading={loading}
              accentColor={config.primaryHex}
            />
          </div>
          <PipelineFinanceiro
            stats={stats}
            despesasMes={despesasMes}
            isLoading={loading}
            primaryHex={config.primaryHex}
            accentHex={config.accentHex}
          />
          <ForecastWidget
            events={forecastEvents}
            isLoading={loading}
            primaryHex={config.primaryHex}
            accentHex={config.accentHex}
            metaReceita={profile?.monthly_goal_revenue || 0}
          />
        </NeonSectionFrame>

        {/* Bloco 3 — Agenda */}
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Agenda">
          {loading ? (
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
