
import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useQueryAction } from '@/lib/useQueryAction';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/profileOfflineContext';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useDailyWork } from '@/lib/useDailyWork';
import { useExpenses } from '@/lib/useExpenses';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Search,
  X,
  List,
  CalendarDays,
  Download,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
  Share2,
  Columns2,
  Calculator,
  FileText,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { exportCalendarIcs } from '@/lib/exportReport';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, parseISO, isValid, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, differenceInCalendarDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AllAccessCalendar from '@/components/calendar/AllAccessCalendar';
import EventForm from '@/components/calendar/EventForm';
import DailyWorkModal from '@/components/calendar/DailyWorkModal';
import EventDetailModal from '@/components/calendar/EventDetailModal';
import PaymentConfirmModal from '@/components/reports/PaymentConfirmModal';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import {
  normalizeDateString,
  todayLocalISO,
  getEventStatus,
} from '@/components/utils/dateUtils';
import { isCancelledEvent, calculateEventReceivableAmount } from '@/lib/eventFinance';
import { needsGooglePush } from '@/lib/googleSyncRules';
import AnimatedStatValue from '@/components/home/AnimatedStatValue';
import CalendarPageHeader from '@/components/calendar/CalendarPageHeader';
import CalendarTodayStrip from '@/components/calendar/CalendarTodayStrip';
import appToast from '@/lib/appToast';
import { DEFAULT_EVENT_COLOR } from '@/lib/brandColors';
import { Skeleton } from '@/components/ui/skeleton';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import DrilldownModal from '@/components/reports/DrilldownModal';
import DayQuickActions from '@/components/calendar/DayQuickActions';
import AlertsPanel from '@/components/calendar/AlertsPanel';
import { useConnectivity } from '@/lib/offline/useConnectivity';
import EventActionSheet from '@/components/mobile/EventActionSheet';
import EventHoursSheet from '@/components/mobile/EventHoursSheet';
import NotesSheet from '@/components/mobile/NotesSheet';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import { applyAuto12Hours } from '@/lib/applyAuto12Hours';
import { useUserSettings } from '@/lib/useUserSettings';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { buildMarkPaidUpdate, buildMarkUnpaidUpdate } from '@/lib/financeMetrics';
import { captureEventLocationFromGps } from '@/lib/eventLocation';
import { useAppScrollLock } from '@/lib/useAppScrollLock';
import EventHeading from '@/components/events/EventHeading';
import { enrichEventsWithClients, getClientDisplayName } from '@/lib/eventDisplay';
import { formatHours } from '@/lib/money';
import EmptyState from '@/components/layout/EmptyState';

const KanbanPipeline = lazy(() => import('@/components/calendar/KanbanPipeline'));
const CacheCalculator = lazy(() => import('@/components/calendar/CacheCalculator'));
const AvailabilityShareModal = lazy(() => import('@/components/calendar/AvailabilityShareModal'));

const CalendarViewFallback = () => (
  <div className="py-10 px-2">
    <Skeleton className="h-40 w-full rounded-xl" />
  </div>
);

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

const CalendarSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-32 sm:w-48" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-20 sm:w-24" />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton className="h-10 flex-1 sm:w-40" />
        <Skeleton className="h-10 flex-1 sm:w-36" />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
    <Skeleton className="h-[50vh] w-full rounded-lg" />
  </div>
);

const StatCard = ({
  title,
  value,
  numericValue,
  formatValue,
  icon: Icon,
  color,
  onClick,
  loading = false,
}) => (
  // Mesmo bloco dos numeros do topo (All Access): numero em Anton, rotulo em Space Mono.
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="text-left rounded-[10px] bg-[#161616] border border-[#222222] p-2.5 flex items-center justify-between gap-2 transition-colors hover:border-[#444444] active:scale-[0.98] disabled:active:scale-100"
  >
    <div className="min-w-0 flex-1">
      {loading ? (
        <Skeleton className="h-6 w-14 bg-[#222222]" />
      ) : numericValue != null && formatValue ? (
        <AnimatedStatValue
          value={numericValue}
          format={formatValue}
          className={`font-poster text-[22px] leading-none ${color} truncate block`}
        />
      ) : (
        <p className={`font-poster text-[22px] leading-none ${color || 'text-white'} truncate`}>{value}</p>
      )}
      <p className="font-tag text-[10px] text-[#a8a8a8] uppercase mt-1 truncate">
        {title}
      </p>
    </div>
    <Icon className="w-4 h-4 text-[#555555] flex-shrink-0" />
  </button>
);


/**
 * Chips da Agenda: "Concluidos" segue a data (mesmo criterio do badge do card);
 * "Pendentes"/"Confirmados" sao o status do negocio, so para eventos que ainda nao terminaram.
 */
function matchesStatusChip(event, key) {
  const done = getEventStatus(event) === 'completed';
  if (key === 'completed') return done;
  return !done && event.status === key;
}

