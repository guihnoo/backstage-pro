
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useQueryAction } from '@/lib/useQueryAction';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useDailyWork } from '@/lib/useDailyWork';
import { useExpenses } from '@/lib/useExpenses';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
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
  LayoutGrid,
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
} from 'lucide-react';
import { exportCalendarIcs } from '@/lib/exportReport';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, parseISO, isValid, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, differenceInCalendarDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BackstageCalendarGrid from '@/components/calendar/BackstageCalendarGrid';
import EventForm from '@/components/calendar/EventForm';
import DailyWorkModal from '@/components/calendar/DailyWorkModal';
import EventDetailModal from '@/components/reports/EventDetailModal';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import {
  normalizeDateString,
  todayLocalISO,
  getEventsForDate,
} from '@/components/utils/dateUtils';
import { isCancelledEvent } from '@/lib/eventFinance';
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
import AvailabilityShareModal from '@/components/calendar/AvailabilityShareModal';
import KanbanPipeline from '@/components/calendar/KanbanPipeline';
import CacheCalculator from '@/components/calendar/CacheCalculator';
import EventActionSheet from '@/components/mobile/EventActionSheet';
import EventHoursSheet from '@/components/mobile/EventHoursSheet';
import NotesSheet from '@/components/mobile/NotesSheet';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { applyAuto12Hours } from '@/lib/applyAuto12Hours';
import { useUserSettings } from '@/lib/useUserSettings';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { captureEventLocationFromGps } from '@/lib/eventLocation';
import { useAppScrollLock } from '@/lib/useAppScrollLock';
import EventHeading from '@/components/events/EventHeading';
import { enrichEventsWithClients, getClientDisplayName } from '@/lib/eventDisplay';

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
  subtext,
  icon: Icon,
  color,
  onClick,
  loading = false,
}) => (
  <Card
    className={`bg-slate-900/50 border-slate-800 transition-all duration-300 ${onClick ? 'hover:border-slate-700 cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-2">
          <p className="text-slate-400 text-xs uppercase font-medium tracking-wide mb-1 truncate">{title}</p>
          {loading ? (
            <Skeleton className="h-7 sm:h-8 w-16" />
          ) : numericValue != null && formatValue ? (
            <AnimatedStatValue
              value={numericValue}
              format={formatValue}
              className={`text-xl sm:text-2xl font-bold ${color} truncate block`}
            />
          ) : (
            <p className={`text-xl sm:text-2xl font-bold ${color} truncate`}>{value}</p>
          )}
          {subtext && <p className="text-slate-500 text-xs mt-1 truncate">{subtext}</p>}
        </div>
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${color} opacity-60 flex-shrink-0`} />
      </div>
    </CardContent>
  </Card>
);

