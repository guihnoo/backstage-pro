import {
  differenceInDays,
  parseISO,
  isValid,
  addDays,
  startOfDay,
} from 'date-fns';
import { getEventCacheAmount } from '@/lib/eventFinance';

/**
 * Regras compartilhadas: NotificationCenter (in-app) e push futuro.
 */
export function buildUserNotifications({
  events,
  clients,
  profile,
  diariasCount = 0,
  today = new Date(),
  formatCurrency,
}) {
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = addDays(today, 1).toISOString().split('T')[0];
  const clientMap = new Map((clients || []).map((c) => [c.id, c]));
  const notes = [];

  for (const ev of events || []) {
    const startStr = ev.start_date?.split('T')[0];
    const endStr = ev.end_date?.split('T')[0] || startStr;
    if (!startStr) continue;

    const clientName = clientMap.get(ev.client_id)?.name || 'Cliente';

    if (startStr <= todayStr && endStr >= todayStr) {
      notes.push({
        id: `today:${ev.id}`,
        type: 'today_event',
        priority: 'urgent',
        title: `Hoje em cena: ${ev.title}`,
        message: `Show hoje com ${clientName}.`,
        action_url: '/calendar',
        event_ref: ev,
        created_date: todayStr,
      });
    } else if (startStr === tomorrowStr) {
      notes.push({
        id: `tomorrow:${ev.id}`,
        type: 'event_reminder',
        priority: 'high',
        title: `Show amanhã: ${ev.title}`,
        message: `Confirme com ${clientName}.`,
        action_url: '/calendar',
        event_ref: ev,
        created_date: todayStr,
      });
    }

    const endDate = endStr ? parseISO(endStr) : null;
    const isPast = endDate && isValid(endDate) && startOfDay(endDate) < startOfDay(today);
    const unpaid = ev.payment_status !== 'paid';

    if (isPast && unpaid) {
      const daysLate = differenceInDays(today, endDate);
      const isUrgent = daysLate > 7;
      const amount = getEventCacheAmount(ev);
      const amountLabel = formatCurrency
        ? formatCurrency(amount)
        : `R$ ${amount.toLocaleString('pt-BR')}`;
      notes.push({
        id: `payment:${ev.id}`,
        type: 'payment_reminder',
        priority: isUrgent ? 'urgent' : 'high',
        title: `Pagamento pendente: ${ev.title}`,
        message: `${clientName} · ${amountLabel} · ${daysLate} dia${daysLate !== 1 ? 's' : ''} em atraso.`,
        action_url: '/reports',
        event_ref: ev,
        created_date: todayStr,
        phone: clientMap.get(ev.client_id)?.phone || null,
        clientName,
        amount,
      });
    }
  }

  const metaDiarias = Number(profile?.monthly_goal_events) || 10;
  const count = Number(diariasCount) || 0;
  const remaining = metaDiarias - count;

  if (metaDiarias > 0 && remaining > 0 && remaining <= 2) {
    notes.push({
      id: `goal:diarias:${todayStr.slice(0, 7)}`,
      type: 'goal_reminder',
      priority: 'medium',
      title: 'Meta quase lá!',
      message: `Falta${remaining === 1 ? '' : 'm'} só ${remaining} diária${remaining !== 1 ? 's' : ''} para bater sua meta do mês.`,
      action_url: '/goals',
      created_date: todayStr,
    });
  }

  const order = { urgent: 0, high: 1, medium: 2, low: 3 };
  return notes.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
}
