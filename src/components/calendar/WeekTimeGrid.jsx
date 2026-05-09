import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { startOfWeek, addDays, format, startOfDay, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEventsForDate, normalizeDateString } from '../utils/dateUtils';

export default function WeekTimeGrid({ currentDate, events = [], onEventClick }) {
  // Verificação de segurança
  const safeEvents = Array.isArray(events) ? events : [];
  
  const weekStart = useMemo(() => {
    return startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira = 1
  }, [currentDate]);
  
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);
  
  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const getEventsForTimeSlot = (day, hour) => {
    const dayEvents = getEventsForDate(safeEvents, day);
    if (!Array.isArray(dayEvents)) return [];
    
    return dayEvents.filter(event => {
      if (!event || !event.start_time) return false;
      
      const eventHour = parseInt(event.start_time.split(':')[0]);
      return eventHour === hour;
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header com os dias da semana */}
      <div className="grid grid-cols-8 border-b border-slate-800">
        <div className="p-3 bg-slate-800/50 text-slate-400 text-sm font-semibold">
          Horário
        </div>
        {weekDays.map(day => (
          <div key={normalizeDateString(day)} className="p-3 bg-slate-800/50 text-center">
            <div className="text-slate-300 font-bold text-sm">
              {format(day, 'EEE', { locale: ptBR })}
            </div>
            <div className="text-white font-bold text-lg">
              {format(day, 'dd')}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de horários */}
      <div className="max-h-96 overflow-y-auto">
        {timeSlots.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-slate-800/50 min-h-[60px]">
            <div className="p-3 bg-slate-800/30 flex items-center justify-center text-slate-400 text-sm font-mono">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map(day => {
              const dayEvents = getEventsForTimeSlot(day, hour);
              return (
                <div key={`${normalizeDateString(day)}-${hour}`} className="p-1 border-r border-slate-800/50 relative">
                  {dayEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-700/80 rounded p-1 mb-1 cursor-pointer hover:bg-slate-600/80 transition-colors"
                      style={{ borderLeft: `3px solid ${event.color || '#22d3ee'}` }}
                      onClick={() => onEventClick && onEventClick(event)}
                    >
                      <div className="text-xs text-white font-medium truncate">
                        {event.title || 'Evento'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {event.start_time || ''}
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}