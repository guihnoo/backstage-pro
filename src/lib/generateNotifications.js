import { supabase } from './supabase';
import { addDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * Gera notificações automáticas para o usuário:
 * - Eventos próximos (próximos 3 dias)
 * - Pagamentos pendentes de eventos concluídos
 */
export async function generateUserNotifications(userId) {
  if (!userId) return;

  const today = new Date();
  const in3Days = addDays(today, 3);

  const [{ data: events }, { data: existing }] = await Promise.all([
    supabase.from('events').select('*').eq('user_id', userId),
    supabase
      .from('notifications')
      .select('action_url, type')
      .eq('user_id', userId)
      .eq('is_read', false),
  ]);

  if (!events) return;

  const existingKeys = new Set(
    (existing || []).map(n => `${n.type}:${n.action_url}`)
  );

  const toInsert = [];

  for (const event of events) {
    const startDate = event.start_date ? parseISO(event.start_date) : null;

    // Alerta de evento próximo
    if (startDate && isWithinInterval(startDate, { start: startOfDay(today), end: endOfDay(in3Days) })) {
      const key = `event_reminder:/calendar?event=${event.id}`;
      if (!existingKeys.has(key)) {
        toInsert.push({
          user_id: userId,
          title: `Show em breve: ${event.title}`,
          message: `Você tem um evento agendado para ${startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
          type: 'event_reminder',
          priority: 'medium',
          action_url: `/calendar?event=${event.id}`,
        });
      }
    }

    // Alerta de pagamento pendente
    const endDate = event.end_date ? parseISO(event.end_date) : null;
    const isPast = endDate ? endDate < today : (startDate ? startDate < today : false);

    if (isPast && event.paid === false && event.payment_model !== 'free') {
      const key = `payment_reminder:/calendar?event=${event.id}`;
      if (!existingKeys.has(key)) {
        toInsert.push({
          user_id: userId,
          title: `Pagamento pendente: ${event.title}`,
          message: `O evento já passou mas o pagamento ainda não foi registrado.`,
          type: 'payment_reminder',
          priority: 'high',
          action_url: `/calendar?event=${event.id}`,
        });
      }
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('notifications').insert(toInsert);
  }
}
