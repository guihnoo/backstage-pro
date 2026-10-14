import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { supabase } from './supabase';
import { mapPayloadToDb } from './useDailyWork';
import { getEventStatus } from '@/components/utils/dateUtils';
import { dayCacheForMinutes, JORNADA_PADRAO_MIN } from './workDay';

const DEFAULT_ENTRY = '08:00';
const DEFAULT_EXIT = '20:00';
const AUTO_HOURS = JORNADA_PADRAO_MIN / 60;

/**
 * Aplica 12h automáticas nos dias do evento que ainda NÃO têm registro (Supabase).
 * Dias já lançados nunca são alterados nem duplicados.
 * Retorno compatível com o contrato legado Base44: { data: { success, error?, daysCreated? } }
 */
export async function applyAuto12Hours({ eventId, userId, origin = 'manual_12h' }) {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: authData } = await supabase.auth.getUser();
    resolvedUserId = authData?.user?.id;
  }

  if (!eventId || !resolvedUserId) {
    return { data: { success: false, error: 'Evento ou usuário inválido.' } };
  }

  try {
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', resolvedUserId)
      .single();

    if (eventErr || !event) {
      return { data: { success: false, error: 'Evento não encontrado.' } };
    }

    if (event.auto_hours_applied) {
      return { data: { success: false, error: '12h já foram aplicadas neste evento.' } };
    }

    if (getEventStatus(event) !== 'completed') {
      return { data: { success: false, error: 'O evento precisa estar concluído.' } };
    }

    const { data: existingWork, error: workErr } = await supabase
      .from('daily_work')
      .select('id, date')
      .eq('event_id', eventId)
      .eq('user_id', resolvedUserId);

    if (workErr) throw workErr;
    const datesWithWork = new Set(
      (existingWork || []).map((w) => (w.date ? String(w.date).slice(0, 10) : null)).filter(Boolean)
    );

    const start = parseISO(event.start_date);
    const end = parseISO(event.end_date || event.start_date);
    const days = eachDayOfInterval({ start, end })
      .filter((day) => !datesWithWork.has(format(day, 'yyyy-MM-dd')));

    if (days.length === 0) {
      return { data: { success: false, error: 'Todos os dias deste evento já têm horas lançadas.' } };
    }

    const dailyCache = dayCacheForMinutes(event, JORNADA_PADRAO_MIN);
    const note = origin === 'manual_12h' ? '12h automáticas (manual)' : '12h automáticas';

    const rows = days.map((day) =>
      mapPayloadToDb({
        user_id: resolvedUserId,
        event_id: eventId,
        date: format(day, 'yyyy-MM-dd'),
        entry_time: DEFAULT_ENTRY,
        exit_time: DEFAULT_EXIT,
        total_hours: AUTO_HOURS,
        overtime_hours: 0,
        daily_cache: dailyCache,
        status: 'completed',
        notes: note,
      })
    );

    const { error: insertErr } = await supabase.from('daily_work').insert(rows);
    if (insertErr) throw insertErr;

    const { error: updateErr } = await supabase
      .from('events')
      .update({ auto_hours_applied: true })
      .eq('id', eventId)
      .eq('user_id', resolvedUserId);

    if (updateErr) throw updateErr;

    return { data: { success: true, daysCreated: rows.length } };
  } catch (error) {
    console.error('applyAuto12Hours:', error);
    return {
      data: {
        success: false,
        error: error.message || 'Falha ao aplicar 12h automáticas.',
      },
    };
  }
}
