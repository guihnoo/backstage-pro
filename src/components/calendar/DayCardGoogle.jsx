import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  normalizeDateString, 
  isDateBetween, 
  isToday 
} from '../utils/dateUtils';

const THEME = {
  surfaceAlt: "#0F172A",
  border: "#1E293B",
  text: "#E6EEF8",
  textDim: "#A7B4C7",
  accent: "#22D3EE",
  overlay: "rgba(9,14,24,0.70)"
};

const softColor = (hex, alpha = 0.18) => {
  if (!hex || hex.length < 7) return `rgba(34, 211, 238, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const eventSpansDay = (event, day) => {
  if (!event?.start_date || !event?.end_date) return false;
  const dayStr = normalizeDateString(day);
  return isDateBetween(dayStr, event.start_date, event.end_date);
};

const getSegmentType = (event, day) => {
  if (!event?.start_date || !event?.end_date) return 'none';
  const dayStr = normalizeDateString(day);
  const startStr = normalizeDateString(event.start_date);
  const endStr = normalizeDateString(event.end_date);
  if (dayStr === startStr && dayStr === endStr) return 'single';
  if (dayStr === startStr) return 'start';
  if (dayStr === endStr) return 'end';
  if (dayStr > startStr && dayStr < endStr) return 'middle';
  return 'none';
};

export default function DayCardGoogle({ 
  day, 
  events = [], 
  work, 
  clients, 
  isCurrentMonth = true,
  isToday: isTodayProp = false,
  isSelected = false,
  onClick, 
  onEventClick 
}) {
  const dayStr = normalizeDateString(day);
  const MAX_RIBBONS = 3;

  const ribbons = events
    .filter(event => eventSpansDay(event, day))
    .slice(0, MAX_RIBBONS)
    .map((ev) => {
      const segmentType = getSegmentType(ev, day);
      const startStr = normalizeDateString(ev.start_date);
      const clientsMap = clients instanceof Map ? clients : new Map();
      const label = dayStr === startStr
        ? (clientsMap.get(ev.client_id)?.name || ev.title || 'Evento')
        : null;
      return {
        id: ev.id,
        color: ev.color || THEME.accent,
        label,
        segmentType,
        event: ev
      };
    });

  const handleDayClick = (e) => {
    // Se clicou em um ribbon, não propaga para o dia
    if (e.target.closest('[data-event-ribbon]')) {
      return;
    }
    onClick && onClick(day);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    e.preventDefault();
    onEventClick && onEventClick(event);
  };

  return (
    <motion.div
      className={`
        relative rounded-lg border p-2 flex flex-col gap-1 overflow-hidden cursor-pointer
        transition-all duration-200
        ${isCurrentMonth ? 'bg-slate-900/50' : 'bg-slate-900/20'}
        ${isTodayProp ? 'border-cyan-400 shadow-lg shadow-cyan-400/20' : 'border-slate-800'}
        ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}
        hover:border-slate-700 hover:shadow-md
        min-h-[80px] sm:min-h-[100px]
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleDayClick}
    >
      {work?.photo_url && (
        <>
          <img 
            src={work.photo_url} 
            alt="Foto do dia" 
            className="absolute inset-0 w-full h-full object-cover z-0" 
          />
          <div 
            className="absolute inset-0 z-10" 
            style={{ backgroundColor: THEME.overlay }}
          />
        </>
      )}

      <div className="relative z-20 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          <span className={`
            font-bold text-sm sm:text-base
            ${isTodayProp ? 'text-cyan-400' : 'text-slate-200'}
            ${!isCurrentMonth ? 'opacity-50' : ''}
          `}>
            {new Date(dayStr + 'T00:00:00').getDate()}
          </span>
          {isTodayProp && (
            <Badge className="text-[10px] sm:text-xs bg-cyan-400/20 text-cyan-300 border-cyan-400/30 px-1.5 py-0">
              Hoje
            </Badge>
          )}
        </div>

        {/* Ribbons de Eventos */}
        <div className="space-y-1 flex-1">
          {ribbons.map((rb, idx) => {
            const isSingle = rb.segmentType === 'single';
            const isStart = rb.segmentType === 'start';
            const isEnd = rb.segmentType === 'end';
            const radiusLeft = (isSingle || isStart) ? '9999px' : '4px';
            const radiusRight = (isSingle || isEnd) ? '9999px' : '4px';

            return (
              <div 
                key={`${rb.id}-${idx}`} 
                className="relative"
                data-event-ribbon="true"
              >
                <button
                  onClick={(e) => handleEventClick(e, rb.event)}
                  className="w-full h-6 sm:h-7 flex items-center relative touch-manipulation
                    active:opacity-70 transition-opacity"
                  style={{
                    backgroundColor: rb.color,
                    borderTopLeftRadius: radiusLeft,
                    borderBottomLeftRadius: radiusLeft,
                    borderTopRightRadius: radiusRight,
                    borderBottomRightRadius: radiusRight,
                    opacity: 0.9,
                    minHeight: '44px'
                  }}
                  aria-label={`Ver evento: ${rb.label || 'Evento'}`}
                >
                  {rb.label && (
                    <span className="px-2 text-[10px] sm:text-xs font-semibold text-slate-900 drop-shadow-sm truncate w-full text-left">
                      {rb.label}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          {events.length > MAX_RIBBONS && (
            <button
              onClick={handleDayClick}
              className="text-[10px] sm:text-xs text-cyan-400 hover:text-cyan-300 
                underline w-full text-left px-1 py-0.5 touch-manipulation"
            >
              +{events.length - MAX_RIBBONS} mais
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}