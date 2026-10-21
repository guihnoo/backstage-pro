import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday as isTodayDate,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { getEventStatus } from '@/components/utils/dateUtils';

const WEEKDAYS = [
  { label: 'D', color: '#ff2e88' },
  { label: 'S', color: '#a8a8a8' },
  { label: 'T', color: '#a8a8a8' },
  { label: 'Q', color: '#a8a8a8' },
  { label: 'Q', color: '#a8a8a8' },
  { label: 'S', color: '#a8a8a8' },
  { label: 'S', color: '#ffd400' },
];

export default function AllAccessCalendar({
  currentDate,
  events = [],
  clients = [],
  selectedDate,
  onDateSelect,
  onEventClick,
  onNewEvent,
  onRegisterWork,
  onAddExpense,
  formatCurrency,
  isVisible = true,
}) {
  const clientMap = useMemo(() => {
    const map = new Map();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  // Calendar cells
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  // Events map by ISO date
  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      if (ev.status === 'cancelled') continue;
      const startIso = ev.start_date ? ev.start_date.slice(0, 10) : null;
      const endIso = ev.end_date ? ev.end_date.slice(0, 10) : startIso;
      if (!startIso) continue;

      let cur = parseISO(startIso);
      const end = endIso ? parseISO(endIso) : cur;
      while (cur <= end) {
        const key = format(cur, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(ev);
        cur = new Date(cur.getTime() + 86400000);
      }
    }
    return map;
  }, [events]);

  const activeSelected = selectedDate ? (selectedDate instanceof Date ? selectedDate : parseISO(selectedDate)) : new Date();
  const selectedIso = format(activeSelected, 'yyyy-MM-dd');
  const selectedEvents = eventsByDay.get(selectedIso) || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Weekday headers */}
      <div>
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={i}
              style={{ color: w.color }}
              className="text-center font-mono text-[11px] font-bold tracking-wider"
            >
              {w.label}
            </div>
          ))}
        </div>

        {/* 7-column month grid matching All Access Board C with continuous multi-day bars */}
        <div role="grid" className="grid grid-cols-7 gap-y-1.5 gap-x-0">
          {calendarDays.map((day) => {
            const iso = format(day, 'yyyy-MM-dd');
            const dayNum = day.getDate();
            const col = day.getDay(); // 0 = Dom, 6 = Sab
            const inMonth = isSameMonth(day, currentDate);
            const isSel = isSameDay(day, activeSelected);
            const isToday = isTodayDate(day);
            const dayEvents = eventsByDay.get(iso) || [];
            const hasEvents = dayEvents.length > 0;
            const topEvent = dayEvents[0];

            let barColor = '#ffd400';
            let barTextColor = '#0a0a0a';
            let barLeft = '4px';
            let barRight = '4px';
            let barBorderRadius = '4px';
            let barLabel = '';

            if (topEvent) {
              const fromIso = topEvent.start_date ? topEvent.start_date.slice(0, 10) : iso;
              const toIso = topEvent.end_date ? topEvent.end_date.slice(0, 10) : fromIso;
              const isEventStart = iso === fromIso;
              const isEventEnd = iso === toIso;
              const isRowStart = col === 0;
              const isRowEnd = col === 6;

              if (topEvent.payment_status === 'paid') {
                barColor = '#5a5a5a';
                barTextColor = '#ffffff';
              } else if (topEvent.status === 'confirmed') {
                barColor = '#ffd400';
                barTextColor = '#0a0a0a';
              } else {
                barColor = '#ff2e88';
                barTextColor = '#ffffff';
              }

              // Multi-day continuous bar geometry
              barLeft = isEventStart ? '4px' : (isRowStart ? '2px' : '-2px');
              barRight = isEventEnd ? '4px' : (isRowEnd ? '2px' : '-2px');
              barBorderRadius = `${isEventStart ? '4px' : '0'} ${isEventEnd ? '4px' : '0'} ${isEventEnd ? '4px' : '0'} ${isEventStart ? '4px' : '0'}`;

              // Display client/company name on start of event or start of row (week continuity)
              if (isEventStart || isRowStart) {
                const clientObj = topEvent.client_id ? clientMap.get(topEvent.client_id) : null;
                barLabel = clientObj?.name || topEvent.title || 'Evento';
              }
            }

            return (
              <div key={iso} className="h-[58px] relative">
                <button
                  type="button"
                  onClick={() => onDateSelect?.(day)}
                  aria-label={barLabel ? `Dia ${dayNum}: ${barLabel}` : `Dia ${dayNum}`}
                  className={`absolute inset-y-0 inset-x-[2px] rounded-[10px] p-0 flex flex-col items-center justify-start pt-1.5 transition-all duration-150 ${
                    isSel
                      ? 'bg-[#222222] ring-1 ring-[#ffd400]'
                      : inMonth
                      ? 'bg-[#141414] hover:bg-[#1a1a1a]'
                      : 'bg-[#0d0d0d] opacity-35'
                  }`}
                >
                  <span
                    className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-display text-[15px] leading-none ${
                      isToday
                        ? 'bg-[#ffd400] text-[#0a0a0a] font-bold shadow-sm'
                        : isSel
                        ? 'text-[#ffd400] font-bold'
                        : inMonth
                        ? 'text-white'
                        : 'text-[#666666]'
                    }`}
                  >
                    {dayNum}
                  </span>
                </button>

                {/* Continuous event bar under date number */}
                {hasEvents && (
                  <div
                    onClick={() => onDateSelect?.(day)}
                    style={{
                      background: barColor,
                      left: barLeft,
                      right: barRight,
                      borderRadius: barBorderRadius,
                    }}
                    className="absolute bottom-1 h-4 flex items-center px-1 overflow-hidden pointer-events-auto cursor-pointer z-10 shadow-sm"
                  >
                    {barLabel && (
                      <span
                        style={{ color: barTextColor }}
                        className="font-sans text-[8.5px] font-black uppercase tracking-tight truncate leading-none"
                      >
                        {barLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 px-1 font-mono text-[10px] text-[#a8a8a8]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-sm bg-[#ffd400]" />
            confirmado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-sm bg-[#ff2e88]" />
            a receber
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-sm bg-[#5a5a5a]" />
            pago
          </span>
        </div>
      </div>

      {/* Selected day section */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="font-mono text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">
          {isTodayDate(activeSelected) ? 'HOJE · ' : ''}
          {format(activeSelected, "d 'de' MMMM", { locale: ptBR })}
        </div>

        {selectedEvents.length > 0 ? (
          <div className="space-y-3">
            {selectedEvents.map((ev) => {
              const cl = clientMap.get(ev.client_id);
              const amount = getEventCacheAmount(ev);
              const evStatus = getEventStatus(ev);
              const isPaid = ev.payment_status === 'paid';

              let statusColor = '#ffd400';
              let statusLabel = 'CONFIRMADO';
              if (isPaid) {
                statusColor = '#5a5a5a';
                statusLabel = 'PAGO';
              } else if (evStatus === 'pending') {
                statusColor = '#ff2e88';
                statusLabel = 'PENDENTE';
              } else if (evStatus === 'confirmed') {
                statusColor = '#ffd400';
                statusLabel = 'CONFIRMADO';
              }

              return (
                <section
                  key={ev.id}
                  className="rounded-2xl bg-[#161616] border border-[#222222] overflow-hidden flex shadow-lg transition-all"
                >
                  {/* Left color bar */}
                  <div
                    style={{ background: ev.color || statusColor }}
                    className="w-2.5 flex-shrink-0"
                  />
                  <div className="flex-1 p-3.5 flex flex-col gap-2 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-[22px] leading-tight text-white uppercase truncate">
                          {ev.title}
                        </h3>
                        <p className="text-[13px] text-[#c8c8c8] truncate mt-0.5">
                          {cl?.name || ev.location || 'Sem cliente'}
                        </p>
                      </div>
                      <span
                        style={{ background: statusColor }}
                        className="flex-shrink-0 h-6 px-2.5 rounded-full text-[#0a0a0a] font-mono text-[10px] font-bold flex items-center justify-center uppercase"
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-[12px] text-[#a8a8a8]">
                        {ev.start_time ? ev.start_time.slice(0, 5) : 'Dia todo'}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </span>
                      <span className="font-display text-[20px] text-white">
                        {isVisible && amount > 0 ? formatCurrency(amount) : '•••••'}
                      </span>
                    </div>

                    {/* Quick action buttons matching Board C */}
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => onRegisterWork?.(ev)}
                        className="h-10 rounded-full border border-[#333333] bg-transparent text-white font-sans text-[13px] font-extrabold hover:bg-[#222222] transition-colors active:scale-95"
                      >
                        Horas
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddExpense?.(ev)}
                        className="h-10 rounded-full border border-[#333333] bg-transparent text-white font-sans text-[13px] font-extrabold hover:bg-[#222222] transition-colors active:scale-95"
                      >
                        Despesa
                      </button>
                      <button
                        type="button"
                        onClick={() => onEventClick?.(ev)}
                        style={{ background: statusColor }}
                        className="h-10 rounded-full border-none text-[#0a0a0a] font-sans text-[13px] font-extrabold hover:opacity-90 transition-opacity active:scale-95 shadow-sm"
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Free day dashed banner matching Board C */
          <section className="rounded-2xl border-2 border-dashed border-[#333333] p-4 flex justify-between items-center gap-3 bg-[#111111]/50">
            <div>
              <div className="font-display text-[20px] text-white">DIA LIVRE</div>
              <div className="text-[13px] text-[#a8a8a8] mt-0.5">
                Fechou um trabalho pra essa data?
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNewEvent?.(activeSelected)}
              className="h-10 px-4 rounded-full border-none bg-[#ffd400] text-[#0a0a0a] font-sans text-[13px] font-extrabold hover:bg-[#ffe033] transition-transform active:scale-95 shrink-0 shadow-sm"
            >
              Marcar evento
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