export default function CalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents, update: updateEvent, delete: deleteEvent } = useEvents();
  const { clients, loading: clientsLoading } = useClients();
  const { dailyWork, loading: dailyWorkLoading, refetch: refetchDailyWork, delete: deleteDailyWorkEntry } = useDailyWork();
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { settings: userSettings } = useUserSettings();

  const unsyncedCount = useMemo(() => {
    if (!userSettings?.google_calendar_connected) return 0;
    return events.filter((e) => !e.google_event_id && !isCancelledEvent(e)).length;
  }, [events, userSettings?.google_calendar_connected]);

  const isLoading = eventsLoading || clientsLoading || dailyWorkLoading || expensesLoading;
  const isDataReady = Array.isArray(events) && Array.isArray(clients) && Array.isArray(dailyWork) && Array.isArray(expenses);

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
    else if (statusFilter !== 'all') base = base.filter((e) => e.status === statusFilter);
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
      map.set(iso, filteredEvents.filter(ev => (ev.start_date || '').slice(0, 10) === iso));
    }
    return map;
  }, [weekDays, filteredEvents]);

  const upcomingGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = format(today, 'yyyy-MM-dd');
    const upcoming = activeEvents
      .filter(ev => (ev.start_date || '') >= todayIso)
      .sort((a, b) => (a.start_date > b.start_date ? 1 : -1));

    const groups = [];
    for (const ev of upcoming) {
      const evDate = parseISO(ev.start_date);
      const diff = differenceInCalendarDays(evDate, today);
      let groupKey, groupLabel;
      if (diff === 0)        { groupKey = 'hoje';         groupLabel = 'Hoje'; }
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
  }, [activeEvents]);

  const todayStr = todayLocalISO();
  const isLiveShiftToday = useMemo(() => {
    const todayEvents = getEventsForDate(activeEvents, todayStr);
    return todayEvents.some((event) => {
      const work = dailyWork.find(
        (w) => w.event_id === event.id && normalizeDateString(w.date) === todayStr
      );
      return work?.entry_time && !work?.exit_time;
    });
  }, [activeEvents, dailyWork, todayStr]);
  useQueryAction('new-event', useCallback(() => {
    setShowEventForm(true);
    setEditingEvent(null);
  }, []));

  // Abre o formulário com cliente pré-selecionado quando ?action=new-event&client_id=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientId = params.get('client_id');
    const action = params.get('action');
    if (action === 'new-event' && clientId) {
      setPrefillEventData((prev) => ({ ...(prev || {}), client_id: clientId }));
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  // Abre EventDetailModal quando ?event=ID vem de outra página
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventId = params.get('event');
    if (eventId && eventMap.size > 0) {
      const ev = eventMap.get(eventId);
      if (ev) {
        setSelectedEvent(ev);
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, location.pathname, navigate, eventMap]);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const eventMap = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);

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

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
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

  const handleEditWork = useCallback(
    (work) => {
      closeModals();

      if (work && !work.id) {
        setEditingWork(null); // This is a new work entry
        setFormPrefilledData(work);
        if (work.date) {
          setSelectedDate(new Date(work.date + 'T00:00:00'));
        }
      } else {
        setEditingWork(work); // This is an existing work entry
        if (work?.date) {
          setSelectedDate(new Date(work.date + 'T00:00:00'));
        }
      }
      setShowDailyWorkModal(true); // Renamed state
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

  const handleWorkDelete = useCallback(
    (workId) => {
      if (!workId) return;
      setConfirmWork(workId);
    },
    []
  );

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

  const handleAddWorkForEvent = useCallback(
    (event) => {
      closeModals();
      const today = normalizeDateString(new Date());
      const start = normalizeDateString(event.start_date);
      const end = normalizeDateString(event.end_date || event.start_date);
      // Use today if within event range, otherwise use event start date
      const workDate = today >= start && today <= end ? today : start;
      setFormPrefilledData({ event_id: event.id, date: workDate });
      setSelectedDate(new Date(workDate + 'T00:00:00'));
      setShowDailyWorkModal(true);
    },
    [closeModals]
  );

  const handleEditExpense = useCallback(
    (expense, event) => {
      closeModals();
      setPrefilledEventIdForExpense(event.id);
      setEditingExpense(expense);
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
        const updateData = { payment_status: newStatus };
        if (newStatus === 'paid') updateData.paid_date = new Date().toISOString().split('T')[0];
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
    [handleFormSuccess, updateEvent]
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
    if (!isDataReady) {
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
      const fromWork = dailyWork
        .filter(w => w.event_id === event.id)
        .reduce((s, w) => s + (Number(w.daily_cache) || 0), 0);
      return sum + (fromWork > 0 ? fromWork : getEventCacheAmount(event));
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
  }, [currentDate, isDataReady, events, dailyWork]);

  const handleEventsClick = useCallback(() => {
    closeModals();
    const items = monthStats.monthEvents
      .map((event) => {
        const client = clientMap.get(event.client_id);
        const startDate = parseISO(event.start_date);
        const endDate = parseISO(event.end_date);
        const fromWork = dailyWork
          .filter(w => w.event_id === event.id)
          .reduce((s, w) => s + (Number(w.daily_cache) || 0), 0);
        const value = fromWork > 0 ? fromWork : getEventCacheAmount(event);
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
          amountFormatted: `${(Number(work.total_hours) || 0).toFixed(1)}h`,
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
        const fromWork = dailyWork
          .filter(w => w.event_id === event.id)
          .reduce((s, w) => s + (Number(w.daily_cache) || 0), 0);
        const value = fromWork > 0 ? fromWork : getEventCacheAmount(event);
        const statusLabel = event.payment_status === 'paid' ? 'Pago' : event.payment_status === 'partial' ? 'Parcial' : 'Pendente';
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

  if (authLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        <CalendarSkeleton />
      </div>
    );
  }

  if (!isDataReady && isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        <CalendarSkeleton />
      </div>
    );
  }

  const hasError = Boolean(eventsError);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-400">Erro ao carregar agenda</h2>
        <p className="text-red-300 mt-2 max-w-md">Não foi possível carregar sua agenda. Por favor, tente novamente.</p>
        <Button onClick={() => { refetchEvents(); refetchDailyWork(); refetchExpenses(); }} className="mt-4 bg-red-600 hover:bg-red-700">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
        <CalendarPageHeader
          currentDate={currentDate}
          primaryHex={config.primaryHex}
          isLive={isLiveShiftToday}
          unsyncedCount={unsyncedCount}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onGoToToday={goToToday}
          onNewEvent={() => handleNewEvent()}
          onRegisterWork={() => handleQuickWorkEntry()}
          onSyncNow={() => hardNavigate('/profile?tab=google')}
          monthStats={{
            showCount: monthStats.totalEvents,
            received: monthStats.received,
            pending: monthStats.pending,
          }}
          formatCurrency={formatCurrency}
        />

        {!clientsLoading && clients.length === 0 && (
          <Alert className="border-amber-500/40 bg-amber-500/10">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <AlertDescription className="text-amber-100 text-sm">
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
          <Alert className="border-red-500 bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              <strong>Erro:</strong> {eventsError}
            </AlertDescription>
          </Alert>
        )}

        <AlertsPanel
          events={activeEvents}
          dailyWork={dailyWork}
          onRegisterWork={handleQuickWorkEntry}
          onLocationCheckIn={handleEventLocationCheckIn}
          onOpenEvent={setSelectedEvent}
        />

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

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <StatCard
            title="Eventos"
            value={monthStats.totalEvents}
            numericValue={monthStats.totalEvents}
            formatValue={(v) => String(Math.round(v))}
            subtext={monthStats.totalEvents === 1 ? 'evento' : 'eventos'}
            icon={Calendar}
            color="bp-text-primary"
            onClick={handleEventsClick}
            loading={isLoading}
          />

          <StatCard
            title="Dias"
            value={monthStats.workDays}
            numericValue={monthStats.workDays}
            formatValue={(v) => String(Math.round(v))}
            subtext={monthStats.workDays === 1 ? 'dia' : 'dias'}
            icon={CheckCircle2}
            color="text-green-400"
            onClick={handleWorkDaysClick}
            loading={isLoading}
          />

          <StatCard
            title="Horas"
            value={`${monthStats.totalHours}h`}
            numericValue={monthStats.totalHours}
            formatValue={(v) => `${Number(v).toFixed(1)}h`}
            subtext="trabalhadas"
            icon={Clock}
            color="text-amber-400"
            onClick={handleHoursClick}
            loading={isLoading}
          />

          <StatCard
            title="Receita"
            value={isVisible ? formatCurrency(monthStats.totalRevenue) : '••••'}
            numericValue={isVisible ? monthStats.totalRevenue : null}
            formatValue={formatCurrency}
            subtext="estimada no mês"
            icon={TrendingUp}
            color="text-emerald-400"
            onClick={handleRevenueClick}
            loading={isLoading}
          />
        </div>

        {/* Busca de eventos */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, cliente ou local…"
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg pl-9 pr-9 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none bp-focus-input transition-colors"
            aria-label="Buscar eventos"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros de status + toggle de vista */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Todos', count: activeEvents.length },
            { key: 'pending', label: 'Pendentes', count: activeEvents.filter(e => e.status === 'pending').length },
            { key: 'confirmed', label: 'Confirmados', count: activeEvents.filter(e => e.status === 'confirmed').length },
            { key: 'completed', label: 'Concluídos', count: activeEvents.filter(e => e.status === 'completed').length },
            { key: 'paid', label: 'Pagos', count: activeEvents.filter(e => e.payment_status === 'paid').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                statusFilter === key
                  ? 'bp-chip-active'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === key ? 'bp-chip-badge-active' : 'bg-slate-700 text-slate-500'}`}>
                {count}
              </span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/60 rounded-lg p-0.5">
              {/* Views primárias */}
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Vista em grade mensal"
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bp-view-active' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('upcoming')}
                title="Próximos shows"
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'upcoming' ? 'bg-amber-600/30 text-amber-300' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Zap className="w-4 h-4" />
              </button>
              {/* Views secundárias no overflow */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Mais vistas"
                    className={`p-1.5 rounded-md transition-colors ${['week', 'list', 'kanban'].includes(viewMode) ? 'bp-view-active' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="bg-slate-900 border-slate-700 min-w-[160px] z-[110]">
                  <DropdownMenuItem
                    onClick={() => { setViewMode('week'); setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 })); }}
                    className={`flex items-center gap-2 cursor-pointer ${viewMode === 'week' ? 'text-white bg-slate-700/50' : 'text-slate-300'}`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    Vista Semanal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 cursor-pointer ${viewMode === 'list' ? 'text-white bg-slate-700/50' : 'text-slate-300'}`}
                  >
                    <List className="w-4 h-4" />
                    Vista em Lista
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-2 cursor-pointer ${viewMode === 'kanban' ? 'text-white bg-slate-700/50' : 'text-slate-300'}`}
                  >
                    <Columns2 className="w-4 h-4" />
                    Pipeline Kanban
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              type="button"
              onClick={() => setShowCalculator(true)}
              title="Calculadora de cachê"
              className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-500 hover:text-yellow-400 hover:border-yellow-600/40 transition-colors"
            >
              <Calculator className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowAvailability(true)}
              title="Compartilhar disponibilidade via WhatsApp"
              className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-500 hover:text-green-400 hover:border-green-600/40 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportIcs}
              title="Exportar agenda como ICS (iCal / Google Calendar)"
              className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grade, Semana ou Lista */}
        {viewMode === 'grid' ? (
          <Card
            className="bg-slate-900/50 border-slate-800 overflow-hidden"
            onTouchStart={handleGridTouchStart}
            onTouchEnd={handleGridTouchEnd}
          >
            <CardContent className="p-0">
              <BackstageCalendarGrid
                currentDate={currentDate}
                events={filteredEvents}
                clients={clients}
                dailyWork={dailyWork}
                selectedDate={selectedDate}
                onDateSelect={handleDayClick}
                onEventClick={handleEventClick}
                onEventQuickLog={handleQuickLogForEvent}
                loading={false}
              />
            </CardContent>
          </Card>
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
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-300 capitalize">
                {format(weekStart, "d 'de' MMM", { locale: ptBR })} –{' '}
                {format(endOfWeek(weekStart, { weekStartsOn: 0 }), "d 'de' MMM yyyy", { locale: ptBR })}
              </p>
              <button
                type="button"
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 bp-hover-primary transition-colors"
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
                          : 'bg-slate-800/40 border-slate-700/50'
                      }`}
                    >
                      {/* Cabeçalho do dia */}
                      <button
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={`px-2 pt-2 pb-1 border-b text-left w-full group ${isToday ? 'bp-today-surface' : 'border-slate-700/40'}`}
                        title={`Novo evento em ${format(day, "d 'de' MMM", { locale: ptBR })}`}
                      >
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'bp-text-primary' : 'text-slate-500'}`}>
                          {format(day, 'EEE', { locale: ptBR })}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className={`text-lg font-bold leading-none ${isToday ? 'bp-text-primary' : 'text-slate-300'}`}>
                            {format(day, 'd')}
                          </p>
                          <span className="opacity-0 group-hover:opacity-60 text-slate-400 text-base leading-none transition-opacity">+</span>
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
                          const statusColor = isPaid ? '#10b981' : isConfirmed ? '#f59e0b' : '#64748b';
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
                                <span className="truncate flex-1 text-slate-100">{ev.title}</span>
                                <StatusIcon className="w-3 h-3 flex-shrink-0 opacity-80" style={{ color: statusColor }} />
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 min-w-0">
                                {timeLabel && <span className="flex-shrink-0">{timeLabel}</span>}
                                {durationDays > 1 && <span className="text-slate-500 flex-shrink-0">· {durationDays}d</span>}
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
                            onClick={() => handleDayClick(day)}
                            className="text-[10px] text-slate-500 text-center mt-0.5 w-full py-0.5 rounded hover:text-slate-300 transition-colors"
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
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-sm">
                  <span className="text-slate-400">
                    <span className="font-semibold text-slate-200">{activeEvents.length}</span> show{activeEvents.length > 1 ? 's' : ''} na semana
                  </span>
                  {weekTotal > 0 && (
                    <span className="text-emerald-400 font-semibold">{isVisible ? formatCurrency(weekTotal) : '••••'}</span>
                  )}
                </div>
              );
            })()}
          </div>
        ) : viewMode === 'upcoming' ? (
          <div className="space-y-4">
            {upcomingGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <CalendarDays className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">Nenhum show agendado a partir de hoje</p>
                <p className="text-xs text-slate-600 mt-1">Toque em + para criar seu próximo evento</p>
              </div>
            ) : upcomingGroups.map(({ key, label, events: upEvents }) => (
              <div key={key}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {upEvents.map(({ ev, diff }) => {
                    const cl = clientMap.get(ev.client_id);
                    const isPaid = ev.payment_status === 'paid';
                    const isConfirmed = ev.status === 'confirmed';
                    const evColor = ev.color || DEFAULT_EVENT_COLOR;
                    const timeLabel = ev.start_time ? ev.start_time.slice(0, 5) : null;
                    const amount = getEventCacheAmount(ev);
                    const isOverdue = ev.payment_due_date && isBefore(parseISO(ev.payment_due_date), new Date()) && !isPaid;
                    const diffLabel = diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : `em ${diff}d`;
                    const diffColor = diff === 0 ? '#f59e0b' : diff === 1 ? '#a78bfa' : '#64748b';
                    const StatusIcon = isPaid ? CheckCircle2 : isOverdue ? AlertCircle : isConfirmed ? BadgeCheck : Clock;
                    const statusColor = isPaid ? '#10b981' : isOverdue ? '#f87171' : isConfirmed ? '#f59e0b' : '#64748b';
                    const durationDays = ev.start_date && ev.end_date
                      ? Math.round((new Date(ev.end_date) - new Date(ev.start_date)) / 86400000) + 1
                      : 1;
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => handleEventClick(ev)}
                        className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-3 flex items-center gap-3 transition-colors"
                        style={isOverdue ? { borderColor: '#f8717130' } : undefined}
                      >
                        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: evColor }} />
                        <div className="w-14 text-center flex-shrink-0">
                          <p className="text-[10px] font-bold uppercase" style={{ color: diffColor }}>{diffLabel}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {format(parseISO(ev.start_date), 'dd/MM', { locale: ptBR })}
                          </p>
                          {durationDays > 1 && (
                            <p className="text-[9px] text-slate-600 mt-0.5">{durationDays}d</p>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <EventHeading event={ev} client={cl} size="sm" />
                          {timeLabel && (
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {timeLabel}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            {ev.status === 'completed' && (ev.nfe_arquivo_url || ev.nfe_numero) && (
                              <FileText
                                className="w-3.5 h-3.5"
                                style={{ color: ev.nfe_analise?.cliente_reconhecido ? '#34d399' : '#60a5fa' }}
                                title={ev.nfe_analise?.cliente_reconhecido ? 'NF-e verificada' : 'NF-e registrada'}
                              />
                            )}
                            <StatusIcon className="w-4 h-4" style={{ color: statusColor }} />
                          </div>
                          {amount > 0 && (
                            <span className="text-[11px] font-semibold font-mono" style={{ color: isPaid ? '#10b981' : isOverdue ? '#f87171' : '#f59e0b' }}>
                              {isVisible ? formatCurrency(amount) : '••••'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanPipeline
            events={filteredEvents}
            clients={clients}
            onEventClick={handleEventClick}
          />
        ) : (
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <List className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">Nenhum evento encontrado</p>
                <p className="text-xs text-slate-600 mt-1">Tente ajustar os filtros ou crie um novo evento</p>
              </div>
            ) : listViewGroups.map(({ monthKey, label, events: monthEvents }) => (
              <div key={monthKey}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2 capitalize">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {monthEvents.map((ev) => {
                    const cl = clientMap.get(ev.client_id);
                    const isPaid = ev.payment_status === 'paid';
                    const canQuickPay = (ev.status === 'completed' || ev.status === 'confirmed') && !isPaid;
                    const statusBadge = isPaid
                      ? { label: 'Pago', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
                      : ({
                          pending:   { label: 'Pendente',   cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
                          confirmed: { label: 'Confirmado', cls: 'bp-surface-primary bp-text-primary border' },
                          completed: { label: 'Concluído',  cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
                          cancelled: { label: 'Cancelado',  cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
                        }[ev.status] || { label: ev.status, cls: 'bg-slate-700 text-slate-400 border-slate-600' });
                    const dayLabel = ev.start_date ? format(parseISO(ev.start_date), "EEE d", { locale: ptBR }) : '—';
                    const timeLabel = ev.start_time ? ev.start_time.slice(0, 5) : null;
                    const amount = getEventCacheAmount(ev);
                    return (
                      <div
                        key={ev.id}
                        className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-3 flex items-center gap-3 transition-colors"
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
                          <p className="text-xs text-slate-500 capitalize">{dayLabel.split(' ')[0]}</p>
                          <p className="text-base font-bold text-slate-200 leading-none">{dayLabel.split(' ')[1]}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEventClick(ev)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <EventHeading event={ev} client={cl} size="sm" />
                          {timeLabel && (
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {timeLabel}
                            </p>
                          )}
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {ev.status === 'completed' && (ev.nfe_arquivo_url || ev.nfe_numero) && (
                            <FileText
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color: ev.nfe_analise?.cliente_reconhecido ? '#34d399' : '#60a5fa' }}
                              title={ev.nfe_analise?.cliente_reconhecido ? 'NF-e verificada' : 'NF-e registrada'}
                            />
                          )}
                          {canQuickPay && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(ev)}
                              title="Marcar como pago"
                              className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <BadgeCheck className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                            {amount > 0 && (
                              <span className="text-[10px] text-emerald-400 font-medium">
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
            <p className="text-xs text-slate-500 font-medium px-1">
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
                const statusColor = isPaid ? '#10b981' : isConfirmed ? '#f59e0b' : ev.status === 'cancelled' ? '#f87171' : '#64748b';
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleEventClick(ev)}
                    className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-3 flex items-center gap-3 transition-colors"
                  >
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.color || DEFAULT_EVENT_COLOR }}
                    />
                    <div className="flex-1 min-w-0">
                      <EventHeading event={ev} client={cl} size="sm" />
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {ev.start_date ? format(parseISO(ev.start_date), "d 'de' MMM yyyy", { locale: ptBR }) : '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        {ev.status === 'completed' && (ev.nfe_arquivo_url || ev.nfe_numero) && (
                          <FileText
                            className="w-3.5 h-3.5"
                            style={{ color: ev.nfe_analise?.cliente_reconhecido ? '#34d399' : '#60a5fa' }}
                            title={ev.nfe_analise?.cliente_reconhecido ? 'NF-e verificada' : 'NF-e registrada'}
                          />
                        )}
                        <StatusIcon className="w-4 h-4" style={{ color: statusColor }} />
                      </div>
                      {amount > 0 && (
                        <span className="text-[11px] font-semibold font-mono" style={{ color: isPaid ? '#10b981' : '#f59e0b' }}>
                          {isVisible ? formatCurrency(amount) : '••••'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
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
      <CacheCalculator
        open={showCalculator}
        onClose={() => setShowCalculator(false)}
        onCreateEvent={(prefill) => {
          setShowCalculator(false);
          setPrefillEventData(prefill);
          setShowEventForm(true);
        }}
      />

      {/* Disponibilidade */}
      <AvailabilityShareModal
        open={showAvailability}
        onClose={() => setShowAvailability(false)}
        events={events}
        clients={clients}
      />

      {/* Modals */}
      <AnimatePresence>
        {showEventForm && (
          <EventForm
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
            event={selectedEvent}
            onClose={closeModals}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onDuplicate={handleDuplicateEvent}
            onPaymentUpdate={handleFormSuccess}
            onWorkEdit={handleEditWork}
            onWorkDelete={handleWorkDelete}
            onAddWork={handleAddWorkForEvent}
            onAddExpense={handleAddExpenseForEvent}
            onExpenseEdit={handleEditExpense}
            onExpenseDelete={handleFormSuccess}
            onApply12h={handleEventActionSheetApplyManual12h}
            onMarkPaid={handleMarkPaid}
            dailyWork={dailyWork.filter((w) => w?.event_id === selectedEvent?.id)}
            expenses={expenses.filter((e) => e?.event_id === selectedEvent?.id)}
            client={clientMap.get(selectedEvent.client_id)}
          />
        )}

        {showExpenseForm && (
          <ExpenseForm
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-md w-full"
            >
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                Selecionar Evento
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mb-6">
                Encontramos {eventsForSelectedDate.length} eventos para{' '}
                {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}. Para qual evento você deseja
                registrar as horas?
              </p>

              <div className="space-y-2 sm:space-y-3 mb-6 max-h-80 overflow-y-auto pr-2">
                {(eventsForSelectedDate || []).map((event) => {
                  const client = clients.find((c) => c.id === event.client_id);
                  return (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => handleSelectEventFromMultiple(event)}
                      className="w-full text-left p-3 sm:p-4 bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
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

              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => closeModals()}
                  className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600 h-12 text-sm sm:text-base"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {drilldownOpen && (
          <DrilldownModal
            open={drilldownOpen}
            onOpenChange={setDrilldownOpen}
            title={drilldownTitle}
            items={drilldownItems}
            onItemClick={handleDrilldownItemClick}
          />
        )}

        {/* Action Sheets Mobile */}
        <EventActionSheet
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
              handleMarkPaid(selectedActionSheetEvent);
              setSelectedActionSheetEvent(null);
            }
          }}
        />

        {showMobileHoursSheet && mobileHoursEventData && (
          <EventHoursSheet
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
            event={activeNotesEvent}
            client={activeNotesEvent ? clientMap.get(activeNotesEvent.client_id) : null}
            isOpen={!!activeNotesEvent}
            onClose={() => setActiveNotesEvent(null)}
            onSave={handleNotesSheetSave}
          />
        )}
      </AnimatePresence>

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
    </NeonPageShell>
  );
}


