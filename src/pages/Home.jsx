import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hardNavigate } from '@/lib/hardNavigate';
import { useAuth } from '@/lib/authContext';
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
import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { LightingBeams } from '@/components/design/LightingBeams';
import { NeonLevelBars } from '@/components/design/NeonLevelBars';
import { NeonSectionFrame } from '@/components/design/NeonSectionFrame';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import { ClampedText } from '@/components/ui/overflowText';
import appToast from '@/lib/appToast';

const EventDetailModal = lazy(() => import('@/components/calendar/EventDetailModal'));

function SectionSkeleton({ className = 'h-28' }) {
  return <Skeleton className={`w-full rounded-xl bg-slate-800/60 ${className}`} />;
}

export default function Home() {
  const { user, profile } = useAuth();
  const [detailEvent, setDetailEvent] = useState(null);
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

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(refreshCockpit);

  const handleMarkPaid = useCallback(
    async (clientId, paidAmount) => {
      await markClientPaid(clientId, paidAmount);
    },
    [markClientPaid]
  );

  return (
    <div className="min-h-full overflow-x-clip bg-[#050609] text-white">
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
        <NeonAtmosphere primary={config.primaryHex} accent={config.accentHex} stage={palcoAtivo} />
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

      <div className="px-4 py-6 max-w-2xl mx-auto pb-28">
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Próximo show">
          {loading ? (
            <SectionSkeleton className="h-36" />
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
        </NeonSectionFrame>

        {hasAlerts && (
          <AlertasBastidao
            alerts={alerts}
            isLoading={loading}
            primaryHex={config.primaryHex}
            accentHex={config.accentHex}
          />
        )}

        {loading ? (
          <SectionSkeleton className="h-32 mb-4" />
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
          isLoading={loading}
          primaryHex={config.primaryHex}
          accentHex={config.accentHex}
        />

        <ForecastWidget
          events={forecastEvents}
          isLoading={loading}
          primaryHex={config.primaryHex}
          accentHex={config.accentHex}
          onViewEvent={setDetailEvent}
        />

        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Agenda">
          {loading ? (
            <SectionSkeleton className="h-40" />
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
            onEdit={() => {
              setDetailEvent(null);
              hardNavigate('/calendar');
            }}
            onDelete={() => {
              setDetailEvent(null);
              refreshCockpit();
            }}
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
    </div>
  );
}
