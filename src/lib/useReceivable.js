import { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';
import {
  isReceivableEvent,
  calculateEventReceivableAmount,
  daysSinceEventEnd,
} from './eventFinance';

export function useReceivableByClient(userId) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchReceivable() {
      setLoading(true);
      setError(null);
      try {
        const [eventsRes, workRes] = await Promise.all([
          supabase
            .from('events')
            .select(
              'id, title, start_date, end_date, status, payment_status, actual_revenue, estimated_revenue, daily_cache_value, client_id, clients (id, name, phone)'
            )
            .eq('user_id', userId)
            .in('payment_status', ['pending', 'unpaid', 'partial'])
            .order('start_date', { ascending: true }),
          supabase
            .from('daily_work')
            .select('event_id, daily_cache, daily_rate')
            .eq('user_id', userId),
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (workRes.error) throw workRes.error;

        const workByEvent = (workRes.data || []).reduce((acc, w) => {
          if (!w.event_id) return acc;
          if (!acc[w.event_id]) acc[w.event_id] = [];
          acc[w.event_id].push(w);
          return acc;
        }, {});

        const byClient = {};

        for (const event of eventsRes.data || []) {
          if (!isReceivableEvent(event)) continue;

          const clientId = event.client_id || event.clients?.id || 'unknown';
          const amount = calculateEventReceivableAmount(
            event,
            workByEvent[event.id] || []
          );
          const daysOverdue = daysSinceEventEnd(event);

          if (!byClient[clientId]) {
            byClient[clientId] = {
              clientId,
              clientName: event.clients?.name || 'Cliente',
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

        const list = Object.values(byClient).sort(
          (a, b) => b.totalAmount - a.totalAmount
        );

        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReceivable();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const totalReceivable = useMemo(
    () => rows.reduce((sum, r) => sum + r.totalAmount, 0),
    [rows]
  );

  return { rows, totalReceivable, loading, error };
}
