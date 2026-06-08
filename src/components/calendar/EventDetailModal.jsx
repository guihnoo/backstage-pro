import { useState, useMemo } from 'react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  MapPin,
  FileText,
  Zap,
  Loader2
} from 'lucide-react';
import {
  formatDisplayDate,
  getEventStatus,
  getEventStatusConfig
} from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { useDailyWork } from '@/lib/useDailyWork';
import { applyAuto12Hours } from '@/api/functions';
import { toast } from 'sonner';
import {
  parseISO,
  differenceInDays
} from 'date-fns';

export default function EventDetailModal({
  event,
  client,
  onClose,
  onEdit,
  onDelete,
  onAddWork,
  onMarkPaid
}) {
  const { formatCurrency } = useFinancialVisibility();
  const { dailyWork } = useDailyWork();
  const [applying12h, setApplying12h] = useState(false);

  // Hooks must be called before any conditional return
  const eventWork = useMemo(() => {
    if (!event) return [];
    return (dailyWork || []).filter(w => w.event_id === event.id);
  }, [dailyWork, event]);

  const totals = useMemo(() => {
    const totalHours = eventWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);
    const totalOvertime = eventWork.reduce((sum, w) => sum + (w.overtime_hours || 0), 0);
    const totalEarned = eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
    return { totalHours, totalOvertime, totalEarned };
  }, [eventWork]);

  const estimatedValue = useMemo(() => {
    if (!event || eventWork.length > 0) return null;
    return getEventCacheAmount(event);
  }, [event, eventWork.length]);

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
          description: 'Você pode editar depois se necessário.',
          duration: 5000
        });
        onClose();
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200 flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-white mb-2 truncate">
                {event.title}
              </DialogTitle>
              {client && (
                <p className="text-slate-400 truncate mb-3">{client.name}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusConfig.badgeClass}>
                  {StatusIcon && <StatusIcon className="w-4 h-4 mr-1" />}
                  {statusConfig.label}
                </Badge>
                {event.payment_status === 'paid' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Pago
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-6">
            
            {/* Quick Actions para evento concluído */}
            {status === 'completed' && !event.auto_hours_applied && (
              <Card className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 border-purple-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="font-bold text-purple-200">Ação Rápida Disponível</h4>
                      <p className="text-sm text-purple-300/80">
                        Aplique 12h automaticamente sem precisar registrar manualmente
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleApply12Hours}
                    disabled={applying12h}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {applying12h ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aplicando 12h...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Aplicar 12h Automáticas
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Informações Básicas */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Informações do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Data Início</p>
                    <p className="text-white font-medium">{formatDisplayDate(event.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Data Fim</p>
                    <p className="text-white font-medium">{formatDisplayDate(event.end_date)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-400">Local</p>
                      <p className="text-white">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-400">Descrição</p>
                      <p className="text-white">{event.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações Financeiras */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Informações Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cachê Diário</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(event.daily_cache_value || 0)}
                  </p>
                </div>

                {eventWork.length > 0 ? (
                  <>
                    <Separator className="bg-slate-700" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Horas Trabalhadas</p>
                        <p className="text-xl font-bold text-cyan-400">{totals.totalHours}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Horas Extras</p>
                        <p className="text-xl font-bold text-orange-400">{totals.totalOvertime}h</p>
                      </div>
                    </div>
                    <Separator className="bg-slate-700" />
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Ganho</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(totals.totalEarned)}
                      </p>
                    </div>
                  </>
                ) : estimatedValue !== null && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Valor Estimado</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {formatCurrency(estimatedValue)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Baseado no cachê diário e duração do evento
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Registros de Trabalho */}
            {eventWork.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Registros de Trabalho ({eventWork.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eventWork.map((work, idx) => (
                      <div
                        key={work.id || idx}
                        className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-white">
                            {formatDisplayDate(work.date)}
                          </p>
                          <p className="text-green-400 font-bold">
                            {formatCurrency(work.daily_cache || 0)}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-slate-400">Entrada</p>
                            <p className="text-white">{work.entry_time || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Saída</p>
                            <p className="text-white">{work.exit_time || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Horas</p>
                            <p className="text-cyan-400 font-medium">{work.total_hours || 0}h</p>
                          </div>
                        </div>
                        {work.notes && (
                          <p className="text-sm text-slate-400 mt-2 italic">{work.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer com Ações */}
        <DialogFooter className="px-6 py-4 border-t border-slate-800 flex-row gap-2">
          <Button
            onClick={onAddWork}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Horas
          </Button>
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1 border-slate-700 hover:bg-slate-800"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          {status === 'completed' && event.payment_status !== 'paid' && (
            <Button
              onClick={onMarkPaid}
              variant="outline"
              className="flex-1 border-green-700 hover:bg-green-900/20 text-green-400"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Marcar como Pago
            </Button>
          )}
          <Button
            onClick={onDelete}
            variant="outline"
            className="border-red-700 hover:bg-red-900/20 text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}