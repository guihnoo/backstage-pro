import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useStats, useEvents, useMeiStats } from '@/lib/useBackstageData';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { Trophy, Zap, Star, Award, Flame, Calendar, X, Pencil, Check, CheckCircle2, BadgeCheck, Clock as ClockIcon, ChevronRight, Plus, Share2 } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { Input } from '@/components/ui/input';
import appToast from '@/lib/appToast';

import MeiDashboard from '@/components/goals/MeiDashboard';
import LiveClockBar from '@/components/home/LiveClockBar';
import StatValuePulse from '@/components/home/StatValuePulse';
import EventDetailModal from '@/components/calendar/EventDetailModal';
import EventForm from '@/components/calendar/EventForm';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { useEvents as useEventsStore } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppScrollLock } from '@/lib/useAppScrollLock';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import EventHeading from '@/components/events/EventHeading';
import { Ellipsis } from '@/components/ui/overflowText';
import { computeEventsNeededForGoal, computeGoalStreak } from '@/lib/goalMetrics';

const SEEN_BADGES_KEY = 'backstage_seen_badges';

function getSeenBadges() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_BADGES_KEY) || '[]')); }
  catch { return new Set(); }
}

function BadgeCelebration({ badge, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const Icon = badge.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.4, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="relative text-center px-10 py-10 rounded-3xl border"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${badge.color}18, #0a0c14 70%)`,
          borderColor: `${badge.color}40`,
          boxShadow: `0 0 60px ${badge.color}40, 0 0 120px ${badge.color}18`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Partículas */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: badge.color,
              top: '50%', left: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
              y: Math.sin((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
          />
        ))}

        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: `${badge.color}22`, border: `2px solid ${badge.color}60` }}
        >
          <Icon className="w-9 h-9" style={{ color: badge.color }} />
        </motion.div>

        <p className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: badge.color }}>
          Conquista desbloqueada!
        </p>
        <h2 className="text-2xl font-black text-white mb-1">{badge.title}</h2>
        <p className="text-sm text-slate-400">{badge.description}</p>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-slate-600 hover:text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}


