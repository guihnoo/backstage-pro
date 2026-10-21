import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, CheckCircle2, Loader2, ChevronRight, Plus } from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { usePaymentToggle } from '@/lib/usePaymentToggle';
import { useDailyWork } from '@/lib/useDailyWork';
import PaymentConfirmModal from '@/components/reports/PaymentConfirmModal';
import { useStatusToggle } from '@/lib/useStatusToggle';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { getEventDisplay } from '@/lib/eventDisplay';
import { resolveEventColor } from '@/lib/brandColors';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { Skeleton } from '@/components/ui/skeleton';

function getTimeGroup(daysFromToday) {
  if (daysFromToday === 0) return 'Hoje';
  if (daysFromToday === 1) return 'Amanhã';
  if (daysFromToday <= 7) return 'Esta semana';
  if (daysFromToday <= 14) return 'Próxima semana';
  return 'Em breve';
}

const statusConfig = {
  pending:   { label: 'Pendente',    color: 'bg-[#ffd400]/20 border-[#ffd400]/30 text-[#ffd400]' },
  scheduled: { label: 'Agendado',    color: 'bg-[#ffd400]/20 border-[#ffd400]/30 text-[#ffd400]' },
  confirmed: { label: '✓ Confirmado', color: 'bg-[#ffd400]/20 border-[#ffd400]/30 text-[#ffd400]' },
  completed: { label: 'Concluído',   color: 'bg-[#333333]/20 border-[#444444]/30 text-[#c8c8c8]' },
  cancelled: { label: 'Cancelado',   color: 'bg-[#ff2e88]/20 border-[#ff2e88]/30 text-[#ff2e88]' }
};

