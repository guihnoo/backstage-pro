
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react'; // Removed MapPin as it's not used
import { getContrastColor, softColor, timeRangeLabel } from '../utils/dateUtils';
import { resolveEventColor } from '@/lib/brandColors';
import { getEventDisplay } from '@/lib/eventDisplay';

export default function ContinuousEventBar({
  span,
  onEventClick,
  onQuickLog,
  clients = []
}) {
  // New interaction state references from the outline
  const pressTimer = useRef(null);
  const lastTapRef = useRef(0);

  if (!span?.block?.events?.length) return null;

  const event = span.block.events[0];
  const client = clients.find((c) => c?.id === event?.client_id);

  // Determine the base color for the bar, prioritizing span.block.color from outline
  const baseColor = resolveEventColor(event, client) || span.block.color || '#22d3ee';
  const { companyName, eventName, showEventSubtitle } = getEventDisplay(event, client);
  const isToday = span.isToday;

  const timeLabel = timeRangeLabel(event);

  // Define segment-related properties with fallbacks for safe rendering as per outline's style
  const segmentType = span.segmentType;
  const radiusLeft = span.radiusLeft || '0px';
  const radiusRight = span.radiusRight || '0px';

  // Handler for pointer down events (mouse or touch start)
  const handlePointerDown = (e) => {
    e.stopPropagation();
    clearTimeout(pressTimer.current);

    // Set a timeout for long press detection
    pressTimer.current = setTimeout(() => {
      if (onQuickLog) {
        console.log('⏰ Long press detectado, chamando onQuickLog');
        onQuickLog();
      }
    }, 500); // 500ms for long press

    // Detect double tap
    const now = new Date().getTime();
    if (now - lastTapRef.current < 300) {// 300ms for double tap interval
      clearTimeout(pressTimer.current); // Cancel potential long press
      if (onQuickLog) {
        console.log('⚡ Double tap detectado, chamando onQuickLog');
        onQuickLog();
      }
      lastTapRef.current = 0; // Reset lastTapRef after double tap to avoid triple tap issues
    } else {
      lastTapRef.current = now;
    }
  };

  // Handler for pointer up events (mouse or touch end)
  const handlePointerUp = () => {
    clearTimeout(pressTimer.current); // Clear long press timer on release
  };

  // Handler for click events (single click)
  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default button actions
    console.log('🖱️ ContinuousEventBar clicado:', span.block);
    // If a quick log (double tap or long press) has been handled, we might not want to also
    // trigger onEventClick. However, the outline doesn't provide logic to prevent handleClick
    // if onQuickLog was called. We implement it as per the outline.
    if (onEventClick) {
      onEventClick();
    } else {
      console.warn('⚠️ onEventClick não foi fornecido para ContinuousEventBar');
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: isToday ? [`0 0 8px ${baseColor}66`, `0 0 16px ${baseColor}33`] : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      exit={{ opacity: 0, scale: 0.95 }} // Added from outline
      whileHover={{ scale: 1.02 }} // Added from outline
      whileTap={{ scale: 0.98 }} // Added from outline
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Clear timer if pointer leaves the element
      className="w-full h-8 sm:h-9 text-left cursor-pointer rounded-full
                 transition-all duration-200 shadow-md
                 hover:shadow-lg active:shadow-sm
                 relative overflow-hidden group
                 touch-manipulation"



      // Added className from outline
      style={{
        backgroundColor: softColor(baseColor, 0.25), // Uses baseColor and new opacity
        borderLeft: `3px solid ${baseColor}`, // Uses baseColor and new border width
        borderRight: segmentType === 'end' || segmentType === 'single' ?
        `3px solid ${baseColor}` :
        'none', // Uses baseColor and segmentType
        borderRadius: `${radiusLeft} ${radiusRight} ${radiusRight} ${radiusLeft}`, // Uses new radius vars
        color: getContrastColor(baseColor) // Sets text color on button itself
      }}
      // Preserving original title attribute for tooltip
      title={`${event.title}${client ? ` • ${client.name}` : ''}${timeLabel ? ` • ${timeLabel}` : ''}\n\nClique duplo (ou toque longo) para registrar horas`}>

      <div
        className="absolute inset-0 rounded-sm flex items-center justify-between px-2 overflow-hidden"
        style={{
          // Update gradient to use the unified baseColor
          background: `linear-gradient(90deg, ${softColor(baseColor, 0.2)} 0%, ${softColor(baseColor, 0.1)} 100%)`
        }}>

        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: baseColor }} // Uses baseColor for dot
          />
          <span className="text-slate-50 text-xs font-semibold truncate">
            {companyName}
          </span>
          {showEventSubtitle && (
            <span className="text-[10px] text-slate-300/80 truncate hidden sm:inline max-w-[40%]">
              {eventName}
            </span>
          )}
          {timeLabel &&
          <span
            className="text-xs opacity-80 flex-shrink-0"
            // Color inherits from the parent button's 'color' style
          >
              {timeLabel}
            </span>
          }
        </div>
        
        {/* Visual indicator for quick logging, preserved from original */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Clock
            className="w-3 h-3 flex-shrink-0"
            style={{ color: getContrastColor(baseColor) }} // Uses baseColor
          />
        </div>
      </div>

      {/* The original feedback div for long press was removed as `whileTap` provides visual feedback for the button. */}
      {/* If specific long-press-only visual feedback is needed, it would require additional state. */}
    </motion.button>);

}