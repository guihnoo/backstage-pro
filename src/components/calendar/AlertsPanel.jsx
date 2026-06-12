import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  Timer,
  Clock,
  MapPin,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { normalizeDateString, getEventsForDate, getWorkForDate, getEventStatus } from '../utils/dateUtils';

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
  const [alerts, setAlerts] = useState([]);
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
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
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
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
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
          body: `Mais de 12h desde a entrada (${hoursSinceEntry.toFixed(1)}h).`,
          icon: Clock,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          cta: {
            label: 'Encerrar turno',
            action: () => onRegisterWork?.(today)
          }
        });
      }
    }

    // Regra CRM: Horas pendentes em eventos recentes (últimos 14 dias)
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);
    const fourteenAgoStr = normalizeDateString(fourteenDaysAgo);

    const eventsNeedingHours = events.filter((event) => {
      const st = getEventStatus(event);
      if (st !== 'completed' && st !== 'archived') return false;
      if (event.auto_hours_applied) return false;
      const endStr = event.end_date || event.start_date || '';
      if (!endStr || endStr < fourteenAgoStr) return false;
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
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
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
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        cta: {
          label: 'Ver evento',
          action: () => onOpenEvent?.(first),
        },
      });
    }

    return newAlerts;
  }, [events, dailyWork, dismissedAlerts, onRegisterWork, onLocationCheckIn, onOpenEvent]);

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

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`${alert.bgColor} border ${alert.borderColor} backdrop-blur-sm`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <alert.icon className={`w-5 h-5 ${alert.color} flex-shrink-0`} />
                    <div className="min-w-0">
                      <h3 className={`font-bold ${alert.color} truncate`}>
                        {alert.title}
                      </h3>
                      <p className="text-sm text-slate-300 mt-1 break-words">
                        {alert.body}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  {alert.cta && (
                    <Button
                      size="sm"
                      onClick={() => executeAction(alert)}
                      className={
                        alert.color === 'text-green-400'
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-400/30'
                          : alert.color === 'text-cyan-400'
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-400/30'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/30'
                      }
                      variant="outline"
                    >
                      {alert.cta.label}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissAlert(alert.id)}
                    className="border-slate-600 text-slate-400 hover:bg-slate-800"
                  >
                    Dispensar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}