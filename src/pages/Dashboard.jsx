import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppData } from '@/components/context/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import StatCard from '@/components/dashboard/StatCard';
import MonthlyChart from '@/components/reports/MonthlyChart';
import PaymentAlerts from '@/components/reports/PaymentAlerts';
import EventDetailModal from '@/components/reports/EventDetailModal';
import PeriodSelector from '@/components/dashboard/PeriodSelector';
import EventsInPeriod from '@/components/dashboard/EventsInPeriod';
import EventStatusSummary from '@/components/dashboard/EventStatusSummary';
import StatDetailModal from '@/components/dashboard/StatDetailModal';
import { getEventStatus } from '@/components/utils/dateUtils';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, isValid, addMonths, subMonths, startOfYear, endOfYear } from 'date-fns';

export default function DashboardPage() {
  const { data, loading, error, refreshData, loadEvents, loadClients, loadDailyWork, loadExpenses } = useAppData();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [period, setPeriod] = useState('this_month');
  const [statDetailModal, setStatDetailModal] = useState({ isOpen: false, type: null });

  // Carregar dados na montagem
  useEffect(() => {
    loadEvents();
    loadClients();
    loadDailyWork();
    loadExpenses();
  }, [loadEvents, loadClients, loadDailyWork, loadExpenses]);

  const isLoading = loading.events || loading.clients || loading.dailyWork || loading.expenses;
  const hasError = error.events || error.clients || error.dailyWork || error.expenses;

  // Calcular intervalo de datas baseado no período selecionado
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'last_month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'next_month':
        return { start: startOfMonth(addMonths(now, 1)), end: endOfMonth(addMonths(now, 1)) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'this_month':
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  // Filtrar dados do período
  const periodData = useMemo(() => {
    if (!data?.events || !data?.dailyWork || !data?.clients) {
      return { events: [], work: [], clients: [] };
    }
    
    const filteredEvents = data.events.filter(event => {
      if (!event?.start_date) return false;
      try {
        const eventStart = parseISO(event.start_date);
        return isValid(eventStart) && isWithinInterval(eventStart, dateRange);
      } catch { 
        return false; 
      }
    });

    const filteredWork = data.dailyWork.filter(work => {
      if (!work?.date) return false;
      try {
        const workDate = parseISO(work.date);
        return isValid(workDate) && isWithinInterval(workDate, dateRange);
      } catch { 
        return false; 
      }
    });

    return {
      events: filteredEvents,
      work: filteredWork,
      clients: data.clients
    };
  }, [data, dateRange]);

  // Calcular estatísticas do dashboard
  const dashboardStats = useMemo(() => {
    if (!data?.events || !data?.dailyWork) {
      return {
        faturamentoRealizado: 0,
        aReceberNoMes: 0,
        horasTrabalhadas: 0,
        eventosConcluidos: 0,
        clientesAtivos: 0,
        statusSummary: { scheduled: 0, in_progress: 0, completed: 0, pending_payment: 0 }
      };
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Faturamento realizado (eventos pagos no mês atual)
    const faturamentoRealizado = data.events
      .filter(e => {
        if (e.payment_status !== 'paid' || !e.paid_date || !e.paid_amount) return false;
        try {
          const paidDate = parseISO(e.paid_date);
          return isValid(paidDate) && isWithinInterval(paidDate, { start: currentMonthStart, end: currentMonthEnd });
        } catch {
          return false;
        }
      })
      .reduce((sum, e) => sum + (e.paid_amount || 0), 0);
    
    // Total a receber no mês
    const aReceberNoMes = data.events
      .filter(e => {
        if (e.payment_status === 'paid') return false;
        const referenceDate = e.payment_due_date || e.end_date;
        if (!referenceDate) return false;
        try {
          const dueDate = parseISO(referenceDate);
          return isValid(dueDate) && isWithinInterval(dueDate, { start: currentMonthStart, end: currentMonthEnd });
        } catch {
          return false;
        }
      })
      .reduce((sum, e) => {
        const eventWork = data.dailyWork.filter(w => w.event_id === e.id);
        if (eventWork.length > 0) {
          return sum + eventWork.reduce((workSum, w) => workSum + (w.daily_cache || 0), 0);
        }
        const startDate = parseISO(e.start_date);
        const endDate = parseISO(e.end_date);
        if (isValid(startDate) && isValid(endDate)) {
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          return sum + (e.daily_cache_value || 0) * days;
        }
        return sum;
      }, 0);
    
    // Horas trabalhadas
    const horasTrabalhadas = periodData.work.reduce((sum, w) => sum + (w.total_hours || 0), 0);
    
    // Eventos concluídos
    const eventosConcluidos = periodData.events.filter(e => getEventStatus(e) === 'completed').length;
    
    // Clientes ativos
    const clientesAtivos = new Set(periodData.events.map(e => e.client_id)).size;
    
    // Status dos eventos
    const scheduled = periodData.events.filter(e => getEventStatus(e) === 'scheduled').length;
    const in_progress = periodData.events.filter(e => getEventStatus(e) === 'in_progress').length;
    const completed = eventosConcluidos;
    const pending_payment = data.events.filter(e => getEventStatus(e) === 'completed' && e.payment_status !== 'paid').length;

    return { 
      faturamentoRealizado,
      aReceberNoMes,
      horasTrabalhadas, 
      eventosConcluidos, 
      clientesAtivos,
      statusSummary: { scheduled, in_progress, completed, pending_payment }
    };
  }, [periodData, data]);

  // Handlers otimizados com useCallback
  const handleStatCardClick = useCallback((type) => {
    setStatDetailModal({ isOpen: true, type });
  }, []);

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleEditEvent = useCallback((eventToEdit) => {
    setSelectedEvent(null);
    window.location.href = `/Calendar?action=edit-event&eventId=${eventToEdit.id}`;
  }, []);

  const handleDeleteEvent = useCallback(() => {
    setSelectedEvent(null);
    refreshData();
  }, [refreshData]);

  const handleFormSuccess = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handleAddExpenseForEvent = useCallback((eventId) => {
    setSelectedEvent(null);
    window.location.href = `/Expenses?action=add-expense&eventId=${eventId}`;
  }, []);

  // Configuração para o modal de detalhes de estatística
  const getStatDetailConfig = useCallback((type) => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const configs = {
      'faturamento': {
        title: 'Faturamento Realizado',
        icon: DollarSign,
        valueType: 'currency',
        events: data.events.filter(e => {
          if (e.payment_status !== 'paid' || !e.paid_date) return false;
          try {
            const paidDate = parseISO(e.paid_date);
            return isValid(paidDate) && isWithinInterval(paidDate, { start: currentMonthStart, end: currentMonthEnd });
          } catch { return false; }
        }),
        getEventValue: (e) => e.paid_amount || 0
      },
      'receber': {
        title: 'A Receber no Mês',
        icon: TrendingUp,
        valueType: 'currency',
        events: data.events.filter(e => {
          if (e.payment_status === 'paid') return false;
          const referenceDate = e.payment_due_date || e.end_date;
          if (!referenceDate) return false;
          try {
            const dueDate = parseISO(referenceDate);
            return isValid(dueDate) && isWithinInterval(dueDate, { start: currentMonthStart, end: currentMonthEnd });
          } catch { return false; }
        }),
        getEventValue: (e) => {
          const eventWork = data.dailyWork.filter(w => w.event_id === e.id);
          if (eventWork.length > 0) {
            return eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
          }
          const startDate = parseISO(e.start_date);
          const endDate = parseISO(e.end_date);
          if (isValid(startDate) && isValid(endDate)) {
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            return (e.daily_cache_value || 0) * days;
          }
          return 0;
        }
      },
      'horas': {
        title: 'Horas Trabalhadas',
        icon: Clock,
        valueType: 'hours',
        events: periodData.events.filter(e => {
          const eventWork = data.dailyWork.filter(w => w.event_id === e.id);
          return eventWork.length > 0;
        }),
        getEventValue: (e) => {
          const eventWork = data.dailyWork.filter(w => w.event_id === e.id);
          return eventWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);
        }
      },
      'concluidos': {
        title: 'Eventos Concluídos',
        icon: CheckCircle,
        valueType: 'currency',
        events: periodData.events.filter(e => getEventStatus(e) === 'completed'),
        getEventValue: (e) => {
          const eventWork = data.dailyWork.filter(w => w.event_id === e.id);
          if (eventWork.length > 0) {
            return eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
          }
          const startDate = parseISO(e.start_date);
          const endDate = parseISO(e.end_date);
          if (isValid(startDate) && isValid(endDate)) {
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            return (e.daily_cache_value || 0) * days;
          }
          return 0;
        }
      }
    };

    return configs[type] || null;
  }, [data, periodData]);

  const statDetailConfig = statDetailModal.isOpen ? getStatDetailConfig(statDetailModal.type) : null;

  // Loading state
  if (isLoading && (!data?.events?.length && !data?.clients?.length && !data?.dailyWork?.length)) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="bg-red-900/40 border-red-700 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar os dados. 
            <Button 
              variant="link" 
              className="text-red-300 p-0 ml-2 h-auto underline" 
              onClick={() => refreshData()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 space-y-5 sm:space-y-6 md:space-y-8 pb-20 sm:pb-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display truncate">
              Olá, {data.user?.full_name?.split(' ')[0] || ''}!
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Aqui está um resumo da sua produtividade.
            </p>
          </div>
          <div className="flex-shrink-0">
            <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
        >
          <StatCard 
            title="Faturamento Realizado" 
            value={isVisible ? formatCurrency(dashboardStats.faturamentoRealizado) : '•••••'} 
            icon={DollarSign} 
            color="text-green-400" 
            onClick={() => handleStatCardClick('faturamento')}
          />
          <StatCard 
            title="A Receber no Mês" 
            value={isVisible ? formatCurrency(dashboardStats.aReceberNoMes) : '•••••'} 
            icon={TrendingUp} 
            color="text-amber-400" 
            onClick={() => handleStatCardClick('receber')}
          />
          <StatCard 
            title="Horas Trabalhadas" 
            value={`${dashboardStats.horasTrabalhadas.toFixed(1)}h`} 
            icon={Clock} 
            color="text-cyan-400" 
            onClick={() => handleStatCardClick('horas')}
          />
          <StatCard 
            title="Eventos Concluídos" 
            value={dashboardStats.eventosConcluidos} 
            icon={CheckCircle} 
            color="text-purple-400" 
            onClick={() => handleStatCardClick('concluidos')}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-5 sm:space-y-6 md:space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
            >
              <MonthlyChart 
                events={data.events}
                dailyWork={data.dailyWork} 
                expenses={data.expenses}
                periodStart={dateRange.start} 
              />
            </motion.div>
          </div>

          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
            >
              <EventsInPeriod 
                events={periodData.events} 
                clients={data.clients} 
                onEventClick={handleEventClick} 
                loading={isLoading} 
              />
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 md:gap-8"
        >
          <PaymentAlerts 
            events={data.events} 
            work={data.dailyWork} 
            clients={data.clients} 
            onEventClick={handleEventClick} 
          />
          <EventStatusSummary 
            stats={dashboardStats.statusSummary}
            events={periodData.events} 
            clients={data.clients} 
            onEventClick={handleEventClick} 
          />
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onPaymentUpdate={handleFormSuccess}
            onWorkEdit={handleFormSuccess}
            onWorkDelete={handleFormSuccess}
            onAddExpense={handleAddExpenseForEvent}
            onExpenseEdit={handleFormSuccess}
            onExpenseDelete={handleFormSuccess}
            onApply12h={() => {}}
            dailyWork={data.dailyWork.filter(w => w?.event_id === selectedEvent?.id)}
            expenses={data.expenses.filter(e => e?.event_id === selectedEvent?.id)}
            client={data.clients.find(c => c.id === selectedEvent.client_id)}
          />
        )}

        {statDetailModal.isOpen && statDetailConfig && (
          <StatDetailModal
            isOpen={statDetailModal.isOpen}
            onClose={() => setStatDetailModal({ isOpen: false, type: null })}
            title={statDetailConfig.title}
            icon={statDetailConfig.icon}
            events={statDetailConfig.events}
            clients={data.clients}
            getEventValue={statDetailConfig.getEventValue}
            onEventClick={handleEventClick}
            valueType={statDetailConfig.valueType}
          />
        )}
      </AnimatePresence>
    </div>
  );
}