import { motion } from 'framer-motion';

export function NeonSectionFrame({ primary = '#A64AFF', accent = '#FFB700', label, className = '', children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`relative mb-8 rounded-[18px] overflow-hidden ${className}`} style={{ background: 'linear-gradient(160deg, rgba(22,25,35,.55), rgba(12,14,20,.45))', border: `1px solid ${primary}22`, boxShadow: `inset 0 1px 0 rgba(255,255,255,.04), 0 12px 28px -16px #000, 0 0 20px ${primary}12` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${primary}55, ${accent}33, transparent)` }} />
      {label && <div className="relative px-4 pt-3"><span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: `${primary}cc` }}>{label}</span></div>}
      <div className="relative [&>*]:rounded-none [&>*]:border-0 [&>*]:shadow-none [&>*]:bg-transparent">{children}</div>
    </motion.section>
  );
}
