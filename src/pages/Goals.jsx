import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useStats, useEvents } from '@/lib/useBackstageData';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { Trophy, Target, Zap, Star, TrendingUp, Award, Flame, Calendar } from 'lucide-react';


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
function BadgeCard({ icon: Icon, title, description, unlocked, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      className={`p-4 rounded-xl border transition-all ${
        unlocked
          ? 'bg-gray-800/60 border-gray-700/50'
          : 'bg-gray-900/30 border-gray-800/30 opacity-50 grayscale'
      }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
        style={{ background: unlocked ? `${color}22` : 'transparent', border: unlocked ? `1px solid ${color}44` : '1px solid #1f2937' }}
      >
        <Icon className="w-5 h-5" style={{ color: unlocked ? color : '#4b5563' }} />
      </div>
      <p className="text-sm font-bold text-white leading-tight">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      {!unlocked && (
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
  const { user, profile } = useAuth();
  const userId = user?.id;
  const categoryId = profile?.category || 'lighting';
  const config = getCategoryConfig(categoryId);
  const [activeTab, setActiveTab] = useState('metas');

  // Stats reais
  const { stats, loading: statsLoading } = useStats(userId);

  // Total de eventos histórico (para nível)
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const { events: allEvents } = useEvents(userId, { from: yearStart });

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
    {
      icon: Star,
      title: 'Primeira Diária',
      description: 'Complete seu primeiro evento',
      unlocked: totalEvents >= 1,
      color: '#FFB700'
    },
    {
      icon: Zap,
      title: '5 Shows',
      description: 'Acumule 5 eventos concluídos',
      unlocked: totalEvents >= 5,
      color: '#00D9FF'
    },
    {
      icon: Flame,
      title: 'Em Chamas',
      description: 'Complete 20 eventos no ano',
      unlocked: totalEvents >= 20,
      color: '#FF6B35'
    },
    {
      icon: Trophy,
      title: 'Pro do Palco',
      description: '50 eventos concluídos',
      unlocked: totalEvents >= 50,
      color: '#A64AFF'
    },
    {
      icon: Award,
      title: 'Meta Financeira',
      description: 'Atinja sua meta de receita mensal',
      unlocked: stats.faturamento_pago >= metaReceita,
      color: '#39FF14'
    },
    {
      icon: Calendar,
      title: 'Agenda Cheia',
      description: 'Bata sua meta de eventos no mês',
      unlocked: stats.eventos_count >= metaEventos,
      color: config.primaryHex
    }
  ], [totalEvents, stats, metaEventos, metaReceita, config]);

  const tabs = [
    { id: 'metas', label: 'Metas do Mês' },
    { id: 'nivel', label: 'Nível & XP' },
    { id: 'conquistas', label: 'Conquistas' },
  ];

  return (
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
              <p className="text-xs text-gray-400 mt-0.5">{totalEvents} eventos concluídos no ano</p>
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
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
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
                <h3 className="text-sm font-bold text-gray-300 mb-6 uppercase tracking-wider">Progresso do Mês</h3>
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
                      sublabel={`R$${(stats.faturamento_pago / 1000).toFixed(1)}k / R$${(metaReceita / 1000).toFixed(1)}k`}
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
                  { label: 'Recebido', value: `R$${stats.faturamento_pago.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, icon: '✅', color: '#39FF14' },
                  { label: 'A Receber', value: `R$${stats.a_receber.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, icon: '⏳', color: '#FFB700' },
                  { label: 'Eventos', value: `${stats.eventos_count} shows`, icon: '🎤', color: config.primaryHex },
                  { label: 'Clientes Ativos', value: `${stats.clientes_ativos}`, icon: '👥', color: config.accentHex },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-4"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-xs text-gray-500 mt-2">{item.label}</p>
                    <p className="text-lg font-black mt-0.5" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </motion.div>
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
        </AnimatePresence>
      </div>
    </NeonPageShell>
  );
}
