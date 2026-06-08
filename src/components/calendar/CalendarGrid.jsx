import { useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { monthMatrix, normalizeDateString, isToday } from '../utils/dateUtils';
import DayCardGoogle from './DayCardGoogle';

export default function CalendarGrid({
  currentDate,
  onDateChange,
  events = [],
  dailyWork = [],
  clients = [],
  onDayClick,
  onEventClick,
  selectedDate
}) {
  // Navegação otimizada com useCallback
  const handlePrevMonth = useCallback(() => {
    onDateChange(subMonths(currentDate, 1));
  }, [currentDate, onDateChange]);

  const handleNextMonth = useCallback(() => {
    onDateChange(addMonths(currentDate, 1));
  }, [currentDate, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  // Gerar matriz de dias do mês (memoizado)
  const days = useMemo(() => monthMatrix(currentDate), [currentDate]);

  // Mapear eventos e trabalho por data (otimização de performance)
  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach(event => {
      if (!event?.start_date || !event?.end_date) return;
      const start = normalizeDateString(event.start_date);
      const end = normalizeDateString(event.end_date);
      
      days.forEach(day => {
        const dayStr = normalizeDateString(day);
        if (dayStr >= start && dayStr <= end) {
          if (!map.has(dayStr)) {
            map.set(dayStr, []);
          }
          map.get(dayStr).push(event);
        }
      });
    });
    return map;
  }, [events, days]);

  const workByDate = useMemo(() => {
    const map = new Map();
    dailyWork.forEach(work => {
      if (work?.date) {
        const dateStr = normalizeDateString(work.date);
        map.set(dateStr, work);
      }
    });
    return map;
  }, [dailyWork]);

  const clientsMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c]));
  }, [clients]);

  return (
    <div className="flex flex-col h-full">
      {/* Header com navegação */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] bg-slate-800 border-slate-700 hover:bg-slate-700"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] bg-slate-800 border-slate-700 hover:bg-slate-700"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>

        <Button
          variant="outline"
          onClick={handleToday}
          className="h-9 sm:h-10 min-h-[44px] px-3 sm:px-4 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white text-xs sm:text-sm"
        >
          Hoje
        </Button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
          <div
            key={i}
            className="text-center py-2 sm:py-3 text-xs sm:text-sm font-medium text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 flex-1 overflow-auto">
        {days.map((day, index) => {
          const dayStr = normalizeDateString(day);
          const dayEvents = eventsByDate.get(dayStr) || [];
          const dayWork = workByDate.get(dayStr);
          const isCurrentMonth = format(day, 'M') === format(currentDate, 'M');
          const isSelected = selectedDate && normalizeDateString(selectedDate) === dayStr;

          return (
            <DayCardGoogle
              key={`${dayStr}-${index}`}
              day={day}
              events={dayEvents}
              work={dayWork}
              clients={clientsMap}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday(day)}
              isSelected={isSelected}
              onClick={() => onDayClick(day)}
              onEventClick={onEventClick}
            />
          );
        })}
      </div>
    </div>
  );
}