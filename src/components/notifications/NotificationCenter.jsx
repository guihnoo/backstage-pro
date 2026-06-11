import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Clock, Calendar, DollarSign, Target, X, Zap, MessageCircle } from 'lucide-react';
import EventDetailModal from '@/components/calendar/EventDetailModal';
import { useAuth } from '@/lib/authContext';
import { useStats } from '@/lib/useBackstageData';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildUserNotifications } from '@/lib/notificationRules';

const DISMISSED_KEY = 'backstage_dismissed_notifications';

function getDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

const PRIORITY_STYLES = {
  urgent: 'text-red-400 border-red-400/20 bg-red-400/5',
  high: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
  medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  low: 'text-slate-400 border-slate-600/20 bg-slate-800/20',
};

const TYPE_ICONS = {
  today_event: Zap,
  event_reminder: Calendar,
  payment_reminder: DollarSign,
  goal_reminder: Target,
  work_reminder: Clock,
};

function NotificationItem({ notification, onDismiss, onNavigate, onViewEvent }) {
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const styleClass = PRIORITY_STYLES[notification.priority] || PRIORITY_STYLES.low;

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const msg = buildChargeMessage({
      clientName: notification.clientName,
      events: [{ title: notification.event_ref?.title || '', start_date: notification.event_ref?.start_date, amount: notification.amount }],
      totalAmount: notification.amount,
    });
    openWhatsAppCharge(notification.phone, msg);
  };

  return (
    <div className={`p-3 border rounded-lg transition-all duration-200 hover:brightness-125 ${styleClass}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white leading-tight">{notification.title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notification.message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {format(parseISO(notification.created_date), "dd/MM", { locale: ptBR })}
            </span>
            <div className="flex items-center gap-1">
              {notification.type === 'payment_reminder' && notification.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="h-8 px-2 text-xs bg-green-900/30 hover:bg-green-900/50 border-green-600/50 text-green-400"
                  title="Cobrar via WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                </Button>
              )}
              {notification.action_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { onViewEvent ? onViewEvent(notification) : onNavigate(notification.action_url); onDismiss(notification.id); }}
                  className="h-8 px-2.5 text-xs bg-cyan-600 hover:bg-cyan-700 border-cyan-500 text-white"
                >
                  Ver
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(notification.id)}
                className="h-8 w-8 p-0 hover:bg-slate-600"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const { user, profile } = useAuth();
  const { events } = useEvents();
  const { clients } = useClients();
  const { stats } = useStats(user?.id);
  const { formatCurrency } = useFinancialVisibility();
  const [dismissed, setDismissed] = useState(() => getDismissed());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Limpa dismissed antigos (> 3 dias) a cada abertura
  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().split('T')[0];
    const fresh = new Set(
      [...dismissed].filter(id => {
        const parts = id.split(':');
        const dateStr = parts[parts.length - 1];
        if (dateStr.length === 10) {
          return differenceInDays(parseISO(today), parseISO(dateStr)) < 3;
        }
        return true;
      })
    );
    if (fresh.size !== dismissed.size) {
      setDismissed(fresh);
      saveDismissed(fresh);
    }
  }, [isOpen]);

  const allNotifications = useMemo(() => {
    const base = buildUserNotifications({
      events,
      clients,
      profile,
      diariasCount: stats?.diarias_count ?? 0,
      today: new Date(),
      formatCurrency,
    });
    return base.map((n) => {
      if (n.type === 'today_event') return { ...n, title: `⚡ Hoje em cena: ${n.title.replace('Hoje em cena: ', '')}` };
      if (n.type === 'event_reminder') return { ...n, title: `📅 ${n.title}` };
      if (n.type === 'payment_reminder') return { ...n, title: `💰 ${n.title}` };
      if (n.type === 'goal_reminder') return { ...n, title: `🎯 ${n.title}` };
      return n;
    });
  }, [events, clients, profile, stats?.diarias_count, formatCurrency]);

  const visible = useMemo(() =>
    allNotifications.filter(n => !dismissed.has(n.id)),
    [allNotifications, dismissed]
  );

  const handleDismiss = useCallback((id) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }, []);

  const handleDismissAll = useCallback(() => {
    setDismissed(prev => {
      const next = new Set(prev);
      allNotifications.forEach(n => next.add(n.id));
      saveDismissed(next);
      return next;
    });
    setIsOpen(false);
  }, [allNotifications]);

  const handleNavigate = useCallback((actionUrl) => {
    hardNavigate(actionUrl);
    setIsOpen(false);
  }, []);

  const handleViewEvent = useCallback((notification) => {
    if (notification.event_ref) {
      setIsOpen(false);
      setSelectedEvent(notification.event_ref);
    } else {
      handleNavigate(notification.action_url);
    }
  }, [handleNavigate]);

  if (!user?.id) return null;

  const count = visible.length;

  return (
    <>
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs bg-red-500 hover:bg-red-500 text-white border-slate-900 p-0 flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border-slate-700 text-white mr-4 mt-2"
        align="end"
      >
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Notificações</h3>
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissAll}
                className="text-xs hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                Limpar tudo
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {count > 0 ? `${count} alerta${count !== 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        <ScrollArea className="max-h-[60dvh]">
          <div className="p-2 space-y-2">
            {count > 0 ? (
              visible.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onDismiss={handleDismiss}
                  onNavigate={handleNavigate}
                  onViewEvent={handleViewEvent}
                />
              ))
            ) : (
              <div className="text-center p-8 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-slate-300">Tudo certo por aqui</p>
                <p className="text-xs text-slate-500 mt-1">Sem alertas no momento</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>

    {selectedEvent && (
      <EventDetailModal
        event={selectedEvent}
        client={selectedEvent.clients || null}
        onClose={() => setSelectedEvent(null)}
        onEdit={() => { setSelectedEvent(null); hardNavigate('/calendar'); }}
        onDelete={() => setSelectedEvent(null)}
        onMarkPaid={() => setSelectedEvent(null)}
      />
    )}
    </>
  );
}
