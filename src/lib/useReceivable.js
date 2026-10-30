import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import {
  isReceivableEvent,
  calculateEventReceivableAmount,
  daysOverduePayment,
} from './eventFinance';

export function useReceivableByClient(userId) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const fetchReceivable = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, workRes] = await Promise.all([
        supabase
          .from('events')
          .select(
            'id, title, start_date, end_date, status, payment_status, payment_due_date, actual_revenue, estimated_revenue, daily_cache_value, client_id, clients (id, name, phone)'
          )
          .eq('user_id', userId)
          .in('payment_status', ['pending', 'unpaid', 'partial'])
          .order('start_date', { ascending: true }),
        supabase
          .from('daily_work')
          .select('event_id, daily_cache')
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
        const daysOverdue = daysOverduePayment(event);

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

      if (!cancelledRef.current) setRows(list);
    } catch (e) {
      if (!cancelledRef.current) setError(e.message);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchReceivable();
    return () => { cancelledRef.current = true; };
  }, [fetchReceivable]);

  const totalReceivable = useMemo(
    () => rows.reduce((sum, r) => sum + r.totalAmount, 0),
    [rows]
  );

  return { rows, totalReceivable, loading, error, refetch: fetchReceivable };
}
