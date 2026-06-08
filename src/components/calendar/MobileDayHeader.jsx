import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MobileDayHeader = ({ selectedDay, onDayChange, onToday }) => {
  const navigateDay = (direction) => {
    const newDay = direction === 'next' ? addDays(selectedDay, 1) : subDays(selectedDay, 1);
    onDayChange(newDay);
  };

  const today = isToday(selectedDay);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/70 backdrop-blur-lg rounded-2xl p-4 border border-slate-800"
    >
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDay('prev')}
          className="hover:bg-slate-800 text-slate-300 hover:text-white h-10 w-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center flex-1">
          <h2 className="text-xl font-bold text-white font-display leading-tight">
            {format(selectedDay, 'EEEE', { locale: ptBR })}
          </h2>
          <p className="text-sm text-slate-400 leading-tight">
            {format(selectedDay, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDay('next')}
          className="hover:bg-slate-800 text-slate-300 hover:text-white h-10 w-10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-3">
        {today && (
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-xs">
            Hoje
          </Badge>
        )}
        
        {!today && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="bg-cyan-400/20 text-cyan-300 border-cyan-400/30 hover:bg-cyan-400/30 text-xs h-8 px-3"
          >
            <Calendar className="w-3 h-3 mr-1.5" />
            Ir para Hoje
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default MobileDayHeader;