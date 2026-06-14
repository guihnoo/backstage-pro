import { motion } from 'framer-motion';
import { getGearForCategory, AUTH_HERO_PRIMARY } from '@/lib/categoryGear';

export function FloatingEquipment({ categoryId = 'lighting', primary = AUTH_HERO_PRIMARY }) {
  const equipments = getGearForCategory(categoryId);
  const isLighting = categoryId === 'lighting';
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {equipments.map((emoji, i) => (
        <motion.div key={i} initial={{ x: Math.random() * w, y: Math.random() * h, opacity: isLighting ? 0.12 : 0.06 }} animate={{ y: [Math.random() * h, Math.random() * h - 100, Math.random() * h], x: [Math.random() * w, Math.random() * w + 50, Math.random() * w] }} transition={{ duration: 15 + i * 2, repeat: Infinity, ease: 'linear' }} className="absolute text-3xl" style={isLighting ? { filter: `drop-shadow(0 0 8px ${primary}55)` } : undefined}>{emoji}</motion.div>
      ))}
    </div>
  );
}
export default FloatingEquipment;
