import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

function useLevels(count, intervalMs, active) {
  const [levels, setLevels] = useState(() => Array.from({ length: count }, () => Math.random()));
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setLevels((prev) => prev.map((v) => Math.max(0.12, Math.min(1, v + (Math.random() - 0.5) * 0.35)))), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, active]);
  return levels;
}

export function NeonLevelBars({ primary = AUTH_HERO_PRIMARY, accent = AUTH_HERO_ACCENT, active = true, count = 22, className = '' }) {
  const levels = useLevels(count, 120, active);
  return (
    <div className={`flex items-end gap-[3px] h-[30px] ${className}`}>
      {levels.map((v, i) => (
        <motion.div key={i} className="flex-1 rounded-sm min-w-[3px]" style={{ height: `${18 + v * 82}%`, background: `linear-gradient(180deg, ${primary}, ${accent})`, opacity: 0.4 + v * 0.6, boxShadow: `0 0 6px ${primary}55` }} />
      ))}
    </div>
  );
}
