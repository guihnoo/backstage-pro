import { motion } from 'framer-motion';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

export function LightingBeams({ primary = AUTH_HERO_PRIMARY, accent = AUTH_HERO_ACCENT }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute -top-2.5 left-1/2 -translate-x-1/2 blur-sm" style={{ width: 0, height: 0, borderLeft: '120px solid transparent', borderRight: '120px solid transparent', borderTop: `360px solid ${primary}10` }} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="absolute top-0 left-[20%] w-32 h-96 opacity-30 blur-xl" style={{ background: `linear-gradient(180deg, ${accent}30, transparent)` }} animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 5, repeat: Infinity }} />
    </div>
  );
}
