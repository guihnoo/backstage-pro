import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LiveClockBar from '@/components/home/LiveClockBar';

export default function CalendarPageHeader({
  currentDate,
  primaryHex,
  isLive = false,
  unsyncedCount = 0,
  onPreviousMonth,
  onNextMonth,
  onGoToToday,
  onNewEvent,
  onRegisterWork,
  onSyncNow,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display truncate">Agenda</h1>
          <p className="text-sm text-slate-400 truncate">Gerencie shows, horas e cachê do mês.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {unsyncedCount > 0 && (
            <button
              type="button"
              onClick={onSyncNow}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
              title={`${unsyncedCount} evento${unsyncedCount === 1 ? '' : 's'} sem sincronizar com Google Calendar`}
            >
              <RefreshCw className="w-3 h-3" />
              {unsyncedCount} fora de sinc
            </button>
          )}
          <LiveClockBar primaryHex={primaryHex} isLive={isLive} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousMonth}
            className="text-slate-50 hover:bg-slate-800 flex-shrink-0 h-10 w-10 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col items-center min-w-[140px] sm:min-w-[180px]">
            <motion.h2
              key={currentDate.getMonth()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg sm:text-xl md:text-2xl font-bold text-white font-display capitalize"
            >
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </motion.h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            className="text-slate-50 hover:bg-slate-800 flex-shrink-0 h-10 w-10 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onGoToToday}
            className="bg-slate-800 text-slate-50 ml-2 border-slate-700 hover:bg-slate-700 h-10"
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onRegisterWork}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 flex-1 sm:flex-none h-10 text-sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Registrar Horas</span>
            <span className="xs:hidden">Horas</span>
          </Button>

          <Button
            onClick={onNewEvent}
            size="sm"
            className="flex-1 sm:flex-none h-10 text-sm active:scale-95 text-white border-0"
            style={{ backgroundColor: primaryHex }}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Novo Evento</span>
            <span className="xs:hidden">Evento</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
