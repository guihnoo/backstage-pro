import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useRealtimeRefetch } from './useRealtimeRefetch';
import { todayLocalISO, countUniqueWorkDays } from '@/components/utils/dateUtils';
import {
  calcEventDays,
  isCancelledEvent,
  isReceivableEvent,
  sumReceivableAmount,
  calculateEventReceivableAmount,
  daysOverduePayment,
  isPaymentOverdue,
} from './eventFinance';
import {
  buildWorkByEvent,
  distributePaidAmount,
  monthRange,
  receivedInPeriod,
  workInPeriod,
} from './financeMetrics';
import { mapRowFromDb } from './useDailyWork';
import { getClientDisplayName } from './eventDisplay';

const EVENT_SELECT = '*, clients (id, name, email, phone)';

const EMPTY_STATS = {
  faturamento_pago: 0,
  a_receber: 0,
  horas_trabalhadas: 0,
  eventos_count: 0,
  diarias_count: 0,
  clientes_ativos: 0,
};

function eventValue(e) {
  if (Number(e.actual_revenue) > 0) return Number(e.actual_revenue);
  if (Number(e.estimated_revenue) > 0) return Number(e.estimated_revenue);
  if (Number(e.daily_cache_value) > 0) {
    return Math.round(Number(e.daily_cache_value) * calcEventDays(e) * 100) / 100;
  }
  return 0;
}

function computeStats(events, workRows) {
  const month = monthRange();
  const { start: monthStart, end: monthEnd } = month;
  const monthEvents = events.filter(
    (e) =>
      !isCancelledEvent(e) &&
      e.start_date <= monthEnd &&
      e.end_date >= monthStart
  );
  const receivableEvents = events.filter((e) =>
    ['pending', 'unpaid', 'partial'].includes(e.payment_status)
  );
  const monthWork = workInPeriod(workRows, month);
  const workByEvent = buildWorkByEvent(workRows);

  return {
    faturamento_pago: receivedInPeriod(events, month, workByEvent),
    a_receber: sumReceivableAmount(receivableEvents, workByEvent),
    horas_trabalhadas: monthWork.reduce((sum, d) => sum + (d.total_hours || 0), 0),
    eventos_count: monthEvents.length,
    diarias_count: countUniqueWorkDays(monthWork),
    clientes_ativos: new Set(monthEvents.map((e) => e.client_id).filter(Boolean)).size,
  };
}

function pickProximoEvento(events, today) {
  const active = events.filter(
    (e) =>
      !isCancelledEvent(e) &&
      ['pending', 'confirmed'].includes(e.status) &&
      e.start_date <= today &&
      e.end_date >= today
  );
  if (active.length) {
    return active.sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
  }

  const upcoming = events.filter(
    (e) =>
      !isCancelledEvent(e) &&
      ['pending', 'confirmed'].includes(e.status) &&
      e.start_date >= today
  );
  return upcoming.sort((a, b) => a.start_date.localeCompare(b.start_date))[0] || null;
}

