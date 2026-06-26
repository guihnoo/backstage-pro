import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { hardNavigate } from '@/lib/hardNavigate';
import {
  getEventCacheAmount,
  isReceivableEvent,
  calculateEventReceivableAmount,
} from '@/lib/eventFinance';
import { ExternalLink } from 'lucide-react';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useDailyWork } from '@/lib/useDailyWork';
import { useExpenses } from '@/lib/useExpenses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  FileText,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  XCircle,
  Activity,
  Receipt,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, startOfYear, endOfYear, addMonths, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import appToast from '@/lib/appToast';
import { getEventStatus } from '@/components/utils/dateUtils';

// Component imports — charts/map/modais em lazy para reduzir chunk inicial
import ReportEventList from '@/components/reports/ReportEventList';
import FinancialSummary from '@/components/reports/FinancialSummary';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/layout/EmptyState';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/authContext';
import { applyAuto12Hours } from '@/lib/applyAuto12Hours';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import LiveClockBar from '@/components/home/LiveClockBar';
import StatValuePulse from '@/components/home/StatValuePulse';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import EventHeading from '@/components/events/EventHeading';
import { enrichEventsWithClients, getClientDisplayName } from '@/lib/eventDisplay';
import { Ellipsis } from '@/components/ui/overflowText';
import { useConnectivity } from '@/lib/offline/useConnectivity';

const ReportsChart = lazy(() => import('@/components/reports/ReportsChart'));
const MonthlyTrend = lazy(() => import('@/components/reports/MonthlyTrend'));
const ClientDetailedTable = lazy(() => import('@/components/reports/ClientDetailedTable'));
const ExpenseAnalysis = lazy(() => import('@/components/reports/ExpenseAnalysis'));
const ExportManager = lazy(() => import('@/components/reports/ExportManager'));
const EventDetailModal = lazy(() => import('@/components/reports/EventDetailModal'));
const EventForm = lazy(() => import('@/components/calendar/EventForm'));
const ExpenseForm = lazy(() => import('@/components/expenses/ExpenseForm'));
const DailyWorkModal = lazy(() => import('@/components/calendar/DailyWorkModal'));
const ActivityHeatmap = lazy(() => import('@/components/reports/ActivityHeatmap'));
const SeasonalityChart = lazy(() => import('@/components/reports/SeasonalityChart'));
const WeekdayBreakdown = lazy(() => import('@/components/reports/WeekdayBreakdown'));
const NfTracker = lazy(() => import('@/components/reports/NfTracker'));
const WorkAnalytics = lazy(() => import('@/components/reports/WorkAnalytics'));
const CashflowForecast = lazy(() => import('@/components/reports/CashflowForecast'));
const CategoryBreakdown = lazy(() => import('@/components/reports/CategoryBreakdown'));
const TopClients = lazy(() => import('@/components/reports/TopClients'));
const ReceivablesAging = lazy(() => import('@/components/reports/ReceivablesAging'));
const SmartInsights = lazy(() => import('@/components/reports/SmartInsights'));
const YearOverYear = lazy(() => import('@/components/reports/YearOverYear'));
const CacheEvolutionChart = lazy(() => import('@/components/reports/CacheEvolutionChart'));
const IRSummary = lazy(() => import('@/components/reports/IRSummary'));
const BrazilVisitedMap = lazy(() => import('@/components/reports/BrazilVisitedMap'));

function ChartBlockSkeleton({ className = 'h-64' }) {
  return <Skeleton className={`w-full rounded-lg ${className}`} />;
}

const ReportsSkeleton = () => (
  <div className="p-4 md:p-6 space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
    <Skeleton className="h-96 rounded-lg" />
  </div>
);

