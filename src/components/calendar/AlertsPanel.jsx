import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  Timer,
  Clock,
  MapPin,
} from 'lucide-react';
import { normalizeDateString, getEventsForDate, getWorkForDate } from '../utils/dateUtils';

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
  className = '',
}) {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

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

    return newAlerts;
  }, [events, dailyWork, dismissedAlerts, onRegisterWork, onLocationCheckIn]);

  useEffect(() => {
    setAlerts(generatedAlerts);
  }, [generatedAlerts]);

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
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
                  <div className="flex items-center gap-3">
                    <alert.icon className={`w-5 h-5 ${alert.color}`} />
                    <div>
                      <h3 className={`font-bold ${alert.color}`}>
                        {alert.title}
                      </h3>
                      <p className="text-sm text-slate-300 mt-1">
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
                      className={`${alert.color === 'text-green-400' 
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-400/30' 
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/30'
                      }`}
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