export default function CalendarPage() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const profile = useProfile();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents, update: updateEvent, delete: deleteEvent } = useEvents();
  const { clients, loading: clientsLoading } = useClients();
  const { dailyWork, loading: dailyWorkLoading, refetch: refetchDailyWork, delete: deleteDailyWorkEntry } = useDailyWork();
  const { loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { settings: userSettings } = useUserSettings();
  const { offline } = useConnectivity();

  const googlePushOn = Boolean(userSettings?.google_calendar_connected) && userSettings?.google_push_enabled !== false;
  const unsyncedCount = useMemo(
    () => (googlePushOn ? events.filter(needsGooglePush).length : 0),
    [events, googlePushOn]
  );

  const isCoreLoading = eventsLoading || clientsLoading;
  const isCoreReady = Array.isArray(events) && Array.isArray(clients);
  const isSecondaryLoading = dailyWorkLoading || expensesLoading;

  const enrichedEvents = useMemo(
    () => enrichEventsWithClients(events || [], clients || []),
    [events, clients]
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showDailyWorkModal, setShowDailyWorkModal] = useState(false); // Renamed from showWorkModal
  const [selectedEvent, setSelectedEvent] = useState(null); // For desktop detail modal
  const [editingEvent, setEditingEvent] = useState(null); // For event form
  const [editingWork, setEditingWork] = useState(null); // For daily work form (edit existing)

  const [multipleEventsModal, setMultipleEventsModal] = useState(false);
  useAppScrollLock(multipleEventsModal);
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState([]);
  const [formPrefilledData, setFormPrefilledData] = useState(null); // For daily work form (new entry)

  const [prefillEventData, setPrefillEventData] = useState(null); // For event form (new event)

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [prefilledEventIdForExpense, setPrefilledEventIdForExpense] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailability, setShowAvailability] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      const stored = localStorage.getItem('backstage:calendar-view-mode');
      return ['grid', 'week', 'list', 'upcoming', 'kanban'].includes(stored) ? stored : 'grid';
    } catch {
      return 'grid';
    }
  });
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [confirmWork, setConfirmWork] = useState(null);
  const [confirmEvent, setConfirmEvent] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('backstage:calendar-view-mode', viewMode);
    } catch { /* quota / private mode */ }
  }, [viewMode]);

  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownItems, setDrilldownItems] = useState([]);

  const [quickActions, setQuickActions] = useState({ open: false, date: null, target: null });

  // Mobile specific states
  const [selectedActionSheetEvent, setSelectedActionSheetEvent] = useState(null); // Event for Action Sheet, client derived
  const [showMobileHoursSheet, setShowMobileHoursSheet] = useState(false);
  const [mobileHoursEventData, setMobileHoursEventData] = useState(null); // Contains event, date, existingWork for mobile hours sheet
  const [activeNotesEvent, setActiveNotesEvent] = useState(null); // Event for Notes Sheet

  const isMobile = useMediaQuery('(max-width: 768px)');

  const activeEvents = useMemo(
    () => enrichedEvents.filter((e) => !isCancelledEvent(e)),
    [enrichedEvents]
  );

  const filteredEvents = useMemo(() => {
    let base = activeEvents;
    if (statusFilter === 'paid') base = base.filter((e) => e.payment_status === 'paid');
    else if (statusFilter !== 'all') base = base.filter((e) => matchesStatusChip(e, statusFilter));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cmap = new Map(clients.map(c => [c.id, c]));
      base = base.filter((e) => {
        const title = (e.title || '').toLowerCase();
        const clientName = (getClientDisplayName(cmap.get(e.client_id)) || e.client_name || '').toLowerCase();
        const location = (e.location || '').toLowerCase();
        return title.includes(q) || clientName.includes(q) || location.includes(q);
      });
    }
    return base;
  }, [activeEvents, statusFilter, searchQuery, clients]);

  const listViewGroups = useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => (a.start_date > b.start_date ? 1 : -1));
    const groups = [];
    let currentMonth = null;
    for (const ev of sorted) {
      const monthKey = (ev.start_date || '').slice(0, 7);
      if (monthKey !== currentMonth) {
        currentMonth = monthKey;
        groups.push({ monthKey, label: monthKey ? format(parseISO(`${monthKey}-01`), "MMMM 'de' yyyy", { locale: ptBR }) : 'Sem data', events: [] });
      }
      groups[groups.length - 1].events.push(ev);
    }
    return groups;
  }, [filteredEvents]);

  const weekDays = useMemo(() =>
    eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 0 }) }),
    [weekStart]
  );

  const weekEventsByDay = useMemo(() => {
    const map = new Map();
    for (const day of weekDays) {
      const iso = format(day, 'yyyy-MM-dd');
      map.set(iso, filteredEvents.filter(ev => {
        const start = (ev.start_date || '').slice(0, 10);
        const end = (ev.end_date || ev.start_date || '').slice(0, 10);
        return start && iso >= start && iso <= end;
      }));
    }
    return map;
  }, [weekDays, filteredEvents]);

  const upcomingGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = format(today, 'yyyy-MM-dd');
    const upcoming = filteredEvents
      .filter(ev => (ev.end_date || ev.start_date || '') >= todayIso)
      .sort((a, b) => (a.start_date > b.start_date ? 1 : -1));

    const groups = [];
    for (const ev of upcoming) {
      const evDate = parseISO(ev.start_date);
      const diff = differenceInCalendarDays(evDate, today);
      let groupKey, groupLabel;
      // diff < 0: show de vários dias que já começou e ainda não terminou
      if (diff <= 0)         { groupKey = 'hoje';         groupLabel = 'Hoje'; }
      else if (diff === 1)   { groupKey = 'amanha';       groupLabel = 'Amanhã'; }
      else if (diff <= 7)    { groupKey = 'esta_semana';  groupLabel = 'Esta semana'; }
      else if (diff <= 14)   { groupKey = 'proxima';      groupLabel = 'Próxima semana'; }
      else if (diff <= 30)   { groupKey = 'este_mes';     groupLabel = 'Nos próximos 30 dias'; }
      else                   { groupKey = 'futuro';       groupLabel = 'Mais adiante'; }

      let g = groups.find(x => x.key === groupKey);
      if (!g) { g = { key: groupKey, label: groupLabel, events: [] }; groups.push(g); }
      g.events.push({ ev, diff });
    }
    return groups;
  }, [filteredEvents]);

  useQueryAction('new-event', useCallback(() => {
    setShowEventForm(true);
    setEditingEvent(null);
  }, []));

  // Abre o formulário com cliente pré-selecionado quando ?action=new-event&client_id=xxx
  const processedActionRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientId = params.get('client_id');
    const action = params.get('action');
    const key = action + ':' + clientId;
    if (action === 'new-event' && clientId && processedActionRef.current !== key) {
      processedActionRef.current = key;
      setPrefillEventData((prev) => ({ ...(prev || {}), client_id: clientId }));
      // Não chamar navigate/replaceState — qualquer mudança de location aciona AnimatePresence
      // e trava motion.div em opacity:0. processedActionRef evita re-processamento.
    }
  }, [location.search, location.pathname]);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const eventMap = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);

  // Abre EventDetailModal quando ?event=ID vem de outra página (definido APÓS eventMap)
  const processedEventIdRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventId = params.get('event');
    if (eventId && eventMap.size > 0 && processedEventIdRef.current !== eventId) {
      const ev = eventMap.get(eventId);
      if (ev) {
        processedEventIdRef.current = eventId;
        setSelectedEvent(ev);
        // Não chamar navigate/replaceState — qualquer mudança de location aciona AnimatePresence
        // e trava motion.div em opacity:0. processedEventIdRef evita re-processamento.
      }
    }
  }, [location.search, location.pathname, eventMap]);

  const closeModals = useCallback(() => {
    setSelectedEvent(null);
    setShowEventForm(false);
    setShowDailyWorkModal(false); // Renamed state
    setMultipleEventsModal(false);
    setEventsForSelectedDate([]);
    setEditingEvent(null);
    setEditingWork(null);
    setFormPrefilledData(null);
    setPrefillEventData(null);
    setShowExpenseForm(false);
    setEditingExpense(null);
    setPrefilledEventIdForExpense(null);
    setDrilldownOpen(false);
    setQuickActions({ open: false, date: null, target: null });
    setShowMobileHoursSheet(false);
    setMobileHoursEventData(null);
    setActiveNotesEvent(null);
  }, []);

  const closeActionSheets = useCallback(() => {
    setSelectedActionSheetEvent(null); // Single state for event action sheet
    setShowMobileHoursSheet(false);
    setMobileHoursEventData(null);
    setActiveNotesEvent(null);
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
    closeModals();
  }, [closeModals]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
    closeModals();
  }, [closeModals]);


  // Swipe navigation (touch devices)
  const swipeTouchStart = useRef(null);
  const swipeTouchStartY = useRef(null);

  const handleGridTouchStart = useCallback((e) => {
    swipeTouchStart.current = e.touches[0].clientX;
    swipeTouchStartY.current = e.touches[0].clientY;
  }, []);

  const handleGridTouchEnd = useCallback((e) => {
    if (swipeTouchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeTouchStart.current;
    const dy = e.changedTouches[0].clientY - swipeTouchStartY.current;
    swipeTouchStart.current = null;
    swipeTouchStartY.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) {
      if (viewMode === 'week') setWeekStart(w => addWeeks(w, 1));
      else goToNextMonth();
    } else {
      if (viewMode === 'week') setWeekStart(w => subWeeks(w, 1));
      else goToPreviousMonth();
    }
  }, [viewMode, goToNextMonth, goToPreviousMonth]);

  const handleNewEvent = useCallback(
    (date = null) => {
      closeModals();
      const targetDate = date || new Date();
      setSelectedDate(targetDate);
      setEditingEvent(null);
      setPrefillEventData({
        start_date: normalizeDateString(targetDate),
        end_date: normalizeDateString(targetDate),
      });
      setShowEventForm(true);
    },
    [closeModals]
  );

  const handleOpenWorkModalForDate = useCallback(
    async (targetDate) => {
      closeModals();

      const dateStr = normalizeDateString(targetDate);
      const eventsForDate = events.filter((event) => {
        if (!event?.start_date || !event?.end_date) return false;
        const startDate = normalizeDateString(event.start_date);
        const endDate = normalizeDateString(event.end_date);
        return dateStr >= startDate && dateStr <= endDate;
      });

      if (eventsForDate.length === 0) {
        appToast.info(`Não há eventos para ${format(targetDate, "dd 'de' MMMM", { locale: ptBR })}`, {
          description: 'Para registrar horas, você precisa primeiro criar um evento nesta data.',
          action: {
            label: 'Criar Evento',
            onClick: () => handleNewEvent(targetDate),
          },
          duration: 8000,
        });
        return;
      }

      setSelectedDate(targetDate); // Set selectedDate for the modal
      if (eventsForDate.length === 1) {
        setFormPrefilledData({ event_id: eventsForDate[0].id, date: dateStr });
        setShowDailyWorkModal(true); // Renamed state
      } else {
        setEventsForSelectedDate(eventsForDate);
        setMultipleEventsModal(true);
      }
    },
    [closeModals, events, handleNewEvent]
  );

  const handleQuickWorkEntry = useCallback(
    (date = null) => {
      const targetDate = date || new Date();
      handleOpenWorkModalForDate(targetDate);
    },
    [handleOpenWorkModalForDate]
  );

  const handleQuickLogForEvent = useCallback(
    (event, date) => {
      closeModals();
      const targetDate = new Date(normalizeDateString(date) + 'T00:00:00');
      setSelectedDate(targetDate);
      setFormPrefilledData({ event_id: event.id, date: normalizeDateString(date) });
      setShowDailyWorkModal(true); // Renamed state
    },
    [closeModals]
  );

  const handleDayClick = useCallback(
    (date, target) => {
      const dateObj = date instanceof Date ? date : new Date(date);

      closeModals();
      closeActionSheets();

      if (quickActions.open && quickActions.date && format(quickActions.date, 'yyyy-MM-dd') === format(dateObj, 'yyyy-MM-dd')) {
        setQuickActions({ open: false, date: null, target: null });
      } else {
        setSelectedDate(dateObj);
        setQuickActions({ open: true, date: dateObj, target });
      }
    },
    [quickActions, closeModals, closeActionSheets]
  );

  const handleSelectEventFromMultiple = useCallback(
    (selectedEventItem) => {
      const dateStr = normalizeDateString(selectedDate);
      setFormPrefilledData({ event_id: selectedEventItem.id, date: dateStr });
      setMultipleEventsModal(false);
      // closeModals() is called by the DailyWorkModal or form success
      setShowDailyWorkModal(true); // Renamed state
    },
    [selectedDate]
  );

  const handleEventClick = useCallback(
    (event) => {
      if (!event) {
        console.warn('Evento é null ou undefined');
        return;
      }

      const client = clientMap.get(event.client_id);
      const enrichedEvent = {
        ...event,
        client_name: getClientDisplayName(client) || event.client_name || 'Sem empresa',
      };

      if (isMobile) {
        setSelectedActionSheetEvent(enrichedEvent);
      } else {
        setSelectedEvent(enrichedEvent);
      }
    },
    [clientMap, isMobile]
  );

  const handleEditEvent = useCallback(
    (event) => {
      closeModals();
      setEditingEvent(event);
      setShowEventForm(true);
    },
    [closeModals]
  );

  const handleDuplicateEvent = useCallback(
    (event) => {
      closeModals();
      setEditingEvent(null);
      setPrefillEventData({
        client_id: event.client_id,
        title: `Cópia — ${event.title}`,
        start_date: '',
        end_date: '',
        start_time: event.start_time,
        end_time: event.end_time,
        payment_status: 'unpaid',
        payment_model: event.payment_model,
        daily_cache_value: event.daily_cache_value,
        cache_valor_base: event.cache_valor_base,
        color: event.color,
        observacoes_md: event.observacoes_md,
        location: event.location,
        location_city: event.location_city,
        location_state: event.location_state,
        location_lat: event.location_lat,
        location_lng: event.location_lng,
      });
      setShowEventForm(true);
      appToast.info('Preencha as novas datas para o evento duplicado');
    },
    [closeModals]
  );


  const handleFormSuccess = useCallback(() => {
    closeModals();
    closeActionSheets();
    refetchEvents();
    refetchDailyWork();
    refetchExpenses();
  }, [closeModals, closeActionSheets, refetchEvents, refetchDailyWork, refetchExpenses]);


  const handleConfirmWorkDelete = useCallback(async () => {
    try {
      await deleteDailyWorkEntry(confirmWork);
      appToast.success('Registro de horas excluído com sucesso!');
      handleFormSuccess();
    } catch (err) {
      console.error('Erro ao excluir registro de trabalho:', err);
      appToast.error('Erro ao excluir o registro de horas.', { description: 'Por favor, tente novamente.' });
    } finally {
      setConfirmWork(null);
    }
  }, [confirmWork, deleteDailyWorkEntry, handleFormSuccess]);

  const handleAddExpenseForEvent = useCallback(
    (event) => {
      closeModals();
      setPrefilledEventIdForExpense(event.id);
      setShowExpenseForm(true);
    },
    [closeModals]
  );



  const handleDeleteEvent = useCallback(
    (eventId) => {
      if (!eventId) return;
      const eventToDelete = events.find((e) => e.id === eventId);
      if (!eventToDelete) { appToast.error('Evento não encontrado para exclusão.'); return; }
      setConfirmEvent(eventToDelete);
    },
    [events]
  );

  const handleConfirmDeleteEvent = useCallback(async () => {
    try {
      await deleteEvent(confirmEvent.id);
      appToast.success(`Evento "${confirmEvent.title}" foi excluído com sucesso!`);
      handleFormSuccess();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      appToast.error('Erro ao excluir o evento.', { description: 'Por favor, tente novamente.' });
    } finally {
      setConfirmEvent(null);
    }
  }, [confirmEvent, deleteEvent, handleFormSuccess]);

  const handleMarkPaid = useCallback(
    async (eventToUpdate) => {
      if (!eventToUpdate) return;
      const newStatus = eventToUpdate.payment_status === 'paid' ? 'unpaid' : 'paid';
      try {
        const updateData = newStatus === 'paid'
          ? buildMarkPaidUpdate(
              eventToUpdate,
              dailyWork.filter((w) => w.event_id === eventToUpdate.id)
            )
          : buildMarkUnpaidUpdate();
        await updateEvent(eventToUpdate.id, updateData);
        appToast.success(
          newStatus === 'paid'
            ? `"${eventToUpdate.title}" marcado como pago!`
            : `"${eventToUpdate.title}" desmarcado — pagamento pendente`
        );
        handleFormSuccess();
      } catch (err) {
        console.error('Erro ao atualizar status de pagamento:', err);
        appToast.error('Erro ao atualizar status de pagamento.');
      }
    },
    [handleFormSuccess, updateEvent, dailyWork]
  );

  // Pagamento SEMPRE pela janela do valor real (regra do dono: digita o que caiu na conta).
  // A propria janela avisa se faltam horas e tem o "cobrar assim mesmo".
  const [payEvent, setPayEvent] = useState(null);
  const requestMarkPaid = useCallback(
    (eventToUpdate) => {
      if (!eventToUpdate) return;
      if (eventToUpdate.payment_status === 'paid') {
        handleMarkPaid(eventToUpdate); // desmarcar pago continua direto
        return;
      }
      setPayEvent(eventToUpdate);
    },
    [handleMarkPaid]
  );

  // New action sheet handlers
  const handleActionSheetViewDetails = useCallback(() => {
    if (selectedActionSheetEvent) {
      closeActionSheets(); // Close the action sheet
      setSelectedEvent(selectedActionSheetEvent); // Open desktop detail modal
    }
  }, [selectedActionSheetEvent, closeActionSheets]);

  const handleActionSheetOpenHours = useCallback(() => {
    if (selectedActionSheetEvent) {
      const today = todayLocalISO();
      const start = selectedActionSheetEvent.start_date || today;
      const end = selectedActionSheetEvent.end_date || start;
      // Use today if within the event's date range, otherwise use event start date
      const dateStr = today >= start && today <= end ? today : start;
      const work = dailyWork.find(
        (w) => w.event_id === selectedActionSheetEvent.id && normalizeDateString(w.date) === normalizeDateString(dateStr)
      );

      setMobileHoursEventData({
        event: selectedActionSheetEvent,
        date: dateStr,
        existingWork: work,
      });
      setSelectedActionSheetEvent(null); // Close the event action sheet
      setShowMobileHoursSheet(true); // Open the hours sheet
    }
  }, [selectedActionSheetEvent, dailyWork]);

  const handleActionSheetOpenNotes = useCallback(() => {
    if (selectedActionSheetEvent) {
      setActiveNotesEvent(selectedActionSheetEvent);
      setSelectedActionSheetEvent(null); // Close the event action sheet
    }
  }, [selectedActionSheetEvent]);

  const handleEventLocationCheckIn = useCallback(
    async (event) => {
      if (!event?.id) return;
      try {
        const captured = await captureEventLocationFromGps();
        await updateEvent(event.id, {
          location: captured.location,
          location_city: captured.location_city,
          location_state: captured.location_state,
          location_lat: captured.location_lat,
          location_lng: captured.location_lng,
        });
        appToast.success('Local registrado no evento', {
          description: (captured.label || captured.location || '').slice(0, 80),
        });
        await refetchEvents();
      } catch (err) {
        appToast.error(err.message || 'Não foi possível registrar o local.');
        throw err;
      }
    },
    [updateEvent, refetchEvents],
  );

  const handleEventActionSheetApplyManual12h = useCallback(
    async (event) => {
      if (!event?.id || !user?.id) {
        appToast.error('Nenhum evento selecionado para aplicar horas.');
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
            description: `${result.data.daysCreated || 1} dia(s) registrado(s). Você pode editar depois.`,
          });
          setSelectedActionSheetEvent(null);
          handleFormSuccess();
        } else {
          appToast.error('Erro ao aplicar horas', {
            description: result.data?.error || 'Tente novamente.',
          });
        }
      } catch (error) {
        console.error('Erro ao aplicar 12h automáticas:', error);
        appToast.error('Erro ao aplicar horas automáticas', {
          description: error.message || 'Tente novamente.',
        });
      }
    },
    [user?.id, handleFormSuccess]
  );

  // EventHoursSheet already persists to the DB internally (useDailyWork).
  // This callback just triggers the post-save data refresh.
  const handleHoursSheetSave = useCallback(
    () => {
      handleFormSuccess();
    },
    [handleFormSuccess]
  );

  const handleNotesSheetSave = useCallback(
    async (notesData) => {
      try {
        if (!activeNotesEvent) {
          appToast.error('Nenhum evento selecionado para salvar observações.');
          return;
        }
        await updateEvent(activeNotesEvent.id, notesData);
        appToast.success('Observações salvas!');
        handleFormSuccess();
      } catch (error) {
        console.error('Erro ao salvar observações:', error);
        appToast.error('Erro ao salvar observações');
      }
    },
    [activeNotesEvent, handleFormSuccess, updateEvent]
  );

  const handleExportIcs = useCallback(() => {
    if (filteredEvents.length === 0) {
      appToast.error('Nenhum evento para exportar.');
      return;
    }
    try {
      exportCalendarIcs(filteredEvents, clients, format(currentDate, 'yyyy-MM'));
      appToast.success(`${filteredEvents.length} evento(s) exportado(s) como ICS`, {
        description: 'Abra o arquivo .ics para importar no Google Calendar, Apple Calendar etc.',
      });
    } catch (err) {
      appToast.error('Erro ao exportar ICS.');
      console.error(err);
    }
  }, [filteredEvents, clients, currentDate]);

  const monthStats = useMemo(() => {
    if (!isCoreReady) {
      return {
        totalEvents: 0,
        workDays: 0,
        totalHours: 0,
        totalRevenue: 0,
        uniqueClients: 0,
        monthEvents: [],
        monthWork: [],
        monthEventIds: new Set(),
        monthClientIds: new Set(),
      };
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const monthEvents = events.filter((event) => {
      if (isCancelledEvent(event)) return false;
      if (!event?.start_date || !event?.end_date) return false;
      try {
        const eventStart = parseISO(event.start_date);
        const eventEnd = parseISO(event.end_date);
        return (
          isValid(eventStart) &&
          isValid(eventEnd) &&
          (eventStart >= monthStart && eventStart <= monthEnd || // Event starts in month
            eventEnd >= monthStart && eventEnd <= monthEnd || // Event ends in month
            eventStart <= monthStart && eventEnd >= monthEnd) // Event spans across month
        );
      } catch {
        return false;
      }
    });

    const monthEventIds = new Set(monthEvents.map((e) => e.id));

    const monthWork = dailyWork.filter((work) => {
      if (!work?.date) return false;
      try {
        const workDate = parseISO(work.date);
        return isValid(workDate) && workDate >= monthStart && workDate <= monthEnd;
      } catch {
        return false;
      }
    });

    const totalEvents = monthEvents.length;
    const workDays = new Set(monthWork.map(w => w.date?.substring(0, 10)).filter(Boolean)).size;
    const totalHours = monthWork.reduce((sum, work) => sum + (Number(work.total_hours) || 0), 0);

    // Receita: soma getEventCacheAmount por evento (usa daily_cache_value como campo primário)
    const totalRevenue = monthEvents.reduce((sum, event) => {
      const workForEvent = dailyWork
        .filter(w => w.event_id === event.id);
      return sum + (calculateEventReceivableAmount(event, workForEvent));
    }, 0);

    const monthClientIds = new Set(monthEvents.map((e) => e.client_id).filter(Boolean));
    const uniqueClients = monthClientIds.size;

    const received = monthEvents
      .filter(e => e.payment_status === 'paid')
      .reduce((sum, e) => sum + (Number(e.paid_amount) || getEventCacheAmount(e)), 0);
    const pending = monthEvents
      .filter(e => e.payment_status !== 'paid')
      .reduce((sum, e) => sum + getEventCacheAmount(e), 0);

    return {
      totalEvents,
      workDays,
      totalHours: Math.round(totalHours * 10) / 10,
      totalRevenue,
      uniqueClients,
      received,
      pending,
      monthEvents,
      monthWork,
      monthEventIds,
      monthClientIds,
    };
  }, [currentDate, isCoreReady, events, dailyWork]);

  const handleEventsClick = useCallback(() => {
    closeModals();
    const items = monthStats.monthEvents
      .map((event) => {
        const client = clientMap.get(event.client_id);
        const startDate = parseISO(event.start_date);
        const endDate = parseISO(event.end_date);
        const workForEvent = dailyWork
          .filter(w => w.event_id === event.id);
        const value = calculateEventReceivableAmount(event, workForEvent);
        return {
          title: event.title,
          subtitle: `${getClientDisplayName(client) || 'Sem empresa'} · ${isValid(startDate) ? format(startDate, 'dd/MM', { locale: ptBR }) : ''}${
            isValid(endDate) && endDate.getTime() !== startDate.getTime()
              ? `–${format(endDate, 'dd/MM', { locale: ptBR })}`
              : ''
          }`,
          amount: value,
          amountFormatted: value > 0 ? (isVisible ? formatCurrency(value) : '••••') : null,
          event_id: event.id,
          dateSort: isValid(startDate) ? startDate.getTime() : 0,
        };
      })
      .sort((a, b) => b.dateSort - a.dateSort);

    setDrilldownTitle(`Eventos de ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(items);
    setDrilldownOpen(true);
  }, [monthStats.monthEvents, clientMap, currentDate, closeModals, dailyWork, formatCurrency, isVisible]);

  const handleWorkDaysClick = useCallback(() => {
    closeModals();
    const items = monthStats.monthWork
      .map((work) => {
        const event = eventMap.get(work.event_id);
        const client = event ? clientMap.get(event.client_id) : null;
        const workDate = parseISO(work.date);

        return {
          title: `${getClientDisplayName(client) || 'Sem empresa'} — ${event?.title || 'Evento'}`,
          subtitle: `${isValid(workDate) ? format(workDate, 'dd/MM/yy', { locale: ptBR }) : ''} • ${
            work.total_hours || 0
          }h trabalhadas`,
          amount: work.daily_cache || 0,
          amountFormatted: isVisible ? formatCurrency(work.daily_cache || 0) : '••••',
          event_id: work.event_id,
          dateSort: isValid(workDate) ? workDate.getTime() : 0,
        };
      })
      .sort((a, b) => b.dateSort - a.dateSort);

    setDrilldownTitle(`Dias Trabalhados em ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(items);
    setDrilldownOpen(true);
  }, [monthStats.monthWork, eventMap, clientMap, currentDate, formatCurrency, closeModals, isVisible]);

  const handleHoursClick = useCallback(() => {
    closeModals();
    const items = monthStats.monthWork
      .map((work) => {
        const event = eventMap.get(work.event_id);
        const client = clientMap.get(event?.client_id);
        const workDate = parseISO(work.date);

        return {
          title: `${getClientDisplayName(client) || 'Sem empresa'} — ${event?.title || 'Evento'}`,
          subtitle: `${isValid(workDate) ? format(workDate, 'dd/MM/yy', { locale: ptBR }) : ''} • ${
            work.entry_time || ''
          }–${work.exit_time || ''}`,
          amount: Number(work.total_hours) || 0,
          amountFormatted: formatHours(work.total_hours),
          event_id: work.event_id,
          dateSort: isValid(workDate) ? workDate.getTime() : 0,
        };
      })
      .sort((a, b) => b.dateSort - a.dateSort);

    setDrilldownTitle(`Horas Trabalhadas em ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(items);
    setDrilldownOpen(true);
  }, [currentDate, monthStats.monthWork, eventMap, clientMap, closeModals]);


  const handleRevenueClick = useCallback(() => {
    closeModals();
    const items = monthStats.monthEvents
      .filter(event => getEventCacheAmount(event) > 0 || dailyWork.some(w => w.event_id === event.id))
      .map((event) => {
        const client = clientMap.get(event.client_id);
        const startDate = parseISO(event.start_date);
        const workForEvent = dailyWork
          .filter(w => w.event_id === event.id);
        const value = calculateEventReceivableAmount(event, workForEvent);
        const statusLabel = event.payment_status === 'paid' ? 'Pago' : 'Pendente';
        return {
          title: event.title,
          subtitle: `${client?.name || 'Cliente'} · ${statusLabel}`,
          amount: value,
          amountFormatted: isVisible ? formatCurrency(value) : '••••',
          event_id: event.id,
          dateSort: isValid(startDate) ? startDate.getTime() : 0,
        };
      })
      .sort((a, b) => b.dateSort - a.dateSort);

    setDrilldownTitle(`Receita de ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(items);
    setDrilldownOpen(true);
  }, [monthStats.monthEvents, clientMap, currentDate, closeModals, dailyWork, formatCurrency, isVisible]);

  const handleDrilldownItemClick = useCallback(
    (item) => {
      if (item.event_id) {
        const event = eventMap.get(item.event_id);
        if (event) {
          setSelectedEvent(event);
          setDrilldownOpen(false);
        }
      }
    },
    [eventMap]
  );

  const handleQuickAddEvent = useCallback(() => {
    if (quickActions.date) {
      handleNewEvent(quickActions.date);
    }
    setQuickActions({ open: false, date: null, target: null });
  }, [quickActions.date, handleNewEvent]);

  const handleQuickAddWork = useCallback(() => {
    if (quickActions.date) {
      handleQuickWorkEntry(quickActions.date);
    }
    setQuickActions({ open: false, date: null, target: null });
  }, [quickActions.date, handleQuickWorkEntry]);

  // Toque longo / duplo toque em um dia da grade → registrar horas daquele dia.

  // Hooks sempre antes de qualquer return antecipado (regra do React).
  const handlePullRefresh = useCallback(async () => {
    await Promise.all([refetchEvents(), refetchDailyWork(), refetchExpenses()]);
  }, [refetchEvents, refetchDailyWork, refetchExpenses]);
  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(handlePullRefresh);

  if (authLoading && !user) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        <CalendarSkeleton />
      </div>
    );
  }

  if (!isCoreReady && isCoreLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        <CalendarSkeleton />
      </div>
    );
  }


  const hasError = Boolean(eventsError);
  const showBlockingError = hasError && !(events?.length > 0);

  if (showBlockingError) {
    return (
      <div className="h-[60vh] flex items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="Não deu para carregar a agenda"
          description={offline ? 'Você está sem internet e este aparelho ainda não guardou esses dados. Eles aparecem quando a conexão voltar.' : 'Confira a internet. Seus dados não foram perdidos.'}
          action={() => { refetchEvents(); refetchDailyWork(); refetchExpenses(); }}
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
        <CalendarPageHeader
          currentDate={currentDate}
          unsyncedCount={unsyncedCount}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onSyncNow={() => hardNavigate('/profile?tab=google')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          monthStats={{
            showCount: monthStats.totalEvents,
            received: monthStats.received,
            pending: monthStats.pending,
          }}
          formatCurrency={formatCurrency}
          isVisible={isVisible}
        />

        {!clientsLoading && clients.length === 0 && (
          <Alert className="border-[#ffd400]/40 bg-[#ffd400]/10">
            <AlertCircle className="w-4 h-4 text-[#ffd400]" />
            <AlertDescription className="text-[#ffd400] text-sm">
              <strong>Primeiro passo:</strong> cadastre um cliente em{' '}
              <button
                type="button"
                className="underline font-semibold"
                onClick={() => hardNavigate('/clients?action=new-client')}
              >
                Clientes
              </button>{' '}
              antes de agendar shows.
            </AlertDescription>
          </Alert>
        )}

        {/* Alertas */}
        {hasError && (
          <Alert className="border-[#ff2e88] bg-[#ff2e88]/10">
            <AlertCircle className="w-4 h-4 text-[#ff2e88]" />
            <AlertDescription className="text-[#ff2e88] text-sm">
              <strong>Erro:</strong> {eventsError}
            </AlertDescription>
          </Alert>
        )}


        {/* Busca + "..." (vistas e ferramentas) no visual All Access: uma linha so, para a grade subir */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar show, cliente ou local"
              className="w-full h-11 bg-[#161616] border border-[#333333] rounded-full pl-10 pr-10 text-base text-white placeholder-[#666666] focus:outline-none focus:border-[#ffd400] transition-colors"
              aria-label="Buscar eventos"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-[#a8a8a8] hover:text-white transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Mais vistas"
                aria-label="Mais vistas e ferramentas"
                className={`h-11 w-11 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                  ['week', 'list', 'kanban', 'upcoming'].includes(viewMode)
                    ? 'bg-[#ffd400] border-[#ffd400] text-[#0a0a0a]'
                    : 'bg-[#161616] border-[#333333] text-[#0a0a0a] hover:border-[#ffd400]'
                }`}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="bg-[#161616] border-[#2a2a2a] text-white rounded-[14px] min-w-[220px] z-[110] p-1.5">
              <div className="font-tag text-[10px] tracking-[2px] text-[#a8a8a8] px-2 pt-1 pb-1.5">VER A AGENDA</div>
              {[
                { mode: 'upcoming', label: 'Próximos shows', icon: Zap },
                { mode: 'week', label: 'Vista Semanal', icon: CalendarDays },
                { mode: 'list', label: 'Vista em Lista', icon: List },
                { mode: 'kanban', label: 'Pipeline Kanban', icon: Columns2 },
              ].map(({ mode, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    if (mode === 'week') setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
                  }}
                  className={`flex items-center gap-2.5 h-10 rounded-[10px] cursor-pointer text-sm font-bold ${
                    viewMode === mode ? 'bg-[#ffd400] text-[#0a0a0a] focus:bg-[#ffd400] focus:text-[#0a0a0a]' : 'text-[#0a0a0a] focus:bg-[#222222] focus:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </DropdownMenuItem>
              ))}
              <div className="font-tag text-[10px] tracking-[2px] text-[#a8a8a8] px-2 pt-2.5 pb-1.5 border-t border-[#2a2a2a] mt-1.5">FERRAMENTAS</div>
              <DropdownMenuItem
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-2.5 h-10 rounded-[10px] cursor-pointer text-sm font-bold text-white focus:bg-[#222222] focus:text-white"
              >
                <Calculator className="w-4 h-4 text-[#ffd400]" />
                Calculadora de cachê
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowAvailability(true)}
                className="flex items-center gap-2.5 h-10 rounded-[10px] cursor-pointer text-sm font-bold text-white focus:bg-[#222222] focus:text-white"
              >
                <Share2 className="w-4 h-4 text-[#ffd400]" />
                Mandar dias livres no WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportIcs}
                className="flex items-center gap-2.5 h-10 rounded-[10px] cursor-pointer text-sm font-bold text-white focus:bg-[#222222] focus:text-white"
              >
                <Download className="w-4 h-4 text-[#ffd400]" />
                Exportar agenda (iCal / Google)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filtros de status: pilulas All Access, rolam para o lado em vez de quebrar linha */}
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: 'all', label: 'Todos', count: activeEvents.length },
            { key: 'pending', label: 'Pendentes', count: activeEvents.filter(e => matchesStatusChip(e, 'pending')).length },
            { key: 'confirmed', label: 'Confirmados', count: activeEvents.filter(e => matchesStatusChip(e, 'confirmed')).length },
            { key: 'completed', label: 'Concluídos', count: activeEvents.filter(e => matchesStatusChip(e, 'completed')).length },
            { key: 'paid', label: 'Pagos', count: activeEvents.filter(e => e.payment_status === 'paid').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              aria-pressed={statusFilter === key}
              onClick={() => setStatusFilter(key)}
              className={`shrink-0 h-9 flex items-center gap-1.5 px-3.5 rounded-full text-xs font-extrabold transition-colors border ${
                statusFilter === key
                  ? 'bg-[#ffd400] border-[#ffd400] text-[#0a0a0a]'
                  : 'bg-[#161616] border-[#2a2a2a] text-[#a8a8a8] hover:text-white'
              }`}
            >
              {label}
              <span className={`font-tag text-[10px] px-1.5 rounded-full ${statusFilter === key ? 'bg-[#0a0a0a] text-[#ffd400]' : 'bg-[#222222] text-[#888888]'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Grade, Semana ou Lista */}
        {viewMode === 'grid' ? (
          <AllAccessCalendar
            currentDate={currentDate}
            events={filteredEvents}
            clients={clients}
            selectedDate={selectedDate}
            onDateSelect={(day) => setSelectedDate(day)}
            onEventClick={handleEventClick}
            onNewEvent={(date) => handleNewEvent(date)}
            onRegisterWork={(ev) => handleQuickLogForEvent(ev, selectedDate || new Date())}
            onAddExpense={(ev) => {
              setEditingExpense(null);
              setPrefilledEventIdForExpense(ev.id);
              setShowExpenseForm(true);
            }}
            formatCurrency={formatCurrency}
            isVisible={isVisible}
          />
        ) : viewMode === 'week' ? (
          <div
            className="space-y-3"
            onTouchStart={handleGridTouchStart}
            onTouchEnd={handleGridTouchEnd}
          >
            {/* Banner "Hoje" — aparece apenas quando a semana exibida contém hoje */}
            {(() => {
              const todayIso = format(new Date(), 'yyyy-MM-dd');
              const weekContainsToday = weekDays.some(d => format(d, 'yyyy-MM-dd') === todayIso);
              const todayEvents = weekEventsByDay.get(todayIso) || [];
              const todayActive = todayEvents.filter(ev => ev.status !== 'cancelled');
              if (!weekContainsToday || todayActive.length === 0) return null;
              return (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bp-today-surface">
                  <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: config.primaryHex }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold bp-text-primary">
                      Hoje — {todayActive.length} show{todayActive.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs truncate opacity-70 bp-text-primary">
                      {todayActive.map(ev => ev.title).join(' · ')}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Navegação semanal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekStart(w => subWeeks(w, 1))}
                  className="p-1.5 rounded-lg bg-[#1f1f1f]/60 border border-[#2a2a2a]/60 text-[#a8a8a8] hover:text-[#e0e0e0] hover:border-[#2a2a2a] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                  className="p-1.5 rounded-lg bg-[#1f1f1f]/60 border border-[#2a2a2a]/60 text-[#a8a8a8] hover:text-[#e0e0e0] hover:border-[#2a2a2a] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-[#c8c8c8]">
                {format(weekStart, "d 'de' MMM", { locale: ptBR })} –{' '}
                {format(endOfWeek(weekStart, { weekStartsOn: 0 }), "d 'de' MMM yyyy", { locale: ptBR })}
              </p>
              <button
                type="button"
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#1f1f1f]/60 border border-[#2a2a2a]/60 text-[#a8a8a8] bp-hover-primary transition-colors"
              >
                Hoje
              </button>
            </div>

            {/* Colunas dos 7 dias — scroll horizontal em mobile */}
            <div className="overflow-x-auto -mx-4 px-4 pb-1">
              <div className="grid grid-cols-7 gap-1.5 min-w-[560px]">
                {weekDays.map((day) => {
                  const iso = format(day, 'yyyy-MM-dd');
                  const isToday = iso === format(new Date(), 'yyyy-MM-dd');
                  const dayEvents = weekEventsByDay.get(iso) || [];
                  const visibleEvents = dayEvents.slice(0, 3);
                  const overflow = dayEvents.length - 3;
                  return (
                    <div
                      key={iso}
                      className={`flex flex-col rounded-xl border transition-colors min-h-[120px] ${
                        isToday
                          ? 'bp-today-surface-soft'
                          : 'bg-[#1f1f1f]/40 border-[#2a2a2a]/50'
                      }`}
                    >
                      {/* Cabeçalho do dia */}
                      <button
                        type="button"
                        onClick={(e) => handleDayClick(day, e.currentTarget)}
                        className={`px-2 pt-2 pb-1 border-b text-left w-full group ${isToday ? 'bp-today-surface' : 'border-[#2a2a2a]/40'}`}
                        title={`Novo evento em ${format(day, "d 'de' MMM", { locale: ptBR })}`}
                      >
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'bp-text-primary' : 'text-[#888888]'}`}>
                          {format(day, 'EEE', { locale: ptBR })}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className={`text-lg font-bold leading-none ${isToday ? 'bp-text-primary' : 'text-[#c8c8c8]'}`}>
                            {format(day, 'd')}
                          </p>
                          <span className="opacity-0 group-hover:opacity-60 text-[#a8a8a8] text-base leading-none transition-opacity">+</span>
                        </div>
                      </button>

                      {/* Eventos do dia */}
                      <div className="flex flex-col gap-1 p-1.5 flex-1">
                        {visibleEvents.map((ev) => {
                          const evColor = ev.color || DEFAULT_EVENT_COLOR;
                          const timeLabel = ev.start_time ? ev.start_time.slice(0, 5) : null;
                          const isCancelled = ev.status === 'cancelled';
                          const isPaid = ev.payment_status === 'paid';
                          const isConfirmed = ev.status === 'confirmed';
                          const amount = getEventCacheAmount(ev);
                          const statusColor = isPaid ? '#10b981' : isConfirmed ? '#f59e0b' : '#888888';
                          const StatusIcon = isPaid ? CheckCircle2 : isConfirmed ? BadgeCheck : Clock;
                          const durationDays = ev.start_date && ev.end_date
                            ? Math.round((new Date(ev.end_date) - new Date(ev.start_date)) / 86400000) + 1
                            : 1;
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => handleEventClick(ev)}
                              className={`w-full text-left rounded-md px-1.5 py-1.5 text-[11px] leading-tight font-medium transition-all flex flex-col gap-0.5 ${isCancelled ? 'opacity-40 line-through' : 'hover:brightness-125'}`}
                              style={{
                                backgroundColor: `${evColor}18`,
                                border: `1px solid ${evColor}45`,
                                borderLeft: `3px solid ${evColor}`,
                              }}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="truncate flex-1 text-[#f0f0f0]">{ev.title}</span>
                                <StatusIcon className="w-3 h-3 flex-shrink-0 opacity-80" style={{ color: statusColor }} />
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-[#a8a8a8] min-w-0">
                                {timeLabel && <span className="flex-shrink-0">{timeLabel}</span>}
                                {durationDays > 1 && <span className="text-[#888888] flex-shrink-0">· {durationDays}d</span>}
                                {amount > 0 && (
                                  <span className="ml-auto flex-shrink-0 font-semibold" style={{ color: isPaid ? '#10b981' : '#f59e0b' }}>
                                    {isVisible ? formatCurrency(amount) : '••••'}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {overflow > 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleDayClick(day, e.currentTarget)}
                            className="text-[10px] text-[#888888] text-center mt-0.5 w-full py-0.5 rounded hover:text-[#c8c8c8] transition-colors"
                          >
                            +{overflow} mais
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo da semana */}
            {(() => {
              const allWeekEvents = weekDays.flatMap(d => weekEventsByDay.get(format(d, 'yyyy-MM-dd')) || []);
              const activeEvents = allWeekEvents.filter(ev => ev.status !== 'cancelled');
              const weekTotal = activeEvents.reduce((s, ev) => s + getEventCacheAmount(ev), 0);
              if (activeEvents.length === 0) return null;
              return (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1f1f1f]/40 border border-[#2a2a2a]/50 text-sm">
                  <span className="text-[#a8a8a8]">
                    <span className="font-semibold text-[#e0e0e0]">{activeEvents.length}</span> show{activeEvents.length > 1 ? 's' : ''} na semana
                  </span>
                  {weekTotal > 0 && (
                    <span className="text-[#ffd400] font-semibold">{isVisible ? formatCurrency(weekTotal) : '••••'}</span>
                  )}
                </div>
              );
            })()}
          </div>
        ) : viewMode === 'upcoming' ? (
          <div className="space-y-4">
            {upcomingGroups.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center px-6"
              >
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-20" style={{ background: config.primaryHex, transform: 'scale(1.6)' }} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-[#1f1f1f]/60 border border-[#2a2a2a]/50">
                    <CalendarDays className="w-9 h-9 text-[#888888]" />
                  </div>
                </div>
                <p className="text-base font-semibold text-white mb-1">Agenda limpa</p>
                <p className="text-sm text-[#888888] mb-6 max-w-xs">Nenhum show agendado a partir de hoje. Que tal criar o próximo?</p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowEventForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`, boxShadow: `0 4px 16px ${config.primaryHex}30` }}
                >
                  <Plus className="w-4 h-4" />
                  Criar evento
                </motion.button>
              </motion.div>
            ) : upcomingGroups.map(({ key, label, events: upEvents }) => (
              <div key={key}>
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider px-1 mb-2">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {upEvents.map(({ ev, diff }, idx) => {
                    const cl = clientMap.get(ev.client_id);
                    const isPaid = ev.payment_status === 'paid';
                    const isConfirmed = ev.status === 'confirmed';
                    const evColor = ev.color || DEFAULT_EVENT_COLOR;
                    const timeLabel = ev.start_time ? ev.start_time.slice(0, 5) : null;
                    const amount = getEventCacheAmount(ev);
                    const isOverdue = ev.payment_due_date && isBefore(parseISO(ev.payment_due_date), new Date()) && !isPaid;
                    const diffLabel = diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : `em ${diff}d`;
                    const diffColor = diff === 0 ? '#f59e0b' : diff === 1 ? '#a78bfa' : '#888888';
                    const StatusIcon = isPaid ? CheckCircle2 : isOverdue ? AlertCircle : isConfirmed ? BadgeCheck : Clock;
                    const statusColor = isPaid ? '#10b981' : isOverdue ? '#f87171' : isConfirmed ? '#f59e0b' : '#888888';
                    const durationDays = ev.start_date && ev.end_date
                      ? Math.round((new Date(ev.end_date) - new Date(ev.start_date)) / 86400000) + 1
                      : 1;
                    return (
                      <motion.button
                        key={ev.id}
                        type="button"
                        onClick={() => handleEventClick(ev)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: Math.min(idx, 10) * 0.04, ease: 'easeOut' }}
                        whileTap={{ scale: 0.985 }}
                        className="w-full text-left bg-[#1f1f1f]/60 hover:bg-[#1f1f1f] border border-[#2a2a2a]/60 rounded-lg px-3 py-3 flex items-center gap-3 transition-colors"
                        style={isOverdue ? { borderColor: '#f8717130' } : undefined}
                      >
                        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: evColor }} />
                        <div className="w-14 text-center flex-shrink-0">
                          <p className="text-[10px] font-bold uppercase" style={{ color: diffColor }}>{diffLabel}</p>
                          <p className="text-xs text-[#888888] mt-0.5">
                            {format(parseISO(ev.start_date), 'dd/MM', { locale: ptBR })}
                          </p>
                          {durationDays > 1 && (
                            <p className="text-[9px] text-[#666666] mt-0.5">{durationDays}d</p>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <EventHeading event={ev} client={cl} size="sm" />
                          {timeLabel && (
                            <p className="text-[11px] text-[#888888] mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {timeLabel}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            {(ev.nfe_arquivo_url || ev.nfe_numero || ev.nf_number) && (
                              <FileText
                                className="w-3.5 h-3.5"
                                style={{ color: ev.nfe_analise?.cliente_reconhecido ? '#34d399' : '#60a5fa' }}
                                title={ev.nfe_analise?.cliente_reconhecido ? 'NF-e verificada' : 'NF-e anexada'}
                              />
                            )}
                            <StatusIcon className="w-4 h-4" style={{ color: statusColor }} />
                          </div>
                          {amount > 0 && (
                            <span className="text-[11px] font-semibold font-tag" style={{ color: isPaid ? '#10b981' : isOverdue ? '#f87171' : '#f59e0b' }}>
                              {isVisible ? formatCurrency(amount) : '••••'}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'kanban' ? (
          <Suspense fallback={<CalendarViewFallback />}>
            <KanbanPipeline
              events={filteredEvents}
              clients={clients}
              onEventClick={handleEventClick}
            />
          </Suspense>
        ) : (
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center px-6"
              >
                <div className="relative mb-5">
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-[#1f1f1f]/60 border border-[#2a2a2a]/50">
                    <List className="w-9 h-9 text-[#888888]" />
                  </div>
                </div>
                <p className="text-base font-semibold text-white mb-1">Nenhum evento encontrado</p>
                <p className="text-sm text-[#888888] mb-6 max-w-xs">Tente ajustar os filtros ou adicione um novo evento à sua agenda.</p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowEventForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`, boxShadow: `0 4px 16px ${config.primaryHex}30` }}
                >
                  <Plus className="w-4 h-4" />
                  Criar evento
                </motion.button>
              </motion.div>
            ) : listViewGroups.map(({ monthKey, label, events: monthEvents }) => (
              <div key={monthKey}>
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider px-1 mb-2 capitalize">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {monthEvents.map((ev) => {
                    const cl = clientMap.get(ev.client_id);
                    const isPaid = ev.payment_status === 'paid';
                    const evStatus = getEventStatus(ev);
                    const canQuickPay = (evStatus === 'completed' || evStatus === 'confirmed') && !isPaid;
                    // Mesmas cores da legenda da Agenda: amarelo confirmado, rosa a receber, cinza pago.
                    const statusBadge = isPaid
                      ? { label: 'Pago', cls: 'bg-[#2a2a2a] text-[#c8c8c8] border-[#2a2a2a]' }
                      : ({
                          pending:     { label: 'Pendente',     cls: 'bg-transparent text-[#c8c8c8] border-[#444444]' },
                          scheduled:   { label: 'Agendado',     cls: 'bg-transparent text-[#c8c8c8] border-[#444444]' },
                          confirmed:   { label: 'Confirmado',   cls: 'bg-[#ffd400] text-[#0a0a0a] border-[#ffd400]' },
                          in_progress: { label: 'Em andamento', cls: 'bg-[#ffd400] text-[#0a0a0a] border-[#ffd400]' },
                          completed:   { label: 'A receber',    cls: 'bg-[#ff2e88] text-[#0a0a0a] border-[#ff2e88]' },
                          cancelled:   { label: 'Cancelado',    cls: 'bg-transparent text-[#ff2e88] border-[#ff2e88]/60' },
                          archived:    { label: 'Arquivado',    cls: 'bg-[#2a2a2a] text-[#a8a8a8] border-[#2a2a2a]' },
                        }[evStatus] || { label: 'Agendado', cls: 'bg-transparent text-[#c8c8c8] border-[#444444]' });
                    const dayLabel = ev.start_date ? format(parseISO(ev.start_date), "EEE d", { locale: ptBR }) : '—';
                    const timeLabel = ev.start_time ? ev.start_time.slice(0, 5) : null;
                    const amount = getEventCacheAmount(ev);
                    return (
                      <div
                        key={ev.id}
                        className="w-full bg-[#161616] hover:bg-[#1c1c1c] border border-[#222222] hover:border-[#333333] rounded-xl px-4 py-3.5 flex items-center gap-3 transition-colors shadow-sm"
                      >
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0"
                          style={{ backgroundColor: ev.color || DEFAULT_EVENT_COLOR }}
                        />
                        <button
                          type="button"
                          onClick={() => handleEventClick(ev)}
                          className="w-10 text-center flex-shrink-0 hover:opacity-70 transition-opacity"
                        >
                          <p className="text-xs text-[#888888] capitalize">{dayLabel.split(' ')[0]}</p>
                          <p className="text-base font-bold text-[#e0e0e0] leading-none">{dayLabel.split(' ')[1]}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEventClick(ev)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <EventHeading event={ev} client={cl} size="sm" />
                          {timeLabel && (
                            <p className="text-[11px] text-[#888888] mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {timeLabel}
                            </p>
                          )}
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(ev.nfe_arquivo_url || ev.nfe_numero || ev.nf_number) && (
                            <FileText
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color: ev.nfe_analise?.cliente_reconhecido ? '#34d399' : '#60a5fa' }}
                              title={ev.nfe_analise?.cliente_reconhecido ? 'NF-e verificada' : 'NF-e anexada'}
                            />
                          )}
                          {canQuickPay && (
                            <button
                              type="button"
                              onClick={() => requestMarkPaid(ev)}
                              title="Marcar como pago"
                              className="p-1.5 rounded-lg bg-[#ffd400]/10 border border-[#ffd400]/30 text-[#ffd400] hover:bg-[#ffd400]/20 transition-colors"
                            >
                              <BadgeCheck className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex flex-col items-end gap-1">
                            <span className={`font-tag text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                            {amount > 0 && (
                              <span className="text-[10px] text-[#ffd400] font-medium">
                                {isVisible ? formatCurrency(amount) : '••••'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resultados de busca — lista cronológica (apenas no modo grid) */}
        {viewMode === 'grid' && searchQuery.trim() && (
          <div className="space-y-2">
            <p className="text-xs text-[#888888] font-medium px-1">
              {filteredEvents.length === 0
                ? 'Nenhum evento encontrado'
                : `${filteredEvents.length} evento${filteredEvents.length > 1 ? 's' : ''} encontrado${filteredEvents.length > 1 ? 's' : ''}`}
            </p>
            {[...filteredEvents]
              .sort((a, b) => (a.start_date > b.start_date ? 1 : -1))
              .map((ev) => {
                const cl = clientMap.get(ev.client_id);
                const isPaid = ev.payment_status === 'paid';
                const isConfirmed = ev.status === 'confirmed';
                const amount = getEventCacheAmount(ev);
                const StatusIcon = isPaid ? CheckCircle2 : isConfirmed ? BadgeCheck : ev.status === 'cancelled' ? AlertCircle : Clock;
                const statusColor = isPaid ? '#10b981' : isConfirmed ? '#f59e0b' : ev.status === 'cancelled' ? '#f87171' : '#888888';
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleEventClick(ev)}
                    className="w-full text-left bg-[#1f1f1f]/60 hover:bg-[#1f1f1f] border border-[#2a2a2a]/60 rounded-lg px-4 py-3 flex items-center gap-3 transition-colors"
                  >
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.color || DEFAULT_EVENT_COLOR }}
                    />
                    <div className="flex-1 min-w-0">
                      <EventHeading event={ev} client={cl} size="sm" />
                      <p className="text-[11px] text-[#888888] truncate mt-0.5">
                        {ev.start_date ? format(parseISO(ev.start_date), "d 'de' MMM yyyy", { locale: ptBR }) : '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        {(ev.nfe_arquivo_url || ev.nfe_numero || ev.nf_number) && (
                          <FileText
                            className="w-3.5 h-3.5"
                            style={{ color: ev.nfe_analise?.cliente_reconhecido ? '#34d399' : '#60a5fa' }}
                            title={ev.nfe_analise?.cliente_reconhecido ? 'NF-e verificada' : 'NF-e anexada'}
                          />
                        )}
                        <StatusIcon className="w-4 h-4" style={{ color: statusColor }} />
                      </div>
                      {amount > 0 && (
                        <span className="text-[11px] font-semibold font-tag" style={{ color: isPaid ? '#10b981' : '#f59e0b' }}>
                          {isVisible ? formatCurrency(amount) : '••••'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {/* Resumos abaixo do calendario (17/10): a grade aparece primeiro no celular. */}
        <AlertsPanel
          events={activeEvents}
          dailyWork={dailyWork}
          onRegisterWork={handleQuickWorkEntry}
          onLocationCheckIn={handleEventLocationCheckIn}
          onOpenEvent={setSelectedEvent}
        />

        {/* Na grade o cartao do dia selecionado (hoje, por padrao) ja mostra os shows de hoje. */}
        {viewMode !== 'grid' && (!isMobile || viewMode !== 'week') && (
          <CalendarTodayStrip
            events={activeEvents}
            dailyWork={dailyWork}
            clients={clients}
            primaryHex={config.primaryHex}
            accentHex={config.accentHex}
            onEventClick={handleEventClick}
            onRegisterWork={() => handleQuickWorkEntry()}
            onNewEvent={() => handleNewEvent()}
          />
        )}

        {/* Numeros do mes (tocar abre a lista de cada um) */}
        <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] pt-1">NÚMEROS DO MÊS</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
          <StatCard
            title="Eventos"
            value={monthStats.totalEvents}
            numericValue={monthStats.totalEvents}
            formatValue={(v) => String(Math.round(v))}
            icon={Calendar}
            color="text-[#ffd400]"
            onClick={handleEventsClick}
            loading={isCoreLoading || isSecondaryLoading}
          />

          <StatCard
            title="Dias de trabalho"
            value={monthStats.workDays}
            numericValue={monthStats.workDays}
            formatValue={(v) => String(Math.round(v))}
            icon={CheckCircle2}
            color="text-white"
            onClick={handleWorkDaysClick}
            loading={isCoreLoading || isSecondaryLoading}
          />

          <StatCard
            title="Horas trabalhadas"
            value={formatHours(monthStats.totalHours)}
            numericValue={monthStats.totalHours}
            formatValue={(v) => formatHours(v)}
            icon={Clock}
            color="text-white"
            onClick={handleHoursClick}
            loading={isCoreLoading || isSecondaryLoading}
          />

          <StatCard
            title="Receita estimada"
            value={isVisible ? formatCurrency(monthStats.totalRevenue) : '••••'}
            numericValue={isVisible ? monthStats.totalRevenue : null}
            formatValue={formatCurrency}
            icon={TrendingUp}
            color="text-white"
            onClick={handleRevenueClick}
            loading={isCoreLoading || isSecondaryLoading}
          />
        </div>
      </motion.div>

      {/* Ações Rápidas Desktop */}
      <DayQuickActions
        open={quickActions.open}
        date={quickActions.date}
        target={quickActions.target}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setQuickActions({ open: false, date: null, target: null });
          }
        }}
        onNewEvent={handleQuickAddEvent}
        onNewWork={handleQuickAddWork}
      />

      {/* Calculadora de cachê */}
      <Suspense fallback={null}>
        <CacheCalculator
          open={showCalculator}
          onClose={() => setShowCalculator(false)}
          onCreateEvent={(prefill) => {
            setShowCalculator(false);
            setPrefillEventData(prefill);
            setShowEventForm(true);
          }}
        />
      </Suspense>

      {/* Disponibilidade */}
      <Suspense fallback={null}>
        <AvailabilityShareModal
          open={showAvailability}
          onClose={() => setShowAvailability(false)}
          events={events}
          clients={clients}
        />
      </Suspense>

      {/* Modals */}
      <AnimatePresence>
        {showEventForm && (
          <EventForm
            key="m-event-form"
            isOpen={showEventForm}
            onClose={() => {
              setShowEventForm(false);
              setEditingEvent(null);
              setPrefillEventData(null);
            }}
            event={editingEvent}
            clients={clients}
            clientsLoading={clientsLoading}
            prefillData={prefillEventData}
            onSuccess={handleFormSuccess}
          />
        )}

        {showDailyWorkModal && (
          <DailyWorkModal
            key="m-daily-work"
            isOpen={showDailyWorkModal}
            onClose={closeModals}
            date={selectedDate}
            event={formPrefilledData?.event_id ? eventMap.get(formPrefilledData.event_id) : null}
            existingWork={editingWork}
            onSuccess={handleFormSuccess}
          />
        )}

        {selectedEvent && (
          <EventDetailModal
            key="m-event-detail"
            event={selectedEvent}
            client={clientMap.get(selectedEvent.client_id)}
            onClose={closeModals}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onDuplicate={handleDuplicateEvent}
            // So atualiza a tela: quem grava o pagamento e a janela do valor real (PaymentConfirmModal).
            onMarkPaid={handleFormSuccess}
          />
        )}

        {showExpenseForm && (
          <ExpenseForm
            key="m-expense"
            open={showExpenseForm}
            onOpenChange={setShowExpenseForm}
            expense={editingExpense}
            events={events}
            prefillEventId={prefilledEventIdForExpense}
            onSuccess={handleFormSuccess}
          />
        )}

        {multipleEventsModal && (
          <motion.div
            key="m-multiple-events"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[min(90dvh,32rem)] flex flex-col overflow-hidden"
            >
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2 shrink-0">
                <Clock className="w-5 h-5 text-[#ffd400]" />
                Selecionar Evento
              </h3>
              <p className="text-sm sm:text-base text-[#c8c8c8] mb-4 shrink-0">
                Encontramos {eventsForSelectedDate.length} eventos para{' '}
                {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}. Para qual evento você deseja
                registrar as horas?
              </p>

              <div className="bp-modal-scroll flex-1 min-h-0 space-y-2 sm:space-y-3 mb-4 pr-1">
                {(eventsForSelectedDate || []).map((event) => {
                  const client = clients.find((c) => c.id === event.client_id);
                  return (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => handleSelectEventFromMultiple(event)}
                      className="w-full text-left p-3 sm:p-4 bg-[#1f1f1f]/50 hover:bg-[#2a2a2a]/50 active:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: event.color || DEFAULT_EVENT_COLOR }} />

                        <div className="min-w-0 flex-1">
                          <EventHeading event={event} client={client} size="sm" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 sm:gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => closeModals()}
                  className="flex-1 bg-[#2a2a2a] border-[#2a2a2a] hover:bg-[#333333] h-12 text-sm sm:text-base"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {drilldownOpen && (
          <DrilldownModal
            key="m-drilldown"
            open={drilldownOpen}
            onOpenChange={setDrilldownOpen}
            title={drilldownTitle}
            items={drilldownItems}
            onItemClick={handleDrilldownItemClick}
          />
        )}

        {/* Action Sheets Mobile */}
        <EventActionSheet
          key="m-action-sheet"
          event={selectedActionSheetEvent}
          client={selectedActionSheetEvent ? clientMap.get(selectedActionSheetEvent.client_id) : null}
          isOpen={!!selectedActionSheetEvent}
          onClose={() => setSelectedActionSheetEvent(null)}
          onViewDetails={handleActionSheetViewDetails}
          onOpenHours={handleActionSheetOpenHours}
          onAddExpense={handleAddExpenseForEvent}
          onOpenNotes={handleActionSheetOpenNotes}
          onApplyManual12h={handleEventActionSheetApplyManual12h}
          onCheckInLocation={handleEventLocationCheckIn}
          canApplyAuto12h={selectedActionSheetEvent && !selectedActionSheetEvent.auto_hours_applied}
          onEdit={() => {
            setEditingEvent(selectedActionSheetEvent);
            setSelectedActionSheetEvent(null);
            setShowEventForm(true);
          }}
          onDuplicate={() => {
            if (selectedActionSheetEvent) {
              handleDuplicateEvent(selectedActionSheetEvent);
              setSelectedActionSheetEvent(null);
            }
          }}
          onDelete={() => {
            if (selectedActionSheetEvent) {
              handleDeleteEvent(selectedActionSheetEvent.id);
              setSelectedActionSheetEvent(null);
            }
          }}
          onMarkPaid={() => {
            if (selectedActionSheetEvent) {
              requestMarkPaid(selectedActionSheetEvent);
              setSelectedActionSheetEvent(null);
            }
          }}
        />

        {showMobileHoursSheet && mobileHoursEventData && (
          <EventHoursSheet
            key="m-hours-sheet"
            event={mobileHoursEventData.event}
            client={mobileHoursEventData.event ? clientMap.get(mobileHoursEventData.event.client_id) : null}
            isOpen={showMobileHoursSheet}
            onClose={() => {
              setShowMobileHoursSheet(false);
              setMobileHoursEventData(null);
            }}
            onSave={handleHoursSheetSave}
            initialDate={mobileHoursEventData.date ? new Date(mobileHoursEventData.date + 'T00:00:00') : selectedDate || new Date()}
            existingWork={mobileHoursEventData.existingWork}
          />
        )}

        {activeNotesEvent && (
          <NotesSheet
            key="m-notes-sheet"
            event={activeNotesEvent}
            client={activeNotesEvent ? clientMap.get(activeNotesEvent.client_id) : null}
            isOpen={!!activeNotesEvent}
            onClose={() => setActiveNotesEvent(null)}
            onSave={handleNotesSheetSave}
          />
        )}
      </AnimatePresence>

      <PaymentConfirmModal
        event={payEvent}
        client={payEvent ? clientMap.get(payEvent.client_id) : null}
        dailyWork={payEvent ? dailyWork.filter((w) => w.event_id === payEvent.id) : []}
        isOpen={!!payEvent}
        onClose={() => setPayEvent(null)}
        onSuccess={() => { setPayEvent(null); handleFormSuccess(); }}
      />

      <ConfirmDialog
        open={!!confirmWork}
        onOpenChange={(open) => !open && setConfirmWork(null)}
        title="Excluir registro de horas?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmWorkDelete}
      />

      <ConfirmDialog
        open={!!confirmEvent}
        onOpenChange={(open) => !open && setConfirmEvent(null)}
        title={`Excluir "${confirmEvent?.title}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDeleteEvent}
      />
    </div>
  );
}


