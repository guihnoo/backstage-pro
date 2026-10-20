import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LiveClockBar from '@/components/home/LiveClockBar';

export default function CalendarPageHeader({
  currentDate,
  primaryHex = '#ffd400',
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-wide uppercase truncate">
            Agenda
          </h1>
          <p className="text-xs text-[#a8a8a8] font-mono tracking-tight truncate">
            Gerencie shows, horas e cachê do mês.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {unsyncedCount > 0 && (
            <button
              type="button"
              onClick={onSyncNow}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#ff2e88]/40 bg-[#ff2e88]/10 text-[#ff2e88] hover:bg-[#ff2e88]/20 transition-colors"
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
            className="text-white hover:bg-[#1a1a1a] flex-shrink-0 h-10 w-10 active:scale-95 border border-[#262626]"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col items-center min-w-[140px] sm:min-w-[180px]">
            <motion.h2
              key={currentDate.getMonth()}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-xl md:text-2xl font-bold text-white font-display tracking-wide capitalize"
            >
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </motion.h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            className="text-white hover:bg-[#1a1a1a] flex-shrink-0 h-10 w-10 active:scale-95 border border-[#262626]"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onGoToToday}
            className="bg-[#141414] text-[#ffd400] font-mono text-xs ml-2 border-[#2a2a2a] hover:bg-[#1f1f1f] hover:text-[#ffd400] h-10 px-3 active:scale-95"
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onRegisterWork}
            variant="outline"
            size="sm"
            className="bg-[#141414] border-[#2a2a2a] hover:bg-[#1f1f1f] text-white flex-1 sm:flex-none h-10 text-sm active:scale-95"
          >
            <Clock className="w-4 h-4 mr-2 text-[#ffd400]" />
            <span className="hidden xs:inline">Registrar Horas</span>
            <span className="xs:hidden">Horas</span>
          </Button>

          <Button
            onClick={onNewEvent}
            size="sm"
            className="flex-1 sm:flex-none h-10 text-sm font-bold active:scale-95 bg-[#ffd400] text-[#0a0a0a] hover:bg-[#ffe033] border-0 transition-transform"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Novo Evento</span>
            <span className="xs:hidden">Evento</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
