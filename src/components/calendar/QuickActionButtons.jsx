import { Button } from '@/components/ui/button';
import { CalendarPlus, Timer, Receipt } from 'lucide-react';

const QuickActionButtons = ({ onAction, selectedDate }) => {
  const handleAction = (actionType) => {
    if (onAction) onAction(actionType, selectedDate);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => handleAction('event')}
        size="sm"
        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all duration-200"
      >
        <CalendarPlus className="w-4 h-4 mr-2" />
        Evento
      </Button>
      
      <Button
        onClick={() => handleAction('work')}
        size="sm"
        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition-all duration-200"
      >
        <Timer className="w-4 h-4 mr-2" />
        Horas
      </Button>
      
      <Button
        onClick={() => handleAction('expense')}
        size="sm"
        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all duration-200"
      >
        <Receipt className="w-4 h-4 mr-2" />
        Despesa
      </Button>
    </div>
  );
};

export default QuickActionButtons;