// ─── Círculo de progresso animado ───────────────────────────
function CircularProgress({ value, max, size = 120, color, label, sublabel }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = (size / 2) - 12;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Trilha de fundo */}
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        {/* Valor central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-center min-w-0 max-w-[7rem]">
        <Ellipsis as="p" className="text-sm font-bold text-white">{label}</Ellipsis>
        <Ellipsis as="p" className="text-xs text-slate-500">{sublabel}</Ellipsis>
      </div>
    </div>
  );
}

// ─── Badge de conquista ──────────────────────────────────────
function BadgeCard({ icon: Icon, title, description, unlocked, color, progress, onClick }) {
  const showProgress = !unlocked && progress != null && progress.max > 0;
  const pct = showProgress ? Math.min((progress.value / progress.max) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: unlocked ? 1.04 : 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer min-w-0 ${
        unlocked
          ? 'bg-slate-800/60 border-slate-700/50'
          : 'bg-slate-900/30 border-slate-800/30'
      }`}
      style={unlocked ? { boxShadow: `0 0 20px ${color}20` } : { opacity: 0.7 }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
        style={{
          background: unlocked ? `${color}22` : 'transparent',
          border: unlocked ? `1px solid ${color}44` : '1px solid #1f2937',
          filter: unlocked ? 'none' : 'grayscale(1)',
        }}
      >
        <Icon className="w-5 h-5" style={{ color: unlocked ? color : '#4b5563' }} />
      </div>
      <Ellipsis as="p" className="text-sm font-bold text-white leading-tight">{title}</Ellipsis>
      <Ellipsis as="p" className="text-xs text-slate-500 mt-0.5">{description}</Ellipsis>
      {unlocked ? (
        <p className="text-xs font-bold mt-2" style={{ color }}>✓ Desbloqueado</p>
      ) : showProgress ? (
        <div className="mt-2">
          <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-1">
            <span>{progress.value} / {progress.max}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 mt-1">🔒 Bloqueado</p>
      )}
    </motion.div>
  );
}

// ─── Nível do profissional ───────────────────────────────────
function getLevelInfo(eventsCount) {
  if (eventsCount >= 100) return { title: 'Lenda do Palco', emoji: '👑', color: '#FFD700', next: null };
  if (eventsCount >= 50) return { title: 'Astro do Backstage', emoji: '⭐', color: AUTH_HERO_PRIMARY, next: 100 };
  if (eventsCount >= 20) return { title: 'Pro do Palco', emoji: '🔥', color: '#60a5fa', next: 50 };
  if (eventsCount >= 5) return { title: 'Veterano do Bastidão', emoji: '🎭', color: '#39FF14', next: 20 };
  return { title: 'Freelancer em Ascensão', emoji: '🚀', color: AUTH_HERO_ACCENT, next: 5 };
}

export default function Goals() {
  const { user, profile, updateProfile } = useAuth();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const userId = user?.id;
  const categoryId = profile?.category || 'lighting';
  const config = getCategoryConfig(categoryId);
  const [activeTab, setActiveTab] = useState('metas');
  const [celebrationBadge, setCelebrationBadge] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);
  const seenRef = useRef(getSeenBadges());
  const { clients } = useClients();
  const { delete: deleteEvent } = useEventsStore();

  const [editingGoals, setEditingGoals] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({ events: '', revenue: '' });
  const [selectedBadge, setSelectedBadge] = useState(null);
  useAppScrollLock(Boolean(celebrationBadge || selectedBadge || selectedEvent));

  const openGoalEdit = () => {
    setGoalForm({
      events: String(profile?.monthly_goal_events || 10),
      revenue: String(profile?.monthly_goal_revenue || 5000),
    });
    setEditingGoals(true);
  };

  const saveGoals = async () => {
    const events = parseInt(goalForm.events);
    const revenue = parseFloat(goalForm.revenue);
    if (!events || events < 1 || !revenue || revenue < 0) {
      appToast.error('Preencha valores válidos para as metas.');
      return;
    }
    try {
      setSavingGoals(true);
      await updateProfile({ monthly_goal_events: events, monthly_goal_revenue: revenue });
      appToast.success('Metas atualizadas!');
      setEditingGoals(false);
    } catch {
      appToast.error('Erro ao salvar metas.');
    } finally {
      setSavingGoals(false);
    }
  };

  // Stats reais
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats(userId);

  // MEI anual
  const { annualRevenue, loading: meiLoading, refetch: refetchMei } = useMeiStats(userId);

  // Total de eventos histórico (para nível) — todos os tempos, só completados
  const { events: allEvents, refetch: refetchAllEvents } = useEvents(userId, { status: 'completed' });

  // Próximos shows agendados
  const today = new Date().toISOString().split('T')[0];
  const { events: upcomingEvents, refetch: refetchUpcoming } = useEvents(userId, { from: today, limit: 4, ascending: true });

  const refreshData = useCallback(async () => {
    refetchStats();
    refetchMei();
    refetchAllEvents();
    refetchUpcoming();
  }, [refetchStats, refetchMei, refetchAllEvents, refetchUpcoming]);

  const pullRefreshGoals = useCallback(async () => {
    await refreshData();
    appToast.success('Metas atualizadas');
  }, [refreshData]);

  const handleConfirmDeleteEvent = useCallback(async () => {
    if (!confirmDeleteEventId) return;
    try {
      await deleteEvent(confirmDeleteEventId);
      appToast.success('Evento excluído com sucesso.');
      setSelectedEvent(null);
      await refreshData();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      appToast.error('Não foi possível excluir o evento.');
    } finally {
      setConfirmDeleteEventId(null);
    }
  }, [confirmDeleteEventId, deleteEvent, refreshData]);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(pullRefreshGoals);

  const totalEvents = allEvents.length;
  const levelInfo = getLevelInfo(totalEvents);

  // Metas mensais do perfil
  const metaDiarias = profile?.monthly_goal_events || 10;
  const diariasMes = stats.diarias_count ?? 0;
  const metaReceita = profile?.monthly_goal_revenue || 5000;

  // Progress para level
  const levelProgress = levelInfo.next
    ? ((totalEvents / levelInfo.next) * 100)
    : 100;

  // Conquistas
  const badges = useMemo(() => [
    // progress: { value, max } — mostrado quando não desbloqueado
    {
      icon: Star,
      title: 'Primeira Diária',
      description: 'Complete seu primeiro evento',
      unlocked: totalEvents >= 1,
      color: AUTH_HERO_ACCENT,
      progress: { value: Math.min(totalEvents, 1), max: 1 },
    },
    {
      icon: Zap,
      title: '5 Shows',
      description: 'Acumule 5 eventos no ano',
      unlocked: totalEvents >= 5,
      color: '#60a5fa',
      progress: { value: Math.min(totalEvents, 5), max: 5 },
    },
    {
      icon: Flame,
      title: 'Em Chamas',
      description: 'Complete 20 eventos no ano',
      unlocked: totalEvents >= 20,
      color: '#FF6B35',
      progress: { value: Math.min(totalEvents, 20), max: 20 },
    },
    {
      icon: Trophy,
      title: 'Pro do Palco',
      description: '50 eventos concluídos',
      unlocked: totalEvents >= 50,
      color: AUTH_HERO_PRIMARY,
      progress: { value: Math.min(totalEvents, 50), max: 50 },
    },
    {
      icon: Award,
      title: 'Meta Financeira',
      description: 'Atinja sua meta de receita mensal',
      unlocked: metaReceita > 0 && stats.faturamento_pago >= metaReceita,
      color: '#39FF14',
      progress: metaReceita > 0 ? { value: Math.min(stats.faturamento_pago, metaReceita), max: metaReceita } : null,
    },
    {
      icon: Calendar,
      title: 'Agenda Cheia',
      description: 'Bata sua meta de diárias no mês',
      unlocked: metaDiarias > 0 && diariasMes >= metaDiarias,
      color: config.primaryHex,
      progress: metaDiarias > 0 ? { value: Math.min(diariasMes, metaDiarias), max: metaDiarias } : null,
    },
  ], [totalEvents, stats, diariasMes, metaDiarias, metaReceita, config]);

  // Histórico mensal dos últimos 4 meses (receita paga, via allEvents)
  const monthlyHistory = useMemo(() => {
    const now = new Date();
    return [3, 2, 1, 0].map(monthsBack => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const monthEvents = allEvents.filter(e => {
        if (e.payment_status !== 'paid') return false;
        const refDate = e.paid_date || e.start_date || '';
        return refDate.startsWith(monthStr);
      });
      const revenue = monthEvents.reduce((sum, e) =>
        sum + (Number(e.paid_amount) > 0
          ? Number(e.paid_amount)
          : (Number(e.actual_revenue) || Number(e.estimated_revenue) || Number(e.daily_cache_value) || 0)), 0);
      const pct = metaReceita > 0 ? Math.min((revenue / metaReceita) * 100, 100) : null;
      const hit = metaReceita > 0 && revenue >= metaReceita;
      const isCurrent = monthsBack === 0;
      return { monthStr, label, revenue, pct, hit, isCurrent };
    });
  }, [allEvents, metaReceita]);

  const goalStreak = useMemo(
    () => computeGoalStreak(allEvents, metaReceita),
    [allEvents, metaReceita],
  );

  const eventsNeededForGoal = useMemo(
    () => computeEventsNeededForGoal(allEvents, metaReceita, stats.faturamento_pago),
    [allEvents, metaReceita, stats.faturamento_pago],
  );

  const yearlyPanel = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const currentMonthIndex = now.getMonth(); // 0-based

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`;
      const revenue = allEvents
        .filter(e => {
          if (e.payment_status !== 'paid') return false;
          const refDate = e.paid_date || e.start_date || '';
          return refDate.startsWith(monthStr);
        })
        .reduce((s, e) => s + (Number(e.paid_amount) || 0), 0);
      const isCurrent = i === currentMonthIndex;
      const isFuture = i > currentMonthIndex;
      const hit = metaReceita > 0 && revenue >= metaReceita && !isFuture;
      const pct = metaReceita > 0 && !isFuture ? Math.min((revenue / metaReceita) * 100, 100) : 0;
      const label = new Date(year, i, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return { monthStr, label, revenue, pct, hit, isCurrent, isFuture };
    });

    const pastMonths = months.filter(m => !m.isFuture && !m.isCurrent);
    const totalYear = months.reduce((s, m) => s + m.revenue, 0);
    const monthsElapsed = currentMonthIndex + 1;
    const monthsWithRevenue = pastMonths.filter(m => m.revenue > 0).length;
    const avgPerMonth = monthsWithRevenue > 0
      ? pastMonths.reduce((s, m) => s + m.revenue, 0) / monthsWithRevenue
      : 0;
    const projected = totalYear + avgPerMonth * Math.max(0, 12 - monthsElapsed);
    const monthsHit = months.filter(m => m.hit).length;

    return { months, totalYear, projected, monthsHit, monthsElapsed };
  }, [allEvents, metaReceita]);

  // Detecta badges recém-desbloqueados
  useEffect(() => {
    if (!badges.length) return;
    const seen = seenRef.current;
    const newlyUnlocked = badges.find(b => b.unlocked && !seen.has(b.title));
    if (newlyUnlocked) {
      seen.add(newlyUnlocked.title);
      try { localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify([...seen])); } catch { /* quota / private mode */ }
      // Pequeno delay para deixar a página carregar primeiro
      setTimeout(() => setCelebrationBadge(newlyUnlocked), 600);
    }
  }, [badges]);

  const tabs = [
    { id: 'metas', label: 'Metas' },
    { id: 'nivel', label: 'Nível' },
    { id: 'conquistas', label: 'Conquistas' },
    { id: 'mei', label: 'MEI' },
  ];

  return (
    <>
    <AnimatePresence>
      {celebrationBadge && (
        <BadgeCelebration
          badge={celebrationBadge}
          onClose={() => setCelebrationBadge(null)}
        />
      )}
    </AnimatePresence>
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-24">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        primaryHex={config.primaryHex}
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden px-4 pt-6 pb-4"
        style={{
          background: `linear-gradient(135deg, ${config.primaryHex}15, transparent)`
        }}
      >
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${config.primaryHex}, transparent)` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="max-w-2xl xl:max-w-6xl mx-auto flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sua Evolução</p>
            <h1 className="text-2xl font-black text-white">Metas & Conquistas</h1>
            <p className="text-sm text-slate-400 mt-1">{config.emoji} {config.label}</p>
          </div>
          <LiveClockBar primaryHex={config.primaryHex} />
        </div>
      </motion.div>

      <div className="px-4 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0">
        {/* Nível preview (sempre visível) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 mb-5 p-5 rounded-2xl border border-slate-800/50 bg-slate-900/40"
          style={{ boxShadow: `0 0 40px ${levelInfo.color}10` }}
        >
          <div className="flex items-center justify-between mb-3 gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Nível atual</p>
              <h2 className="text-lg font-black truncate" style={{ color: levelInfo.color }}>
                {levelInfo.emoji} {levelInfo.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{totalEvents} evento{totalEvents !== 1 ? 's' : ''} concluído{totalEvents !== 1 ? 's' : ''} no total</p>
            </div>
            {levelInfo.next && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Próximo nível</p>
                <p className="text-sm font-bold text-white">{levelInfo.next - totalEvents} eventos</p>
              </div>
            )}
          </div>
          {/* Barra de nível */}
          {levelInfo.next && (
            <div className="bg-slate-800/70 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(levelProgress, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}99)`,
                  boxShadow: `0 0 10px ${levelInfo.color}60`
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl mb-5 border border-slate-800/50">
          {tabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 min-h-[36px] rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        <AnimatePresence mode="wait">
          {/* ─── ABA METAS ─── */}
          {activeTab === 'metas' && (
            <motion.div
              key="metas"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Circulos de progresso */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Progresso do Mês</h3>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {!editingGoals && (
                    <button
                      type="button"
                      onClick={openGoalEdit}
                      className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors px-2 py-1 rounded-lg bp-hover-primary hover:bg-[color-mix(in_srgb,var(--bp-primary)_10%,transparent)]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar metas
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {editingGoals && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-5"
                    >
                      <div
                        className="grid grid-cols-2 gap-3 p-4 rounded-xl border"
                        style={{ borderColor: `${config.primaryHex}33`, background: `${config.primaryHex}0d` }}
                      >
                        <div>
                          <label htmlFor="goal-events" className="block text-xs text-slate-400 mb-1.5">Diárias/mês</label>
                          <Input
                            id="goal-events"
                            type="number"
                            min="1"
                            value={goalForm.events}
                            onChange={e => setGoalForm(f => ({ ...f, events: e.target.value }))}
                            className="bg-slate-800/80 border-slate-700 text-white h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="goal-revenue" className="block text-xs text-slate-400 mb-1.5">Meta R$ / mês</label>
                          <Input
                            id="goal-revenue"
                            type="number"
                            min="0"
                            step="100"
                            value={goalForm.revenue}
                            onChange={e => setGoalForm(f => ({ ...f, revenue: e.target.value }))}
                            className="bg-slate-800/80 border-slate-700 text-white h-9 text-sm"
                          />
                        </div>
                        <div className="col-span-2 flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={saveGoals}
                            disabled={savingGoals}
                            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold text-white hover:brightness-110 transition-[filter] disabled:opacity-50"
                            style={{ backgroundColor: config.primaryHex }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {savingGoals ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGoals(false)}
                            className="px-4 h-9 rounded-lg text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {statsLoading ? (
                  <div className="flex justify-around">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-24 h-24 bg-slate-800 rounded-full animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-around flex-wrap gap-4">
                    <CircularProgress
                      value={stats.faturamento_pago}
                      max={metaReceita}
                      size={110}
                      color={config.primaryHex}
                      label="Recebido"
                      sublabel={isVisible ? formatCurrency(stats.faturamento_pago) : '••••'}
                    />
                    <CircularProgress
                      value={diariasMes}
                      max={metaDiarias}
                      size={110}
                      color={config.accentHex}
                      label="Diárias"
                      sublabel={`${diariasMes} / ${metaDiarias}`}
                    />
                    <CircularProgress
                      value={stats.a_receber}
                      max={metaReceita}
                      size={110}
                      color={config.accentHex}
                      label="A Receber"
                      sublabel={isVisible ? formatCurrency(stats.a_receber) : '••••'}
                    />
                  </div>
                )}
              </div>

              {/* Clientes Ativos — única métrica não exibida nos círculos */}
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => hardNavigate('/clients')}
                className="w-full flex items-center gap-4 bg-slate-900/40 border border-slate-800/40 rounded-xl p-4 text-left hover:border-slate-700/60 transition-colors cursor-pointer"
              >
                <span className="text-2xl">👥</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">Clientes Ativos</p>
                  <StatValuePulse value={stats.clientes_ativos} glowColor={config.accentHex}>
                    <p className="text-xl font-black mt-0.5" style={{ color: config.accentHex }}>
                      {stats.clientes_ativos} empresa{stats.clientes_ativos !== 1 ? 's' : ''}
                    </p>
                  </StatValuePulse>
                  <p className="text-[10px] text-slate-600 mt-0.5">contratantes com shows no período</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </motion.button>

              {/* Mensagem de incentivo */}
              {(() => {
                const metaBatida = stats.faturamento_pago >= metaReceita && diariasMes >= metaDiarias;
                const metaReceita100 = stats.faturamento_pago >= metaReceita;
                const metaDiarias100 = diariasMes >= metaDiarias;
                if (metaBatida) {
                  return (
                    <div className="p-4 rounded-xl border text-center" style={{ background: '#39FF1408', borderColor: '#39FF1430' }}>
                      <p className="text-2xl mb-1">🏆</p>
                      <p className="text-sm font-bold text-white">Todas as metas batidas!</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {diariasMes} diária{diariasMes !== 1 ? 's' : ''} · {isVisible ? formatCurrency(stats.faturamento_pago) : '••••'} recebidos. Mês excepcional!
                      </p>
                    </div>
                  );
                }
                return (
                  <div
                    className="p-4 rounded-xl border"
                    style={{ background: `${config.primaryHex}08`, borderColor: `${config.primaryHex}30` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{metaReceita100 || metaDiarias100 ? '🎉' : '💪'}</span>
                      <div>
                        {!metaDiarias100 && (() => {
                          const needed = metaDiarias - diariasMes;
                          const todayD = new Date();
                          const dim = new Date(todayD.getFullYear(), todayD.getMonth() + 1, 0).getDate();
                          const daysLeft = dim - todayD.getDate();
                          const onTrack = todayD.getDate() > 0 && (diariasMes / todayD.getDate()) >= (metaDiarias / dim);
                          return (
                            <>
                              <p className="text-sm font-bold text-white">
                                {needed} diária{needed !== 1 ? 's' : ''} para bater a meta do mês
                              </p>
                              {daysLeft > 0 && needed > 0 && (
                                <p className={`text-xs mt-0.5 ${onTrack ? 'text-emerald-400/70' : 'text-amber-400/80'}`}>
                                  {onTrack ? '✓ No ritmo' : '⚠ Abaixo do ritmo'} · {daysLeft} dias restantes · 1 show a cada {(daysLeft / needed).toFixed(1)} dias
                                </p>
                              )}
                            </>
                          );
                        })()}
                        {metaDiarias100 && !metaReceita100 && (
                          <p className="text-sm font-bold text-white">Meta de diárias batida! 📅</p>
                        )}
                        {!metaReceita100 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Faltam {isVisible ? formatCurrency(metaReceita - stats.faturamento_pago) : '••••'} para a meta de receita
                          </p>
                        )}
                        {metaReceita100 && !metaDiarias100 && (
                          <p className="text-xs text-slate-400 mt-0.5">Meta de receita atingida! Continue registrando suas diárias.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Compartilhar resultado */}
              {(stats.faturamento_pago > 0 || diariasMes > 0) && (
                <button
                  type="button"
                  onClick={async () => {
                    const mes = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
                    const mesLabel = mes.charAt(0).toUpperCase() + mes.slice(1);
                    const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
                    const pctR = metaReceita > 0 ? Math.round((stats.faturamento_pago / metaReceita) * 100) : null;
                    const pctD = metaDiarias > 0 ? Math.round((diariasMes / metaDiarias) * 100) : null;
                    const lines = [
                      `🎯 *Metas de ${mesLabel}*`,
                      '',
                      metaReceita > 0
                        ? `💰 Receita: *${fmt(stats.faturamento_pago)}* / ${fmt(metaReceita)} (${pctR}%)`
                        : `💰 Receita recebida: *${fmt(stats.faturamento_pago)}*`,
                      metaDiarias > 0
                        ? `📅 Diárias: *${diariasMes}* / ${metaDiarias} (${pctD}%)`
                        : `📅 Diárias: *${diariasMes}*`,
                      stats.a_receber > 0 ? `⏳ A receber: ${fmt(stats.a_receber)}` : null,
                      goalStreak > 0 ? `🔥 ${goalStreak} ${goalStreak === 1 ? 'mês seguido' : 'meses seguidos'} batendo a meta!` : null,
                      '',
                      '_Backstage Pro_',
                    ].filter(l => l !== null).join('\n');
                    if (navigator.share) {
                      try { await navigator.share({ text: lines }); }
                      catch (e) { if (e.name !== 'AbortError') appToast.error('Erro ao compartilhar'); }
                    } else {
                      await navigator.clipboard.writeText(lines);
                      appToast.success('Resumo copiado!', { description: 'Cole no WhatsApp ou onde preferir.' });
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar resultado
                </button>
              )}

              {/* Próximos shows */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Próximos Shows</h3>
                  <button
                    type="button"
                    onClick={() => hardNavigate('/calendar')}
                    className="flex items-center gap-1 text-xs text-slate-500 transition-colors bp-hover-primary"
                  >
                    Ver agenda <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Nenhum show agendado</p>
                      <p className="text-xs text-slate-600 mt-0.5">Adicione eventos à sua agenda para acompanhar aqui</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => hardNavigate('/calendar')}
                      className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      style={{ background: `${config.primaryHex}20`, color: config.primaryHex }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agendar show
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((ev, i) => {
                      if (!ev.start_date) return null;
                      const days = differenceInCalendarDays(parseISO(ev.start_date), new Date());
                      const isUrgent = days <= 1;
                      const label = days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `em ${days}d`;
                      const isPaid = ev.payment_status === 'paid';
                      const isConfirmed = ev.status === 'confirmed' || ev.status === 'scheduled';
                      const StatusIcon = isPaid ? CheckCircle2 : isConfirmed ? BadgeCheck : ClockIcon;
                      const statusColor = isPaid ? '#10b981' : isConfirmed ? '#f59e0b' : '#64748b';
                      const amount = getEventCacheAmount(ev);
                      const accentColor = isUrgent ? AUTH_HERO_ACCENT : config.primaryHex;
                      return (
                        <motion.button
                          key={ev.id}
                          type="button"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors text-left"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}80` }}
                          />
                          <div className="flex-1 min-w-0">
                            <EventHeading event={ev} client={ev.clients} size="sm" />
                            <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                              {format(parseISO(ev.start_date), "EEE d/MM", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className="w-3.5 h-3.5" style={{ color: statusColor }} />
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${accentColor}22`, color: accentColor }}>
                                {label}
                              </span>
                            </div>
                            {amount > 0 && (
                              <span className="text-[10px] font-semibold font-mono" style={{ color: isPaid ? '#10b981' : '#f59e0b' }}>
                                {isVisible ? formatCurrency(amount) : '••••'}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Mini-calendário do mês */}
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth();
                  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const firstDayOfWeek = new Date(year, month, 1).getDay();

                  const eventDates = new Set();
                  [...allEvents, ...upcomingEvents].forEach(ev => {
                    if (!ev.start_date || ev.status === 'cancelled') return;
                    if (ev.start_date.startsWith(monthStr)) eventDates.add(ev.start_date);
                    if (ev.end_date && ev.end_date > ev.start_date) {
                      let cur = new Date(ev.start_date + 'T00:00:00');
                      const end = new Date(ev.end_date + 'T00:00:00');
                      while (cur <= end) {
                        const ds = cur.toISOString().split('T')[0];
                        if (ds.startsWith(monthStr)) eventDates.add(ds);
                        cur.setDate(cur.getDate() + 1);
                      }
                    }
                  });

                  if (eventDates.size === 0) return null;

                  const todayNum = now.getDate();
                  const cells = [];
                  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

                  return (
                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                      <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2 capitalize">
                        {new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>
                      <div className="grid grid-cols-7 text-center mb-1">
                        {['D','S','T','Q','Q','S','S'].map((d, i) => (
                          <span key={i} className="text-[9px] font-bold text-slate-700">{d}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5">
                        {cells.map((day, i) => {
                          if (!day) return <div key={`e${i}`} />;
                          const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
                          const hasEvent = eventDates.has(dateStr);
                          const isToday = day === todayNum;
                          const isPast = day < todayNum;
                          return (
                            <div key={dateStr} className="flex flex-col items-center py-0.5 gap-0.5">
                              <span
                                className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none font-medium
                                  ${isToday ? 'font-bold text-slate-900' : isPast ? 'text-slate-700' : 'text-slate-400'}
                                `}
                                style={isToday ? { background: config.primaryHex } : undefined}
                              >
                                {day}
                              </span>
                              {hasEvent && (
                                <div
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: config.primaryHex, opacity: isPast ? 0.45 : 0.9 }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Streak + Projeção */}
              {(goalStreak > 0 || eventsNeededForGoal) && (
                <div className="grid grid-cols-2 gap-3">
                  {goalStreak > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
                      <span className="text-2xl">🔥</span>
                      <p className="text-xl font-black text-amber-400">{goalStreak}</p>
                      <p className="text-[11px] text-amber-400/80 leading-tight">
                        {goalStreak === 1 ? 'mês seguido' : 'meses seguidos'} batendo a meta
                      </p>
                    </div>
                  )}
                  {eventsNeededForGoal && (
                    <div className={`bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center ${!goalStreak ? 'col-span-2' : ''}`}>
                      <p className="text-2xl font-black text-white">{eventsNeededForGoal.count}</p>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {eventsNeededForGoal.count === 1 ? 'show ainda' : 'shows ainda'} para bater a meta
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        média {isVisible ? formatCurrency(eventsNeededForGoal.avg) : '•••'}/show
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Histórico mensal */}
              {monthlyHistory.some(m => m.revenue > 0) && (
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Histórico Recente</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {monthlyHistory.map(({ label, revenue, pct, hit, isCurrent }) => (
                      <div
                        key={label}
                        className={`p-3 rounded-xl border ${isCurrent ? 'border-slate-600/60 bg-slate-800/50' : 'border-slate-800/40 bg-slate-900/30'}`}
                      >
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider capitalize mb-1">
                          {label}{isCurrent ? ' · atual' : ''}
                        </p>
                        <p className="text-sm font-bold text-white">
                          {isVisible ? formatCurrency(revenue) : '•••'}
                        </p>
                        {pct !== null && (
                          <div className="mt-2">
                            <div className="h-1 rounded-full bg-slate-700/60">
                              <div
                                className="h-1 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: hit ? '#10b981' : config.primaryHex }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-600 mt-1">
                              {Math.round(pct)}% da meta {hit ? '✅' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Painel Anual */}
              {yearlyPanel.totalYear > 0 && (
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      {new Date().getFullYear()} em Resumo
                    </h3>
                    {yearlyPanel.monthsHit > 0 && (
                      <span className="text-[11px] font-bold text-emerald-400">
                        {yearlyPanel.monthsHit} {yearlyPanel.monthsHit === 1 ? 'mês bateu' : 'meses bateram'} a meta
                      </span>
                    )}
                  </div>

                  {/* Barras mensais */}
                  <div className="flex items-end gap-1 h-14 mb-3">
                    {yearlyPanel.months.map(({ label, pct, hit, isCurrent, isFuture }) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex items-end" style={{ height: 40 }}>
                          <div
                            className={`w-full rounded-t-sm transition-all duration-700 ${isCurrent ? 'animate-pulse' : ''}`}
                            style={{
                              height: isFuture ? 3 : `${Math.max(pct, isFuture ? 0 : 4)}%`,
                              background: isFuture
                                ? '#1e293b'
                                : hit
                                ? '#10b981'
                                : pct > 0
                                ? config.accentHex
                                : '#1e293b',
                              opacity: isFuture ? 0.3 : 1,
                            }}
                          />
                        </div>
                        <span className={`text-[8px] font-mono capitalize ${isCurrent ? 'bp-text-primary font-bold' : 'text-slate-600'}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Stats anuais */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Recebido em {new Date().getFullYear()}</p>
                      <p className="text-base font-black text-white mt-0.5">
                        {isVisible ? formatCurrency(yearlyPanel.totalYear) : '•••'}
                      </p>
                    </div>
                    {yearlyPanel.projected > yearlyPanel.totalYear && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Projeção dezembro</p>
                        <p className="text-base font-black text-emerald-400 mt-0.5">
                          {isVisible ? formatCurrency(yearlyPanel.projected) : '•••'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── ABA NÍVEL ─── */}
          {activeTab === 'nivel' && (
            <motion.div
              key="nivel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Pirâmide de níveis */}
              {[
                { title: 'Freelancer em Ascensão', emoji: '🚀', req: 1, color: AUTH_HERO_ACCENT },
                { title: 'Veterano do Bastidão', emoji: '🎭', req: 5, color: '#39FF14' },
                { title: 'Pro do Palco', emoji: '🔥', req: 20, color: '#60a5fa' },
                { title: 'Astro do Backstage', emoji: '⭐', req: 50, color: AUTH_HERO_PRIMARY },
                { title: 'Lenda do Palco', emoji: '👑', req: 100, color: '#FFD700' },
              ].map((level, i) => {
                const reached = totalEvents >= level.req;
                const isCurrent = getLevelInfo(totalEvents).title === level.title;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-opacity-60 bg-slate-800/60'
                        : reached
                        ? 'border-slate-700/30 bg-slate-900/30'
                        : 'border-slate-800/20 bg-slate-900/10 opacity-40'
                    }`}
                    style={isCurrent ? {
                      borderColor: `${level.color}50`,
                      boxShadow: `0 0 20px ${level.color}15`
                    } : {}}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: reached ? `${level.color}20` : 'transparent',
                        border: `2px solid ${reached ? level.color + '50' : '#374151'}`
                      }}
                    >
                      {reached ? level.emoji : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Ellipsis as="p" className="font-bold text-white text-sm">{level.title}</Ellipsis>
                      <p className="text-xs text-slate-500">{level.req}+ eventos concluídos</p>
                    </div>
                    {isCurrent && (
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: `${level.color}20`, color: level.color }}
                      >
                        Atual
                      </span>
                    )}
                    {reached && !isCurrent && (
                      <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ─── ABA CONQUISTAS ─── */}
          {activeTab === 'conquistas' && (
            <motion.div
              key="conquistas"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge, i) => (
                  <BadgeCard key={i} {...badge} onClick={() => setSelectedBadge(badge)} />
                ))}
              </div>
              <p className="text-center text-xs text-slate-600 mt-5">
                {badges.filter(b => b.unlocked).length} / {badges.length} conquistas desbloqueadas
              </p>
            </motion.div>
          )}

          {activeTab === 'mei' && (
            <motion.div
              key="mei"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MeiDashboard
                annualRevenue={annualRevenue}
                loading={meiLoading}
                dasType="services"
                accentColor={config.primaryHex}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NeonPageShell>

    {/* Badge detail sheet */}
    <AnimatePresence>
      {selectedBadge && (() => {
        const Icon = selectedBadge.icon;
        const showProgress = !selectedBadge.unlocked && selectedBadge.progress?.max > 0;
        const pct = showProgress ? Math.min((selectedBadge.progress.value / selectedBadge.progress.max) * 100, 100) : 0;
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85dvh] flex flex-col rounded-t-2xl border p-6 pb-8 overflow-hidden"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${selectedBadge.color}14, #0d0f1a 60%)`,
                borderColor: `${selectedBadge.color}30`,
              }}
            >
              <div className="bp-modal-scroll flex-1 min-h-0 -mx-1 px-1">
              <div className="flex items-start justify-between gap-3 mb-5 min-w-0">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: selectedBadge.unlocked ? `${selectedBadge.color}22` : 'transparent',
                      border: `1px solid ${selectedBadge.unlocked ? selectedBadge.color + '44' : '#1f2937'}`,
                      filter: selectedBadge.unlocked ? 'none' : 'grayscale(1)',
                    }}
                  >
                    <Icon className="w-7 h-7" style={{ color: selectedBadge.unlocked ? selectedBadge.color : '#4b5563' }} />
                  </div>
                  <div className="min-w-0">
                    <Ellipsis as="h3" className="text-lg font-bold text-white">{selectedBadge.title}</Ellipsis>
                    <Ellipsis as="p" className="text-sm text-slate-400">{selectedBadge.description}</Ellipsis>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedBadge(null)} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedBadge.unlocked ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: `${selectedBadge.color}18`, border: `1px solid ${selectedBadge.color}30` }}>
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: selectedBadge.color }}>Conquista desbloqueada!</p>
                    <p className="text-xs text-slate-500">Você completou este desafio.</p>
                  </div>
                </div>
              ) : showProgress ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>Progresso</span>
                    <span>{selectedBadge.progress.value} / {selectedBadge.progress.max} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: selectedBadge.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 pt-1">Faltam {selectedBadge.progress.max - selectedBadge.progress.value} para desbloquear.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 italic">🔒 Complete o desafio para desbloquear esta conquista.</p>
              )}
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
    {selectedEvent && (
      <EventDetailModal
        event={selectedEvent}
        client={selectedEvent.clients || null}
        onClose={() => setSelectedEvent(null)}
        onEdit={(event) => {
          setSelectedEvent(null);
          setEditingEvent(event);
          setShowEventForm(true);
        }}
        onDelete={(eventId) => setConfirmDeleteEventId(eventId)}
        onMarkPaid={() => {
          setSelectedEvent(null);
          refreshData();
        }}
        onAddWork={() => {
          setSelectedEvent(null);
          hardNavigate('/calendar');
        }}
      />
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
        onSuccess={async () => {
          setShowEventForm(false);
          setEditingEvent(null);
          await refreshData();
        }}
      />
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
    </>
  );
}
