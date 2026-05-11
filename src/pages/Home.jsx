import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Settings, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { getCategoryConfig, getCategoryMotivation } from '@/lib/categoryConfig';
import {
  useStats,
  useUpcomingEvent,
  usePaymentAlerts,
} from '@/lib/useBackstageData';
import { useEvents } from '@/lib/useBackstageData';

import ProximoShow from '@/components/home/ProximoShow';
import QuickStats from '@/components/home/QuickStats';
import AlertasBastidao from '@/components/home/AlertasBastidao';
import PipelineFinanceiro from '@/components/home/PipelineFinanceiro';
import ProximosEventos from '@/components/home/ProximosEventos';
import FloatingActions from '@/components/home/FloatingActions';

export default function Home() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userId = user?.id;
  const categoryId = profile?.category || 'audio';
  const config = getCategoryConfig(categoryId);
  const motivation = getCategoryMotivation(categoryId);
  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profissional';

  // Dados reais do Supabase
  const { stats, loading: statsLoading } = useStats(userId);
  const { event: proximoEvento, loading: eventLoading } = useUpcomingEvent(userId);
  const { alerts, loading: alertsLoading } = usePaymentAlerts(userId);

  const today = new Date().toISOString().split('T')[0];
  const { events: proximosEventos } = useEvents(userId, {
    from: today,
    limit: 5,
    ascending: true
  });

  // Detecta se tem evento HOJE → Modo Palco
  const isOnStage = proximoEvento
    ? proximoEvento.event_date === today
    : false;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formattedDay = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ─── HEADER DINÂMICO POR CATEGORIA ─── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
        style={{
          background: isOnStage
            ? `linear-gradient(135deg, ${config.primaryHex}22, ${config.accentHex}11, #030712)`
            : 'linear-gradient(180deg, #111827 0%, #030712 100%)'
        }}
      >
        {/* Glow de fundo dinâmico */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${config.bgGlow} 0%, transparent 70%)`,
          }}
        />

        {/* Linha neon na categoria */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${config.primaryHex}, transparent)` }}
          animate={{ opacity: isOnStage ? [0.6, 1, 0.6] : 0.4 }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <div className="relative z-10 px-4 pt-6 pb-5 max-w-2xl mx-auto">
          {/* Topo: Data + Ações */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-0.5">
                {formattedDay}
              </p>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: config.primaryHex }}
              >
                {config.emoji} {config.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-gray-800/80 border border-gray-700/50 flex items-center justify-center hover:border-gray-600 transition-all"
              >
                <Bell className="w-4 h-4 text-gray-400" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-gray-800/80 border border-gray-700/50 flex items-center justify-center hover:border-gray-600 transition-all"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>
          </div>

          {/* Saudação principal */}
          <div className="mb-1">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-black text-white leading-tight"
            >
              Olá,{' '}
              <span style={{
                WebkitTextStroke: `1px ${config.primaryHex}`,
                textShadow: `0 0 30px ${config.primaryHex}60`
              }}>
                {firstName}
              </span>
              .
            </motion.h1>
          </div>

          {/* Badge Modo Palco / Frase motivacional */}
          <AnimatePresence mode="wait">
            {isOnStage ? (
              <motion.div
                key="palco"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 mt-2"
              >
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: `${config.primaryHex}33`, border: `1px solid ${config.primaryHex}66` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: config.primaryHex }} />
                  MODO PALCO ATIVO
                </motion.span>
              </motion.div>
            ) : (
              <motion.p
                key="motivation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-gray-400 mt-1 italic"
              >
                "{motivation}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <div className="px-4 py-6 max-w-2xl mx-auto pb-28">

        {/* PRÓXIMO SHOW */}
        <ProximoShow
          event={proximoEvento}
          userCategory={categoryId}
          isOnStage={isOnStage}
          loading={eventLoading}
        />

        {/* QUICK STATS */}
        <QuickStats stats={stats} isLoading={statsLoading} />

        {/* ALERTAS DO BASTIDÃO */}
        <AlertasBastidao alerts={alerts} isLoading={alertsLoading} />

        {/* PIPELINE FINANCEIRO */}
        <PipelineFinanceiro stats={stats} isLoading={statsLoading} />

        {/* PRÓXIMOS EVENTOS */}
        <ProximosEventos events={proximosEventos} userCategory={categoryId} />

        {/* LOGOUT (discreto no bottom) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex justify-center"
        >
          {showLogoutConfirm ? (
            <div className="flex items-center gap-3 bg-red-900/30 border border-red-800/50 rounded-xl px-5 py-3">
              <span className="text-sm text-red-300">Sair do backstage?</span>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-700/50 px-3 py-1 rounded-lg hover:bg-red-900/30 transition-all"
              >
                Sim, sair
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-xs text-gray-500 hover:text-gray-400"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-500 text-xs transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          )}
        </motion.div>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <FloatingActions />
    </div>
  );
}