function buildPaymentAlerts(receivableEvents) {
  return receivableEvents
    .filter(isReceivableEvent)
    .map((event) => {
      const daysOverdue = daysOverduePayment(event);
      const overdue = isPaymentOverdue(event);
      const value = eventValue(event);
      return {
        id: event.id,
        type: overdue ? 'overdue' : 'pending',
        title: `${getClientDisplayName(event.clients) || 'Sem empresa'} — R$${value.toLocaleString('pt-BR')}`,
        daysOverdue,
        description: overdue
          ? `Vencimento passado há ${daysOverdue} dia${daysOverdue !== 1 ? 's' : ''}`
          : event.payment_due_date
            ? `Vence em ${new Date(event.payment_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}`
            : 'Aguardando pagamento',
        clientId: event.client_id,
        clientName: getClientDisplayName(event.clients) || 'Sem empresa',
        phone: event.clients?.phone || null,
        amount: value,
        eventTitle: event.title,
        eventStartDate: event.start_date,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

function buildReceivableRows(receivableEvents, workByEvent) {
  const byClient = {};

  for (const event of receivableEvents) {
    if (!isReceivableEvent(event)) continue;

    const clientId = event.client_id || event.clients?.id || 'unknown';
    const amount = calculateEventReceivableAmount(event, workByEvent[event.id] || []);
    const daysOverdue = daysOverduePayment(event);

    if (!byClient[clientId]) {
      byClient[clientId] = {
        clientId,
        clientName: getClientDisplayName(event.clients) || 'Sem empresa',
        phone: event.clients?.phone || null,
        totalAmount: 0,
        eventsCount: 0,
        maxDaysOverdue: 0,
        events: [],
      };
    }

    const row = byClient[clientId];
    row.totalAmount += amount;
    row.eventsCount += 1;
    row.maxDaysOverdue = Math.max(row.maxDaysOverdue, daysOverdue);
    row.events.push({
      id: event.id,
      title: event.title,
      start_date: event.start_date,
      amount,
      daysOverdue,
    });
    if (!row.phone && event.clients?.phone) {
      row.phone = event.clients.phone;
    }
  }

  return Object.values(byClient).sort((a, b) => b.totalAmount - a.totalAmount);
}

export function deriveDashboard(eventsRaw, workRaw) {
  const today = todayLocalISO();
  const events = eventsRaw || [];
  const workRows = (workRaw || []).map(mapRowFromDb);
  const workByEvent = buildWorkByEvent(workRows);

  const receivableEvents = events.filter((e) =>
    ['pending', 'unpaid', 'partial'].includes(e.payment_status)
  );

  const upcomingEvents = events
    .filter((e) => !isCancelledEvent(e) && e.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 30);

  return {
    stats: computeStats(events, workRows),
    proximoEvento: pickProximoEvento(events, today),
    alerts: buildPaymentAlerts(receivableEvents),
    receivableRows: buildReceivableRows(receivableEvents, workByEvent),
    upcomingEvents,
    dailyWork: workRows,
  };
}

/**
 * Cockpit Home — 2 requests Supabase (events + daily_work) em vez de ~10 hooks paralelos.
 */
export function useHomeDashboard(userId) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [proximoEvento, setProximoEvento] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [receivableRows, setReceivableRows] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [dailyWork, setDailyWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const silentRef = useRef(false);
  const pendingRef = useRef(null);

  const refetch = useCallback((opts = {}) => {
    if (opts?.silent) silentRef.current = true;
    return new Promise((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      setVersion((v) => v + 1);
    });
  }, []);

  useRealtimeRefetch(['events', 'daily_work'], refetch);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const { start: monthStart, end: monthEnd } = monthRange();
    const today = todayLocalISO();
    const silent = silentRef.current;
    silentRef.current = false;

    async function load() {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const eventsFilter = [
          `and(start_date.lte.${monthEnd},end_date.gte.${monthStart})`,
          // recebido conta pela data do pagamento: shows de outros meses pagos neste mês
          `and(payment_status.eq.paid,paid_date.gte.${monthStart},paid_date.lte.${monthEnd})`,
          'payment_status.in.(pending,unpaid,partial)',
          `and(end_date.gte.${today},status.neq.cancelled)`,
        ].join(',');

        const [eventsRes, workRes] = await Promise.all([
          supabase
            .from('events')
            .select(EVENT_SELECT)
            .eq('user_id', userId)
            .or(eventsFilter)
            .order('start_date', { ascending: true }),
          supabase.from('daily_work').select('*').eq('user_id', userId).order('date', { ascending: false }),
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (workRes.error) throw workRes.error;

        if (cancelled) return;

        const derived = deriveDashboard(eventsRes.data, workRes.data);
        setStats(derived.stats);
        setProximoEvento(derived.proximoEvento);
        setAlerts(derived.alerts);
        setReceivableRows(derived.receivableRows);
        setUpcomingEvents(derived.upcomingEvents);
        setDailyWork(derived.dailyWork);
      } catch (err) {
        if (!cancelled) setError(err.message);
        pendingRef.current?.reject?.(err);
      } finally {
        if (!cancelled) setLoading(false);
        pendingRef.current?.resolve?.();
        pendingRef.current = null;
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const totalReceivable = useMemo(
    () => receivableRows.reduce((sum, r) => sum + r.totalAmount, 0),
    [receivableRows]
  );

  const markClientPaid = useCallback(
    async (clientId, paidAmount) => {
      const row = receivableRows.find((r) => r.clientId === clientId);
      if (!row || !userId) return;

      const today = todayLocalISO();
      setReceivableRows((prev) => prev.filter((r) => r.clientId !== clientId));

      const adjusted = paidAmount != null && paidAmount > 0;
      const results = await Promise.all(
        distributePaidAmount(row.events, paidAmount).map((share) =>
          supabase
            .from('events')
            .update({
              payment_status: 'paid',
              paid_date: today,
              paid_amount: share.amount > 0 ? share.amount : null,
              ...(adjusted ? { actual_revenue: share.amount } : {}),
            })
            .eq('id', share.id)
            .eq('user_id', userId)
        )
      );
      const err = results.find((r) => r.error)?.error;
      if (err) {
        refetch();
        throw err;
      }
      refetch();
    },
    [receivableRows, userId, refetch]
  );

  return {
    stats,
    proximoEvento,
    alerts,
    receivableRows,
    totalReceivable,
    upcomingEvents,
    dailyWork,
    loading,
    error,
    refetch,
    markClientPaid,
  };
}
