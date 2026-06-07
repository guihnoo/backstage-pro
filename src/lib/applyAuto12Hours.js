import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { supabase } from './supabase';
import { getEventStatus } from '@/components/utils/dateUtils';

const DEFAULT_ENTRY = '08:00';
const DEFAULT_EXIT = '20:00';
const AUTO_HOURS = 12;

function calculateDailyCache(event) {
  const baseValue = Number(event.daily_cache_value || event.estimated_revenue || 0);
  const paymentModel = event.payment_model || 'HORAS_EXTRAS';

  if (paymentModel === 'MEIO_CACHE_E_DOBRA') {
    const base = Number(event.cache_valor_base || baseValue);
    if (AUTO_HOURS <= 6) return Math.round((base / 2) * 100) / 100;
    if (AUTO_HOURS <= 12) return Math.round(baseValue * 100) / 100;
    return Math.round(base * 2 * 100) / 100;
  }

  return Math.round(baseValue * 100) / 100;
}

/**
 * Aplica 12h automáticas para cada dia do evento (Supabase).
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
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', resolvedUserId);

    if (workErr) throw workErr;
    if (existingWork?.length > 0) {
      return {
        data: {
          success: false,
          error: 'Já existem registros de horas. Edite ou remova antes de aplicar 12h.',
        },
      };
    }

    const start = parseISO(event.start_date);
    const end = parseISO(event.end_date || event.start_date);
    const days = eachDayOfInterval({ start, end });
    const dailyCache = calculateDailyCache(event);
    const note = origin === 'manual_12h' ? '12h automáticas (manual)' : '12h automáticas';

    const rows = days.map((day) => {
      const workDate = format(day, 'yyyy-MM-dd');
      return {
        user_id: resolvedUserId,
        event_id: eventId,
        work_date: workDate,
        entry_time: DEFAULT_ENTRY,
        exit_time: DEFAULT_EXIT,
        hours_worked: AUTO_HOURS,
        overtime_hours: 0,
        daily_cache: dailyCache,
        status: 'completed',
        description: note,
      };
    });

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