// Seção colapsável — persiste estado aberto/fechado em localStorage
function ExpandableSection({ id, label, defaultOpen = false, children }) {
  const storageKey = id ? `backstage:report-section:${id}` : null;
  const [open, setOpen] = useState(() => {
    if (!storageKey) return defaultOpen;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? stored === 'true' : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const toggle = () => {
    setOpen(v => {
      const next = !v;
      if (storageKey) {
        try { localStorage.setItem(storageKey, String(next)); } catch (_e) { /* storage indisponível */ }
      }
      return next;
    });
  };

  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-300">{label}</span>
        <ChevronDown
          className="w-4 h-4 text-slate-500 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div className="p-4 space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}

// Period options for reports
const PERIOD_OPTIONS = [
  { value: 'this_week', label: 'Esta Semana' },
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Passado' },
  { value: 'last_3_months', label: 'Últimos 3 Meses' },
  { value: 'last_6_months', label: 'Últimos 6 Meses' },
  { value: 'this_year', label: 'Este Ano' },
  { value: 'all_time', label: 'Todo o Período' },
];

// Enhanced StatCard with comparison indicators
const StatCard = ({ title, value, pulseValue, pulseColor, subtitle, icon: Icon, color, trend, onClick, isClickable = true }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.change > 0) return <ArrowUp className="w-3 h-3 text-green-400" />;
    if (trend.change < 0) return <ArrowDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-slate-400';
    if (trend.change > 0) return 'text-green-400';
    if (trend.change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <Card
      className={`bg-slate-900/50 border-slate-800 transition-all min-w-0 overflow-hidden ${
        isClickable && onClick
          ? 'cursor-pointer hover:border-[color-mix(in_srgb,var(--bp-primary)_45%,transparent)] hover:shadow-[0_12px_40px_-12px_color-mix(in_srgb,var(--bp-primary)_35%,transparent)]'
          : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 relative">
        <Icon className={`w-10 h-10 absolute right-3 top-3 ${color} opacity-10`} />
        <div className="space-y-1 min-w-0 mb-3">
          <p className="text-sm font-medium text-slate-400 truncate">{title}</p>
          <StatValuePulse value={pulseValue ?? value} glowColor={pulseColor}>
            <p className={`text-lg font-bold font-mono truncate ${color}`} title={typeof value === 'string' ? value : undefined}>{value}</p>
          </StatValuePulse>
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          {subtitle && <p className="text-xs text-slate-500 truncate flex-1 min-w-0" title={subtitle}>{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(trend.change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {isClickable && onClick && (
          <div className="mt-2 text-xs bp-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Clique para ver detalhes →
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Modal para exibir detalhes dos KPIs
const KPIDetailModal = ({ isOpen, onClose, title, data, type: _type, onItemClick }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const getModalContent = () => {
    if (!data || data.length === 0) {
      return <p className="text-slate-400">Nenhum registro encontrado para este período.</p>;
    }

    return (
      <div className="space-y-4">
        {data.map((item, index) => {
          const isClickable = !!(item.event_ref || item.client_id);
          return (
            <div
              key={index}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => {
                if (item.event_ref) onItemClick?.(item.event_ref);
                else if (item.client_id) { onClose?.(); hardNavigate(`/client-detail?id=${item.client_id}`); }
              }}
              onKeyDown={isClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (item.event_ref) onItemClick?.(item.event_ref);
                  else if (item.client_id) { onClose?.(); hardNavigate(`/client-detail?id=${item.client_id}`); }
                }
              } : undefined}
              className={`flex items-center justify-between p-3 bg-slate-800/50 rounded-lg transition-colors gap-3 min-w-0 ${isClickable ? 'cursor-pointer hover:bg-slate-700/60' : ''}`}
            >
              <div className="min-w-0 flex-1">
                {item.event_ref ? (
                  <>
                    <EventHeading event={item.event_ref} client={item.client} size="sm" />
                    {item.subtitle && (
                      <p className="text-sm text-slate-400 truncate mt-0.5" title={item.subtitle}>{item.subtitle}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium text-white truncate" title={item.title}>{item.title}</p>
                    <p className="text-sm text-slate-400 truncate" title={item.subtitle}>{item.subtitle}</p>
                  </>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold ${item.value < 0 ? 'text-red-400' : 'text-green-400'}`}>{isVisible ? formatCurrency(item.value) : '••••'}</p>
                {item.date && <p className="text-xs text-slate-500">{item.date}</p>}
                {item.event_ref && <p className="text-[10px] text-slate-600 mt-0.5">Toque para detalhes</p>}
                {item.client_id && (
                  <p className="text-[10px] mt-0.5 flex items-center gap-0.5 justify-end bp-text-primary">
                    <ExternalLink className="w-2.5 h-2.5" /> Ver cliente
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden p-0 bp-focus-scope">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 min-w-0">
          <DialogTitle className="text-xl font-bold bp-text-primary min-w-0">
            <Ellipsis>{title}</Ellipsis>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Detalhamento dos registros que compõem esta métrica
          </DialogDescription>
        </DialogHeader>
        <div className="bp-modal-scroll px-6 pb-6">{getModalContent()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default function ReportsPage() {
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents, delete: deleteEvent } = useEvents();
  const { clients, loading: clientsLoading, error: clientsError, refetch: refetchClients } = useClients();
  const { dailyWork, loading: dailyWorkLoading, error: dailyWorkError, refetch: refetchDailyWork, delete: deleteWork } = useDailyWork();
  const { expenses, loading: expensesLoading, error: expensesError, refetch: refetchExpenses, delete: deleteExpense } = useExpenses();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { profile, user } = useAuth();
  const { offline } = useConnectivity();
  const config = getCategoryConfig(profile?.category || 'lighting');

  const data = useMemo(() => {
    const clientList = clients || [];
    return {
      events: enrichEventsWithClients(events || [], clientList),
      clients: clientList,
      dailyWork: dailyWork || [],
      expenses: expenses || [],
    };
  }, [events, clients, dailyWork, expenses]);

  const loading = useMemo(
    () => ({
      events: eventsLoading,
      clients: clientsLoading,
      dailyWork: dailyWorkLoading,
      expenses: expensesLoading,
    }),
    [eventsLoading, clientsLoading, dailyWorkLoading, expensesLoading]
  );

  const error = useMemo(
    () => ({
      events: eventsError,
      clients: clientsError,
      dailyWork: dailyWorkError,
      expenses: expensesError,
    }),
    [eventsError, clientsError, dailyWorkError, expensesError]
  );

  const refreshData = useCallback(async ({ silent = false } = {}) => {
    const opts = { silent };
    await Promise.all([
      refetchEvents(opts),
      refetchClients(opts),
      refetchDailyWork(opts),
      refetchExpenses(opts),
    ]);
  }, [refetchEvents, refetchClients, refetchDailyWork, refetchExpenses]);

  const pullRefreshReports = useCallback(async () => {
    await refreshData({ silent: true });
    appToast.success('Relatórios atualizados');
  }, [refreshData]);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(pullRefreshReports);

  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedView, setSelectedView] = useState('overview');
  const [showProjection, setShowProjection] = useState(false);
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalType, setModalType] = useState('');
  const [chartFilter, setChartFilter] = useState(null);

  // State para o EventDetailModal e formulários de edição
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null);
  const [confirmDeleteWork, setConfirmDeleteWork] = useState(null);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [editingWorkEntry, setEditingWorkEntry] = useState(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState(null);

  const eventsReady = !loading.events;
  const isDataReady = eventsReady && !loading.clients && !loading.dailyWork && !loading.expenses;
  const hasError = error.events || error.clients || error.dailyWork || error.expenses;
  const hasCachedData = (events?.length ?? 0) > 0 || (clients?.length ?? 0) > 0;
  const showBlockingError = hasError && !offline && !hasCachedData;

  // Calculate date ranges for current and previous periods
  const { currentRange, previousRange, nextRange } = useMemo(() => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd, nextStart, nextEnd;

    switch (selectedPeriod) {
      case 'this_week': {
        const weekOpts = { weekStartsOn: 0 }; // domingo
        currentStart = startOfWeek(now, weekOpts);
        currentEnd = endOfWeek(now, weekOpts);
        previousStart = startOfWeek(subWeeks(now, 1), weekOpts);
        previousEnd = endOfWeek(subWeeks(now, 1), weekOpts);
        nextStart = startOfWeek(addWeeks(now, 1), weekOpts);
        nextEnd = endOfWeek(addWeeks(now, 1), weekOpts);
        break;
      }
      case 'this_month':
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
        nextStart = startOfMonth(addMonths(now, 1));
        nextEnd = endOfMonth(addMonths(now, 1));
        break;
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        currentStart = startOfMonth(lastMonth);
        currentEnd = endOfMonth(lastMonth);
        previousStart = startOfMonth(subMonths(now, 2));
        previousEnd = endOfMonth(subMonths(now, 2));
        nextStart = startOfMonth(now);
        nextEnd = endOfMonth(now);
        break;
      }
      case 'last_3_months':
        currentStart = startOfMonth(subMonths(now, 2));
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 5));
        previousEnd = endOfMonth(subMonths(now, 3));
        nextStart = startOfMonth(addMonths(now, 1));
        nextEnd = endOfMonth(addMonths(now, 3));
        break;
      case 'last_6_months':
        currentStart = startOfMonth(subMonths(now, 5));
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 11));
        previousEnd = endOfMonth(subMonths(now, 6));
        nextStart = startOfMonth(addMonths(now, 1));
        nextEnd = endOfMonth(addMonths(now, 6));
        break;
      case 'this_year':
        currentStart = startOfYear(now);
        currentEnd = endOfYear(now);
        previousStart = startOfYear(subMonths(now, 12));
        previousEnd = endOfYear(subMonths(now, 12));
        nextStart = startOfYear(addMonths(now, 12));
        nextEnd = endOfYear(addMonths(now, 12));
        break;
      case 'all_time':
      default:
        currentStart = null;
        currentEnd = null;
        previousStart = null;
        previousEnd = null;
        nextStart = null;
        nextEnd = null;
        break;
    }

    return {
      currentRange: { start: currentStart, end: currentEnd },
      previousRange: { start: previousStart, end: previousEnd },
      nextRange: { start: nextStart, end: nextEnd }
    };
  }, [selectedPeriod]);

  // **LÓGICA REVISADA**: Faturamento baseado na data de pagamento
  const processedData = useMemo(() => {
    const { events = [], dailyWork = [], expenses = [], clients = [] } = data;

    // APLICAR STATUS CORRETO A TODOS OS EVENTOS ANTES DE PROCESSAR
    const eventsWithCorrectStatus = events.map((event) => ({
      ...event,
      calculatedStatus: getEventStatus(event)
    }));

    // Função auxiliar para verificar se uma data está no intervalo
    const isInRange = (dateStr, range) => {
      if (!range.start || !range.end || !dateStr) return selectedPeriod === 'all_time';
      try {
        const date = parseISO(dateStr);
        return isWithinInterval(date, { start: range.start, end: range.end });
      } catch (error) {
        console.warn('Erro ao parsear data:', dateStr, error);
        return false;
      }
    };

    const calculateRealEventValue = (event) => {
      if (event.payment_status === 'paid' && event.paid_amount > 0) return event.paid_amount;

      const eventDailyWork = dailyWork.filter((work) => work.event_id === event.id);
      if (eventDailyWork.length > 0) {
        const totalFromWork = eventDailyWork.reduce((sum, work) => sum + (work.daily_cache || 0), 0);
        if (totalFromWork > 0) return totalFromWork;
      }

      return getEventCacheAmount(event);
    };

    // Processar dados do período atual
    const processForPeriod = (range) => {
      // **MUDANÇA CRÍTICA**: Faturamento baseado em paid_date, não em start_date
      const paidEventsInPeriod = eventsWithCorrectStatus.filter((e) =>
        e.payment_status === 'paid' &&
        e.paid_date &&
        isInRange(e.paid_date, range)
      );

      // Eventos do período para outras métricas (baseado em start_date)
      const periodEvents = eventsWithCorrectStatus.filter((e) => e.start_date && isInRange(e.start_date, range));
      const periodWork = dailyWork.filter((w) => w.date && isInRange(w.date, range));
      const periodExpenses = expenses.filter((e) => {
        const expenseDate = e.expense_date || e.date;
        return expenseDate && isInRange(expenseDate, range);
      });

      const realizedRevenue = paidEventsInPeriod.reduce((sum, e) => sum + (e.paid_amount || calculateRealEventValue(e)), 0);

      const receivableRevenue = eventsWithCorrectStatus
        .filter(isReceivableEvent)
        .reduce((sum, e) => {
          const eventDailyWork = dailyWork.filter((work) => work.event_id === e.id);
          return sum + calculateEventReceivableAmount(e, eventDailyWork);
        }, 0);

      const projectedRevenue = eventsWithCorrectStatus.
        filter((e) => e.calculatedStatus === 'scheduled').
        reduce((sum, e) => sum + calculateRealEventValue(e), 0);

      // Total de despesas
      const totalExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // Receita total (realizada + a receber)
      const totalRevenue = realizedRevenue + receivableRevenue;

      // Lucro líquido
      const netProfit = totalRevenue - totalExpenses;

      // Horas trabalhadas
      const totalHours = periodWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);

      // Clientes ativos no período
      const activeClientIds = new Set(periodEvents.map((e) => e.client_id));

      // Cliente com maior faturamento no período (baseado em pagamentos)
      const clientRevenueMap = {};
      paidEventsInPeriod.forEach((event) => {
        if (event.client_id) {
          clientRevenueMap[event.client_id] = (clientRevenueMap[event.client_id] || 0) + (event.paid_amount || calculateRealEventValue(event));
        }
      });

      const topClientId = Object.keys(clientRevenueMap).reduce((a, b) =>
        clientRevenueMap[a] > clientRevenueMap[b] ? a : b, null);
      const topClient = topClientId ? clients.find((c) => c.id === topClientId) : null;

      return {
        totalRevenue,
        realizedRevenue,
        receivableRevenue,
        projectedRevenue,
        totalExpenses,
        netProfit,
        totalHours,
        activeClientsCount: activeClientIds.size,
        topClient,
        completedEventsCount: periodEvents.filter((e) => e.calculatedStatus === 'completed').length,
        scheduledEventsCount: periodEvents.filter((e) => e.calculatedStatus === 'scheduled').length,
        inProgressEventsCount: periodEvents.filter((e) => e.calculatedStatus === 'in_progress').length,
        events: periodEvents,
        paidEvents: paidEventsInPeriod, // Eventos pagos no período
        work: periodWork,
        expenses: periodExpenses
      };
    };

    const currentData = processForPeriod(currentRange);
    const previousData = processForPeriod(previousRange);
    const nextData = processForPeriod(nextRange);

    // Calcular tendências (comparação com período anterior)
    const calculateTrend = (current, previous) => {
      if (previous === 0) return { change: current > 0 ? 100 : 0 };
      return { change: (current - previous) / previous * 100 };
    };

    return {
      current: currentData,
      previous: previousData,
      next: nextData,
      trends: {
        revenue: calculateTrend(currentData.totalRevenue, previousData.totalRevenue),
        receivable: calculateTrend(currentData.receivableRevenue, previousData.receivableRevenue),
        profit: calculateTrend(currentData.netProfit, previousData.netProfit),
        clients: calculateTrend(currentData.activeClientsCount, previousData.activeClientsCount)
      },
      // Dados para componentes filhos
      chartInput: {
        realized: currentData.paidEvents.map((e) => ({ ...e, calculated_value: e.paid_amount || calculateRealEventValue(e) })),
        receivable: eventsWithCorrectStatus.filter(isReceivableEvent).map((e) => {
          const eventDailyWork = dailyWork.filter((work) => work.event_id === e.id);
          return { ...e, calculated_value: calculateEventReceivableAmount(e, eventDailyWork) };
        }),
        projected: eventsWithCorrectStatus.filter((e) => e.calculatedStatus === 'scheduled').map((e) => ({ ...e, calculated_value: calculateRealEventValue(e) })),
        expenses: currentData.expenses
      }
    };
  }, [data, currentRange, previousRange, nextRange, selectedPeriod]);

  // Handlers para KPIs clicáveis
  const handleKPIClick = useCallback((type) => {
    const { current } = processedData;

    switch (type) {
      case 'faturamento':
        setModalTitle('Faturamento Realizado');
        setModalData(current.paidEvents.map((event) => {
          const client = data.clients.find((c) => c.id === event.client_id);
          const paidDateStr = event.paid_date
            ? format(parseISO(event.paid_date), 'dd/MM/yyyy')
            : 'Data não registrada';
          return {
            title: event.title,
            subtitle: paidDateStr,
            value: event.paid_amount,
            date: paidDateStr,
            event_ref: event,
            client,
          };
        }));
        break;
      case 'a_receber': {
        setModalTitle('Valores a Receber');
        const receivableEvents = data.events.filter(isReceivableEvent);
        setModalData(receivableEvents.map((event) => {
          const client = data.clients.find((c) => c.id === event.client_id);
          const eventDailyWork = data.dailyWork.filter((w) => w.event_id === event.id);
          const endLabel = (event.end_date || event.start_date)
            ? format(parseISO(event.end_date || event.start_date), 'dd/MM/yyyy')
            : '--';
          return {
            title: event.title,
            subtitle: `Concluído em ${endLabel}`,
            value: calculateEventReceivableAmount(event, eventDailyWork),
            event_ref: event,
            client,
          };
        }));
        break;
      }
      case 'lucro':
        setModalTitle('Composição do Lucro Líquido');
        setModalData([
          { title: 'Receita Total', subtitle: 'Faturamento + A Receber', value: current.totalRevenue },
          { title: 'Despesas Totais', subtitle: 'Gastos do período', value: -current.totalExpenses },
          { title: 'Lucro Líquido', subtitle: 'Receita - Despesas', value: current.netProfit }]
        );
        break;
      case 'clientes': {
        setModalTitle('Clientes Ativos');
        const activeClients = [...new Set(current.events.map((e) => e.client_id))].
          map((clientId) => data.clients.find((c) => c.id === clientId)).
          filter(Boolean);
        setModalData(activeClients.map((client) => ({
          title: getClientDisplayName(client) || client.name || 'Cliente',
          subtitle: `${current.events.filter((e) => e.client_id === client.id).length} eventos no período`,
          value: current.paidEvents.filter((e) => e.client_id === client.id).reduce((sum, e) => sum + (e.paid_amount || 0), 0),
          client_id: client.id,
        })));
        break;
      }
      default:
        return;
    }

    setModalType(type);
    setModalOpen(true);
  }, [processedData, data]);

  // Handler para o clique no gráfico
  const handleChartClick = useCallback((payload) => {
    if (payload && payload.date) {
      setChartFilter({ date: payload.date, view: payload.view });
    }
  }, []);

  const clearChartFilter = () => {
    setChartFilter(null);
  };

  // Clientes presentes nos eventos do período atual
  const clientsInPeriod = useMemo(() => {
    const clientIds = new Set(processedData.current.events.map((e) => e.client_id).filter(Boolean));
    return data.clients.filter((c) => clientIds.has(c.id));
  }, [processedData, data.clients]);

  // Eventos do período filtrados por cliente (se houver filtro ativo)
  const clientFilteredEvents = useMemo(() => {
    if (!selectedClientFilter) return processedData.current.events;
    return processedData.current.events.filter((e) => e.client_id === selectedClientFilter);
  }, [processedData, selectedClientFilter]);

  // Memo para filtrar a lista de eventos com base no clique do gráfico
  const filteredEventList = useMemo(() => {
    if (!chartFilter || !chartFilter.date) {
      return clientFilteredEvents;
    }

    return clientFilteredEvents.filter(event => {
      const eventStartDate = event.start_date ? event.start_date.split('T')[0] : null;
      const eventPaidDate = event.paid_date ? event.paid_date.split('T')[0] : null;

      const chartView = chartFilter.view;

      if (chartView === 'realized' || chartView === 'overview_receita') {
        return eventPaidDate === chartFilter.date;
      }
      if (chartView === 'receivable') {
        // A receber é baseado na data de finalização do evento
        const eventEndDate = event.end_date ? event.end_date.split('T')[0] : null;
        return eventEndDate === chartFilter.date && isReceivableEvent(event);
      }
      if (chartView === 'projected') {
        return eventStartDate === chartFilter.date && getEventStatus(event) === 'scheduled';
      }

      // Fallback para despesas no modo geral e outras visualizações
      return eventStartDate === chartFilter.date;
    });
  }, [clientFilteredEvents, chartFilter]);

  // Handlers para o EventDetailModal
  const handleEventEdit = () => {
    setEditingEvent(selectedEvent);
    setSelectedEvent(null);
  };

  const handleEventDuplicate = (event) => {
    setSelectedEvent(null);
    setEditingEvent({
      ...event,
      id: undefined,
      title: `Cópia — ${event.title}`,
      start_date: '',
      end_date: '',
      payment_status: 'unpaid',
      auto_hours_applied: false,
    });
    appToast.info('Preencha as novas datas para o evento duplicado');
  };

  const handleEventDelete = (eventId) => {
    setConfirmDeleteEvent(eventId);
  };

  const handleConfirmEventDelete = async () => {
    try {
      await deleteEvent(confirmDeleteEvent);
      appToast.success('Evento excluído com sucesso!');
      setSelectedEvent(null);
      refreshData();
    } catch (_e) {
      appToast.error('Erro ao excluir evento');
    } finally {
      setConfirmDeleteEvent(null);
    }
  };

  const handleWorkEdit = (work) => {
    if (!work || !selectedEvent) return;
    setEditingWorkEntry(work);
    setShowWorkModal(true);
  };

  const handleWorkDelete = (workId) => {
    setConfirmDeleteWork(workId);
  };

  const handleConfirmWorkDelete = async () => {
    try {
      await deleteWork(confirmDeleteWork);
      appToast.success('Registro de trabalho excluído!');
      refreshData();
    } catch (_e) {
      appToast.error('Erro ao excluir registro');
    } finally {
      setConfirmDeleteWork(null);
    }
  };

  const handleExpenseEdit = (expense) => {
    setEditingExpense(expense);
  };

  const handleExpenseDelete = (expenseId) => {
    setConfirmDeleteExpense(expenseId);
  };

  const handleConfirmExpenseDelete = async () => {
    try {
      await deleteExpense(confirmDeleteExpense);
      appToast.success('Despesa excluída!');
      refreshData();
    } catch (_e) {
      appToast.error('Erro ao excluir despesa');
    } finally {
      setConfirmDeleteExpense(null);
    }
  };

  const handleApply12h = useCallback(
    async (event) => {
      if (!event?.id || !user?.id) {
        appToast.error('Não foi possível aplicar 12h automáticas.');
        return;
      }
      try {
        const result = await applyAuto12Hours({
          eventId: event.id,
          userId: user.id,
          origin: 'manual_12h',
        });
        if (result.data?.success) {
          appToast.success('12 horas aplicadas automaticamente!', {
            description: `${result.data.daysCreated || 1} dia(s) registrado(s).`,
          });
          setSelectedEvent(null);
          await refreshData();
        } else {
          appToast.error('Erro ao aplicar horas', {
            description: result.data?.error || 'Tente novamente.',
          });
        }
      } catch (error) {
        console.error('Erro ao aplicar 12h:', error);
        appToast.error('Erro ao aplicar horas automáticas', {
          description: error.message || 'Tente novamente.',
        });
      }
    },
    [user?.id, refreshData]
  );

  const handleClientDetail = (clientId) => {
    hardNavigate(`/client-detail?id=${clientId}`);
  };

  if (!eventsReady) {
    return <ReportsSkeleton />;
  }

  if (showBlockingError) {
    return (
      <div className="h-[60vh] flex items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao Carregar Dados"
          description="Não foi possível carregar os dados para o relatório."
          action={() => refreshData()}
          actionLabel="Tentar Novamente"
        />
      </div>
    );
  }

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="pb-24">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        primaryHex={config.primaryHex}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="p-4 md:p-6 space-y-8 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white font-display">Relatórios</h1>
            <p className="text-slate-400">Análise completa do seu desempenho financeiro e operacional.</p>
          </div>

          <div className="flex items-center gap-3">
            <LiveClockBar primaryHex={config.primaryHex} />
            <Suspense fallback={<Skeleton className="h-9 w-28 rounded-lg shrink-0" />}>
              <ExportManager
                data={{
                  events: processedData.current.events,
                  work: processedData.current.work,
                  expenses: processedData.current.expenses,
                  clients: data.clients
                }}
                period={currentRange}
              />
            </Suspense>
          </div>
        </div>

        {hasError && (
          <Alert className="border-red-500/40 bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              <strong>Erro ao sincronizar:</strong>{' '}
              {[error.events, error.clients, error.dailyWork, error.expenses].filter(Boolean).join(' · ')}
              {hasCachedData && ' — exibindo dados em cache.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Filtro de período — chips scrolláveis */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none -mt-4">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedPeriod(opt.value)}
              className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${selectedPeriod === opt.value ? 'bp-chip-active' : 'border-slate-700/50 bg-slate-800/40 text-slate-500 hover:text-slate-300'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filtro por cliente — só exibe quando há mais de 1 cliente no período */}
        {clientsInPeriod.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none -mt-4">
            <button
              type="button"
              onClick={() => setSelectedClientFilter(null)}
              className={`flex-shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-all ${!selectedClientFilter ? 'bp-chip-active' : 'border-slate-700/50 bg-slate-800/40 text-slate-500 hover:text-slate-300'}`}
            >
              Todos
            </button>
            {clientsInPeriod.map(client => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedClientFilter(client.id === selectedClientFilter ? null : client.id)}
                className={`flex-shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-all max-w-[140px] truncate ${selectedClientFilter === client.id ? 'bp-chip-active' : 'border-slate-700/50 bg-slate-800/40 text-slate-500 hover:text-slate-300'}`}
              >
                {getClientDisplayName(client) || client.name}
              </button>
            ))}
          </div>
        )}

        <Suspense fallback={<ChartBlockSkeleton className="h-48" />}>
          <BrazilVisitedMap events={data.events} clients={data.clients} />
        </Suspense>

        {!isDataReady ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : (
        <>
        {/* Enhanced KPI Cards with Click Handlers — após clientes/despesas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 group">
          <StatCard
            title="Faturamento"
            value={isVisible ? formatCurrency(processedData.current.realizedRevenue) : '•••••'}
            pulseValue={processedData.current.realizedRevenue}
            pulseColor="#39FF14"
            subtitle={`${processedData.current.paidEvents.length} pagamentos recebidos`}
            icon={DollarSign}
            color="text-green-400"
            trend={processedData.trends.revenue}
            onClick={() => handleKPIClick('faturamento')} />

          <StatCard
            title="A Receber"
            value={isVisible ? formatCurrency(processedData.current.receivableRevenue) : '•••••'}
            pulseValue={processedData.current.receivableRevenue}
            pulseColor={config.accentHex}
            subtitle={`${data.events?.filter(isReceivableEvent).length || 0} pendentes`}
            icon={Clock}
            color="text-amber-400"
            trend={processedData.trends.receivable}
            onClick={() => handleKPIClick('a_receber')} />

          <StatCard
            title="Lucro Líquido"
            value={isVisible ? formatCurrency(processedData.current.netProfit) : '•••••'}
            pulseValue={processedData.current.netProfit}
            pulseColor={processedData.current.netProfit >= 0 ? '#39FF14' : '#FF4444'}
            subtitle="Receita - Despesas"
            icon={TrendingUp}
            color={processedData.current.netProfit >= 0 ? "text-green-400" : "text-red-400"}
            trend={processedData.trends.profit}
            onClick={() => handleKPIClick('lucro')} />

          <StatCard
            title="Clientes Ativos"
            value={processedData.current.activeClientsCount}
            pulseValue={processedData.current.activeClientsCount}
            pulseColor={config.primaryHex}
            subtitle={processedData.current.topClient ? `Top: ${processedData.current.topClient.name}` : 'Nenhum cliente'}
            icon={Users}
            color="bp-text-primary"
            trend={processedData.trends.clients}
            onClick={() => handleKPIClick('clientes')} />

        </div>

        {/* Projeção para o Próximo Período */}
        {processedData.next.projectedRevenue > 0 &&
          <Card
            className="cursor-pointer transition-all border"
            style={{
              background: `linear-gradient(to right, ${config.primaryHex}22, ${config.accentHex}18)`,
              borderColor: `${config.primaryHex}44`,
            }}
            onClick={() => setShowProjection(true)}>

            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold bp-text-primary mb-1">Projeção do Próximo Período</h3>
                  <StatValuePulse value={processedData.next.projectedRevenue} glowColor={config.primaryHex}>
                    <p className="text-3xl font-bold text-white">
                      {isVisible ? formatCurrency(processedData.next.projectedRevenue) : '•••••'}
                    </p>
                  </StatValuePulse>
                  <p className="text-sm text-slate-400 mt-1">
                    {processedData.next.scheduledEventsCount} eventos agendados
                  </p>
                </div>
                <BarChart3 className="w-12 h-12 bp-text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>
        }

        {/* View Selector */}
        <div className="relative border-b border-slate-800">
          <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-none">
            {[
              { id: 'overview', label: 'Visão Geral', short: 'Geral', icon: BarChart3, count: null },
              { id: 'clients', label: 'Clientes', short: 'Clientes', icon: Users, count: data.clients.length },
              { id: 'expenses', label: 'Despesas', short: 'Despesas', icon: DollarSign, count: processedData.current.expenses.length },
              { id: 'work', label: 'Trabalho', short: 'Trabalho', icon: Briefcase, count: processedData.current.work.length || null },
              { id: 'activity', label: 'Atividade', short: 'Ativ.', icon: Activity, count: null },
              {
                id: 'fiscal', label: 'Fiscal', short: 'Fiscal', icon: Receipt,
                count: data.events.filter(e => e.status !== 'cancelled' && !e.nf_number && (Number(e.paid_amount) > 0 || Number(e.estimated_revenue) > 0 || Number(e.actual_revenue) > 0)).length || null,
              },
            ].map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setSelectedView(view.id)}
                className={`flex items-center gap-1.5 h-9 px-2.5 flex-shrink-0 rounded-t-lg text-sm font-medium transition-all ${
                  selectedView === view.id
                    ? 'text-white border-b-2'
                    : 'text-slate-400 hover:text-white border-b-2 border-transparent'
                }`}
                style={selectedView === view.id ? { borderBottomColor: config.primaryHex, color: config.primaryHex } : undefined}
              >
                <view.icon className="w-4 h-4 shrink-0" />
                <span className="hidden min-[440px]:inline">{view.label}</span>
                <span className="min-[440px]:hidden">{view.short}</span>
                {view.count != null && view.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedView === view.id ? 'bp-chip-badge-active' : 'bg-slate-700/50 text-slate-500'}`}>
                    {view.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* fade direita indica scroll horizontal */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#050609] to-transparent min-[440px]:hidden" />
        </div>

        {/* Content based on selected view */}
        {selectedView === 'overview' && (
          <div className="space-y-4">
            <Suspense fallback={<ChartBlockSkeleton className="h-24" />}>
              <SmartInsights
                events={data.events}
                clients={data.clients}
                expenses={data.expenses}
                work={data.dailyWork}
                profile={profile}
              />
            </Suspense>
            <Suspense fallback={<ChartBlockSkeleton className="h-40" />}>
              <ReceivablesAging
                events={data.events}
                clients={data.clients}
                work={data.dailyWork}
              />
            </Suspense>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartBlockSkeleton />}>
                <ReportsChart
                  chartInput={processedData.chartInput}
                  period={selectedPeriod}
                  onDataClick={handleChartClick}
                />
              </Suspense>
              <FinancialSummary stats={processedData.current} />
            </div>
            <Suspense fallback={<ChartBlockSkeleton className="h-56" />}>
              <MonthlyTrend
                events={data.events}
                goalRevenue={Number(profile?.monthly_goal_revenue) || 0}
              />
            </Suspense>

            {/* Seções secundárias colapsáveis */}
            <ExpandableSection id="yoy" label="Comparativo Ano a Ano">
              <Suspense fallback={<ChartBlockSkeleton className="h-48" />}>
                <YearOverYear events={data.events} clients={data.clients} />
              </Suspense>
            </ExpandableSection>

            <ExpandableSection id="cashflow-category" label="Previsão de Caixa & Categorias">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<ChartBlockSkeleton />}>
                  <CashflowForecast
                    events={data.events}
                    work={data.dailyWork}
                    clients={data.clients}
                  />
                </Suspense>
                <Suspense fallback={<ChartBlockSkeleton />}>
                  <CategoryBreakdown
                    events={processedData.current.events}
                    work={processedData.current.work}
                  />
                </Suspense>
              </div>
            </ExpandableSection>

            <ExpandableSection id="top-clients" label="Top Clientes">
              <Suspense fallback={<ChartBlockSkeleton className="h-48" />}>
                <TopClients
                  events={processedData.current.events}
                  clients={data.clients}
                />
              </Suspense>
            </ExpandableSection>
          </div>
        )}

        {selectedView === 'clients' && (
          <Suspense fallback={<ChartBlockSkeleton className="h-96" />}>
            <ClientDetailedTable
              data={{
                clients: data.clients,
                events: processedData.current.events,
                work: processedData.current.work,
                expenses: processedData.current.expenses
              }}
              onClientClick={handleClientDetail}
            />
          </Suspense>
        )}

        {selectedView === 'expenses' &&
          <Suspense fallback={<ChartBlockSkeleton className="h-80" />}>
            <ExpenseAnalysis
              expenses={processedData.current.expenses}
              period={selectedPeriod}
              onSliceClick={(category) => {
                appToast.info(`Visualizando despesas da categoria: ${category}`);
              }}
            />
          </Suspense>
        }

        {selectedView === 'work' && (
          <Suspense fallback={<ChartBlockSkeleton className="h-80" />}>
            <WorkAnalytics
              work={processedData.current.work}
              events={data.events}
              clients={data.clients}
            />
          </Suspense>
        )}

        {selectedView === 'activity' && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <Suspense fallback={<ChartBlockSkeleton className="h-32" />}>
                <ActivityHeatmap events={data.events} />
              </Suspense>
            </div>
            <Suspense fallback={<ChartBlockSkeleton className="h-64" />}>
              <CacheEvolutionChart events={data.events} />
            </Suspense>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartBlockSkeleton />}>
                <SeasonalityChart events={data.events} />
              </Suspense>
              <Suspense fallback={<ChartBlockSkeleton />}>
                <WeekdayBreakdown events={data.events} />
              </Suspense>
            </div>
          </div>
        )}

        {selectedView === 'fiscal' && (
          <div>
            <Suspense fallback={<ChartBlockSkeleton className="h-48" />}>
              <NfTracker
                events={data.events}
                clients={data.clients}
                onOpenEvent={(ev) => setSelectedEvent(ev)}
              />
            </Suspense>
            <Suspense fallback={<ChartBlockSkeleton className="h-64" />}>
              <IRSummary
                events={data.events}
                expenses={data.expenses}
                work={data.dailyWork}
              />
            </Suspense>
          </div>
        )}

        {/* Events List - AGORA FILTRÁVEL e com MODAL */}
        <div className="space-y-2">
          {chartFilter && (
            <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg gap-2 min-w-0">
              <p className="text-sm bp-text-primary truncate min-w-0 flex-1">
                Filtro ativo: Mostrando eventos para <strong>{chartFilter.date ? format(parseISO(chartFilter.date), 'dd/MM/yyyy') : '--'}</strong>
              </p>
              <Button variant="ghost" size="sm" onClick={clearChartFilter} className="text-slate-400 hover:text-white">
                <XCircle className="w-4 h-4 mr-2" />
                Limpar Filtro
              </Button>
            </div>
          )}
          <ReportEventList
            events={filteredEventList} // USANDO A LISTA FILTRADA
            clients={data.clients}
            dailyWork={data.dailyWork} // Passando todo o dailyWork
            title={`Eventos do Período (${filteredEventList.length})`}
            onEventClick={(event) => setSelectedEvent(event)} // NOVO: handler para abrir modal
          />
        </div>

        {/* Empty State */}
        {processedData.current.events.length === 0 && !chartFilter &&
          <EmptyState
            icon={FileText}
            title="Nenhum dado encontrado"
            description="Não há eventos registrados para o período selecionado." />

        }
        {processedData.current.events.length > 0 && chartFilter && filteredEventList.length === 0 &&
          <EmptyState
            icon={FileText}
            title="Nenhum evento encontrado para o filtro"
            description="Não há eventos correspondentes à data selecionada no gráfico." />

        }
        </>
        )}
      </motion.div>

      {/* Modal de detalhes dos KPIs */}
      <KPIDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        data={modalData}
        type={modalType}
        onItemClick={(ev) => { setModalOpen(false); setSelectedEvent(ev); }} />

      {/* Modal de detalhes do evento */}
      {selectedEvent && (
        <Suspense fallback={null}>
          <EventDetailModal
            event={selectedEvent}
            client={data.clients.find(c => c.id === selectedEvent.client_id)}
            dailyWork={data.dailyWork.filter(w => w.event_id === selectedEvent.id)}
            expenses={data.expenses.filter(e => e.event_id === selectedEvent.id)}
            onClose={() => setSelectedEvent(null)}
            onEdit={handleEventEdit}
            onDelete={handleEventDelete}
            onDuplicate={handleEventDuplicate}
            onPaymentUpdate={() => refreshData({ silent: true })}
            onWorkEdit={handleWorkEdit}
            onWorkDelete={handleWorkDelete}
            onExpenseEdit={handleExpenseEdit}
            onExpenseDelete={handleExpenseDelete}
            onApply12h={handleApply12h}
          />
        </Suspense>
      )}

      {showWorkModal && selectedEvent && (
        <Suspense fallback={null}>
          <DailyWorkModal
            isOpen={showWorkModal}
            onClose={() => {
              setShowWorkModal(false);
              setEditingWorkEntry(null);
            }}
            date={
              editingWorkEntry?.date || editingWorkEntry?.work_date
                ? new Date(`${(editingWorkEntry.date || editingWorkEntry.work_date).slice(0, 10)}T00:00:00`)
                : new Date()
            }
            event={selectedEvent}
            existingWork={editingWorkEntry}
            onSuccess={() => {
              setShowWorkModal(false);
              setEditingWorkEntry(null);
              refreshData({ silent: true });
            }}
          />
        </Suspense>
      )}

      {/* Form de edição de evento */}
      {editingEvent && (
        <Suspense fallback={null}>
          <EventForm
            isOpen={!!editingEvent}
            onClose={() => setEditingEvent(null)}
            event={editingEvent}
            clients={data.clients}
            onSuccess={() => { setEditingEvent(null); refreshData({ silent: true }); }}
          />
        </Suspense>
      )}

      {/* Form de edição de despesa */}
      {editingExpense && (
        <Suspense fallback={null}>
          <ExpenseForm
            open={!!editingExpense}
            onOpenChange={(open) => { if (!open) setEditingExpense(null); }}
            expense={editingExpense}
            events={data.events}
            onSuccess={() => { setEditingExpense(null); refreshData({ silent: true }); }}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={!!confirmDeleteEvent}
        onOpenChange={(open) => !open && setConfirmDeleteEvent(null)}
        title="Excluir evento?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmEventDelete}
      />
      <ConfirmDialog
        open={!!confirmDeleteWork}
        onOpenChange={(open) => !open && setConfirmDeleteWork(null)}
        title="Excluir registro de trabalho?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmWorkDelete}
      />
      <ConfirmDialog
        open={!!confirmDeleteExpense}
        onOpenChange={(open) => !open && setConfirmDeleteExpense(null)}
        title="Excluir despesa?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmExpenseDelete}
      />

      {/* Modal de Projeção do Próximo Período */}
      <Dialog open={showProjection} onOpenChange={setShowProjection}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white w-full max-w-lg h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85dvh] flex flex-col overflow-hidden p-0 bp-focus-scope sm:rounded-lg">
          <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
            <DialogTitle className="text-lg font-bold bp-text-primary">
              Projeção — Próximo Período
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Eventos confirmados ainda não realizados
            </DialogDescription>
          </DialogHeader>
          <div className="bp-modal-scroll px-6 pb-6 space-y-4">
            {/* Total projetado */}
            <div className="flex items-center justify-between p-4 rounded-xl border bp-surface-primary">
              <div>
                <p className="text-xs bp-text-primary uppercase tracking-wider font-mono mb-0.5">Total projetado</p>
                <p className="text-2xl font-black text-white">
                  {isVisible ? formatCurrency(processedData.next.projectedRevenue) : '•••••'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{processedData.next.scheduledEventsCount} evento{processedData.next.scheduledEventsCount !== 1 ? 's' : ''}</p>
                {processedData.current.realizedRevenue > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    vs {isVisible ? formatCurrency(processedData.current.realizedRevenue) : '•••'} atual
                  </p>
                )}
              </div>
            </div>

            {/* Lista de eventos */}
            {processedData.next.events
              .filter(e => e.calculatedStatus === 'scheduled' || e.calculatedStatus === 'confirmed')
              .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
              .map(event => {
                const client = data.clients.find(c => c.id === event.client_id);
                const value = getEventCacheAmount(event);
                const dateStr = event.start_date
                  ? new Date(event.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : '—';
                return (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0 cursor-pointer hover:bg-slate-800/30 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => { setShowProjection(false); setSelectedEvent(event); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowProjection(false); setSelectedEvent(event); } }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-400">
                      {dateStr.split(' ')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <EventHeading event={event} client={client} size="sm" />
                      <p className="text-xs text-slate-500 truncate mt-0.5">{dateStr}</p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: config.primaryHex }}>
                      {isVisible ? formatCurrency(value) : '•••'}
                    </p>
                  </div>
                );
              })
            }
            {processedData.next.scheduledEventsCount === 0 && (
              <p className="text-center text-slate-500 text-sm py-6">Nenhum evento agendado para o próximo período.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </NeonPageShell>
  );
}


