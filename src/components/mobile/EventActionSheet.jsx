import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Eye,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar,
  Zap,
  Copy,
} from 'lucide-react';
import { formatDisplayDate, getEventStatus, getEventStatusConfig } from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { toast } from 'sonner';

export default function EventActionSheet({
  event,
  client,
  isOpen,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenHours,
  onMarkPaid,
  onApplyManual12h,
  canApplyAuto12h,
}) {
  const { formatCurrency } = useFinancialVisibility();

  if (!event) return null;

  const status = getEventStatus(event);
  const statusConfig = getEventStatusConfig(event);
  const StatusIcon = statusConfig.icon;

  const handleApply12Hours = () => {
    if (onApplyManual12h) {
      onApplyManual12h(event);
    } else {
      toast.info('Aplicar 12h automáticas em breve.', {
        description: 'Use "Registrar Horas" manualmente por enquanto.',
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t-2 border-cyan-400 rounded-t-3xl shadow-2xl pb-safe max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-800">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white truncate mb-2">
                    {event.title}
                  </h2>
                  {client && (
                    <p className="text-sm text-slate-400 truncate mb-2">
                      {client.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${statusConfig.badgeClass}`}>
                      {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                      {statusConfig.label}
                    </Badge>
                    {event.payment_status === 'paid' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Pago
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="flex-shrink-0 h-10 w-10 min-w-[44px] min-h-[44px]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Event Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>
                    {formatDisplayDate(event.start_date)} - {formatDisplayDate(event.end_date)}
                  </span>
                </div>
                {event.daily_cache_value > 0 && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span>{formatCurrency(event.daily_cache_value)}/dia</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                
                {/* Aplicar 12h Automáticas */}
                {canApplyAuto12h && (
                  <Button
                    onClick={handleApply12Hours}
                    className="w-full h-14 min-h-[44px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium text-base justify-start px-4"
                  >
                    <Zap className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-bold">Aplicar 12h Automáticas</div>
                      <div className="text-xs opacity-80">Mais rápido — 12h por dia do evento</div>
                    </div>
                  </Button>
                )}

                {/* Registrar Horas Manualmente */}
                <Button
                  onClick={onOpenHours}
                  className="w-full h-14 min-h-[44px] bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-base justify-start px-4"
                >
                  <Clock className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-bold">Registrar Horas</div>
                    <div className="text-xs opacity-80">Entrada, saída e detalhes</div>
                  </div>
                </Button>

                <Separator className="bg-slate-800 my-3" />

                {/* Ver Detalhes */}
                <Button
                  variant="outline"
                  onClick={onViewDetails}
                  className="w-full h-12 min-h-[44px] bg-slate-800 border-slate-700 hover:bg-slate-700 text-white justify-start"
                >
                  <Eye className="w-5 h-5 mr-3" />
                  Ver Detalhes Completos
                </Button>

                {/* Editar */}
                <Button
                  variant="outline"
                  onClick={onEdit}
                  className="w-full h-12 min-h-[44px] bg-slate-800 border-slate-700 hover:bg-slate-700 text-white justify-start"
                >
                  <Edit className="w-5 h-5 mr-3" />
                  Editar Evento
                </Button>

                {/* Duplicar */}
                {onDuplicate && (
                  <Button
                    variant="outline"
                    onClick={onDuplicate}
                    className="w-full h-12 min-h-[44px] bg-slate-800 border-slate-700 hover:bg-slate-700 text-cyan-300 justify-start"
                  >
                    <Copy className="w-5 h-5 mr-3" />
                    Duplicar Evento
                  </Button>
                )}

                {/* Toggle pagamento */}
                {event.payment_status !== 'paid' ? (
                  <Button
                    variant="outline"
                    onClick={onMarkPaid}
                    className="w-full h-12 min-h-[44px] bg-green-900/20 border-green-700/50 hover:bg-green-900/30 text-green-400 justify-start"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-3" />
                    Marcar como Pago
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={onMarkPaid}
                    className="w-full h-12 min-h-[44px] bg-amber-900/20 border-amber-700/50 hover:bg-amber-900/30 text-amber-400 justify-start"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-3" />
                    Desmarcar pagamento
                  </Button>
                )}

                <Separator className="bg-slate-800 my-3" />

                {/* Excluir */}
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="w-full h-12 min-h-[44px] bg-red-900/20 border-red-700/50 hover:bg-red-900/30 text-red-400 justify-start"
                >
                  <Trash2 className="w-5 h-5 mr-3" />
                  Excluir Evento
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}