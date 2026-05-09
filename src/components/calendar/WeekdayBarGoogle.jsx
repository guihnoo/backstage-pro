import React from 'react';

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const THEME = {
  surface: "#0B1220",
  textDim: "#A7B4C7",
  border: "#1E293B"
};

export default function WeekdayBarGoogle() {
  return (
    <div 
      className="grid grid-cols-7 py-3 px-2 border-b"
      style={{ 
        backgroundColor: THEME.surface,
        borderColor: THEME.border 
      }}
    >
      {WEEKDAY_LABELS.map((day) => (
        <div 
          key={day} 
          className="text-center text-xs font-bold uppercase tracking-wider"
          style={{ 
            color: THEME.textDim,
            letterSpacing: '0.05em'
          }}
        >
          {day}
        </div>
      ))}
    </div>
  );
}