import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Plus, Loader2, Clock } from 'lucide-react';
import { applyAuto12Hours } from '@/api/functions';
import { toast } from 'sonner';

const getEventStatus = (event) => {
  if (event.payment_status === 'paid') return 'completed';
  if (new Date(event.end_date) < new Date()) return 'completed';
  if (new Date(event.start_date) > new Date()) return 'scheduled';
  return 'active';
};

export default function DayQuickActionsMobile({ 
  _day, 
  events = [], 
  onNewEvent, 
  onRegisterWork 
}) {
  const [applying12h, setApplying12h] = useState(null);

  const completedEventsWithoutHours = events.filter(e => 
    getEventStatus(e) === 'completed' && !e.auto_hours_applied
  );

  const eventsToRegister = events.filter(e =>
    getEventStatus(e) !== 'completed'
  );

  const handleNewEvent = () => {
    onNewEvent?.();
  };

  const handleQuick12Hours = async (event, e) => {
    e.stopPropagation();
    setApplying12h(event.id);
    
    try {
      const result = await applyAuto12Hours({ eventId: event.id, origin: 'manual_12h' });
      
      if (result && result.data && result.data.success) {
        toast.success(`12h aplicadas: ${event.title}`, {
          description: 'Horas registradas automaticamente'
        });
        window.location.reload();
      } else {
        toast.error('Erro ao aplicar horas: ' + (result?.data?.message || 'Motivo desconhecido'));
      }
    } catch (error) {
      console.error("Error applying auto 12 hours:", error);
      toast.error('Erro ao aplicar horas automáticas: ' + error.message);
    } finally {
      setApplying12h(null);
    }
  };

  const handleRegisterWork = (event, e) => {
    e.stopPropagation();
    onRegisterWork?.(event);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-3 py-2 space-y-2"
    >
      {/* Novo Evento */}
      <Button
        onClick={handleNewEvent}
        className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white justify-start"
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo Evento
      </Button>

      {/* Aplicar 12h nos eventos concluídos */}
      {completedEventsWithoutHours.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-purple-400 font-medium px-2">Aplicar 12h automáticas:</p>
          {completedEventsWithoutHours.map(event => (
            <Button
              key={event.id}
              onClick={(e) => handleQuick12Hours(event, e)}
              disabled={applying12h === event.id}
              variant="outline"
              className="w-full h-10 bg-purple-900/20 border-purple-700/50 hover:bg-purple-900/30 text-purple-300 justify-start text-sm"
            >
              {applying12h === event.id ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 mr-2" />
                  {event.title}
                </>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Registrar Horas Manualmente */}
      {eventsToRegister.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-medium px-2">Registrar horas manualmente:</p>
          {eventsToRegister.map(event => (
            <Button
              key={event.id}
              onClick={(e) => handleRegisterWork(event, e)}
              variant="outline"
              className="w-full h-10 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white justify-start text-sm"
            >
              <Clock className="w-3 h-3 mr-2" />
              {event.title}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
}