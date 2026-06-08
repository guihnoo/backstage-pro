import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import {
  format,
  differenceInDays,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { daysDifference, getEventStatus, normalizeDateString } from '../utils/dateUtils';

export default function PaymentAlerts({ events = [], work = [], clients = [], onEventClick }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const paymentAlerts = useMemo(() => {
    if (!Array.isArray(events) || !Array.isArray(clients)) return [];

    const now = new Date();
    const alerts = [];
    const clientMap = new Map(clients.map(c => [c.id, c.name]));

    events.forEach(event => {
      // CORREÇÃO: Alerta deve aparecer APENAS para eventos concluídos e não pagos
      if (getEventStatus(event) !== 'completed' || event.payment_status === 'paid') {
        return;
      }

      // Calcular valor devido baseado no trabalho realizado ou valor do evento
      const eventWork = Array.isArray(work) ? work.filter(w => w.event_id === event.id) : [];
      let amountDue = 0;

      // Prioridade 1: Usar a soma dos cachês do trabalho registrado
      if (eventWork.length > 0) {
        amountDue = eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
      } 
      // Prioridade 2: Usar o valor projetado do evento
      else {
        const eventDays = daysDifference(event.start_date, event.end_date);
        amountDue = (event.daily_cache_value || 0) * (eventDays > 0 ? eventDays : 1);
      }

      // Só adicionar se há valor a receber
      if (amountDue <= 0) return;

      let status = 'pending';
      let message = 'Pagamento pendente';
      let urgency = 1;

      if (event.payment_due_date) {
        try {
            const dueDate = parseISO(event.payment_due_date);
            const daysOverdue = differenceInDays(now, dueDate);
            
            if (daysOverdue > 0) {
              status = 'overdue';
              message = `Vencido há ${daysOverdue} dia(s)`;
              urgency = 3;
            } else if (daysOverdue >= -7) {
              status = 'due_soon';
              message = `Vence em ${Math.abs(daysOverdue)} dia(s)`;
              urgency = 2;
            }
        } catch(e) {
            console.warn("Data de vencimento inválida:", event.payment_due_date);
        }
      }

      alerts.push({
        id: event.id,
        event,
        clientName: clientMap.get(event.client_id) || 'Cliente Desconhecido',
        status,
        message,
        urgency,
        amountDue,
        dueDate: event.payment_due_date
      });
    });

    // Ordenar por urgência e valor
    return alerts.sort((a, b) => {
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      return b.amountDue - a.amountDue;
    });
  }, [events, work, clients]);

  const getStatusConfig = (status) => {
    const configs = {
      overdue: {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-400/50',
        icon: AlertTriangle
      },
      due_soon: {
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-400/50',
        icon: Calendar
      },
      pending: {
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-600',
        icon: DollarSign
      }
    };
    return configs[status] || configs.pending;
  };

  const totalOverdue = useMemo(() => {
    return paymentAlerts
      .filter(alert => alert.status === 'overdue')
      .reduce((sum, alert) => sum + alert.amountDue, 0);
  }, [paymentAlerts]);

  if (!isVisible) {
    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="text-amber-300 font-display flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pagamentos Pendentes
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
                <p className="text-slate-400">Valores ocultos. Clique no ícone de olho para exibir.</p>
            </CardContent>
        </Card>
    );
  }
  
  if (paymentAlerts.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-amber-300 font-display flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pagamentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum pagamento pendente ou vencido.</p>
            <p className="text-sm text-slate-500 mt-2">Todos os pagamentos estão em dia!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-amber-300 font-display flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Pagamentos Pendentes
          <Badge variant="outline" className="text-amber-400 border-amber-400/50">
            {paymentAlerts.length}
          </Badge>
        </CardTitle>
        {totalOverdue > 0 && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mt-2">
            <p className="text-red-300 font-bold text-sm">
              ⚠️ Total em atraso: {formatCurrency(totalOverdue)}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 -mr-2">
          {paymentAlerts.slice(0, 10).map(alert => {
            const config = getStatusConfig(alert.status);
            const Icon = config.icon;
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 cursor-pointer hover:border-opacity-80 transition-all touch-manipulation min-h-[60px]`}
                onClick={() => onEventClick && onEventClick(alert.event)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                    <div className="truncate">
                      <span className="font-bold text-white text-sm truncate">{alert.clientName}</span>
                      <p className="text-xs text-slate-400 truncate">{alert.event.title}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${config.color} pl-2`}>
                    {formatCurrency(alert.amountDue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={config.color}>{alert.message}</span>
                  {alert.dueDate && (
                    <span className="text-slate-400">
                      {format(parseISO(alert.dueDate), 'dd MMM', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        {paymentAlerts.length > 10 && (
          <div className="text-center mt-4">
            <Button variant="outline" size="sm" className="text-slate-400 min-h-[44px]">
              Ver todos ({paymentAlerts.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}