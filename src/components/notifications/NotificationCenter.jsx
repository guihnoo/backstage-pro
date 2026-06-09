import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Clock, Calendar, DollarSign, Target, X, Zap } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';
import {
  differenceInDays,
  parseISO,
  isValid,
  format,
  addDays,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Gera lista estável de notificações a partir dos dados do usuário
function buildNotifications({ events, clients, profile, today, formatCurrency }) {
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = addDays(today, 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const clientMap = new Map((clients || []).map(c => [c.id, c]));
  const notes = [];

  for (const ev of events || []) {
    const startStr = ev.start_date?.split('T')[0];
    const endStr = ev.end_date?.split('T')[0] || startStr;
    if (!startStr) continue;

    const clientName = clientMap.get(ev.client_id)?.name || 'Cliente';

    // Evento hoje → urgent
    if (startStr <= todayStr && endStr >= todayStr) {
      notes.push({
        id: `today:${ev.id}`,
        type: 'today_event',
        priority: 'urgent',
        title: `⚡ Hoje em cena: ${ev.title}`,
        message: `Você tem um show hoje com ${clientName}.`,
        action_url: '/calendar',
        created_date: todayStr,
      });
    }
    // Evento amanhã → high
    else if (startStr === tomorrowStr) {
      notes.push({
        id: `tomorrow:${ev.id}`,
        type: 'event_reminder',
        priority: 'high',
        title: `📅 Show amanhã: ${ev.title}`,
        message: `Lembre de confirmar com ${clientName}.`,
        action_url: '/calendar',
        created_date: todayStr,
      });
    }

    // Pagamento pendente de evento já encerrado → high/urgent
    const endDate = endStr ? parseISO(endStr) : null;
    const isPast = endDate && isValid(endDate) && startOfDay(endDate) < startOfDay(today);
    const unpaid = ev.payment_status !== 'paid';

    if (isPast && unpaid) {
      const daysLate = differenceInDays(today, endDate);
      const isUrgent = daysLate > 7;
      const amount = getEventCacheAmount(ev);
      const amountLabel = formatCurrency ? formatCurrency(amount) : `R$ ${amount.toLocaleString('pt-BR')}`;
      notes.push({
        id: `payment:${ev.id}`,
        type: 'payment_reminder',
        priority: isUrgent ? 'urgent' : 'high',
        title: `💰 Pagamento pendente: ${ev.title}`,
        message: `${clientName} · ${amountLabel} · ${daysLate} dia${daysLate !== 1 ? 's' : ''} em atraso.`,
        action_url: '/reports',
        created_date: todayStr,
      });
    }
  }

  // Meta mensal de eventos quase batida
  const metaEventos = Number(profile?.monthly_goal_events) || 10;
  const thisMonthEvents = (events || []).filter(ev => {
    const s = ev.start_date?.split('T')[0];
    if (!s) return false;
    const now = new Date();
    return s.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  });
  const count = thisMonthEvents.length;
  const remaining = metaEventos - count;

  if (remaining > 0 && remaining <= 2) {
    notes.push({
      id: `goal:events:${todayStr.slice(0, 7)}`,
      type: 'goal_reminder',
      priority: 'medium',
      title: `🎯 Meta quase lá!`,
      message: `Falta${remaining === 1 ? '' : 'm'} só ${remaining} evento${remaining !== 1 ? 's' : ''} para bater sua meta do mês.`,
      action_url: '/goals',
      created_date: todayStr,
    });
  }

  // Ordenação: urgent → high → medium
  const order = { urgent: 0, high: 1, medium: 2, low: 3 };
  return notes.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
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

function NotificationItem({ notification, onDismiss, onNavigate }) {
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const styleClass = PRIORITY_STYLES[notification.priority] || PRIORITY_STYLES.low;

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
              {notification.action_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { onNavigate(notification.action_url); onDismiss(notification.id); }}
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
  const { formatCurrency } = useFinancialVisibility();
  const [dismissed, setDismissed] = useState(() => getDismissed());
  const [isOpen, setIsOpen] = useState(false);

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

  const allNotifications = useMemo(() =>
    buildNotifications({ events, clients, profile, today: new Date(), formatCurrency }),
    [events, clients, profile, formatCurrency]
  );

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

  if (!user?.id) return null;

  const count = visible.length;

  return (
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
        <ScrollArea className="max-h-[60vh]">
          <div className="p-2 space-y-2">
            {count > 0 ? (
              visible.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onDismiss={handleDismiss}
                  onNavigate={handleNavigate}
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
  );
}
