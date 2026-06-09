import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { hardNavigate } from '@/lib/hardNavigate';
import { getCategoryConfig, getCategoryMotivation } from '@/lib/categoryConfig';
import { useStats, useUpcomingEvent, usePaymentAlerts, useEvents } from '@/lib/useBackstageData';
import ProximoShow from '@/components/home/ProximoShow';
import EventDetailModal from '@/components/calendar/EventDetailModal';
import MetaMensalBar from '@/components/home/MetaMensalBar';
import QuickStats from '@/components/home/QuickStats';
import AReceber from '@/components/home/AReceber';
import AlertasBastidao from '@/components/home/AlertasBastidao';
import { useReceivableByClient } from '@/lib/useReceivable';
import PipelineFinanceiro from '@/components/home/PipelineFinanceiro';
import ProximosEventos from '@/components/home/ProximosEventos';
import ForecastWidget from '@/components/home/ForecastWidget';
import FloatingActions from '@/components/home/FloatingActions';
import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { LightingBeams } from '@/components/design/LightingBeams';
import { NeonLevelBars } from '@/components/design/NeonLevelBars';
import { NeonSectionFrame } from '@/components/design/NeonSectionFrame';

export default function Home() {
  const { user, profile, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const userId = user?.id;
  const categoryId = profile?.category || 'lighting';
  const config = getCategoryConfig(categoryId);
  const motivation = getCategoryMotivation(categoryId);
  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profissional';
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats(userId);
  const { event: proximoEvento } = useUpcomingEvent(userId);
  const { alerts, loading: alertsLoading } = usePaymentAlerts(userId);
  const {
    rows: receivableRows,
    totalReceivable,
    loading: receivableLoading,
    markClientPaid,
  } = useReceivableByClient(userId);
  const today = new Date().toISOString().split('T')[0];
  const {
    events: proximosEventos,
    loading: proximosLoading,
    refetch: refetchProximos,
  } = useEvents(userId, { from: today, limit: 5, ascending: true });
  const { events: forecastEvents, loading: forecastLoading } = useEvents(userId, { from: today, limit: 30, ascending: true });
  const isOnStage = proximoEvento
    ? today >= (proximoEvento.start_date || proximoEvento.event_date || '') &&
      today <= (proximoEvento.end_date || proximoEvento.start_date || proximoEvento.event_date || '')
    : false;
  const formattedDay = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  const handleLogout = async () => {
    await signOut();
    hardNavigate('/login');
  };

  const handleMarkPaid = useCallback(
    async (clientId, paidAmount) => {
      await markClientPaid(clientId, paidAmount);
      refetchStats();
    },
    [markClientPaid, refetchStats]
  );

  return (
    <div className="min-h-screen bg-[#050609] text-white">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden" style={{ background: isOnStage ? `linear-gradient(165deg, ${config.primaryHex}33, ${config.accentHex}14 45%, transparent 80%)` : 'linear-gradient(180deg, #11131c 0%, #050609 100%)' }}>
        <NeonAtmosphere primary={config.primaryHex} accent={config.accentHex} stage={isOnStage} />
        {isOnStage && <LightingBeams primary={config.primaryHex} accent={config.accentHex} />}
        <motion.div className="absolute top-0 left-0 right-0 h-0.5 z-10" style={{ background: `linear-gradient(90deg, transparent, ${config.primaryHex}, transparent)` }} animate={{ opacity: isOnStage ? [0.6, 1, 0.6] : 0.4 }} transition={{ duration: 2, repeat: Infinity }} />
        <div className="relative z-10 px-4 pt-6 pb-5 max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#6b7283] mb-0.5">{formattedDay}</p>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.primaryHex }}>{config.emoji} {config.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => hardNavigate('/profile')} className="w-9 h-9 rounded-full bg-[#0c0e14]/80 border border-[#23262f] flex items-center justify-center"><Settings className="w-4 h-4 text-[#8a91a1]" /></motion.button>
            </div>
          </div>
          <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-3xl font-extrabold leading-tight tracking-tight">
            Olá, <span style={{ WebkitTextStroke: `1px ${config.primaryHex}`, textShadow: `0 0 30px ${config.primaryHex}60` }}>{firstName}</span>.
          </motion.h1>
          <AnimatePresence mode="wait">
            {isOnStage ? (
              <motion.div key="palco" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 mt-3">
                <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit" style={{ background: `${config.primaryHex}33`, border: `1px solid ${config.primaryHex}66` }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: config.primaryHex }} /> MODO PALCO ATIVO
                </motion.span>
                <NeonLevelBars primary={config.primaryHex} accent={config.accentHex} className="max-w-[200px]" />
              </motion.div>
            ) : (
              <motion.p key="motivation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-[#8a91a1] mt-2 italic font-mono">&ldquo;{motivation}&rdquo;</motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
      <div className="px-4 py-6 max-w-2xl mx-auto pb-28">
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Próximo show">
          <ProximoShow event={proximoEvento} userCategory={categoryId} isOnStage={isOnStage} onViewEvent={setDetailEvent} />
        </NeonSectionFrame>
        <MetaMensalBar
          profile={profile}
          stats={stats}
          isLoading={statsLoading}
          accentColor={config.primaryHex}
        />
        <ForecastWidget
          events={forecastEvents}
          isLoading={forecastLoading}
          primaryHex={config.primaryHex}
          accentHex={config.accentHex}
          onViewEvent={setDetailEvent}
        />
        <QuickStats stats={stats} isLoading={statsLoading} primaryHex={config.primaryHex} accentHex={config.accentHex} />
        <AReceber
          rows={receivableRows}
          totalReceivable={totalReceivable}
          isLoading={receivableLoading}
          onMarkPaid={handleMarkPaid}
        />
        <AlertasBastidao alerts={alerts} isLoading={alertsLoading} primaryHex={config.primaryHex} accentHex={config.accentHex} />
        <PipelineFinanceiro stats={stats} isLoading={statsLoading} primaryHex={config.primaryHex} accentHex={config.accentHex} />
        <NeonSectionFrame primary={config.primaryHex} accent={config.accentHex} label="Agenda">
          <ProximosEventos
            events={proximosEventos}
            isLoading={proximosLoading}
            userCategory={categoryId}
            onRefresh={refetchProximos}
            onViewEvent={setDetailEvent}
          />
        </NeonSectionFrame>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 flex justify-center">
          {showLogoutConfirm ? (
            <div className="flex items-center gap-3 bg-red-900/30 border border-red-800/50 rounded-xl px-5 py-3">
              <span className="text-sm text-red-300">Sair do backstage?</span>
              <button onClick={handleLogout} className="text-xs font-bold text-red-400 border border-red-700/50 px-3 py-1 rounded-lg">Sim, sair</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="text-xs text-[#6b7283]">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 text-[#5f6678] hover:text-[#8a91a1] text-xs"><LogOut className="w-3.5 h-3.5" /> Sair</button>
          )}
        </motion.div>
      </div>
      <FloatingActions />
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          client={detailEvent.clients || null}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setDetailEvent(null); hardNavigate('/calendar'); }}
          onDelete={() => { setDetailEvent(null); refetchStats(); }}
          onMarkPaid={() => { setDetailEvent(null); refetchStats(); }}
        />
      )}
    </div>
  );
}
