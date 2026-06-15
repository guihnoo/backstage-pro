
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getContrastColor, softColor, timeRangeLabel } from '../utils/dateUtils';
import { DEFAULT_EVENT_COLOR, resolveEventColor } from '@/lib/brandColors';
import { getEventDisplay } from '@/lib/eventDisplay';

// Ícone e cor do status de pagamento
const STATUS_MAP = {
  paid:      { Icon: CheckCircle2, color: '#10b981', label: 'Pago' },
  confirmed: { Icon: Clock,        color: '#f59e0b', label: 'Aguardando' },
  unpaid:    { Icon: AlertCircle,  color: '#64748b', label: 'Pendente' },
};

export default function ContinuousEventBar({
  span,
  onEventClick,
  onQuickLog,
  clients = []
}) {
  const pressTimer = useRef(null);
  const lastTapRef = useRef(0);

  if (!span?.block?.events?.length) return null;

  const event = span.block.events[0];
  const client = clients.find((c) => c?.id === event?.client_id);

  const baseColor = resolveEventColor(event, client) || span.block.color || DEFAULT_EVENT_COLOR;
  const { companyName, eventName, showEventSubtitle } = getEventDisplay(event, client);
  const isToday = span.isToday;
  const timeLabel = timeRangeLabel(event);

  // Bordas arredondadas derivadas dos flags de segmento
  const isStart = span.roundedLeft;
  const isEnd   = span.roundedRight;
  const radiusLeft  = isStart ? '9999px' : '2px';
  const radiusRight = isEnd   ? '9999px' : '2px';

  // Duração total do evento em dias
  const blockDurationDays = span.block.start && span.block.end
    ? Math.round((span.block.end.getTime() - span.block.start.getTime()) / 86400000)
    : 1;
  const isMultiDay = blockDurationDays > 1;

  // Status de pagamento
  const statusKey = event.payment_status === 'paid' ? 'paid'
    : event.status === 'confirmed'                  ? 'confirmed'
    : 'unpaid';
  const { Icon: StatusIcon, color: statusColor } = STATUS_MAP[statusKey];

  const handlePointerDown = (e) => {
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => { if (onQuickLog) onQuickLog(); }, 500);
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      clearTimeout(pressTimer.current);
      if (onQuickLog) onQuickLog();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handlePointerUp = () => clearTimeout(pressTimer.current);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onEventClick) onEventClick();
  };

  return (
    <motion.button
      initial={{ opacity: 0, scaleX: 0.9 }}
      animate={{
        opacity: 1,
        scaleX: 1,
        boxShadow: isToday
          ? [`0 0 8px ${baseColor}66`, `0 0 16px ${baseColor}33`]
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      exit={{ opacity: 0, scaleX: 0.9 }}
      whileHover={{ scale: 1.015, boxShadow: `0 4px 14px ${baseColor}40` }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full h-8 sm:h-9 text-left cursor-pointer transition-all duration-200 relative overflow-hidden group touch-manipulation"
      style={{
        backgroundColor: softColor(baseColor, 0.22),
        borderLeft:  `3px solid ${baseColor}`,
        borderRight: isEnd ? `3px solid ${baseColor}` : 'none',
        borderTop:    `1px solid ${baseColor}40`,
        borderBottom: `1px solid ${baseColor}40`,
        borderRadius: `${radiusLeft} ${radiusRight} ${radiusRight} ${radiusLeft}`,
        color: getContrastColor(baseColor),
      }}
      title={`${companyName}${showEventSubtitle ? ` · ${eventName}` : ''}${timeLabel ? ` • ${timeLabel}` : ''}${isMultiDay ? ` (${blockDurationDays} dias)` : ''}\n\nClique duplo ou toque longo para registrar horas`}
    >
      {/* Gradiente interno */}
      <div
        className="absolute inset-0 flex items-center justify-between px-2 overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${softColor(baseColor, 0.18)} 0%, ${softColor(baseColor, 0.08)} 100%)`,
        }}
      >
        {/* Left: dot + nome + subtítulo */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: baseColor }}
          />
          <span className="text-slate-50 text-xs font-semibold truncate leading-none">
            {companyName}
          </span>
          {showEventSubtitle && (
            <span className="text-[10px] text-slate-300/70 truncate hidden sm:inline max-w-[35%] leading-none">
              {eventName}
            </span>
          )}
          {/* Badge de duração — só no segmento inicial */}
          {isMultiDay && isStart && (
            <span
              className="text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0 leading-none hidden xs:inline"
              style={{ background: `${baseColor}30`, color: baseColor }}
            >
              {blockDurationDays}d
            </span>
          )}
        </div>

        {/* Right: status + clock (hover) */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          <StatusIcon
            className="w-3 h-3 flex-shrink-0 transition-opacity"
            style={{ color: statusColor, opacity: 0.85 }}
          />
          <Clock
            className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-70 transition-opacity duration-150"
            style={{ color: getContrastColor(baseColor) }}
          />
        </div>
      </div>
    </motion.button>
  );
}
