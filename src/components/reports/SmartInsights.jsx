import { useMemo } from 'react';
import { format, isAfter, startOfMonth, endOfMonth, subMonths, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, AlertCircle, Zap, Users, Calendar, Star, Clock, CheckCircle2 } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { getEventStatus } from '@/components/utils/dateUtils';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function buildInsights({ events, clients, expenses: _expenses, work, profile, fmt }) {
  const today = new Date();
  const insights = [];

  const active = (events || []).filter(e => getEventStatus(e) !== 'cancelled');
  const completed = active.filter(e => getEventStatus(e) === 'completed');
  const upcoming = active.filter(e => {
    const st = getEventStatus(e);
    return (st === 'scheduled' || st === 'confirmed') && e.start_date && isAfter(parseISO(e.start_date), today);
  });

  // --- 1. Inadimplência: eventos concluídos com pagamento vencido ---
  const overdueUnpaid = completed.filter(e => {
    if (e.payment_status === 'paid') return false;
    // Se tem data de vencimento definida, respeita ela
    if (e.payment_due_date) return parseISO(e.payment_due_date) < today;
    // Sem data de vencimento: 7+ dias após o fim do evento
    const daysAgo = e.end_date
      ? differenceInDays(today, parseISO(e.end_date))
      : e.start_date
        ? differenceInDays(today, parseISO(e.start_date))
        : 999;
    return daysAgo >= 7;
  });
  if (overdueUnpaid.length > 0) {
    const total = overdueUnpaid.reduce((s, e) => s + (getEventCacheAmount(e) || 0), 0);
    insights.push({
      id: 'overdue',
      priority: 10,
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      title: `${overdueUnpaid.length} show${overdueUnpaid.length > 1 ? 's' : ''} sem pagamento`,
      description: `Você tem ${fmt(total)} a receber de shows já realizados.`,
      cta: 'Ver Relatórios → Visão Geral',
      ctaAction: null,
    });
  }

  // --- 2. Agenda vazia nos próximos 30 dias ---
  const next30 = upcoming.filter(e => {
    const d = parseISO(e.start_date);
    return differenceInDays(d, today) <= 30;
  });
  if (next30.length === 0 && upcoming.length === 0) {
    insights.push({
      id: 'empty_agenda',
      priority: 8,
      icon: Calendar,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      title: 'Agenda vazia nos próximos 30 dias',
      description: 'Nenhum show agendado. É um bom momento para prospectar clientes e enviar propostas.',
      cta: 'Ir para Agenda',
      ctaAction: () => hardNavigate('/calendar'),
    });
  } else if (next30.length >= 5) {
    insights.push({
      id: 'busy_month',
      priority: 3,
      icon: Zap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      title: `${next30.length} shows nos próximos 30 dias`,
      description: 'Agenda cheia! Verifique se equipamentos e equipe estão confirmados para todos os shows.',
      cta: 'Ver Agenda',
      ctaAction: () => hardNavigate('/calendar'),
    });
  }

  // --- 3. Crescimento de receita vs mês anterior ---
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const prevMonthStart = startOfMonth(subMonths(today, 1));
  const prevMonthEnd = endOfMonth(subMonths(today, 1));

  const revThisMonth = completed.filter(e => {
    const d = parseISO(e.start_date || e.end_date || '');
    return d >= thisMonthStart && d <= thisMonthEnd && e.payment_status === 'paid';
  }).reduce((s, e) => s + (getEventCacheAmount(e) || 0), 0);

  const revLastMonth = completed.filter(e => {
    const d = parseISO(e.start_date || e.end_date || '');
    return d >= prevMonthStart && d <= prevMonthEnd && e.payment_status === 'paid';
  }).reduce((s, e) => s + (getEventCacheAmount(e) || 0), 0);

  if (revLastMonth > 0 && today.getDate() >= 10) {
    const pct = ((revThisMonth - revLastMonth) / revLastMonth) * 100;
    if (pct >= 20) {
      insights.push({
        id: 'growth',
        priority: 5,
        icon: TrendingUp,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        title: `Receita ${pct.toFixed(0)}% acima do mês passado`,
        description: `Você recebeu mais este mês que no anterior. Continue assim! 🎉`,
        cta: null,
        ctaAction: null,
      });
    } else if (pct <= -20) {
      insights.push({
        id: 'decline',
        priority: 6,
        icon: TrendingDown,
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/20',
        title: `Receita ${Math.abs(pct).toFixed(0)}% abaixo do mês passado`,
        description: `Queda em relação ao mês anterior. Considere prospectar novos clientes.`,
        cta: 'Ver Clientes',
        ctaAction: () => hardNavigate('/clients'),
      });
    }
  }

  // --- 4. Dependência de cliente único ---
  const clientRevMap = {};
  completed.forEach(e => {
    if (!e.client_id) return;
    const rev = e.payment_status === 'paid' ? (getEventCacheAmount(e) || 0) : 0;
    clientRevMap[e.client_id] = (clientRevMap[e.client_id] || 0) + rev;
  });
  const totalPaidRev = Object.values(clientRevMap).reduce((s, v) => s + v, 0);
  if (totalPaidRev > 0) {
    const topClientId = Object.entries(clientRevMap).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topRev = clientRevMap[topClientId] || 0;
    const topPct = (topRev / totalPaidRev) * 100;
    if (topPct >= 50) {
      const topClient = (clients || []).find(c => c.id === topClientId);
      insights.push({
        id: 'concentration',
        priority: 7,
        icon: Users,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        title: `${topPct.toFixed(0)}% da receita de 1 cliente`,
        description: `${topClient?.name || 'Um único cliente'} representa mais da metade da sua receita. Diversifique para reduzir risco.`,
        cta: 'Ver Clientes',
        ctaAction: () => hardNavigate('/clients'),
      });
    }
  }

  // --- 5. Melhor mês histórico chegando nos próximos 60 dias ---
  const byMonth = Array(12).fill(0);
  completed.forEach(e => {
    if (!e.start_date) return;
    const m = parseInt(e.start_date.slice(5, 7), 10) - 1;
    byMonth[m] += (e.payment_status === 'paid' ? getEventCacheAmount(e) : 0) || 0;
  });
  const maxRev = Math.max(...byMonth);
  if (maxRev > 0) {
    const bestMonthIdx = byMonth.indexOf(maxRev);
    const curMonth = today.getMonth();
    const nextMonth = (curMonth + 1) % 12;
    const monthAfter = (curMonth + 2) % 12;
    if (bestMonthIdx === nextMonth || bestMonthIdx === monthAfter) {
      insights.push({
        id: 'best_month_incoming',
        priority: 4,
        icon: Star,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/20',
        title: `${MONTHS_PT[bestMonthIdx]} é seu melhor mês histórico`,
        description: `Historicamente ${MONTHS_PT[bestMonthIdx]} é quando você mais fatura. Garanta shows agendados agora!`,
        cta: 'Ver Sazonalidade',
        ctaAction: null,
      });
    }
  }

  // --- 6. Meta do mês quase batida ---
  const monthlyGoal = Number(profile?.monthly_goal_revenue) || 0;
  if (monthlyGoal > 0 && revThisMonth > 0) {
    const pctGoal = (revThisMonth / monthlyGoal) * 100;
    if (pctGoal >= 80 && pctGoal < 100) {
      const remaining = monthlyGoal - revThisMonth;
      insights.push({
        id: 'goal_near',
        priority: 9,
        icon: CheckCircle2,
        themePrimary: true,
        title: `${pctGoal.toFixed(0)}% da meta mensal — quase lá!`,
        description: `Faltam ${fmt(remaining)} para bater a meta de ${format(today, 'MMMM', { locale: ptBR })}.`,
        cta: 'Ver Metas',
        ctaAction: () => hardNavigate('/goals'),
      });
    } else if (pctGoal >= 100) {
      insights.push({
        id: 'goal_hit',
        priority: 9,
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        title: `Meta de ${format(today, 'MMMM', { locale: ptBR })} batida! 🎉`,
        description: `Você já ultrapassou a meta mensal de ${fmt(monthlyGoal)}. Excelente trabalho!`,
        cta: null,
        ctaAction: null,
      });
    }
  }

  // --- 7. Taxa horária boa ---
  const totalHours = (work || []).reduce((s, w) => s + (w.total_hours || 0), 0);
  if (totalPaidRev > 0 && totalHours > 10) {
    const rate = totalPaidRev / totalHours;
    if (rate >= 150) {
      insights.push({
        id: 'hourly_rate',
        priority: 2,
        icon: Clock,
        themePrimary: true,
        title: `Sua taxa horária é ${fmt(rate)}/hora`,
        description: 'Acima de R$150/hora — ótima rentabilidade! Continue selecionando shows de alto valor.',
        cta: null,
        ctaAction: null,
      });
    }
  }

  // Sort by priority desc, keep top 3
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

export default function SmartInsights({ events = [], clients = [], expenses = [], work = [], profile = {} }) {
  const { primaryHex } = useCategoryTheme();
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const insights = useMemo(() => {
    const fmt = (v) => isVisible ? formatCurrency(v) : '••••';
    return buildInsights({ events, clients, expenses, work, profile, fmt });
  }, [events, clients, expenses, work, profile, formatCurrency, isVisible]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Zap className="w-4 h-4 bp-text-primary" />
        <h3 className="text-sm font-semibold text-white">Insights Inteligentes</h3>
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">baseados nos seus dados</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map(insight => {
          const Icon = insight.icon;
          const isTheme = insight.themePrimary;
          return (
            <div
              key={insight.id}
              className={`rounded-xl border p-4 flex flex-col gap-2 ${isTheme ? '' : insight.bg}`}
              style={isTheme ? {
                backgroundColor: `${primaryHex}1a`,
                borderColor: `${primaryHex}33`,
              } : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-black/20">
                  <Icon
                    className={`w-4 h-4 ${isTheme ? '' : insight.color}`}
                    style={isTheme ? { color: primaryHex } : undefined}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{insight.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insight.description}</p>
                </div>
              </div>
              {insight.cta && insight.ctaAction && (
                <button
                  type="button"
                  onClick={insight.ctaAction}
                  className={`self-start text-[11px] font-medium ${insight.color} hover:opacity-80 transition-opacity mt-1`}
                >
                  {insight.cta} →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
