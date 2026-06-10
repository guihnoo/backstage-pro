import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { todayLocalISO } from '@/components/utils/dateUtils';
import {
  isReceivableEvent,
  calculateEventReceivableAmount,
  daysSinceEventEnd,
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
            'id, title, start_date, end_date, status, payment_status, actual_revenue, estimated_revenue, daily_cache_value, client_id, clients (id, name, phone)'
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

  const markClientPaid = useCallback(async (clientId, paidAmount) => {
    const row = rows.find(r => r.clientId === clientId);
    if (!row) return;
    const today = todayLocalISO();
    setRows(prev => prev.filter(r => r.clientId !== clientId));

    // Distribute paidAmount proportionally across events if provided
    const basePayload = { payment_status: 'paid', paid_date: today };
    if (paidAmount != null && paidAmount > 0 && row.events.length > 0) {
      const totalCalc = row.events.reduce((s, e) => s + e.amount, 0);
      const ratio = totalCalc > 0 ? paidAmount / totalCalc : 1;
      const updates = row.events.map(ev =>
        supabase
          .from('events')
          .update({ ...basePayload, actual_revenue: Math.round(ev.amount * ratio * 100) / 100 })
          .eq('id', ev.id)
          .eq('user_id', userId)
      );
      const results = await Promise.all(updates);
      const err = results.find(r => r.error)?.error;
      if (err) { await fetchReceivable(); throw err; }
    } else {
      const { error: updateError } = await supabase
        .from('events')
        .update(basePayload)
        .in('id', row.events.map(e => e.id))
        .eq('user_id', userId);
      if (updateError) { await fetchReceivable(); throw updateError; }
    }
  }, [rows, userId, fetchReceivable]);

  const totalReceivable = useMemo(
    () => rows.reduce((sum, r) => sum + r.totalAmount, 0),
    [rows]
  );

  return { rows, totalReceivable, loading, error, refetch: fetchReceivable, markClientPaid };
}
