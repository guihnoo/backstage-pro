
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getEventStatusLabel, getEventStatusConfig, getEventStatus, formatDisplayDate, formatFullDate, timeRangeLabel } from '../utils/dateUtils';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import PaymentConfirmModal from './PaymentConfirmModal';
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Paperclip,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Zap,
  Building2,
  Copy
} from 'lucide-react';

const InfoItem = ({ icon: Icon, label, value, color = 'text-slate-300', isCurrency = false, formatFn }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const displayValue = formatFn ? formatFn(value) : isCurrency ? formatCurrency(value) : value;

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <Icon className={`w-4 h-4 mt-0.5 sm:mt-1 ${color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${color} break-words`}>
          {isVisible || !isCurrency ? displayValue || 'Não informado' : '•••••'}
        </p>
      </div>
    </div>
  );
};

const WorkItem = ({ work, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">

      <div className="flex justify-between items-center mb-2 gap-2">
        <p className="text-sm font-bold text-white truncate flex-1">{formatFullDate(work.date)}</p>
        <Button variant="ghost" size="sm" className="h-8 px-2 flex-shrink-0" onClick={() => onEdit(work)}>
          <Edit className="w-3 h-3 mr-1" /> Editar
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <InfoItem icon={Clock} label="Horas" value={`${work.total_hours?.toFixed(1) || 0}h`} color="text-cyan-300" />
        <InfoItem icon={Clock} label="Extras" value={`${work.overtime_hours?.toFixed(1) || 0}h`} color="text-pink-400" />
        <InfoItem icon={DollarSign} label="Cachê Dia" value={work.daily_cache || 0} isCurrency={true} color="text-green-300" />
        {work.photo_url &&
          <a href={work.photo_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center justify-center gap-1 text-xs">
            <Paperclip className="w-3 h-3" /> Ver Foto
          </a>
        }
      </div>
      {work.notes && <p className="text-xs text-slate-400 mt-2 p-2 bg-slate-900/50 rounded break-words">{work.notes}</p>}
    </motion.div>
  );
};

const ExpenseItem = ({ expense, onEdit: _onEdit }) => {
  const { formatCurrency } = useFinancialVisibility();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">

      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{expense.title}</p>
          <Badge variant="secondary" className="text-xs capitalize mt-1">{expense.category}</Badge>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-amber-400">{formatCurrency(expense.amount)}</p>
          <p className="text-xs text-slate-400 whitespace-nowrap">{formatDisplayDate(expense.date)}</p>
        </div>
      </div>
      {expense.description && <p className="text-xs text-slate-400 mt-2 break-words">{expense.description}</p>}
    </motion.div>
  );
};

