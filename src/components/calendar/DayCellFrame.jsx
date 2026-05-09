import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import DayQuickActionsMobile from './DayQuickActionsMobile';
import { isToday as isTodayUtil, getEventStatus } from '../utils/dateUtils';
import { useMediaQuery } from '../hooks/useMediaQuery';

// =========================
// VISUAL TOKENS (DARK)
// =========================
const THEME = {
  surface: "#0F172A",
  surfaceAlt: "#1E293B", // Ligeiramente mais claro para contraste da célula
  border: "#334155",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  overlay: "rgba(15, 23, 42, 0.75)",
  accent: "#22D3EE",
};

const STATUS_COLORS = {
  scheduled: 'bg-blue-500/80',
  in_progress: 'bg-emerald-500/80',
  completed: 'bg-slate-500/80',
  confirmed: 'bg-cyan-500/80',
  pending: 'bg-amber-500/80',
  cancelled: 'bg-rose-500/80',
  archived: 'bg-slate-600/80'
};

// =========================
// SUB-COMPONENTS
// =========================

const DayNumber = ({ day }) => {
  const isCurrentToday = isTodayUtil(day);
  return (
    <span
      className="text-sm font-semibold"
      style={{ color: isCurrentToday ? THEME.accent : THEME.textDim }}
    >
      {day.getDate()}
    </span>
  );
};

const EventBadges = ({ events }) => {
  if (!events || events.length === 0) return null;

  const maxBadges = 2;
  const visibleEvents = events.slice(0, maxBadges);
  const overflowCount = events.length - maxBadges;

  return (
    <div className="space-y-1">
      {visibleEvents.map(event => (
        <div
          key={event.id}
          className={`w-full text-xs text-white font-medium px-2 py-1 rounded truncate ${STATUS_COLORS[getEventStatus(event)] || 'bg-gray-500'}`}
        >
          {event.title}
        </div>
      ))}
      {overflowCount > 0 && (
        <div className="text-xs text-slate-400 font-medium">+ {overflowCount} mais</div>
      )}
    </div>
  );
};

const FinanceChips = ({ work, payoutStatus }) => {
  const hasContent = work || payoutStatus;
  if (!hasContent) return null;

  const Chip = ({ children, tone = 'default' }) => {
    const toneClasses = {
      default: 'bg-slate-600/70 text-slate-300',
      amber: 'bg-amber-500/80 text-amber-100',
      cyan: 'bg-cyan-400/80 text-cyan-100',
    };
    return (
      <div className={`text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm ${toneClasses[tone]}`}>
        {children}
      </div>
    );
  };

  const Dot = ({ tone = 'default', title }) => {
    const toneClasses = {
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
    };
    return (
      <div
        title={title}
        className={`w-1.5 h-1.5 rounded-full shadow-sm ${toneClasses[tone]}`}
      />
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {work?.total_hours > 0 && <Chip>{work.total_hours.toFixed(0)}h</Chip>}
      {work?.overtime_hours > 0 && <Chip tone="amber">+{work.overtime_hours.toFixed(0)}h</Chip>}
      {work?.daily_cache > 0 && <Chip tone="cyan">R${work.daily_cache.toFixed(0)}</Chip>}
      {payoutStatus === "paid" && <Dot tone="emerald" title="Pago" />}
      {payoutStatus === "pending" && <Dot tone="amber" title="Pendente" />}
    </div>
  );
};


// =========================
// MAIN FRAME COMPONENT
// =========================
export default function DayCellFrame({ day, events, work, payoutStatus, onDateClick, onRegisterWork, onCreateEvent, onAddExpense }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const longPressTimer = useRef(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handlePointerDown = () => {
    if (!isMobile) return;
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(30);
      setIsSheetOpen(true);
    }, 550);
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleClick = () => {
    if (isMobile) {
      // On mobile, simple tap opens details directly
      onDateClick(day, events, work);
    } else {
      // On desktop, click also opens details
      onDateClick(day, events, work);
    }
  };

  return (
    <>
      <motion.div
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative grid grid-rows-[auto_1fr_auto] gap-1.5 p-2 rounded-lg cursor-pointer h-full"
        style={{
          backgroundColor: THEME.surfaceAlt,
          border: `1px solid ${THEME.border}`,
          color: THEME.text,
          boxShadow: isTodayUtil(day) ? `0 0 0 2px ${THEME.accent}` : 'none',
          opacity: events.length > 0 || work ? 1 : 0.7 // Dim unused cells
        }}
      >
        {/* Background Photo */}
        {work?.photo_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={work.photo_url}
              alt="Foto do dia"
              className="w-full h-full object-cover rounded-lg"
            />
            <div
              className="absolute inset-0 rounded-lg"
              style={{ backgroundColor: THEME.overlay }}
            />
          </div>
        )}

        {/* Content Grid */}
        <div className="relative z-10 flex justify-between items-start">
          <DayNumber day={day} />
        </div>

        <div className="relative z-10 flex flex-col justify-end overflow-hidden">
          <EventBadges events={events} />
        </div>

        <div className="relative z-10">
          <FinanceChips work={work} payoutStatus={payoutStatus} />
        </div>
      </motion.div>

      {/* Mobile Bottom Sheet */}
      <DayQuickActionsMobile
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        day={day}
        onRegisterWork={onRegisterWork}
        onCreateEvent={onCreateEvent}
        onOpenDetails={() => onDateClick(day, events, work)}
        onAddExpense={onAddExpense}
      />
    </>
  );
}