export default function ProximosEventos({ events, isLoading, onRefresh, onViewEvent, userCategory }) {
  const config = getCategoryConfig(userCategory || 'lighting');
  const proximosEventos = events.slice(0, 6);
  const { togglePayment, toggling: togglingPayment } = usePaymentToggle();
  // Marcar pago abre a janela do valor real (regra do dono); desmarcar continua direto.
  const [payEvent, setPayEvent] = useState(null);
  const { dailyWork } = useDailyWork();
  const { confirmEvent, toggling: togglingStatus } = useStatusToggle();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const today = new Date();

  const groupedEvents = useMemo(() => {
    const groups = [];
    let lastGroup = null;
    for (const ev of proximosEventos) {
      const dateStr = ev.start_date || ev.event_date;
      const d = dateStr ? parseISO(dateStr) : null;
      const days = d ? differenceInCalendarDays(d, today) : 999;
      const group = getTimeGroup(Math.max(0, days));
      if (group !== lastGroup) {
        groups.push({ type: 'header', label: group });
        lastGroup = group;
      }
      groups.push({ type: 'event', event: ev, days });
    }
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proximosEventos]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-[#2a2a2a]/30 bg-[#161616]/50 flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-10 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-3 w-10 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (proximosEventos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8 p-6 rounded-xl border text-center"
        style={{
          background: `linear-gradient(to right, ${config.primaryHex}14, ${config.accentHex}10)`,
          borderColor: `${config.primaryHex}40`,
        }}
      >
        <p className="font-semibold" style={{ color: config.primaryHex }}>📅 Nenhum evento próximo</p>
        <p className="text-sm text-[#a8a8a8] mt-1 mb-4">Crie seu primeiro evento para começar!</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => hardNavigate('/calendar')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:brightness-110"
          style={{
            background: `${config.primaryHex}22`,
            borderColor: `${config.primaryHex}55`,
            color: config.primaryHex,
          }}
        >
          <Plus className="w-4 h-4" /> Criar evento
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Próximos Eventos</h3>
        <button
          type="button"
          onClick={() => hardNavigate('/calendar')}
          className="text-xs text-[#888888] flex items-center gap-1 transition-colors bp-hover-primary"
        >
          Ver agenda <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        {groupedEvents.map((item, idx) => {
          if (item.type === 'header') {
            return (
              <div key={`h-${item.label}`} className={`flex items-center gap-2 ${idx > 0 ? 'mt-4' : 'mt-0'} mb-2`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest font-tag ${
                  item.label === 'Hoje' ? 'bp-text-primary' :
                  item.label === 'Amanhã' ? 'text-[#ffd400]' :
                  'text-[#888888]'
                }`}>
                  {item.label}
                </span>
                {item.label === 'Hoje' && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: config.primaryHex }}
                  />
                )}
                <div className="flex-1 h-px bg-[#1e2030]" />
              </div>
            );
          }

          const event = item.event;
          const status = statusConfig[event.status] || statusConfig.pending;
          const dateStr = event.start_date || event.event_date;
          const eventDate = dateStr ? parseISO(dateStr) : null;
          const formattedDate = eventDate ? format(eventDate, 'd MMM', { locale: ptBR }) : '';
          const formattedTime = event.start_time
            ? format(parseISO(`2000-01-01T${event.start_time}`), 'HH:mm')
            : '';
          const isPaid = event.payment_status === 'paid';
          const isToggling = togglingPayment === event.id;
          const isConfirming = togglingStatus === event.id;
          const isPending = event.status === 'pending';
          const cacheValue = getEventCacheAmount(event);
          const display = getEventDisplay(event, event.clients);
          const barColor = resolveEventColor(event, event.clients);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx, 10) * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewEvent ? onViewEvent(event) : hardNavigate('/calendar')}
              className={`p-4 rounded-lg border transition-all group cursor-pointer ${
                item.days === 0
                  ? 'bp-today-surface-soft hover:brightness-110'
                  : 'bg-[#161616]/50 border-[#2a2a2a]/30 hover:border-[#2a2a2a]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: barColor, boxShadow: `0 0 5px ${barColor}80` }} />
                    <div className="min-w-0">
                      <h4
                        className="font-semibold text-white truncate transition-colors group-hover:[color:var(--event-primary)]"
                        style={{ '--event-primary': config.primaryHex }}
                      >
                        {display.companyName}
                      </h4>
                      {display.showEventSubtitle && (
                        <p className="text-xs text-[#a8a8a8] truncate">{display.eventName}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${status.color}`}>
                      {status.label}
                    </span>
                    {isPaid && (
                      <span className="text-xs px-2 py-0.5 rounded border whitespace-nowrap bg-[#ffd400]/20 border-[#ffd400]/30 text-[#ffd400]">
                        ✓ Pago
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-[#a8a8a8]">
                    {formattedTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formattedTime}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-[#888888] mb-0.5">{formattedDate.toUpperCase()}</p>
                    <p className="font-bold tabular-nums" style={{ color: config.primaryHex }}>
                      {isVisible ? formatCurrency(cacheValue) : '•••'}
                    </p>
                  </div>

                  {isPending && (
                    <button
                      type="button"
                      disabled={isConfirming}
                      onClick={(e) => { e.stopPropagation(); confirmEvent(event, onRefresh); }}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-full border transition-all active:scale-95 bg-[#ffd400]/30 border-[#ffd400]/30 text-[#ffd400] hover:bg-[#ffd400]/40"
                      title="Confirmar evento"
                    >
                      {isConfirming ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Confirmar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPaid) togglePayment(event, onRefresh);
                      else setPayEvent(event);
                    }}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-full border transition-all active:scale-95 ${
                      isPaid
                        ? 'bg-[#ffd400]/15 border-[#ffd400]/30 text-[#ffd400] hover:bg-[#ffd400]/25'
                        : 'bg-[#1f1f1f]/50 border-[#2a2a2a]/50 text-[#888888] hover:border-[#ffd400]/40 hover:text-[#ffd400]'
                    }`}
                    title={isPaid ? 'Desmarcar pagamento' : 'Marcar como pago'}
                  >
                    {isToggling ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {isPaid ? 'Pago' : 'Marcar pago'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <PaymentConfirmModal
        event={payEvent}
        dailyWork={payEvent ? (dailyWork || []).filter((w) => w.event_id === payEvent.id) : []}
        isOpen={!!payEvent}
        onClose={() => setPayEvent(null)}
        onSuccess={() => { setPayEvent(null); onRefresh?.(); }}
      />
    </div>
  );
}
