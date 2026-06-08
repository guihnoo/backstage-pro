import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, User, CheckCircle2, Loader2, ChevronRight, Plus } from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { usePaymentToggle } from '@/lib/usePaymentToggle';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-600/20 border-amber-500/30 text-amber-300' },
  confirmed: { label: '✓ Confirmado', color: 'bg-green-600/20 border-green-500/30 text-green-300' },
  completed: { label: 'Concluído', color: 'bg-blue-600/20 border-blue-500/30 text-blue-300' },
  cancelled: { label: 'Cancelado', color: 'bg-red-600/20 border-red-500/30 text-red-300' }
};

export default function ProximosEventos({ events, isLoading, onRefresh }) {
  const proximosEventos = events.slice(0, 5);
  const { togglePayment, toggling } = usePaymentToggle();

  if (isLoading) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Próximos Eventos</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
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
        className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-center"
      >
        <p className="text-blue-300 font-semibold">📅 Nenhum evento próximo</p>
        <p className="text-sm text-blue-400/70 mt-1 mb-4">Crie seu primeiro evento para começar!</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => hardNavigate('/calendar')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-600/30 transition-colors"
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
          className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
        >
          Ver agenda <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-3">
        {proximosEventos.map((event, idx) => {
          const status = statusConfig[event.status] || statusConfig.pending;
          const dateStr = event.start_date || event.event_date;
          const eventDate = dateStr ? parseISO(dateStr) : null;
          const formattedDate = eventDate ? format(eventDate, 'd MMM', { locale: ptBR }) : '';
          const formattedTime = event.start_time
            ? format(parseISO(`2000-01-01T${event.start_time}`), 'HH:mm')
            : '';
          const isPaid = event.payment_status === 'paid';
          const isToggling = toggling === event.id;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => hardNavigate('/calendar')}
              className="p-4 rounded-lg bg-gray-900/50 border border-gray-700/30 hover:border-gray-600/50 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {event.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${status.color}`}>
                      {status.label}
                    </span>
                    {isPaid && (
                      <span className="text-xs px-2 py-0.5 rounded border whitespace-nowrap bg-emerald-600/20 border-emerald-500/30 text-emerald-300">
                        ✓ Pago
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {event.clients?.name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{event.clients.name}</span>
                      </div>
                    )}
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
                    <p className="text-xs text-gray-500 mb-0.5">{formattedDate.toUpperCase()}</p>
                    <p className="font-bold text-cyan-400">
                      R${(event.actual_revenue || event.estimated_revenue || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePayment(event, onRefresh);
                    }}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-all active:scale-95 ${
                      isPaid
                        ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/25'
                        : 'bg-gray-800/50 border-gray-700/50 text-gray-500 hover:border-emerald-500/40 hover:text-emerald-400'
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
    </div>
  );
}
