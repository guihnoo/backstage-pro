import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Timer,
  Clock,
  MapPin,
  ClipboardList,
  AlertCircle,
  CalendarCheck,
  Bell,
} from 'lucide-react';
import { normalizeDateString, getEventsForDate, getWorkForDate, getEventStatus } from '../utils/dateUtils';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { fetchPendingFollowUps } from '@/lib/useClientInteractions';
import { useAuth } from '@/lib/authContext';
import { formatHours } from '@/lib/money';

function eventNeedsLocation(event) {
  if (!event) return false;
  const hasText = Boolean(event.location?.trim());
  const hasCoords = event.location_lat != null && event.location_lng != null;
  return !hasText && !hasCoords;
}

export default function AlertsPanel({
  events = [],
  dailyWork = [],
  onRegisterWork,
  onLocationCheckIn,
  onOpenEvent,
  className = '',
}) {
  const theme = useCategoryTheme();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [pendingFollowUps, setPendingFollowUps] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    fetchPendingFollowUps(user.id).then(setPendingFollowUps).catch(() => {});
  }, [user?.id]);

  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const raw = sessionStorage.getItem('bp_dismissed_alerts');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Gerar alertas baseados nas regras
  const generatedAlerts = useMemo(() => {
    const today = new Date();
    const todayStr = normalizeDateString(today);
    const newAlerts = [];

    // Regra: Sugestão de check-in
    const hasEventToday = getEventsForDate(events, today).length > 0;
    const todayWork = getWorkForDate(dailyWork, today);
    const hasEntryTime = todayWork && todayWork.entry_time;

    const todayEvents = getEventsForDate(events, today);

    if (hasEventToday && !hasEntryTime && !dismissedAlerts.has('checkin_suggestion')) {
      newAlerts.push({
        id: 'checkin_suggestion',
        kind: 'today',
        title: 'Lembrete de entrada',
        body: 'Você tem evento hoje. Registrar entrada?',
        icon: Timer,
        color: 'text-[#ffd400]',
        bgColor: 'bg-[#ffd400]/10',
        borderColor: 'border-[#ffd400]/30',
        cta: {
          label: 'Registrar agora',
          action: () => onRegisterWork?.(today)
        }
      });
    }

    const eventMissingLocation = todayEvents.find(eventNeedsLocation);
    if (eventMissingLocation && !dismissedAlerts.has('location_checkin')) {
      newAlerts.push({
        id: 'location_checkin',
        kind: 'today',
        title: 'Registrar local do evento',
        body: `"${eventMissingLocation.title || 'Seu evento de hoje'}" ainda não tem local. Faça check-in GPS no venue.`,
        icon: MapPin,
        accentHex: theme.primaryHex,
        cta: {
          label: 'Check-in GPS',
          action: () => onLocationCheckIn?.(eventMissingLocation),
        },
      });
    }

    // Regra: Sugestão de check-out
    if (hasEntryTime && !todayWork.exit_time && !dismissedAlerts.has('checkout_suggestion')) {
      const entryTime = new Date(`${todayStr}T${todayWork.entry_time}:00`);
      const now = new Date();
      const hoursSinceEntry = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceEntry >= 12) {
        newAlerts.push({
          id: 'checkout_suggestion',
          kind: 'warning',
          title: 'Registrar saída e hora extra',
          body: `Mais de 12h desde a entrada (${formatHours(hoursSinceEntry)}).`,
          icon: Clock,
          color: 'text-[#ffd400]',
          bgColor: 'bg-[#ffd400]/10',
          borderColor: 'border-[#ffd400]/30',
          cta: {
            label: 'Encerrar turno',
            action: () => onRegisterWork?.(today)
          }
        });
      }
    }

    // Regra: Show amanhã — lembrete de preparação
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = normalizeDateString(tomorrow);
    const tomorrowEvents = events.filter((event) => {
      const st = getEventStatus(event);
      if (st === 'completed' || st === 'archived' || st === 'cancelled') return false;
      return (event.start_date || '').startsWith(tomorrowStr);
    });
    if (tomorrowEvents.length > 0 && !dismissedAlerts.has('tomorrow_reminder')) {
      const first = tomorrowEvents[0];
      const count = tomorrowEvents.length;
      newAlerts.push({
        id: 'tomorrow_reminder',
        kind: 'upcoming',
        title: count === 1 ? 'Show amanhã' : `${count} shows amanhã`,
        body: count === 1
          ? `"${first.title || 'Evento'}" está agendado para amanhã${first.start_time ? ` às ${first.start_time.slice(0, 5)}` : ''}.`
          : `${count} eventos agendados para amanhã. Revise sua agenda e equipamentos.`,
        icon: CalendarCheck,
        accentHex: theme.primaryHex,
        cta: {
          label: 'Ver evento',
          action: () => onOpenEvent?.(first),
        },
      });
    }

    // Regra CRM: Dias específicos sem horas em eventos em andamento ou recentes (7 dias)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenAgoStr = normalizeDateString(sevenDaysAgo);

    const missingDayAlerts = [];
    events.forEach((event) => {
      const st = getEventStatus(event);
      if (st === 'cancelled') return;
      if (event.auto_hours_applied) return;
      const startStr = event.start_date || '';
      const endStr = event.end_date || event.start_date || '';
      if (!startStr || startStr < sevenAgoStr) return;
      // Only check events that have already started
      if (startStr > todayStr) return;

      // Collect all days from start up to yesterday (days that have passed)
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const lastDayToCheck = endStr < todayStr ? endStr : normalizeDateString(yesterday);

      const missingDays = [];
      const cursor = new Date(startStr + 'T00:00:00');
      const last = new Date(lastDayToCheck + 'T00:00:00');
      while (cursor <= last) {
        const dayStr = normalizeDateString(cursor);
        const hasWork = dailyWork.some(
          (w) => w.event_id === event.id && normalizeDateString(w.date) === dayStr
        );
        if (!hasWork) missingDays.push(dayStr);
        cursor.setDate(cursor.getDate() + 1);
      }

      if (missingDays.length > 0) {
        missingDayAlerts.push({ event, missingDays });
      }
    });

    // Um alerta por evento (máx 3), depois resumo para o restante
    if (missingDayAlerts.length > 0) {
      missingDayAlerts.slice(0, 3).forEach(({ event, missingDays }) => {
        const alertId = `crm_missing_days_${event.id}`;
        if (dismissedAlerts.has(alertId)) return;
        const dayLabel = missingDays.length === 1 ? 'dia' : 'dias';
        newAlerts.push({
          id: alertId,
          kind: 'crm',
          title: missingDays.length === 1
            ? 'Ontem sem registro de horas'
            : `${missingDays.length} ${dayLabel} sem horas`,
          body: `"${event.title || 'Evento'}" — ${missingDays.length} ${dayLabel} sem lançamento. Registre para fechar o evento.`,
          icon: ClipboardList,
          accentHex: theme.primaryHex,
          cta: {
            label: 'Registrar agora',
            action: () => onOpenEvent?.(event),
          },
        });
      });
      if (missingDayAlerts.length > 3 && !dismissedAlerts.has('crm_missing_days_others')) {
        const remaining = missingDayAlerts.length - 3;
        newAlerts.push({
          id: 'crm_missing_days_others',
          kind: 'crm',
          title: `+${remaining} evento${remaining > 1 ? 's' : ''} com horas pendentes`,
          body: `Outros ${remaining} evento${remaining > 1 ? 's' : ''} têm dias sem registro de trabalho.`,
          icon: ClipboardList,
          accentHex: theme.primaryHex,
          cta: {
            label: 'Ver agenda',
            action: () => onOpenEvent?.(missingDayAlerts[3].event),
          },
        });
      }
    }

    // Regra CRM: Horas pendentes em eventos recentes (últimos 14 dias) — zero horas no total
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);
    const fourteenAgoStr = normalizeDateString(fourteenDaysAgo);

    const eventsNeedingHours = events.filter((event) => {
      const st = getEventStatus(event);
      if (st !== 'completed' && st !== 'archived') return false;
      if (event.auto_hours_applied) return false;
      const endStr = event.end_date || event.start_date || '';
      if (!endStr || endStr < fourteenAgoStr) return false;
      // Skip if already caught by missing-days alert
      if (missingDayAlerts.some((a) => a.event.id === event.id)) return false;
      return !dailyWork.some((w) => w.event_id === event.id);
    });

    if (eventsNeedingHours.length > 0 && !dismissedAlerts.has('crm_pending_hours')) {
      const first = eventsNeedingHours[0];
      const count = eventsNeedingHours.length;
      newAlerts.push({
        id: 'crm_pending_hours',
        kind: 'crm',
        title: count === 1
          ? 'Horas não registradas'
          : `${count} eventos sem horas`,
        body: count === 1
          ? `"${first.title || 'Evento'}" ainda não tem horas lançadas.`
          : `${count} eventos recentes aguardam lançamento de horas.`,
        icon: ClipboardList,
        accentHex: theme.primaryHex,
        cta: {
          label: 'Ver evento',
          action: () => onOpenEvent?.(first),
        },
      });
    }

    // Regra CRM: Pagamentos vencidos
    const overdueEvents = events.filter((event) => {
      if (!event.payment_due_date) return false;
      if (event.payment_status === 'paid') return false;
      return event.payment_due_date < todayStr;
    });

    if (overdueEvents.length > 0 && !dismissedAlerts.has('crm_overdue_payment')) {
      const first = overdueEvents[0];
      const count = overdueEvents.length;
      newAlerts.push({
        id: 'crm_overdue_payment',
        kind: 'crm',
        title: count === 1
          ? 'Pagamento vencido'
          : `${count} pagamentos vencidos`,
        body: count === 1
          ? `"${first.title || 'Evento'}" com vencimento em ${new Date(first.payment_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}.`
          : `${count} eventos com pagamento vencido aguardam confirmação.`,
        icon: AlertCircle,
        color: 'text-[#ff2e88]',
        bgColor: 'bg-[#ff2e88]/10',
        borderColor: 'border-[#ff2e88]/30',
        cta: {
          label: 'Ver evento',
          action: () => onOpenEvent?.(first),
        },
      });
    }

    // Regra CRM: Follow-ups de clientes vencidos/hoje
    if (pendingFollowUps.length > 0 && !dismissedAlerts.has('crm_followup')) {
      const first = pendingFollowUps[0];
      const count = pendingFollowUps.length;
      newAlerts.push({
        id: 'crm_followup',
        kind: 'crm',
        title: count === 1 ? 'Follow-up pendente' : `${count} follow-ups pendentes`,
        body: count === 1
          ? `Cliente "${first.clients?.name || '—'}": ${first.notes?.slice(0, 60) || 'sem anotação'}`
          : `${count} clientes aguardam retorno. Verifique o histórico de contatos.`,
        icon: Bell,
        accentHex: theme.accentHex,
      });
    }

    return newAlerts;
  }, [events, dailyWork, pendingFollowUps, dismissedAlerts, onRegisterWork, onLocationCheckIn, onOpenEvent, theme.primaryHex, theme.accentHex]);

  useEffect(() => {
    setAlerts(generatedAlerts);
  }, [generatedAlerts]);

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => {
      const next = new Set([...prev, alertId]);
      try { sessionStorage.setItem('bp_dismissed_alerts', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const executeAction = (alert) => {
    if (alert.cta?.action) {
      alert.cta.action();
    }
    dismissAlert(alert.id);
  };

  if (alerts.length === 0) {
    return null;
  }

  // Visual All Access (mesmo cartao dos Avisos do sino): rosa = urgente, amarelo = o resto.
  const pill = 'h-8 px-3 rounded-full text-xs font-extrabold active:scale-95 transition-transform';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">LEMBRETES</div>
      <AnimatePresence>
        {alerts.map((alert) => {
          const accent = alert.color === 'text-[#ff2e88]' ? '#ff2e88' : '#ffd400';
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="rounded-[14px] bg-[#1a1a1a] px-3 py-2.5 flex gap-2.5 items-start"
                style={{ borderLeft: `4px solid ${accent}` }}
              >
                <div
                  className="w-[34px] h-[34px] rounded-[10px] text-[#0a0a0a] flex items-center justify-center shrink-0"
                  style={{ background: accent }}
                >
                  <alert.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-1.5">
                    <h3 className="text-sm font-extrabold leading-tight text-white">{alert.title}</h3>
                    <button
                      type="button"
                      className="-mt-1 -mr-1 h-7 w-7 flex items-center justify-center rounded-full text-[#a8a8a8] hover:text-white"
                      onClick={() => dismissAlert(alert.id)}
                      aria-label="Dispensar alerta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[13px] text-[#c8c8c8] leading-snug mt-0.5 break-words">{alert.body}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {alert.cta && (
                      <button
                        type="button"
                        onClick={() => executeAction(alert)}
                        className={`${pill} border-0 text-[#0a0a0a]`}
                        style={{ background: accent }}
                      >
                        {alert.cta.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-8 px-2 text-xs font-bold text-[#a8a8a8] ml-auto"
                    >
                      Dispensar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}