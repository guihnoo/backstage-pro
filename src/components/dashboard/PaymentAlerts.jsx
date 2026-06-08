import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDisplayDate, getEventStatus } from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

export default function PaymentAlerts({ events = [], work = [], clients = [], onEventClick }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const paymentAlerts = useMemo(() => {
    const alerts = [];
    const today = new Date();

    events.forEach(event => {
      const eventStatus = getEventStatus(event);
      
      // Alerta: Evento concluído mas pagamento não confirmado
      if (eventStatus === 'completed' && event.payment_status !== 'paid') {
        const eventWork = work.filter(w => w.event_id === event.id);
        const totalRevenue = eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
        const client = clients.find(c => c.id === event.client_id);

        alerts.push({
          id: event.id,
          type: 'unpaid',
          priority: 'high',
          event,
          client,
          amount: totalRevenue,
          message: `Pagamento pendente de ${client?.name || 'Cliente'}`
        });
      }

      // Alerta: Pagamento com vencimento próximo (próximos 7 dias)
      if (event.payment_due_date && event.payment_status !== 'paid') {
        const dueDate = new Date(event.payment_due_date);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
          const client = clients.find(c => c.id === event.client_id);
          alerts.push({
            id: `due-${event.id}`,
            type: 'due_soon',
            priority: diffDays <= 3 ? 'urgent' : 'medium',
            event,
            client,
            daysUntilDue: diffDays,
            message: `Vencimento ${diffDays === 0 ? 'hoje' : `em ${diffDays} dia(s)`}`
          });
        }
      }

      // Alerta: Pagamento atrasado
      if (event.payment_due_date && event.payment_status !== 'paid') {
        const dueDate = new Date(event.payment_due_date);
        if (dueDate < today) {
          const client = clients.find(c => c.id === event.client_id);
          const diffTime = today - dueDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          alerts.push({
            id: `overdue-${event.id}`,
            type: 'overdue',
            priority: 'urgent',
            event,
            client,
            daysOverdue: diffDays,
            message: `Atrasado há ${diffDays} dia(s)`
          });
        }
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [events, work, clients]);

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return { color: 'text-red-400', bgColor: 'bg-red-400/10', icon: AlertTriangle };
      case 'high':
        return { color: 'text-amber-400', bgColor: 'bg-amber-400/10', icon: DollarSign };
      case 'medium':
        return { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', icon: Calendar };
      default:
        return { color: 'text-slate-400', bgColor: 'bg-slate-400/10', icon: CheckCircle };
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-white">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
            <span className="truncate">Alertas de Pagamento</span>
          </CardTitle>
          {paymentAlerts.length > 0 && (
            <Badge variant="destructive" className="flex-shrink-0">
              {paymentAlerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        {paymentAlerts.length === 0 ? (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 text-sm">
              Todos os pagamentos estão em dia! 🎉
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] sm:h-[450px] pr-2">
            <div className="space-y-2 sm:space-y-3">
              {paymentAlerts.map((alert) => {
                const config = getPriorityConfig(alert.priority);
                const Icon = config.icon;

                return (
                  <button
                    key={alert.id}
                    onClick={() => onEventClick(alert.event)}
                    className={`w-full text-left p-3 sm:p-4 rounded-lg border border-slate-700 hover:border-cyan-400/50 ${config.bgColor} transition-all duration-200`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-white text-sm truncate flex-1">
                            {alert.event.title}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${config.color} border-current flex-shrink-0`}
                          >
                            {alert.message}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 truncate mb-2">
                          {alert.client?.name || 'Cliente'}
                        </p>
                        {alert.amount > 0 && (
                          <p className={`text-sm font-bold ${config.color}`}>
                            {isVisible ? formatCurrency(alert.amount) : '•••••'}
                          </p>
                        )}
                        {alert.event.payment_due_date && (
                          <p className="text-xs text-slate-500 mt-1">
                            Vencimento: {formatDisplayDate(alert.event.payment_due_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}