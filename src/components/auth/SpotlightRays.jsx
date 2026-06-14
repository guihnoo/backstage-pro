import { motion } from 'framer-motion';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

export function SpotlightRays({ primary = AUTH_HERO_PRIMARY, accent = AUTH_HERO_ACCENT }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.svg animate={{ rotateZ: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-0 left-1/4 w-96 h-96" viewBox="0 0 200 300">
        <defs><linearGradient id="ray1" x1="100" y1="0" x2="0" y2="300"><stop offset="0%" stopColor={`${accent}99`} /><stop offset="100%" stopColor={`${accent}00`} /></linearGradient></defs>
        <polygon points="100,0 0,300 200,300" fill="url(#ray1)" />
      </motion.svg>
      <motion.svg animate={{ rotateZ: [2, -2, 2] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-0 right-1/4 w-80 h-80" viewBox="0 0 200 300">
        <defs><linearGradient id="ray2" x1="100" y1="0" x2="200" y2="300"><stop offset="0%" stopColor={`${primary}88`} /><stop offset="100%" stopColor={`${primary}00`} /></linearGradient></defs>
        <polygon points="100,0 0,300 200,300" fill="url(#ray2)" />
      </motion.svg>
    </div>
  );
}
export default SpotlightRays;
