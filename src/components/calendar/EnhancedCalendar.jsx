import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, isSameMonth, isToday } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  normalizeDateString,
  stringToLocalDate,
  isSameDay,
  getEventStatus,
} from '../utils/dateUtils';

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

const EventBadge = React.memo(({ event, clientName, onRegisterWork: _onRegisterWork, isFirstDay }) => {
  const eventStatus = getEventStatus(event);

  let statusColor = event.color || '#22d3ee';
  switch (eventStatus) {
    case 'in_progress': statusColor = '#34d399'; break;
    case 'scheduled': statusColor = '#60a5fa'; break;
    case 'completed': statusColor = '#9ca3af'; break;
    case 'archived': statusColor = '#6b7280'; break;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="px-2 py-1 rounded-md text-xs font-semibold text-white shadow-md cursor-pointer relative group"
      style={{ backgroundColor: `${statusColor}BF`, borderLeft: `3px solid ${statusColor}` }}
    >
      <span className="truncate block">{isFirstDay ? clientName : '...'}</span>
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
});

const DayCell = React.memo(({ day, isCurrentMonth, dayEvents, work, onDateClick, getClientName, onRegisterWork }) => {
  const isCurrentDay = isToday(day);

  return (
    <div
      onClick={() => onDateClick(day, dayEvents, work)}
      className={`relative flex flex-col p-2 box-border min-h-[120px] md:min-h-[140px] cursor-pointer 
                  rounded-lg transition-all duration-300 group
                  ${isCurrentMonth ? 'bg-slate-800/60' : 'bg-slate-900/50'}
                  ${isCurrentDay ? 'border-2 border-cyan-400' : 'border border-slate-700/50'}
                  hover:bg-slate-700/70 hover:scale-[1.02] hover:shadow-2xl`}
    >
      <span className={`text-sm font-bold mb-1 font-display self-end ${isCurrentDay ? 'text-cyan-300' : isCurrentMonth ? 'text-slate-100' : 'text-slate-500'}`}>
        {format(day, 'd')}
      </span>
      
      <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
        <AnimatePresence>
          {dayEvents.map(event => (
            <EventBadge
              key={event.id}
              event={event}
              clientName={getClientName(event.client_id)}
              onRegisterWork={onRegisterWork}
              isFirstDay={isSameDay(day, stringToLocalDate(event.start_date))}
            />
          ))}
        </AnimatePresence>
      </div>

      {work && work.total_hours > 0 && (
        <div className="mt-1 text-right">
          <span className="text-xs font-bold text-green-300 bg-green-500/10 px-2 py-1 rounded">
            {work.total_hours.toFixed(1)}h
          </span>
        </div>
      )}
    </div>
  );
});

export default function EnhancedCalendar({
  days,
  currentMonthDate,
  events = [],
  dailyWork = [],
  clients = [],
  onDateClick,
  onEventClick: _onEventClick,
  onRegisterWork,
  isLoading
}) {
  const getClientName = useMemo(() => (clientId) => {
    if (!clients || !Array.isArray(clients)) return 'Cliente';
    const client = clients.find(c => c && c.id === clientId);
    return client ? client.name : 'Cliente';
  }, [clients]);

  const getDayData = (day) => {
    const dayStr = normalizeDateString(day);
    const dayEvents = events.filter(event => {
      if (!event || !event.start_date || !event.end_date) return false;
      const startStr = normalizeDateString(event.start_date);
      const endStr = normalizeDateString(event.end_date);
      return dayStr >= startStr && dayStr <= endStr;
    });
    const work = dailyWork.find(w => w && w.date && normalizeDateString(w.date) === dayStr);
    return { dayEvents, work };
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-lg rounded-xl shadow-2xl border-2 border-slate-700/30 p-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        </div>
      )}
      <div className="grid grid-cols-7 mb-3">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center font-bold text-slate-300 font-display tracking-widest text-xs md:text-sm">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {days.map((day) => {
          const { dayEvents, work } = getDayData(day);
          const isCurrentMonth = isSameMonth(day, currentMonthDate);
          
          return (
            <DayCell
              key={normalizeDateString(day)}
              day={day}
              isCurrentMonth={isCurrentMonth}
              dayEvents={dayEvents}
              work={work}
              onDateClick={onDateClick}
              getClientName={getClientName}
              onRegisterWork={onRegisterWork}
            />
          );
        })}
      </div>
    </div>
  );
}