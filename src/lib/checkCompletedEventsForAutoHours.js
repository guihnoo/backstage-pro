import { supabase } from './supabase';
import { getEventStatus } from '@/components/utils/dateUtils';
import { applyAuto12Hours } from './applyAuto12Hours';

/**
 * Verifica eventos concluídos sem horas e aplica 12h automáticas (substitui Base44).
 * Retorno compatível: { data: { success, processed?, skipped?, errors? } }
 */
export async function checkCompletedEventsForAutoHours({ userId } = {}) {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: authData } = await supabase.auth.getUser();
    resolvedUserId = authData?.user?.id;
  }

  if (!resolvedUserId) {
    return { data: { success: false, error: 'Usuário não autenticado.' } };
  }

  try {
    const { data: events, error: eventsErr } = await supabase
      .from('events')
      .select('id, start_date, end_date, auto_hours_applied')
      .eq('user_id', resolvedUserId)
      .eq('auto_hours_applied', false);

    if (eventsErr) throw eventsErr;

    const completed = (events || []).filter((e) => getEventStatus(e) === 'completed');
    if (completed.length === 0) {
      return { data: { success: true, processed: 0, skipped: 0 } };
    }

    const eventIds = completed.map((e) => e.id);
    const { data: existingWork, error: workErr } = await supabase
      .from('daily_work')
      .select('event_id')
      .eq('user_id', resolvedUserId)
      .in('event_id', eventIds);

    if (workErr) throw workErr;

    const eventsWithWork = new Set((existingWork || []).map((w) => w.event_id));
    const candidates = completed.filter((e) => !eventsWithWork.has(e.id));

    let processed = 0;
    const errors = [];

    for (const event of candidates) {
      const result = await applyAuto12Hours({
        eventId: event.id,
        userId: resolvedUserId,
        origin: 'auto_check',
      });
      if (result.data?.success) {
        processed += 1;
      } else if (result.data?.error) {
        errors.push({ eventId: event.id, error: result.data.error });
      }
    }

    return {
      data: {
        success: true,
        processed,
        skipped: completed.length - candidates.length,
        errors: errors.length ? errors : undefined,
      },
    };
  } catch (error) {
    console.error('checkCompletedEventsForAutoHours:', error);
    return {
      data: {
        success: false,
        error: error.message || 'Falha ao verificar eventos para 12h automáticas.',
      },
    };
  }
}
