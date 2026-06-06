import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { differenceInDays, parseISO } from 'date-fns';

export function useStats(userId) {
  const [stats, setStats] = useState({
    faturamento_pago: 0,
    a_receber: 0,
    horas_trabalhadas: 0,
    eventos_count: 0,
    clientes_ativos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const [eventsRes, dailyWorkRes] = await Promise.all([
          supabase
            .from('events')
            .select('*')
            .eq('user_id', userId)
            .gte('start_date', monthStart)
            .lte('start_date', monthEnd),
          supabase
            .from('daily_work')
            .select('*')
            .eq('user_id', userId)
            .gte('date', monthStart)
            .lte('date', monthEnd),
        ]);

        const events = eventsRes.data || [];
        const dailyWork = dailyWorkRes.data || [];

        const faturamento_pago = events
          .filter(e => e.payment_status === 'paid')
          .reduce((sum, e) => sum + (e.actual_revenue || e.estimated_revenue || 0), 0);

        const a_receber = events
          .filter(e => e.payment_status === 'pending' && e.status === 'completed')
          .reduce((sum, e) => sum + (e.actual_revenue || e.estimated_revenue || 0), 0);

        const horas_trabalhadas = dailyWork.reduce((sum, d) => sum + (d.total_hours || 0), 0);

        setStats({
          faturamento_pago,
          a_receber,
          horas_trabalhadas,
          eventos_count: events.length,
          clientes_ativos: new Set(events.map(e => e.client_id).filter(Boolean)).size
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  return { stats, loading, error };
}

export function useUpcomingEvent(userId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchEvent() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error: err } = await supabase
          .from('events')
          .select('*, clients (name, email, phone)')
          .eq('user_id', userId)
          .gte('start_date', today)
          .in('status', ['pending', 'confirmed'])
          .order('start_date', { ascending: true })
          .limit(1)
          .single();

        if (err && err.code !== 'PGRST116') throw err;
        setEvent(data || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
    const interval = setInterval(fetchEvent, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  return { event, loading, error };
}

export function useEvents(userId, options = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchEvents() {
      try {
        let query = supabase
          .from('events')
          .select('*, clients (name, email, phone)')
          .eq('user_id', userId);

        if (options.limit) query = query.limit(options.limit);
        if (options.status) query = query.eq('status', options.status);
        if (options.from) query = query.gte('start_date', options.from);
        if (options.to) query = query.lte('start_date', options.to);

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
  }, [userId, JSON.stringify(options)]);

  return { events, loading, error };
}

export function useClients(userId) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

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
  }, [userId]);

  return { clients, loading, error };
}

export function usePaymentAlerts(userId) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchAlerts() {
      try {
        const { data, error: err } = await supabase
          .from('events')
          .select('id, title, start_date, payment_status, status, actual_revenue, estimated_revenue, clients (name)')
          .eq('user_id', userId)
          .eq('payment_status', 'pending')
          .eq('status', 'completed')
          .order('start_date', { ascending: true });

        if (err) throw err;

        const alertsList = (data || []).map(event => {
          const daysOverdue = differenceInDays(new Date(), parseISO(event.start_date));
          return {
            id: event.id,
            type: daysOverdue > 0 ? 'overdue' : 'pending',
            title: `${event.clients?.name || 'Cliente'} — R$${(event.actual_revenue || event.estimated_revenue || 0).toLocaleString('pt-BR')}`,
            daysOverdue,
            description: daysOverdue > 0 ? `Atrasado há ${daysOverdue} dias` : 'Aguardando pagamento'
          };
        });

        setAlerts(alertsList.sort((a, b) => b.daysOverdue - a.daysOverdue));
      } catch (err) {
        console.error('Erro ao buscar alertas:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, [userId]);

  return { alerts, loading };
}

export function useCountdown(eventDate) {
  const [countdown, setCountdown] = useState(null);
  const [isTodayFlag, setIsTodayFlag] = useState(false);

  useEffect(() => {
    if (!eventDate) return;

    function updateCountdown() {
      const target = parseISO(eventDate);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
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
