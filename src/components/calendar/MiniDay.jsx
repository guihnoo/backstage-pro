import { motion } from 'framer-motion';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';

const MiniDay = ({ day, selectedDay, currentMonth, events, onClick }) => {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isSelected = selectedDay && isSameDay(day, selectedDay);
  const hasEvents = events && events.length > 0;
  const today = isToday(day);

  const handleClick = () => {
    if (onClick) {
      onClick(day);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        relative w-full aspect-square rounded-lg text-xs font-medium transition-all duration-200 min-h-[32px] flex flex-col items-center justify-center
        ${isSelected 
          ? 'bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-400/20' 
          : today
            ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/50'
            : isCurrentMonth
              ? 'bg-slate-800/50 text-white hover:bg-slate-700/50'
              : 'bg-transparent text-slate-500 hover:bg-slate-800/30'
        }
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="leading-none">
        {format(day, 'd')}
      </span>
      
      {/* Event indicator */}
      {hasEvents && (
        <div className="flex gap-0.5 mt-0.5">
          {events.slice(0, 3).map((event, index) => (
            <div
              key={index}
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color || '#22d3ee' }}
            />
          ))}
          {events.length > 3 && (
            <div className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
          )}
        </div>
      )}
    </motion.button>
  );
};

export default MiniDay;