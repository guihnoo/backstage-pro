import { motion } from 'framer-motion';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

export function NeonAtmosphere({ primary = AUTH_HERO_PRIMARY, accent = AUTH_HERO_ACCENT, stage = false }) {
  const washOpacity = stage ? '2e' : '1c';
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% -10%, #11131c 0%, #07080d 55%, #050609 100%)' }} />
      <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] blur-sm" style={{ background: `radial-gradient(circle, ${primary}${washOpacity} 0%, transparent 62%)` }} />
      <motion.div className="absolute -bottom-16 -left-10 w-[280px] h-[280px] blur-[26px]" style={{ background: `radial-gradient(circle, ${accent}14, transparent 65%)` }} animate={{ opacity: [0.5, 0.85, 0.5] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute top-40 -right-16 w-[240px] h-[240px] blur-[30px]" style={{ background: `radial-gradient(circle, ${primary}12, transparent 65%)` }} animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ duration: 10, repeat: Infinity }} />
      <div className="absolute left-0 right-0 bottom-0 h-[300px] transition-opacity duration-500" style={{ opacity: stage ? 0.6 : 0.4, background: `repeating-linear-gradient(90deg, ${primary}22 0 1px, transparent 1px 46px), repeating-linear-gradient(0deg, ${primary}1c 0 1px, transparent 1px 46px)`, transform: 'perspective(420px) rotateX(62deg)', transformOrigin: 'bottom', maskImage: 'linear-gradient(0deg, #000 10%, transparent 75%)', WebkitMaskImage: 'linear-gradient(0deg, #000 10%, transparent 75%)' }} />
      <div className="absolute top-0 left-[18%] w-px h-full" style={{ background: `linear-gradient(180deg, transparent, ${accent}30, transparent)` }} />
      <div className="absolute top-0 right-[24%] w-px h-full" style={{ background: `linear-gradient(180deg, transparent, ${primary}26, transparent)` }} />
      <div className="absolute inset-0 opacity-50" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.015) 0 1px, transparent 1px 3px)' }} />
    </div>
  );
}
