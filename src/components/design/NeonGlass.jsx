// Visual All Access: o antigo "vidro neon" virou o cartao padrao (#161616, borda #222, cantos 16px).
// Mantem a mesma API (primary/glow ignorados) para nao mexer em quem usa.
export function NeonGlass({ className = '', children, style }) {
  return (
    <div className={`relative rounded-2xl bg-[#161616] border border-[#222222] ${className}`} style={style}>
      {children}
    </div>
  );
}
