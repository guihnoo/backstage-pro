import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useRealtimeRefetch } from './useRealtimeRefetch';
import { differenceInDays, parseISO } from 'date-fns';
import { todayLocalISO, countUniqueWorkDays } from '@/components/utils/dateUtils';
import {
  calcEventDays,
  isCancelledEvent,
  isReceivableEvent,
  sumReceivableAmount,
} from './eventFinance';
import {
  buildWorkByEvent,
  monthRange,
  receivedInPeriod,
  yearRange,
} from './financeMetrics';

const PAID_EVENT_FIELDS =
  'id, client_id, status, payment_status, paid_amount, paid_date, start_date, end_date, daily_cache_value, actual_revenue, estimated_revenue';

/**
 * Eventos pagos cuja competência de recebimento cai no período
 * (paid_date; pagos antigos sem paid_date entram pela data do show). Sem período: todos os pagos.
 */
function paidEventsQuery(userId, range) {
  const query = supabase
    .from('events')
    .select(PAID_EVENT_FIELDS)
    .eq('user_id', userId)
    .eq('payment_status', 'paid');
  if (!range) return query;
  return query.or(
    `and(paid_date.gte.${range.start},paid_date.lte.${range.end}),` +
      `and(paid_date.is.null,start_date.gte.${range.start},start_date.lte.${range.end})`
  );
}

const eventValue = (e) => {
  if (Number(e.actual_revenue) > 0) return Number(e.actual_revenue);
  if (Number(e.estimated_revenue) > 0) return Number(e.estimated_revenue);
  if (Number(e.daily_cache_value) > 0) {
    return Math.round(Number(e.daily_cache_value) * calcEventDays(e) * 100) / 100;
  }
  return 0;
};

