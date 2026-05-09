import React from 'react';
import { motion } from 'framer-motion';

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
// Usando as cores do tema slate-900 e slate-400
const THEME = {
  surfaceAlt: "#111827", // slate-800, mais adequado para header
  textDim: "#94A3B8",    // slate-400
  border: "#1F2937",     // slate-700
};

export default function WeekdayStickyHeader() {
  return (
    <motion.div 
      className="sticky top-0 z-10 grid grid-cols-7"
      style={{ 
        backgroundColor: THEME.surfaceAlt, 
        borderBottom: `1px solid ${THEME.border}`
      }}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {WEEKDAY_LABELS.map((day) => (
        <div 
          key={day} 
          className="py-2 text-center text-xs font-bold tracking-widest"
          style={{ color: THEME.textDim }}
        >
          {day}
        </div>
      ))}
    </motion.div>
  );
}