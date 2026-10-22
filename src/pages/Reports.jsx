import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  lazy,
  Suspense,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { isReceivableEvent, calculateEventReceivableAmount } from '@/lib/eventFinance';
import {
  buildWorkByEvent,
  expensesInPeriod,
  getEventReceivedAmount,
  getEventReceivedDate,
  isDateInRange,
  paidEventsInPeriod,
  projectedEventsInPeriod,
  sumExpenses,
  sumReceived,
  workInPeriod,
} from '@/lib/financeMetrics';

import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useDailyWork } from '@/lib/useDailyWork';
import { useExpenses } from '@/lib/useExpenses';

import { AlertCircle } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  addMonths,
  startOfWeek,
  endOfWeek,
  subWeeks,
  addWeeks,
} from 'date-fns';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import appToast from '@/lib/appToast';
import { getEventStatus } from '@/components/utils/dateUtils';

// Component imports — charts/map/modais em lazy para reduzir chunk inicial
import AllAccessDinheiro from '@/components/reports/AllAccessDinheiro';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/layout/EmptyState';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
// NeonPageShell removido na Entrega 4 All Access

import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import EventHeading from '@/components/events/EventHeading';
import { enrichEventsWithClients } from '@/lib/eventDisplay';

import { useConnectivity } from '@/lib/offline/useConnectivity';

const ExportManager = lazy(() => import('@/components/reports/ExportManager'));
const EventDetailModal = lazy(() => import('@/components/calendar/EventDetailModal'));
const PaymentConfirmModal = lazy(() => import('@/components/reports/PaymentConfirmModal'));
const EventForm = lazy(() => import('@/components/calendar/EventForm'));
const NfTracker = lazy(() => import('@/components/reports/NfTracker'));
const HoursReviewList = lazy(() => import('@/components/reports/HoursReviewList'));
const CashflowForecast = lazy(() => import('@/components/reports/CashflowForecast'));
const IRSummary = lazy(() => import('@/components/reports/IRSummary'));

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


