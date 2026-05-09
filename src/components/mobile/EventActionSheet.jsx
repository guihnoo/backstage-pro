import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { formatDisplayDate, getEventStatus, getEventStatusConfig } from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { applyAuto12Hours } from '@/api/functions';
import { toast } from 'sonner';

export default function EventActionSheet({
  event,
  client,
  isOpen,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
  onOpenHours,
  onMarkPaid
}) {
  const { formatCurrency } = useFinancialVisibility();
  const [applying12h, setApplying12h] = useState(false);

  if (!event) return null;

  const status = getEventStatus(event);
  const statusConfig = getEventStatusConfig(event);
  const StatusIcon = statusConfig.icon;

  const handleApply12Hours = async () => {
    setApplying12h(true);
    try {
      const result = await applyAuto12Hours({ eventId: event.id, origin: 'manual_12h' });
      
      if (result.data.success) {
        toast.success('12 horas aplicadas automaticamente!', {
          description: 'Você pode editar depois se necessário.'
        });
        onClose();
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error('Erro ao aplicar horas', {
          description: result.data.error || 'Tente novamente.'
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar 12h:', error);
      toast.error('Erro ao aplicar horas automáticas', {
        description: error.message || 'Tente novamente.'
      });
    } finally {
      setApplying12h(false);
    }
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
                {status === 'completed' && !event.auto_hours_applied && (
                  <Button
                    onClick={handleApply12Hours}
                    disabled={applying12h}
                    className="w-full h-14 min-h-[44px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium text-base justify-start px-4"
                  >
                    {applying12h ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <div className="font-bold">Aplicar 12h Automáticas</div>
                          <div className="text-xs opacity-80">Mais rápido - sem registro manual</div>
                        </div>
                      </>
                    )}
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

                {/* Marcar como Pago */}
                {status === 'completed' && event.payment_status !== 'paid' && (
                  <Button
                    variant="outline"
                    onClick={onMarkPaid}
                    className="w-full h-12 min-h-[44px] bg-green-900/20 border-green-700/50 hover:bg-green-900/30 text-green-400 justify-start"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-3" />
                    Marcar como Pago
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