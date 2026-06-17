
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

const DAY_FULL_LABELS = {
  DOM: 'domingo', SEG: 'segunda-feira', TER: 'terça-feira',
  QUA: 'quarta-feira', QUI: 'quinta-feira', SEX: 'sexta-feira', 'SÁB': 'sábado',
};

const WeekHeader = () => (
  <div role="row" className="grid grid-cols-7 text-center text-xs font-bold uppercase text-slate-400 tracking-wider py-3 border-b border-slate-800">
    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => (
      <div key={day} role="columnheader" aria-label={DAY_FULL_LABELS[day]}>{day}</div>
    ))}
  </div>
);

const DayCell = React.memo(({ day, isCurrentMonth, isSelected, isToday, onDateSelect, onQuickAction, dotsForDay = [], isFocused }) => {
  const pressTimer = useRef(null);
  const lastTapRef = useRef(0);
  const cellRef = useRef(null);

  const dateStr = normalizeDateString(day);

  const ariaLabel = useMemo(() => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
    } catch {
      return dateStr;
    }
  }, [dateStr]);

  // Sync programmatic focus when rovingDate points here
  useEffect(() => {
    if (isFocused && cellRef.current && document.activeElement !== cellRef.current) {
      cellRef.current.focus({ preventScroll: false });
    }
  }, [isFocused]);

  const handlePointerDown = () => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      if (onQuickAction) onQuickAction('work', day);
    }, 500);

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      clearTimeout(pressTimer.current);
      if (onQuickAction) onQuickAction('work', day);
    }
    lastTapRef.current = now;
  };

  const handlePointerUp = () => clearTimeout(pressTimer.current);

  return (
    <div
      ref={cellRef}
      role="gridcell"
      tabIndex={isFocused ? 0 : -1}
      data-date={dateStr}
      aria-label={ariaLabel}
      aria-selected={isSelected || undefined}
      aria-current={isToday ? 'date' : undefined}
      onClick={() => onDateSelect && onDateSelect(day)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`
        relative h-28 md:h-32 lg:h-36 border-b border-r border-slate-800/50
        ${isCurrentMonth ? 'bg-slate-900/30' : 'bg-slate-900/70'}
        ${isSelected ? 'outline outline-2 outline-[var(--bp-primary)] z-10' : ''}
        transition-colors duration-300 touch-manipulation
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bp-primary)] focus-visible:z-10
      `}
    >
      {/* Número do dia */}
      <span className={`
        text-xs font-medium absolute top-1.5 right-1.5 md:text-sm rounded-full
        h-7 w-7 flex items-center justify-center
        ${isToday ? 'bg-[var(--bp-primary)] text-slate-900 font-bold' : 'bg-slate-800 text-slate-200'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
      `}>
        {new Date(dateStr + 'T00:00:00').getDate()}
      </span>

      {/* Dots de eventos no fundo da célula */}
      {dotsForDay.length > 0 && (
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-0.5 pointer-events-none">
          {dotsForDay.slice(0, 4).map((dot, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: dot.color, opacity: isCurrentMonth ? 0.85 : 0.35 }}
            />
          ))}
          {dotsForDay.length > 4 && (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
          )}
        </div>
      )}
    </div>
  );
});

const EventLanesOverlay = React.memo(({ weekStartDate, eventBlocks, clients = [], onEventClick, onEventQuickLog, onDateSelect }) => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const weekSpans = useMemo(() => {
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
            dayOfSpan.setDate(dayOfSpan.getDate() + span.colStart - 1);

            return (
              <div
                key={`${span.block.idRaiz}-${span.colStart}`}
                className="pointer-events-auto"
                style={{
                  gridColumn: `${span.colStart} / ${span.colEnd}`,
                  gridRow: laneIndex + 1
                }}
              >
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
        <div
          className="pointer-events-auto flex justify-center"
          style={{ gridColumn: '1 / 8', gridRow: lanes.length + 1 }}
        >
          <button
            type="button"
            onClick={() => onDateSelect && onDateSelect(weekStartDate)}
            className="text-[10px] font-semibold text-slate-400 bg-slate-800/70 border border-slate-700/50 rounded-full px-2 py-0.5 hover:bg-slate-700/70 hover:text-white transition-all bp-hover-primary"
          >
            +{overflow.length} mais
          </button>
        </div>
      )}
    </div>
  );
});

