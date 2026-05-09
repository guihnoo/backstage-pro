
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  monthMatrix,
  normalizeDateString,
  isToday as isTodayStr
} from '../utils/dateUtils';
import {
  splitBlockIntoWeekSpans,
  assignLanes,
  groupContinuousEvents,
  normalizeEventForGrid
} from '../utils/calendarHelpers';
import ContinuousEventBar from './ContinuousEventBar';

const WeekHeader = () => (
  <div className="grid grid-cols-7 text-center text-xs font-bold uppercase text-slate-400 tracking-wider py-3 border-b border-slate-800">
    {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((day) => <div key={day}>{day}</div>)}
  </div>
);

const DayCell = React.memo(({ day, isCurrentMonth, isSelected, isToday, onDateSelect, onQuickAction }) => {
  const pressTimer = useRef(null);
  const lastTapRef = useRef(0);

  const handlePointerDown = () => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      if (onQuickAction) onQuickAction('work', day);
    }, 500);

    const now = new Date().getTime();
    if (now - lastTapRef.current < 300) {
      clearTimeout(pressTimer.current);
      if (onQuickAction) onQuickAction('work', day);
    }
    lastTapRef.current = now;
  };

  const handlePointerUp = () => {
    clearTimeout(pressTimer.current);
  };

  return (
    <div
      onClick={() => onDateSelect && onDateSelect(day)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`
        relative h-28 md:h-32 lg:h-36 border-b border-r border-slate-800/50 
        ${isCurrentMonth ? 'bg-slate-900/30' : 'bg-slate-900/70'}
        ${isSelected ? 'outline outline-2 outline-cyan-400 z-10' : ''}
        transition-colors duration-300 touch-manipulation
      `}>
      {/* AJUSTE: Touch target mínimo para o número do dia */}
      <span className={`
        text-xs font-medium absolute top-1.5 right-1.5 md:text-sm rounded-full 
        h-7 w-7 flex items-center justify-center
        ${isToday ? 'bg-cyan-400 text-slate-900 font-bold' : 'bg-slate-800 text-slate-200'}
      `}>
        {new Date(normalizeDateString(day) + 'T00:00:00').getDate()}
      </span>
    </div>
  );
});

const EventLanesOverlay = React.memo(({ weekStartDate, eventBlocks, clients = [], onEventClick, onEventQuickLog }) => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const weekSpans = useMemo(() => {
    // CORREÇÃO: Garantir que eventBlocks é sempre um array
    const safeEventBlocks = Array.isArray(eventBlocks) ? eventBlocks : [];
    return safeEventBlocks.flatMap((block) => splitBlockIntoWeekSpans(block, weekStartDate));
  }, [eventBlocks, weekStartDate]);

  const { lanes, overflow } = useMemo(() => assignLanes(weekSpans, screenWidth), [weekSpans, screenWidth]);

  return (
    <div className="absolute inset-x-2 top-10 grid grid-cols-7 gap-1 pointer-events-none z-10">
      {lanes.map((lane, laneIndex) => (
        <React.Fragment key={laneIndex}>
          {lane.map((span) => {
            const dayOfSpan = new Date(weekStartDate);
            // setDate expects a 1-based day, colStart is 1-based (grid-column: 1 / N)
            dayOfSpan.setDate(dayOfSpan.getDate() + span.colStart - 1);

            return (
              <div
                key={`${span.block.idRaiz}-${span.colStart}`}
                className="pointer-events-auto"
                style={{
                  gridColumn: `${span.colStart} / ${span.colEnd}`,
                  gridRow: laneIndex + 1
                }}>
                <ContinuousEventBar
                  span={span}
                  onEventClick={() => onEventClick(span.block.events?.[0] || span.block)}
                  onQuickLog={() => onEventQuickLog(span.block.events?.[0] || span.block, dayOfSpan)}
                  clients={clients}
                />
              </div>
            );
          })}
        </React.Fragment>
      ))}
      {overflow.length > 0 && (
        <div className="text-cyan-400 text-xs mt-1 col-span-7 text-center pointer-events-auto">
          + {overflow.length} mais...
        </div>
      )}
    </div>
  );
});

const WeekRow = React.memo(({ week, isSelected, onEventQuickLog, ...props }) => {
  const isWeekSelected = week && week.some((day) => day && isSelected(day));
  return (
    <div className={`relative grid grid-cols-7 ${isWeekSelected ? 'bg-slate-800/20' : ''}`}>
      {week.map((day, dayIndex) =>
        day ? <DayCell key={normalizeDateString(day)} day={day} {...props} isSelected={isSelected(day)} isToday={isTodayStr(day)} /> : <div key={dayIndex} className="h-32 border-b border-r border-slate-800/50 bg-slate-900/70" />
      )}
      <EventLanesOverlay weekStartDate={week[0]} onEventQuickLog={onEventQuickLog} {...props} />
    </div>
  );
});

export default function BackstageCalendarGrid({
  currentDate,
  selectedDate,
  events = [],
  dailyWork = [],
  clients = [],
  onDateSelect,
  onQuickAction,
  onEventClick,
  onEventQuickLog,
  showDayChips
}) {
  console.log('🔄 BackstageCalendarGrid renderizado com:', {
    eventsCount: events.length,
    hasOnEventClick: !!onEventClick
  });

  // CORREÇÃO: Envolvido em useMemo para estabilizar as referências.
  const safeEvents = useMemo(() => Array.isArray(events) ? events : [], [events]);
  const safeClients = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);

  const days = useMemo(() => monthMatrix(currentDate), [currentDate]);

  const weeks = useMemo(() => {
    const result = [];
    if (days && days.length) {
      for (let i = 0; i < days.length; i += 7) {
        result.push(days.slice(i, i + 7));
      }
    }
    return result;
  }, [days]);

  const isSelected = (day) => selectedDate && normalizeDateString(day) === normalizeDateString(selectedDate);
  // The isToday prop is passed directly from DayCell now, but for consistency if other components needed it:
  // const isToday = (day) => isTodayStr(day); 

  const eventBlocks = useMemo(() => {
    // 'safeEvents' e 'safeClients' agora são estáveis.
    const normalizedEvents = safeEvents.map((event) => normalizeEventForGrid(event, safeClients)).filter(Boolean);
    return groupContinuousEvents(normalizedEvents);
  }, [safeEvents, safeClients]);

  const handleEventClickInternal = useCallback((event) => {
    console.log('🎯 BackstageCalendarGrid handleEventClickInternal:', event);
    if (onEventClick) {
      onEventClick(event);
    } else {
      console.warn('⚠️ onEventClick não foi fornecido');
    }
  }, [onEventClick]);

  return (
    <motion.div
      key={currentDate.getMonth()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="border-t border-slate-800 overflow-x-auto">

      <WeekHeader />
      {/* AJUSTE: Min-width para garantir que o calendário não fique espremido */}
      <div className="border-l border-slate-800 min-w-[320px]">
        {weeks.map((week, index) => (
          <WeekRow
            key={index}
            week={week}
            isSelected={isSelected}
            // isToday prop is now passed from WeekRow to DayCell
            isCurrentMonth={(day) => day && new Date(normalizeDateString(day) + 'T00:00:00').getMonth() === currentDate.getMonth()}
            eventBlocks={eventBlocks}
            clients={safeClients}
            dailyWork={dailyWork}
            onDateSelect={onDateSelect}
            onQuickAction={onQuickAction}
            onEventClick={handleEventClickInternal}
            onEventQuickLog={onEventQuickLog}
            showDayChips={showDayChips}
          />
        ))}
      </div>
    </motion.div>
  );
}
