import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useStats, useEvents, useMeiStats } from '@/lib/useBackstageData';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { Trophy, Zap, Star, TrendingUp, Award, Flame, Calendar, X, Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import MeiDashboard from '@/components/goals/MeiDashboard';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
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
        <p className="text-sm text-gray-400">{badge.description}</p>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-600 hover:text-gray-400 transition-colors"
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
      <div className="text-center">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-gray-500">{sublabel}</p>
      </div>
    </div>
  );
}

// ─── Badge de conquista ──────────────────────────────────────
function BadgeCard({ icon: Icon, title, description, unlocked, color, progress }) {
  const showProgress = !unlocked && progress != null && progress.max > 0;
  const pct = showProgress ? Math.min((progress.value / progress.max) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: unlocked ? 1.04 : 1.02 }}
      className={`p-4 rounded-xl border transition-all ${
        unlocked
          ? 'bg-gray-800/60 border-gray-700/50'
          : 'bg-gray-900/30 border-gray-800/30'
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
      <p className="text-sm font-bold text-white leading-tight">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      {unlocked ? (
        <p className="text-xs font-bold mt-2" style={{ color }}>✓ Desbloqueado</p>
      ) : showProgress ? (
        <div className="mt-2">
          <div className="flex justify-between text-[9px] font-mono text-gray-600 mb-1">
            <span>{progress.value} / {progress.max}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
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
        <p className="text-xs text-gray-600 mt-1">🔒 Bloqueado</p>
      )}
    </motion.div>
  );
}

// ─── Nível do profissional ───────────────────────────────────
function getLevelInfo(eventsCount) {
  if (eventsCount >= 100) return { title: 'Lenda do Palco', emoji: '👑', color: '#FFD700', next: null };
  if (eventsCount >= 50) return { title: 'Astro do Backstage', emoji: '⭐', color: '#A64AFF', next: 100 };
  if (eventsCount >= 20) return { title: 'Pro do Palco', emoji: '🔥', color: '#00D9FF', next: 50 };
  if (eventsCount >= 5) return { title: 'Veterano do Bastidão', emoji: '🎭', color: '#39FF14', next: 20 };
  return { title: 'Freelancer em Ascensão', emoji: '🚀', color: '#FFB700', next: 5 };
}

export default function Goals() {
  const { user, profile, updateProfile } = useAuth();
  const { formatCurrency } = useFinancialVisibility();
  const userId = user?.id;
  const categoryId = profile?.category || 'lighting';
  const config = getCategoryConfig(categoryId);
  const [activeTab, setActiveTab] = useState('metas');
  const [celebrationBadge, setCelebrationBadge] = useState(null);
  const seenRef = useRef(getSeenBadges());

  const [editingGoals, setEditingGoals] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({ events: '', revenue: '' });

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
      toast.error('Preencha valores válidos para as metas.');
      return;
    }
    try {
      setSavingGoals(true);
      await updateProfile({ monthly_goal_events: events, monthly_goal_revenue: revenue });
      toast.success('Metas atualizadas!');
      setEditingGoals(false);
    } catch {
      toast.error('Erro ao salvar metas.');
    } finally {
      setSavingGoals(false);
    }
  };

  // Stats reais
  const { stats, loading: statsLoading } = useStats(userId);

  // MEI anual
  const { annualRevenue, loading: meiLoading } = useMeiStats(userId);

  // Total de eventos histórico (para nível) — todos os tempos, só completados
  const { events: allEvents } = useEvents(userId, { status: 'completed' });

  const totalEvents = allEvents.length;
  const levelInfo = getLevelInfo(totalEvents);

  // Metas mensais do perfil
  const metaEventos = profile?.monthly_goal_events || 10;
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
      color: '#FFB700',
      progress: { value: Math.min(totalEvents, 1), max: 1 },
    },
    {
      icon: Zap,
      title: '5 Shows',
      description: 'Acumule 5 eventos no ano',
      unlocked: totalEvents >= 5,
      color: '#00D9FF',
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
      color: '#A64AFF',
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
      description: 'Bata sua meta de eventos no mês',
      unlocked: metaEventos > 0 && stats.eventos_count >= metaEventos,
      color: config.primaryHex,
      progress: metaEventos > 0 ? { value: Math.min(stats.eventos_count, metaEventos), max: metaEventos } : null,
    },
  ], [totalEvents, stats, metaEventos, metaReceita, config]);

  // Detecta badges recém-desbloqueados
  useEffect(() => {
    if (!badges.length) return;
    const seen = seenRef.current;
    const newlyUnlocked = badges.find(b => b.unlocked && !seen.has(b.title));
    if (newlyUnlocked) {
      seen.add(newlyUnlocked.title);
      try { localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify([...seen])); } catch {}
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
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-screen pb-24">
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
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sua Evolução</p>
          <h1 className="text-2xl font-black text-white">Metas & Conquistas</h1>
          <p className="text-sm text-gray-400 mt-1">{config.emoji} {config.label}</p>
        </div>
      </motion.div>

      <div className="px-4 max-w-2xl mx-auto">
        {/* Nível preview (sempre visível) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 mb-5 p-5 rounded-2xl border border-gray-800/50 bg-gray-900/40"
          style={{ boxShadow: `0 0 40px ${levelInfo.color}10` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Nível atual</p>
              <h2 className="text-lg font-black" style={{ color: levelInfo.color }}>
                {levelInfo.emoji} {levelInfo.title}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{totalEvents} evento{totalEvents !== 1 ? 's' : ''} concluído{totalEvents !== 1 ? 's' : ''} no total</p>
            </div>
            {levelInfo.next && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Próximo nível</p>
                <p className="text-sm font-bold text-white">{levelInfo.next - totalEvents} eventos</p>
              </div>
            )}
          </div>
          {/* Barra de nível */}
          {levelInfo.next && (
            <div className="bg-gray-800/70 rounded-full h-2 overflow-hidden">
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
        <div className="flex gap-1 bg-gray-900/50 p-1 rounded-xl mb-5 border border-gray-800/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 min-h-[36px] rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-400'
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
              <div className="bg-gray-900/40 border border-gray-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Progresso do Mês</h3>
                  {!editingGoals && (
                    <button
                      type="button"
                      onClick={openGoalEdit}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded-lg hover:bg-cyan-400/10"
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
                      <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">Shows/mês</label>
                          <Input
                            type="number"
                            min="1"
                            value={goalForm.events}
                            onChange={e => setGoalForm(f => ({ ...f, events: e.target.value }))}
                            className="bg-gray-800/80 border-gray-700 text-white h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">Meta R$ / mês</label>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={goalForm.revenue}
                            onChange={e => setGoalForm(f => ({ ...f, revenue: e.target.value }))}
                            className="bg-gray-800/80 border-gray-700 text-white h-9 text-sm"
                          />
                        </div>
                        <div className="col-span-2 flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={saveGoals}
                            disabled={savingGoals}
                            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {savingGoals ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGoals(false)}
                            className="px-4 h-9 rounded-lg text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-colors"
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
                    {[1, 2].map(i => (
                      <div key={i} className="w-28 h-28 bg-gray-800 rounded-full animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-around flex-wrap gap-6">
                    <CircularProgress
                      value={stats.faturamento_pago}
                      max={metaReceita}
                      size={130}
                      color={config.primaryHex}
                      label="Receita"
                      sublabel={`${formatCurrency(stats.faturamento_pago)} / ${formatCurrency(metaReceita)}`}
                    />
                    <CircularProgress
                      value={stats.eventos_count}
                      max={metaEventos}
                      size={130}
                      color={config.accentHex}
                      label="Eventos"
                      sublabel={`${stats.eventos_count} / ${metaEventos} shows`}
                    />
                  </div>
                )}
              </div>

              {/* Resumo financeiro */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Recebido', value: formatCurrency(stats.faturamento_pago), icon: '✅', color: '#39FF14', route: '/reports' },
                  { label: 'A Receber', value: formatCurrency(stats.a_receber), icon: '⏳', color: '#FFB700', route: '/reports' },
                  { label: 'Eventos', value: `${stats.eventos_count} shows`, icon: '🎤', color: config.primaryHex, route: '/calendar' },
                  { label: 'Clientes Ativos', value: `${stats.clientes_ativos}`, icon: '👥', color: config.accentHex, route: '/clients' },
                ].map((item, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => hardNavigate(item.route)}
                    className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-4 text-left hover:border-gray-700/60 transition-colors cursor-pointer"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-xs text-gray-500 mt-2">{item.label}</p>
                    <p className="text-lg font-black mt-0.5" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </motion.button>
                ))}
              </div>

              {/* Mensagem de incentivo */}
              <div
                className="p-4 rounded-xl border text-center"
                style={{
                  background: `${config.primaryHex}08`,
                  borderColor: `${config.primaryHex}30`
                }}
              >
                {stats.eventos_count >= metaEventos ? (
                  <>
                    <p className="text-xl mb-1">🎉</p>
                    <p className="text-sm font-bold text-white">Meta de eventos batida!</p>
                    <p className="text-xs text-gray-400 mt-1">Você superou {metaEventos} eventos este mês. Incrível!</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl mb-1">💪</p>
                    <p className="text-sm font-bold text-white">
                      {metaEventos - stats.eventos_count} eventos para a meta!
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Você está construindo sua carreira, show a show.</p>
                  </>
                )}
              </div>
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
                { title: 'Freelancer em Ascensão', emoji: '🚀', req: 1, color: '#FFB700' },
                { title: 'Veterano do Bastidão', emoji: '🎭', req: 5, color: '#39FF14' },
                { title: 'Pro do Palco', emoji: '🔥', req: 20, color: '#00D9FF' },
                { title: 'Astro do Backstage', emoji: '⭐', req: 50, color: '#A64AFF' },
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
                        ? 'border-opacity-60 bg-gray-800/60'
                        : reached
                        ? 'border-gray-700/30 bg-gray-900/30'
                        : 'border-gray-800/20 bg-gray-900/10 opacity-40'
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
                      <p className="font-bold text-white text-sm">{level.title}</p>
                      <p className="text-xs text-gray-500">{level.req}+ eventos concluídos</p>
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
                      <TrendingUp className="w-4 h-4 text-gray-600 flex-shrink-0" />
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
                  <BadgeCard key={i} {...badge} />
                ))}
              </div>
              <p className="text-center text-xs text-gray-600 mt-5">
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
    </>
  );
}
