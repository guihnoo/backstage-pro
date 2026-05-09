import React from 'react';
import { motion } from 'framer-motion';
import { format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { monthMatrix } from '../utils/dateUtils';

const THEME = {
  surface: "#0B1220",
  surfaceAlt: "#0F172A",
  border: "#1E293B",
  text: "#E6EEF8",
  textDim: "#A7B4C7",
  accent: "#22D3EE"
};

export default function MiniMonthGrid({ currentDate, selectedDay, allEvents, onDayClick }) {
  const days = monthMatrix(currentDate);

  const getEventsForDate = (date) => {
    return allEvents.filter(event => {
      if (!event.start_date || !event.end_date) return false;
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getDayIndicator = (date, events) => {
    if (events.length === 0) return null;
    
    if (events.length === 1) {
      return (
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: events[0].color || THEME.accent }}
        />
      );
    }
    
    return (
      <div className="flex gap-0.5">
        {events.slice(0, 3).map((event, idx) => (
          <div 
            key={idx}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: event.color || THEME.accent }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 shadow-xl">
      {/* Header do Mini Calendário */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-white font-display">
          {format(currentDate, 'LLLL yyyy', { locale: ptBR })}
        </h3>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
          <div key={idx} className="text-center text-xs font-bold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, selectedDay);
          const today = isToday(day);
          
          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`
                relative aspect-square rounded-xl p-1 transition-all duration-200 flex flex-col items-center justify-center text-sm font-medium
                ${isSelected 
                  ? 'bg-cyan-400 text-slate-900 shadow-lg scale-105' 
                  : today
                  ? 'bg-slate-700 text-cyan-300 ring-2 ring-cyan-400/50'
                  : isCurrentMonth
                  ? 'bg-slate-800/50 text-slate-200 hover:bg-slate-700/50'
                  : 'bg-slate-900/30 text-slate-500 hover:bg-slate-800/30'
                }
              `}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.01 }}
            >
              {/* Número do Dia */}
              <span className="text-sm font-bold mb-1">
                {format(day, 'd')}
              </span>

              {/* Indicadores de Eventos */}
              <div className="flex justify-center items-center h-3">
                {getDayIndicator(day, dayEvents)}
              </div>

              {/* Badge para dias com muitos eventos */}
              {dayEvents.length > 3 && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {dayEvents.length}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span>Com eventos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
            <span>Vazio</span>
          </div>
        </div>
      </div>
    </div>
  );
}