const WeekRow = React.memo(({ week, isSelected, isCurrentMonth, onEventQuickLog, eventsByDay = {}, rovingDate, ...props }) => {
  const isWeekSelected = week && week.some((day) => day && isSelected(day));
  return (
    <div role="row" className={`relative grid grid-cols-7 ${isWeekSelected ? 'bg-slate-800/20' : ''}`}>
      {week.map((day, dayIndex) =>
        day ? (
          <DayCell
            key={normalizeDateString(day)}
            day={day}
            {...props}
            isCurrentMonth={isCurrentMonth(day)}
            isSelected={isSelected(day)}
            isToday={isTodayStr(day)}
            dotsForDay={eventsByDay[normalizeDateString(day)] || []}
            isFocused={rovingDate === normalizeDateString(day)}
          />
        ) : (
          <div
            key={dayIndex}
            role="gridcell"
            aria-disabled="true"
            className="h-32 border-b border-r border-slate-800/50 bg-slate-900/70"
          />
        )
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
  const safeEvents  = useMemo(() => Array.isArray(events)  ? events  : [], [events]);
  const safeClients = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);

  const days  = useMemo(() => monthMatrix(currentDate), [currentDate]);

  const weeks = useMemo(() => {
    const result = [];
    if (days && days.length) {
      for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Flat array of date strings (null for padding cells)
  const dateStrings = useMemo(
    () => days.map(d => d ? normalizeDateString(d) : null),
    [days]
  );

  const isSelected = (day) => selectedDate && normalizeDateString(day) === normalizeDateString(selectedDate);

  const eventBlocks = useMemo(() => {
    const normalizedEvents = safeEvents
      .map((event) => normalizeEventForGrid(event, safeClients))
      .filter(Boolean);
    return groupContinuousEvents(normalizedEvents);
  }, [safeEvents, safeClients]);

  // Mapa dia → [{color, status}] para os dots nas células
  const eventsByDay = useMemo(() => {
    const map = {};
    for (const block of eventBlocks) {
      if (!block.start || !block.end) continue;
      let cur = new Date(block.start.getTime());
      const endTime = block.end.getTime();
      while (cur.getTime() < endTime) {
        const key = cur.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push({ color: block.color, status: block.events[0]?.payment_status });
        cur = new Date(cur.getTime() + 86400000);
      }
    }
    return map;
  }, [eventBlocks]);

  const handleEventClickInternal = useCallback((event) => {
    if (onEventClick) onEventClick(event);
  }, [onEventClick]);

  // ── Roving tabindex state ──────────────────────────────────────────────────
  const [focusedDate, setFocusedDate] = useState(null);
  const gridRef = useRef(null);

  // Anchor: focusedDate > selectedDate (se visível) > hoje (se visível) > primeiro dia
  const rovingDate = useMemo(() => {
    if (focusedDate && dateStrings.includes(focusedDate)) return focusedDate;
    if (selectedDate) {
      const sel = normalizeDateString(selectedDate);
      if (dateStrings.includes(sel)) return sel;
    }
    const todayStr = normalizeDateString(new Date());
    if (dateStrings.includes(todayStr)) return todayStr;
    return dateStrings.find(Boolean) ?? null;
  }, [focusedDate, selectedDate, dateStrings]);

  // Reset focusedDate quando o mês muda
  useEffect(() => { setFocusedDate(null); }, [currentDate]);

  // ── Navegação por teclado ──────────────────────────────────────────────────
  const handleGridKeyDown = useCallback((e) => {
    // Só processa quando o foco está em uma gridcell
    if (e.target.getAttribute('role') !== 'gridcell') return;

    const NAV_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Home', 'End'];
    if (!NAV_KEYS.includes(e.key)) return;

    const currentStr = rovingDate;
    if (!currentStr) return;

    const flatIdx = dateStrings.indexOf(currentStr);
    if (flatIdx === -1) return;

    let newIdx = flatIdx;

    if (e.key === 'ArrowRight') {
      for (let i = flatIdx + 1; i < dateStrings.length; i++) {
        if (dateStrings[i]) { newIdx = i; break; }
      }
    } else if (e.key === 'ArrowLeft') {
      for (let i = flatIdx - 1; i >= 0; i--) {
        if (dateStrings[i]) { newIdx = i; break; }
      }
    } else if (e.key === 'ArrowDown') {
      const target = flatIdx + 7;
      if (target < dateStrings.length && dateStrings[target]) {
        newIdx = target;
      } else {
        // procura o mais próximo não-nulo naquela linha
        for (let i = target; i < Math.min(target + 7, dateStrings.length); i++) {
          if (dateStrings[i]) { newIdx = i; break; }
        }
      }
    } else if (e.key === 'ArrowUp') {
      const target = flatIdx - 7;
      if (target >= 0 && dateStrings[target]) {
        newIdx = target;
      } else {
        for (let i = target; i >= Math.max(0, target - 7); i--) {
          if (dateStrings[i]) { newIdx = i; break; }
        }
      }
    } else if (e.key === 'Home') {
      const weekStart = Math.floor(flatIdx / 7) * 7;
      for (let i = weekStart; i < weekStart + 7 && i < dateStrings.length; i++) {
        if (dateStrings[i]) { newIdx = i; break; }
      }
    } else if (e.key === 'End') {
      const weekEnd = Math.floor(flatIdx / 7) * 7 + 6;
      for (let i = Math.min(weekEnd, dateStrings.length - 1); i >= Math.floor(flatIdx / 7) * 7; i--) {
        if (dateStrings[i]) { newIdx = i; break; }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onDateSelect) onDateSelect(days[flatIdx]);
      return;
    }

    if (newIdx !== flatIdx && dateStrings[newIdx]) {
      e.preventDefault();
      const newDateStr = dateStrings[newIdx];
      setFocusedDate(newDateStr);
      // Foco programático via data-date
      requestAnimationFrame(() => {
        gridRef.current?.querySelector(`[data-date="${newDateStr}"]`)?.focus({ preventScroll: false });
      });
    }
  }, [rovingDate, dateStrings, days, onDateSelect]);

  return (
    <motion.div
      ref={gridRef}
      role="grid"
      aria-label={`Calendário de ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
      aria-multiselectable="false"
      onKeyDown={handleGridKeyDown}
      key={currentDate.getMonth()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="border-t border-slate-800 overflow-x-auto"
    >
      <WeekHeader />
      <div role="rowgroup" className="border-l border-slate-800 min-w-[320px]">
        {weeks.map((week, index) => (
          <WeekRow
            key={index}
            week={week}
            rovingDate={rovingDate}
            isSelected={isSelected}
            isCurrentMonth={(day) => day && new Date(normalizeDateString(day) + 'T00:00:00').getMonth() === currentDate.getMonth()}
            eventBlocks={eventBlocks}
            eventsByDay={eventsByDay}
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
