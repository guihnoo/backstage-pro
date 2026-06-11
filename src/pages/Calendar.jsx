
import { useState, useMemo, useCallback, useEffect } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useQueryAction } from '@/lib/useQueryAction';
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
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
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
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import DrilldownModal from '@/components/reports/DrilldownModal';
import DayQuickActions from '@/components/calendar/DayQuickActions';
import AlertsPanel from '@/components/calendar/AlertsPanel';
import EventActionSheet from '@/components/mobile/EventActionSheet';
import EventHoursSheet from '@/components/mobile/EventHoursSheet';
import NotesSheet from '@/components/mobile/NotesSheet';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { applyAuto12Hours } from '@/lib/applyAuto12Hours';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { captureEventLocationFromGps } from '@/lib/eventLocation';
import { useAppScrollLock } from '@/lib/useAppScrollLock';

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
  const { user, profile, loading: authLoading } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents, update: updateEvent, delete: deleteEvent } = useEvents();
  const { clients, loading: clientsLoading } = useClients();
  const { dailyWork, loading: dailyWorkLoading, refetch: refetchDailyWork, create: createDailyWork, update: updateDailyWork, delete: deleteDailyWorkEntry } = useDailyWork();
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { formatCurrency } = useFinancialVisibility();

  const isLoading = eventsLoading || clientsLoading || dailyWorkLoading || expensesLoading;
  const isDataReady = Array.isArray(events) && Array.isArray(clients) && Array.isArray(dailyWork) && Array.isArray(expenses);

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
  const [confirmWork, setConfirmWork] = useState(null);
  const [confirmEvent, setConfirmEvent] = useState(null);

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
    () => events.filter((e) => !isCancelledEvent(e)),
    [events]
  );

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return activeEvents;
    if (statusFilter === 'paid') return activeEvents.filter((e) => e.payment_status === 'paid');
    return activeEvents.filter((e) => e.status === statusFilter);
  }, [activeEvents, statusFilter]);

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
        toast.info(`Não há eventos para ${format(targetDate, "dd 'de' MMMM", { locale: ptBR })}`, {
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
        client_name: client?.name || 'Cliente Desconhecido',
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
      });
      setShowEventForm(true);
      toast.info('Preencha as novas datas para o evento duplicado');
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
      toast.success('Registro de horas excluído com sucesso!');
      handleFormSuccess();
    } catch (err) {
      console.error('Erro ao excluir registro de trabalho:', err);
      toast.error('Erro ao excluir o registro de horas.', { description: 'Por favor, tente novamente.' });
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
      if (!eventToDelete) { toast.error('Evento não encontrado para exclusão.'); return; }
      setConfirmEvent(eventToDelete);
    },
    [events]
  );

  const handleConfirmDeleteEvent = useCallback(async () => {
    try {
      await deleteEvent(confirmEvent.id);
      toast.success(`Evento "${confirmEvent.title}" foi excluído com sucesso!`);
      handleFormSuccess();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      toast.error('Erro ao excluir o evento.', { description: 'Por favor, tente novamente.' });
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
        toast.success(
          newStatus === 'paid'
            ? `"${eventToUpdate.title}" marcado como pago!`
            : `"${eventToUpdate.title}" desmarcado — pagamento pendente`
        );
        handleFormSuccess();
      } catch (err) {
        console.error('Erro ao atualizar status de pagamento:', err);
        toast.error('Erro ao atualizar status de pagamento.');
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
      const dateStr = selectedActionSheetEvent.start_date; // Use event start date for initial hours date
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
        toast.success('Local registrado no evento', {
          description: (captured.label || captured.location || '').slice(0, 80),
        });
        await refetchEvents();
      } catch (err) {
        toast.error(err.message || 'Não foi possível registrar o local.');
        throw err;
      }
    },
    [updateEvent, refetchEvents],
  );

  const handleEventActionSheetApplyManual12h = useCallback(
    async (event) => {
      if (!event?.id || !user?.id) {
        toast.error('Nenhum evento selecionado para aplicar horas.');
        return;
      }
      try {
        const result = await applyAuto12Hours({
          eventId: event.id,
          userId: user.id,
          origin: 'manual_12h',
        });
        if (result.data?.success) {
          toast.success('12 horas aplicadas automaticamente!', {
            description: `${result.data.daysCreated || 1} dia(s) registrado(s). Você pode editar depois.`,
          });
          setSelectedActionSheetEvent(null);
          handleFormSuccess();
        } else {
          toast.error('Erro ao aplicar horas', {
            description: result.data?.error || 'Tente novamente.',
          });
        }
      } catch (error) {
        console.error('Erro ao aplicar 12h automáticas:', error);
        toast.error('Erro ao aplicar horas automáticas', {
          description: error.message || 'Tente novamente.',
        });
      }
    },
    [user?.id, handleFormSuccess]
  );

  const handleHoursSheetSave = useCallback(
    async (workData) => {
      try {
        if (!mobileHoursEventData?.event) {
          toast.error('Nenhum evento selecionado para registrar horas.');
          return;
        }
        const payload = {
          ...workData,
          event_id: mobileHoursEventData.event.id,
          work_date: normalizeDateString(workData.work_date || workData.date || new Date()),
          hours_worked: Number(workData.hours_worked ?? workData.total_hours ?? 0),
          status: workData.status || 'completed',
          user_id: user?.id,
        };

        delete payload.date;
        delete payload.total_hours;

        if (mobileHoursEventData.existingWork?.id) {
          await updateDailyWork(mobileHoursEventData.existingWork.id, payload);
          toast.success('Horas atualizadas com sucesso!');
        } else {
          await createDailyWork(payload);
          toast.success('Horas registradas com sucesso!');
        }

        handleFormSuccess();
      } catch (error) {
        console.error('Erro ao salvar horas:', error);
        toast.error('Erro ao registrar horas');
      }
    },
    [mobileHoursEventData, handleFormSuccess, user, updateDailyWork, createDailyWork]
  );

  const handleNotesSheetSave = useCallback(
    async (notesData) => {
      try {
        if (!activeNotesEvent) {
          toast.error('Nenhum evento selecionado para salvar observações.');
          return;
        }
        await updateEvent(activeNotesEvent.id, notesData);
        toast.success('Observações salvas!');
        handleFormSuccess();
      } catch (error) {
        console.error('Erro ao salvar observações:', error);
        toast.error('Erro ao salvar observações');
      }
    },
    [activeNotesEvent, handleFormSuccess, updateEvent]
  );

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

    return {
      totalEvents,
      workDays,
      totalHours: Math.round(totalHours * 10) / 10,
      totalRevenue,
      uniqueClients,
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
          subtitle: `${client?.name || 'Cliente'} · ${isValid(startDate) ? format(startDate, 'dd/MM', { locale: ptBR }) : ''}${
            isValid(endDate) && endDate.getTime() !== startDate.getTime()
              ? `–${format(endDate, 'dd/MM', { locale: ptBR })}`
              : ''
          }`,
          amount: value,
          amountFormatted: value > 0 ? formatCurrency(value) : null,
          event_id: event.id,
          dateSort: isValid(startDate) ? startDate.getTime() : 0,
        };
      })
      .sort((a, b) => b.dateSort - a.dateSort);

    setDrilldownTitle(`Eventos de ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(items);
    setDrilldownOpen(true);
  }, [monthStats.monthEvents, clientMap, currentDate, closeModals, dailyWork, formatCurrency]);

  const handleWorkDaysClick = useCallback(() => {
    closeModals();
    const items = monthStats.monthWork
      .map((work) => {
        const event = eventMap.get(work.event_id);
        const client = event ? clientMap.get(event.client_id) : null;
        const workDate = parseISO(work.date);

        return {
          title: `${client?.name || 'Cliente'} — ${event?.title || 'Evento'}`,
          subtitle: `${isValid(workDate) ? format(workDate, 'dd/MM/yy', { locale: ptBR }) : ''} • ${
            work.total_hours || 0
          }h trabalhadas`,
          amount: work.daily_cache || 0,
          amountFormatted: formatCurrency(work.daily_cache || 0),
          event_id: work.event_id,
          dateSort: isValid(workDate) ? workDate.getTime() : 0,
        };
      })
      .sort((a, b) => b.dateSort - a.dateSort);

    setDrilldownTitle(`Dias Trabalhados em ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(items);
    setDrilldownOpen(true);
  }, [monthStats.monthWork, eventMap, clientMap, currentDate, formatCurrency, closeModals]);

  const handleHoursClick = useCallback(() => {
    closeModals();
    const items = monthStats.monthWork
      .map((work) => {
        const event = eventMap.get(work.event_id);
        const client = clientMap.get(event?.client_id);
        const workDate = parseISO(work.date);

        return {
          title: `${client?.name || 'Cliente'} — ${event?.title || 'Evento'}`,
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

  const handleClientsClick = useCallback(() => {
    closeModals();
    const clientItems = [];
    monthStats.monthClientIds.forEach((clientId) => {
      const client = clientMap.get(clientId);
      const clientEvents = monthStats.monthEvents.filter((e) => e.client_id === clientId);

      clientItems.push({
        title: client?.name || 'Cliente Desconhecido',
        subtitle: `${clientEvents.length} evento(s) no mês`,
        client_id: clientId,
        dateSort: 0,
      });
    });

    setDrilldownTitle(`Clientes Ativos em ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(clientItems.sort((a, b) => a.title.localeCompare(b.title)));
    setDrilldownOpen(true);
  }, [monthStats.monthClientIds, monthStats.monthEvents, clientMap, currentDate, closeModals]);

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
          amountFormatted: formatCurrency(value),
          event_id: event.id,
          dateSort: isValid(startDate) ? startDate.getTime() : 0,
        };
      })
      .sort((a, b) => b.dateSort - a.dateSort);

    setDrilldownTitle(`Receita de ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`);
    setDrilldownItems(items);
    setDrilldownOpen(true);
  }, [monthStats.monthEvents, clientMap, currentDate, closeModals, dailyWork, formatCurrency]);

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
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onGoToToday={goToToday}
          onNewEvent={() => handleNewEvent()}
          onRegisterWork={() => handleQuickWorkEntry()}
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
        />

        <CalendarTodayStrip
          events={activeEvents}
          dailyWork={dailyWork}
          primaryHex={config.primaryHex}
          accentHex={config.accentHex}
          onEventClick={handleEventClick}
          onRegisterWork={() => handleQuickWorkEntry()}
          onNewEvent={() => handleNewEvent()}
        />

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <StatCard
            title="Eventos"
            value={monthStats.totalEvents}
            numericValue={monthStats.totalEvents}
            formatValue={(v) => String(Math.round(v))}
            subtext={monthStats.totalEvents === 1 ? 'evento' : 'eventos'}
            icon={Calendar}
            color="text-purple-400"
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
            value={formatCurrency(monthStats.totalRevenue)}
            numericValue={monthStats.totalRevenue}
            formatValue={formatCurrency}
            subtext="estimada no mês"
            icon={TrendingUp}
            color="text-emerald-400"
            onClick={handleRevenueClick}
            loading={isLoading}
          />

          <StatCard
            title="Clientes"
            value={monthStats.uniqueClients}
            numericValue={monthStats.uniqueClients}
            formatValue={(v) => String(Math.round(v))}
            subtext={monthStats.uniqueClients === 1 ? 'cliente' : 'clientes'}
            icon={Users}
            color="text-purple-400"
            onClick={handleClientsClick}
            loading={isLoading}
          />
        </div>

        {/* Filtros de status */}
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
                  ? 'bg-cyan-600/20 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === key ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Grid do Calendário */}
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
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
                      key={event.id}
                      onClick={() => handleSelectEventFromMultiple(event)}
                      className="w-full text-left p-3 sm:p-4 bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: event.color || '#22d3ee' }} />

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate text-sm sm:text-base">{event.title}</p>
                          <p className="text-xs sm:text-sm text-slate-400 truncate">
                            {client?.name || 'Cliente não encontrado'}
                          </p>
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