export function useStats(userId) {
  const [stats, setStats] = useState({
    faturamento_pago: 0,
    a_receber: 0,
    horas_trabalhadas: 0,
    eventos_count: 0,
    diarias_count: 0,
    clientes_ativos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const refetch = useCallback(() => setVersion(v => v + 1), []);

  useRealtimeRefetch(['events', 'daily_work', 'clients'], refetch);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      try {
        const month = monthRange();
        const { start: monthStart, end: monthEnd } = month;

        const [monthEventsRes, receivableEventsRes, monthWorkRes, receivableWorkRes, paidEventsRes] = await Promise.all([
          supabase
            .from('events')
            .select('id, payment_status, status, client_id, start_date, end_date, daily_cache_value, actual_revenue, estimated_revenue, paid_amount')
            .eq('user_id', userId)
            .lte('start_date', monthEnd)
            .gte('end_date', monthStart),
          supabase
            .from('events')
            .select('id, payment_status, status, start_date, end_date, daily_cache_value, actual_revenue, estimated_revenue, paid_amount')
            .eq('user_id', userId)
            .in('payment_status', ['pending', 'unpaid', 'partial']),
          supabase
            .from('daily_work')
            .select('date, total_hours')
            .eq('user_id', userId)
            .gte('date', monthStart)
            .lte('date', monthEnd),
          supabase
            .from('daily_work')
            .select('event_id, daily_cache')
            .eq('user_id', userId),
          paidEventsQuery(userId, month),
        ]);

        const monthEvents = (monthEventsRes.data || []).filter(e => !isCancelledEvent(e));
        const receivableEvents = receivableEventsRes.data || [];
        const monthWork = monthWorkRes.data || [];
        const workByEvent = buildWorkByEvent(receivableWorkRes.data || []);

        const faturamento_pago = receivedInPeriod(paidEventsRes.data || [], month, workByEvent);

        const a_receber = sumReceivableAmount(receivableEvents, workByEvent);
        const horas_trabalhadas = monthWork.reduce((sum, d) => sum + (d.total_hours || 0), 0);
        const diarias_count = countUniqueWorkDays(monthWork);

        if (!cancelled) {
          setStats({
            faturamento_pago,
            a_receber,
            horas_trabalhadas,
            eventos_count: monthEvents.length,
            diarias_count,
            clientes_ativos: new Set(monthEvents.map(e => e.client_id).filter(Boolean)).size
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  return { stats, loading, error, refetch };
}

export function useUpcomingEvent(userId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    try {
      const today = todayLocalISO();

      const { data: onStage, error: stageErr } = await supabase
        .from('events')
        .select('*, clients (name, email, phone)')
        .eq('user_id', userId)
        .lte('start_date', today)
        .gte('end_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (stageErr) throw stageErr;
      if (onStage) {
        setEvent(onStage);
        return;
      }

      const { data, error: err } = await supabase
        .from('events')
        .select('*, clients (name, email, phone)')
        .eq('user_id', userId)
        .gte('start_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (err) throw err;
      setEvent(data || null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useRealtimeRefetch('events', refetch);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { event, loading, error, refetch };
}

export function useEvents(userId, options = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion(v => v + 1), []);

  useRealtimeRefetch('events', refetch);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchEvents() {
      try {
        let query = supabase
          .from('events')
          .select('*, clients (name, email, phone)')
          .eq('user_id', userId);

        if (options.limit) query = query.limit(options.limit);
        if (options.status) query = query.eq('status', options.status);
        if (options.from) query = query.gte('start_date', options.from);
        if (options.endAfter) query = query.gte('end_date', options.endAfter);
        if (options.to) query = query.lte('start_date', options.to);
        if (options.excludeCancelled) {
          query = query.neq('status', 'cancelled');
        }

        query = query.order('start_date', { ascending: options.ascending !== false });

        const { data, error: err } = await query;
        if (err) throw err;
        setEvents(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [userId, JSON.stringify(options), version]);

  return { events, loading, error, refetch };
}

export function useClients(userId) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const refetch = useCallback(() => setVersion(v => v + 1), []);

  useRealtimeRefetch('clients', refetch);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchClients() {
      try {
        const { data, error: err } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setClients(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, [userId, version]);

  return { clients, loading, error, refetch };
}

export function usePaymentAlerts(userId) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refetch = useCallback(() => setVersion(v => v + 1), []);

  useRealtimeRefetch('events', refetch);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAlerts() {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('events')
          .select('id, title, client_id, start_date, end_date, payment_status, status, daily_cache_value, actual_revenue, estimated_revenue, clients (name, phone)')
          .eq('user_id', userId)
          .in('payment_status', ['pending', 'unpaid', 'partial'])
          .order('start_date', { ascending: true });

        if (err) throw err;

        const alertsList = (data || [])
          .filter(isReceivableEvent)
          .map(event => {
            const refDate = event.end_date || event.start_date;
            const daysOverdue = differenceInDays(new Date(), parseISO(refDate));
            const value = eventValue(event);
            return {
              id: event.id,
              type: daysOverdue > 0 ? 'overdue' : 'pending',
              title: `${event.clients?.name || 'Cliente'} — R$${value.toLocaleString('pt-BR')}`,
              daysOverdue,
              description: daysOverdue > 0 ? `Atrasado há ${daysOverdue} dias` : 'Aguardando pagamento',
              clientId: event.client_id,
              clientName: event.clients?.name || 'Cliente',
              phone: event.clients?.phone || null,
              amount: value,
              eventTitle: event.title,
              eventStartDate: event.start_date,
            };
          });

        if (!cancelled) {
          setAlerts(alertsList.sort((a, b) => b.daysOverdue - a.daysOverdue));
        }
      } catch (err) {
        console.error('Erro ao buscar alertas:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAlerts();
    return () => { cancelled = true; };
  }, [userId, version]);

  return { alerts, loading, refetch };
}

export function useCountdown(eventDate) {
  const [countdown, setCountdown] = useState(null);
  const [isTodayFlag, setIsTodayFlag] = useState(false);

  useEffect(() => {
    if (!eventDate) return;

    function updateCountdown() {
      const target = parseISO(eventDate);
      const now = new Date();
      const todayStr = todayLocalISO(now);
      setIsTodayFlag(eventDate.startsWith(todayStr));

      const diff = target - now;
      if (diff <= 0) { setCountdown(null); return; }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  return { countdown, isToday: isTodayFlag };
}

// MEI annual revenue limit (2025)
export const MEI_LIMIT = 81000;

// DAS 2025 values by activity type
export const MEI_DAS = {
  services:  { label: 'Prestador de serviços', monthly: 80.90 },
  commerce:  { label: 'Comércio / Indústria',  monthly: 76.90 },
  both:      { label: 'Comércio + Serviços',   monthly: 81.90 },
};

export function useMeiStats(userId) {
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refetch = useCallback(() => setVersion(v => v + 1), []);

  useRealtimeRefetch('events', refetch);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function fetch() {
      try {
        const year = yearRange();

        const [paidRes, workRes] = await Promise.all([
          paidEventsQuery(userId, year),
          supabase.from('daily_work').select('event_id, daily_cache').eq('user_id', userId),
        ]);

        const total = receivedInPeriod(
          paidRes.data || [],
          year,
          buildWorkByEvent(workRes.data || [])
        );

        if (!cancelled) setAnnualRevenue(total);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [userId, version]);

  return { annualRevenue, loading, refetch };
}

/** Todos os eventos pagos + horas por evento, para métricas de recebido por mês (Metas). */
export function usePaidEvents(userId) {
  const [paidEvents, setPaidEvents] = useState([]);
  const [workByEvent, setWorkByEvent] = useState({});
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refetch = useCallback(() => setVersion(v => v + 1), []);

  useRealtimeRefetch(['events', 'daily_work'], refetch);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function fetch() {
      try {
        const [paidRes, workRes] = await Promise.all([
          paidEventsQuery(userId),
          supabase.from('daily_work').select('event_id, daily_cache').eq('user_id', userId),
        ]);

        if (cancelled) return;
        setPaidEvents(paidRes.data || []);
        setWorkByEvent(buildWorkByEvent(workRes.data || []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [userId, version]);

  return { paidEvents, workByEvent, loading, refetch };
}
