export function NeonGlass({ primary = '#A64AFF', accent, glow = false, className = '', children, style }) {
  return (
    <div className={`relative rounded-[18px] overflow-hidden backdrop-blur-[14px] ${className}`} style={{ background: 'linear-gradient(160deg, rgba(22,25,35,.72), rgba(12,14,20,.66))', border: `1px solid ${primary}26`, boxShadow: `inset 0 1px 0 rgba(255,255,255,.05), 0 14px 30px -18px #000${glow ? `, 0 0 26px ${primary}22` : ''}`, ...style }}>
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 3px)' }} />
      <div className="relative">{children}</div>
    </div>
  );
}
