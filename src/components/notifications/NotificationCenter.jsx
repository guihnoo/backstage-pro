import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';
// Só carrega ao tocar numa notificação: o sino fica na barra de todas as telas.
const EventDetailModal = lazy(() => import('@/components/calendar/EventDetailModal'));
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { useAuth } from '@/lib/authContext';
import { useDailyWork } from '@/lib/useDailyWork';
import { monthRange } from '@/lib/financeMetrics';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';
import appToast from '@/lib/appToast';

const EventForm = lazy(() => import('@/components/calendar/EventForm'));
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildUserNotifications } from '@/lib/notificationRules';
import { todayLocalISO, countUniqueWorkDays } from '@/components/utils/dateUtils';

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

// Cada tipo de aviso ganha uma etiqueta e uma cor (visual All Access).
const TYPE_LOOK = {
  today_event: { tag: 'HOJE', color: '#ffd400' },
  event_reminder: { tag: 'AG', color: '#ffd400' },
  payment_reminder: { tag: 'R$', color: '#ff2e88' },
  goal_reminder: { tag: '★', color: '#ffd400' },
  work_reminder: { tag: 'H', color: '#ffffff' },
};

function NotificationItem({ notification, onDismiss, onNavigate, onViewEvent }) {
  const look = TYPE_LOOK[notification.type] || { tag: '!', color: '#ffffff' };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const msg = buildChargeMessage({
      clientName: notification.clientName,
      events: [{ title: notification.event_ref?.title || '', start_date: notification.event_ref?.start_date, amount: notification.amount }],
      totalAmount: notification.amount,
    });
    openWhatsAppCharge(notification.phone, msg);
  };

  const pill = 'h-8 px-3 rounded-full text-xs font-extrabold active:scale-95 transition-transform';

  return (
    <div
      className="rounded-[14px] bg-[#1a1a1a] px-3 py-2.5 flex gap-2.5 items-start"
      style={{ borderLeft: `4px solid ${look.color}` }}
    >
      <div
        className="w-[34px] h-[34px] rounded-[10px] text-[#0a0a0a] flex items-center justify-center font-poster text-[13px] shrink-0"
        style={{ background: look.color }}
      >
        {look.tag}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-1.5">
          <span className="text-sm font-extrabold leading-tight">{notification.title}</span>
          <span className="font-tag text-[10px] text-[#a8a8a8] whitespace-nowrap">
            {format(parseISO(notification.created_date), 'dd/MM', { locale: ptBR })}
          </span>
        </div>
        <div className="text-[13px] text-[#c8c8c8] leading-snug mt-0.5">{notification.message}</div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {notification.type === 'payment_reminder' && notification.phone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className={`${pill} border-0 text-[#0a0a0a]`}
              style={{ background: look.color }}
              title="Cobrar via WhatsApp"
            >
              Cobrar
            </button>
          )}
          {notification.action_url && (
            <button
              type="button"
              onClick={() => { onViewEvent ? onViewEvent(notification) : onNavigate(notification.action_url); onDismiss(notification.id); }}
              className={`${pill} border border-[#444444] bg-transparent text-white`}
            >
              Ver
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(notification.id)}
            className="h-8 px-2 text-xs font-bold text-[#a8a8a8] ml-auto"
            aria-label="Dispensar aviso"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter({ compact = false }) {
  const { user, profile } = useAuth();
  const { events, delete: deleteEvent, refetch: refetchEvents } = useEvents();
  const { clients } = useClients();
  // So precisa das diarias do mes: usa as horas que o app ja carrega (antes o sino fazia
  // 5 consultas proprias ao banco em toda tela, inclusive uma de todas as horas).
  const { dailyWork } = useDailyWork();
  const diariasMes = useMemo(() => {
    const { start, end } = monthRange();
    return countUniqueWorkDays((dailyWork || []).filter((d) => d?.date >= start && d?.date <= end));
  }, [dailyWork]);
  const { formatCurrency } = useFinancialVisibility();
  const [dismissed, setDismissed] = useState(() => getDismissed());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);

  // Limpa dismissed antigos (> 3 dias) a cada abertura
  useEffect(() => {
    if (!isOpen) return;
    const today = todayLocalISO();
    setDismissed(prev => {
      const fresh = new Set(
        [...prev].filter(id => {
          const parts = id.split(':');
          const dateStr = parts[parts.length - 1];
          if (dateStr.length === 10) {
            return differenceInDays(parseISO(today), parseISO(dateStr)) < 3;
          }
          return true;
        })
      );
      if (fresh.size !== prev.size) {
        saveDismissed(fresh);
        return fresh;
      }
      return prev;
    });
  }, [isOpen]);

  const allNotifications = useMemo(() => {
    return buildUserNotifications({
      events,
      clients,
      profile,
      diariasCount: diariasMes,
      today: new Date(),
      formatCurrency,
    });
  }, [events, clients, profile, diariasMes, formatCurrency]);

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

  const handleConfirmDeleteEvent = useCallback(async () => {
    if (!confirmDeleteEventId) return;
    try {
      await deleteEvent(confirmDeleteEventId);
      appToast.success('Evento excluído com sucesso.');
      setSelectedEvent(null);
      await refetchEvents();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      appToast.error('Não foi possível excluir o evento.');
    } finally {
      setConfirmDeleteEventId(null);
    }
  }, [confirmDeleteEventId, deleteEvent, refetchEvents]);

  if (!user?.id) return null;

  const count = visible.length;

  return (
    <>
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`relative inline-flex items-center justify-center rounded-full text-[#a8a8a8] hover:text-white hover:bg-[#1a1a1a] transition-colors ${
            compact ? 'min-w-[44px] min-h-[44px] w-11 h-11' : 'w-10 h-10'
          }`}
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-[#ff2e88] text-white text-[11px] font-extrabold flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[min(92vw,400px)] rounded-[18px] border border-[#2a2a2a] bg-[#0a0a0a] text-white p-0 mr-2 mt-2"
        align="end"
      >
        <div className="px-[18px] pt-4 pb-2 flex items-end justify-between">
          <div>
            <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">
              {count > 0 ? `${count} ${count === 1 ? 'NOVO' : 'NOVOS'}` : 'TUDO EM DIA'}
            </div>
            <div className="font-poster text-[34px] leading-none">AVISOS</div>
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className="h-9 px-3 rounded-full border border-[#333333] bg-transparent text-white text-xs font-extrabold"
            >
              Limpar tudo
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[60dvh]">
          <div className="px-[18px] pb-4 space-y-2">
            {count > 0 ? (
              [['HOJE', visible.filter((n) => String(n.created_date).slice(0, 10) === todayLocalISO())],
               ['ANTES', visible.filter((n) => String(n.created_date).slice(0, 10) !== todayLocalISO())]]
                .filter(([, list]) => list.length > 0)
                .map(([label, list]) => (
                  <div key={label} className="space-y-2">
                    <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] pt-1">{label}</div>
                    {list.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onDismiss={handleDismiss}
                        onNavigate={handleNavigate}
                        onViewEvent={handleViewEvent}
                      />
                    ))}
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <div className="font-poster text-2xl">TUDO CERTO POR AQUI</div>
                <p className="text-xs text-[#a8a8a8] mt-1">Sem avisos no momento</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>

    {selectedEvent && (
      <Suspense fallback={null}>
        <EventDetailModal
          event={selectedEvent}
          client={selectedEvent.clients || clients?.find(c => c.id === selectedEvent.client_id) || null}
          onClose={() => setSelectedEvent(null)}
          onEdit={(event) => {
            setSelectedEvent(null);
            setEditingEvent(event);
            setShowEventForm(true);
          }}
          onDelete={(eventId) => setConfirmDeleteEventId(eventId)}
          onMarkPaid={async () => {
            setSelectedEvent(null);
            await refetchEvents();
          }}
        />
      </Suspense>
    )}

    {showEventForm && (
      <Suspense fallback={null}>
        <EventForm
          isOpen={showEventForm}
          clients={clients}
          event={editingEvent}
          onClose={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          onSuccess={async () => {
            setShowEventForm(false);
            setEditingEvent(null);
            await refetchEvents();
          }}
        />
      </Suspense>
    )}

    <ConfirmDialog
      open={!!confirmDeleteEventId}
      onOpenChange={(open) => !open && setConfirmDeleteEventId(null)}
      title="Excluir evento?"
      description="O evento será removido permanentemente da sua agenda."
      confirmLabel="Excluir"
      destructive
      onConfirm={handleConfirmDeleteEvent}
    />
    </>
  );
}