const EventDetailModal = React.memo(function EventDetailModal({
  event,
  dailyWork = [],
  expenses = [],
  client,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onPaymentUpdate,
  onWorkEdit,
  _onWorkDelete,
  _onAddExpense,
  onExpenseEdit,
  _onExpenseDelete,
  onApply12h
}) {
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const statusConfig = useMemo(() => event ? getEventStatusConfig(event) : {}, [event]);
  const statusLabel = useMemo(() => event ? getEventStatusLabel(event) : '', [event]);

  const stats = useMemo(() => {
    if (!event || !dailyWork) return {};

    const totalHours = dailyWork.reduce((sum, work) => sum + (work.total_hours || 0), 0);
    const totalOvertime = dailyWork.reduce((sum, work) => sum + (work.overtime_hours || 0), 0);
    const fromWork = dailyWork.reduce((sum, work) => sum + (work.daily_cache || 0), 0);
    const totalRevenue = fromWork > 0 ? fromWork : getEventCacheAmount(event);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netRevenue = totalRevenue - totalExpenses;

    return { totalHours, totalOvertime, totalRevenue, totalExpenses, netRevenue };
  }, [event, dailyWork, expenses]);

  const canApply12h = useMemo(() => {
    if (!event) return false;
    const isCompleted = getEventStatus(event) === 'completed';
    return isCompleted && (!dailyWork || dailyWork.length === 0) && !event.auto_hours_applied;
  }, [event, dailyWork]);

  if (!event) return null;

  const handlePaymentUpdate = () => {
    setShowPaymentConfirm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentConfirm(false);
    onPaymentUpdate();
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-[95dvh] max-h-[95dvh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 overflow-hidden flex flex-col">
          <DialogHeader className={`p-3 sm:p-4 md:p-6 border-b ${statusConfig.borderColor} flex-shrink-0`}>
            <div className="flex justify-between items-start gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={`${statusConfig.badgeClass} border text-xs`}>{statusLabel}</Badge>
                  {client && (
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-300">
                      <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[150px] sm:max-w-none">{client.name}</span>
                    </div>
                  )}
                </div>
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold font-display truncate pr-2">
                  {event.title}
                </DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 min-w-[44px] min-h-[44px]">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 pb-safe">

              {canApply12h && (
                <Alert className="bg-blue-900/40 border-blue-700 text-blue-200">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col gap-2 w-full">
                    <AlertDescription className="text-sm">
                      Evento concluído sem registros. Deseja aplicar 12h de trabalho?
                    </AlertDescription>
                    <Button
                      size="sm"
                      onClick={() => onApply12h(event)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-10 min-h-[44px]"
                    >
                      <Zap className="w-4 h-4 mr-2" /> Aplicar 12h
                    </Button>
                  </div>
                </Alert>
              )}

              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
                  <InfoItem icon={DollarSign} label="Receita Bruta" value={stats.totalRevenue || 0} isCurrency color="text-green-300" />
                  <InfoItem icon={FileText} label="Despesas" value={stats.totalExpenses || 0} isCurrency color="text-amber-400" />
                  <InfoItem icon={DollarSign} label="Receita Líquida" value={stats.netRevenue || 0} isCurrency color="text-cyan-300" />
                  <InfoItem icon={Clock} label="Total Horas" value={`${stats.totalHours?.toFixed(1) || 0}h`} color="text-slate-300" />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-white text-sm sm:text-base">Detalhes do Evento</h3>
                  <InfoItem icon={Calendar} label="Período" value={`${formatFullDate(event.start_date)} - ${formatFullDate(event.end_date)}`} />
                  <InfoItem icon={Clock} label="Horário" value={timeRangeLabel(event)} />
                  <InfoItem icon={DollarSign} label="Valor Diária Base" value={event.daily_cache_value || 0} isCurrency />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-white text-sm sm:text-base">Detalhes do Pagamento</h3>
                  <InfoItem
                    icon={event.payment_status === 'paid' ? CheckCircle : AlertTriangle}
                    label="Status Pagamento"
                    value={event.payment_status === 'paid' ? 'Recebido' : 'Pendente'}
                    color={event.payment_status === 'paid' ? 'text-green-400' : 'text-amber-400'}
                  />

                  {event.payment_status === 'paid' ? (
                    <InfoItem icon={Calendar} label="Data do Recebimento" value={event.paid_date ? formatFullDate(event.paid_date) : null} />
                  ) : (
                    <InfoItem icon={Calendar} label="Vencimento" value={event.payment_due_date ? formatFullDate(event.payment_due_date) : null} />
                  )}
                  {event.paid_amount > 0 && <InfoItem icon={DollarSign} label="Valor Recebido" value={event.paid_amount} isCurrency />}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white text-sm sm:text-base">Registros de Trabalho ({dailyWork.length})</h3>
                {dailyWork.length > 0 ? (
                  <div className="space-y-3">
                    {dailyWork.map((work) => <WorkItem key={work.id} work={work} onEdit={onWorkEdit} />)}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhum registro de trabalho para este evento.</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white text-sm sm:text-base">Despesas ({expenses.length})</h3>
                {expenses.length > 0 ? (
                  <div className="space-y-3">
                    {expenses.map((exp) => <ExpenseItem key={exp.id} expense={exp} onEdit={onExpenseEdit} />)}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhuma despesa registrada para este evento.</p>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-3 sm:p-4 bg-slate-900/50 border-t border-slate-700 flex flex-col sm:flex-row gap-2 sm:justify-between flex-shrink-0 pb-safe">
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onEdit(event)}
                className="flex-1 sm:flex-none bg-slate-800 border-slate-700 hover:bg-slate-700 text-white px-3 py-2 text-xs sm:text-sm h-10 min-h-[44px]"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Editar
              </Button>
              {onDuplicate && (
                <Button
                  variant="outline"
                  onClick={() => { onDuplicate(event); onClose(); }}
                  className="flex-1 sm:flex-none bg-slate-800 border-slate-700 hover:bg-slate-700 text-cyan-300 px-3 py-2 text-xs sm:text-sm h-10 min-h-[44px]"
                  title="Criar cópia deste evento"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Duplicar
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => onDelete(event.id)}
                className="flex-1 sm:flex-none text-xs sm:text-sm h-10 min-h-[44px]"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Excluir
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {event.payment_status !== 'paid' && (
                <Button
                  onClick={handlePaymentUpdate}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-10 min-h-[44px]"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Confirmar Recebimento
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showPaymentConfirm &&
          <PaymentConfirmModal
            event={event}
            isOpen={showPaymentConfirm}
            onClose={() => setShowPaymentConfirm(false)}
            onSuccess={handlePaymentSuccess} />
        }
      </AnimatePresence>
    </>
  );
});

export default EventDetailModal;
