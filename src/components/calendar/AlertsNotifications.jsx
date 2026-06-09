import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Bell, AlertTriangle, Calendar, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const alertIcons = {
  today: Bell,
  upcoming: Calendar,
  warning: AlertTriangle,
};

const alertColors = {
  high: 'bg-red-500/20 border-red-500/50 text-red-300',
  medium: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
  low: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
};

export default function AlertsNotifications({ alerts, onAction, onDismiss, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-slate-900 border-slate-800 shadow-2xl shadow-black/30 text-slate-200">
          <CardHeader className="border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-display text-white">
                <Bell className="w-5 h-5 text-cyan-400" />
                Lembretes e Alertas
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum lembrete ativo no momento.</p>
              </div>
            ) : (
              alerts.map(alert => {
                const Icon = alertIcons[alert.type] || Bell;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border ${alertColors[alert.priority] || alertColors.medium}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <h3 className="font-bold">{alert.title}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(alert.id)}
                        className="text-slate-400 hover:text-white h-8 w-8 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <p className="text-sm mb-3 opacity-90">{alert.message}</p>
                    
                    {/* Listar eventos relacionados */}
                    {alert.events && alert.events.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {alert.events.slice(0, 3).map(event => (
                          <div key={event.id} className="flex items-center gap-2 text-xs bg-black/20 p-2 rounded">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: event.color || '#22d3ee' }}
                            />
                            <span className="font-medium">{event.title}</span>
                            <span className="text-slate-400">
                              {format(new Date(event.start_date + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                            </span>
                          </div>
                        ))}
                        {alert.events.length > 3 && (
                          <p className="text-xs text-slate-400">
                            +{alert.events.length - 3} outros eventos
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Ações específicas por tipo de alerta */}
                    <div className="flex gap-2">
                      {alert.type === 'warning' && (
                        <Button
                          size="sm"
                          onClick={() => onAction(alert, 'register_hours')}
                          className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                        >
                          <Timer className="w-3 h-3 mr-1" />
                          Registrar Horas
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction(alert, 'view_events')}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}