export default function ReportsPage() {
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents, delete: deleteEvent } = useEvents();
  const { clients, loading: clientsLoading, error: clientsError, refetch: refetchClients } = useClients();
  const { dailyWork, loading: dailyWorkLoading, error: dailyWorkError, refetch: refetchDailyWork } = useDailyWork();
  const { expenses, loading: expensesLoading, error: expensesError, refetch: refetchExpenses } = useExpenses();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { profile } = useAuth();
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

  const [selectedPeriod] = useState('this_month');
  const [showProjection, setShowProjection] = useState(false);

  // O mapa ganhou tela propria (/mapa, "Mais > Mapa"); link antigo /reports#mapa vai para la.
  const routerLocation = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (routerLocation.hash === '#mapa') navigate('/mapa', { replace: true });
  }, [routerLocation.hash, navigate]);

  // State para o EventDetailModal e formulários de edição
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [payingEvent, setPayingEvent] = useState(null); // "Recebi" direto da lista A receber
  const [editingEvent, setEditingEvent] = useState(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null);

  const eventsReady = !loading.events;
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

  const workByEvent = useMemo(() => buildWorkByEvent(data.dailyWork), [data.dailyWork]);

  // Competências por tipo de valor: ver src/lib/financeMetrics.js
  const processedData = useMemo(() => {
    const { events = [], dailyWork = [], expenses = [], clients = [] } = data;

    // APLICAR STATUS CORRETO A TODOS OS EVENTOS ANTES DE PROCESSAR
    const eventsWithCorrectStatus = events.map((event) => ({
      ...event,
      calculatedStatus: getEventStatus(event)
    }));

    const receivedAmount = (event) => getEventReceivedAmount(event, workByEvent[event.id] || []);
    const projectedAmount = (event) => calculateEventReceivableAmount(event, workByEvent[event.id] || []);

    // Processar dados do período atual
    const processForPeriod = (range) => {
      // Recebido: pela data do pagamento
      const paidEventsInRange = paidEventsInPeriod(eventsWithCorrectStatus, range);

      // Eventos do período para outras métricas (baseado em start_date)
      const periodEvents = eventsWithCorrectStatus.filter((e) => isDateInRange(e.start_date, range));
      const periodWork = workInPeriod(dailyWork, range);
      const periodExpenses = expensesInPeriod(expenses, range);

      const realizedRevenue = sumReceived(paidEventsInRange, workByEvent);

      const receivableRevenue = eventsWithCorrectStatus
        .filter(isReceivableEvent)
        .reduce((sum, e) => {
          const eventDailyWork = dailyWork.filter((work) => work.event_id === e.id);
          return sum + calculateEventReceivableAmount(e, eventDailyWork);
        }, 0);

      // Previsto: shows ainda não realizados com início no período
      const projectedRevenue = projectedEventsInPeriod(eventsWithCorrectStatus, range).
        reduce((sum, e) => sum + projectedAmount(e), 0);

      // Total de despesas
      const totalExpenses = sumExpenses(periodExpenses);

      // Receita do período = o que foi RECEBIDO no período (caixa).
      // "A receber" é o saldo em aberto hoje, de todos os meses: não entra no lucro do mês
      // (antes entrava e misturava meses — auditoria 15/10, P0).
      const totalRevenue = realizedRevenue;

      // Lucro líquido
      const netProfit = totalRevenue - totalExpenses;

      // Horas trabalhadas
      const totalHours = periodWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);

      // Clientes ativos no período
      const activeClientIds = new Set(periodEvents.map((e) => e.client_id));

      // Cliente com maior faturamento no período (baseado em pagamentos)
      const clientRevenueMap = {};
      paidEventsInRange.forEach((event) => {
        if (event.client_id) {
          clientRevenueMap[event.client_id] = (clientRevenueMap[event.client_id] || 0) + receivedAmount(event);
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
        paidEvents: paidEventsInRange, // Eventos pagos no período
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
        // Saldo em aberto não tem comparação por período.
        receivable: null,
        profit: calculateTrend(currentData.netProfit, previousData.netProfit),
        clients: calculateTrend(currentData.activeClientsCount, previousData.activeClientsCount)
      },
      // Dados para componentes filhos
      chartInput: {
        // paid_date preenchido também para pagos antigos sem data (o gráfico posiciona por ele)
        realized: currentData.paidEvents.map((e) => ({ ...e, paid_date: getEventReceivedDate(e), calculated_value: receivedAmount(e) })),
        receivable: eventsWithCorrectStatus.filter(isReceivableEvent).map((e) => {
          const eventDailyWork = dailyWork.filter((work) => work.event_id === e.id);
          return { ...e, calculated_value: calculateEventReceivableAmount(e, eventDailyWork) };
        }),
        projected: eventsWithCorrectStatus.filter((e) => e.calculatedStatus === 'scheduled').map((e) => ({ ...e, calculated_value: projectedAmount(e) })),
        expenses: currentData.expenses
      }
    };
  }, [data, workByEvent, currentRange, previousRange, nextRange]);

  // Handlers para KPIs clicáveis

  // Eventos do período filtrados por cliente (se houver filtro ativo)

  // Memo para filtrar a lista de eventos com base no clique do gráfico

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

  if (!eventsReady) {
    return <ReportsSkeleton />;
  }

  if (showBlockingError) {
    return (
      <div className="h-[60vh] flex items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="Não deu para carregar o Dinheiro"
          description="Confira a internet. Seus dados não foram perdidos."
          action={() => refreshData()}
          actionLabel="Tentar de novo"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-x-clip bg-[#0a0a0a] text-white pb-24">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        primaryHex="#ffd400"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="p-4 md:p-6 space-y-8 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0"
      >
        <AllAccessDinheiro
          events={data.events || []}
          clients={data.clients || []}
          expenses={data.expenses || []}
          formatCurrency={formatCurrency}
          isVisible={isVisible}
          onExportPdf={() => {
            const expBtn = document.querySelector('[data-export-trigger]');
            if (expBtn) expBtn.click();
            else appToast.info('Gerando exportação de relatórios...');
          }}
          onMarkPaid={(ev) => setPayingEvent(ev)}
          workByEvent={workByEvent}
          initialTab={new URLSearchParams(routerLocation.search).get('aba')}
          // Funcoes que sumiram na troca de visual (20/10) e voltaram em 21/10.
          receberExtra={
            <Suspense fallback={<ChartBlockSkeleton />}>
              <CashflowForecast compact events={data.events} work={data.dailyWork} clients={data.clients} />
            </Suspense>
          }
          fiscalExtra={
            <Suspense fallback={<ChartBlockSkeleton className="h-64" />}>
              <NfTracker events={data.events} clients={data.clients} onOpenEvent={(ev) => setSelectedEvent(ev)} />
              <IRSummary events={data.events} expenses={data.expenses} work={data.dailyWork} />
            </Suspense>
          }
          analiseExtra={
            <Suspense fallback={<ChartBlockSkeleton className="h-64" />}>
              <HoursReviewList
                events={data.events}
                dailyWork={data.dailyWork}
                clients={data.clients}
                onOpenEvent={(ev) => setSelectedEvent(ev)}
              />
            </Suspense>
          }
        />
        <div className="hidden">
          <ExportManager
            data={{
              events: processedData.current.events,
              paidEvents: processedData.current.paidEvents,
              allWork: data.dailyWork,
              work: processedData.current.work,
              expenses: processedData.current.expenses,
              clients: data.clients
            }}
            period={currentRange}
          />
        </div>
      </motion.div>

      {/* "Recebi": mesma janela de pagamento do app (com a regra das horas preenchidas) */}
      {payingEvent && (
        <Suspense fallback={null}>
          <PaymentConfirmModal
            event={payingEvent}
            client={data.clients.find((c) => c.id === payingEvent.client_id)}
            dailyWork={data.dailyWork || []}
            isOpen={!!payingEvent}
            onClose={() => setPayingEvent(null)}
            onSuccess={() => { setPayingEvent(null); refreshData({ silent: true }); }}
          />
        </Suspense>
      )}

      {/* Modal de detalhes do evento */}
      {selectedEvent && (
        <Suspense fallback={null}>
          <EventDetailModal
            event={selectedEvent}
            client={data.clients.find(c => c.id === selectedEvent.client_id)}
            onClose={() => setSelectedEvent(null)}
            onEdit={handleEventEdit}
            onDelete={handleEventDelete}
            onDuplicate={handleEventDuplicate}
            // So atualiza a tela: quem grava o pagamento e a janela do valor real.
            onMarkPaid={() => refreshData({ silent: true })}
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

      <ConfirmDialog
        open={!!confirmDeleteEvent}
        onOpenChange={(open) => !open && setConfirmDeleteEvent(null)}
        title="Excluir evento?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmEventDelete}
      />

      {/* Modal de Projeção do Próximo Período */}
      <Dialog open={showProjection} onOpenChange={setShowProjection}>
        <DialogContent className="w-full max-w-lg h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85dvh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0 pr-14">
            <DialogTitle>
              Projeção — Próximo Período
            </DialogTitle>
            <DialogDescription className="text-sm">
              Eventos confirmados ainda não realizados
            </DialogDescription>
          </DialogHeader>
          <div className="bp-modal-scroll px-6 pb-6 space-y-4">
            {/* Total projetado */}
            <div className="flex items-center justify-between p-4 rounded-xl border bp-surface-primary">
              <div>
                <p className="text-xs bp-text-primary uppercase tracking-wider font-tag mb-0.5">Total projetado</p>
                <p className="text-2xl font-black text-white">
                  {isVisible ? formatCurrency(processedData.next.projectedRevenue) : '•••••'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#888888]">{processedData.next.scheduledEventsCount} evento{processedData.next.scheduledEventsCount !== 1 ? 's' : ''}</p>
                {processedData.current.realizedRevenue > 0 && (
                  <p className="text-xs text-[#888888] mt-0.5">
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
                const value = calculateEventReceivableAmount(event, workByEvent[event.id] || []);
                const dateStr = event.start_date
                  ? new Date(event.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : '—';
                return (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 py-3 border-b border-[#2a2a2a] last:border-0 cursor-pointer hover:bg-[#1f1f1f] rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => { setShowProjection(false); setSelectedEvent(event); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowProjection(false); setSelectedEvent(event); } }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1f1f1f] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#a8a8a8]">
                      {dateStr.split(' ')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <EventHeading event={event} client={client} size="sm" />
                      <p className="text-xs text-[#888888] truncate mt-0.5">{dateStr}</p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: config.primaryHex }}>
                      {isVisible ? formatCurrency(value) : '•••'}
                    </p>
                  </div>
                );
              })
            }
            {processedData.next.scheduledEventsCount === 0 && (
              <p className="text-center text-[#888888] text-sm py-6">Nenhum evento agendado para o próximo período.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

