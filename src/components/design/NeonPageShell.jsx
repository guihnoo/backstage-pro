// Visual All Access: fundo preto liso (#0a0a0a), sem o brilho/grade de palco do visual antigo.
// Mantem a mesma API (primary/accent/stage ignorados) para nao mexer em quem usa.
export function NeonPageShell({ className = '', children }) {
  return (
    <div className={`relative min-h-full overflow-x-clip bg-[#0a0a0a] text-white ${className}`}>
      <div className="relative z-10 min-w-0">{children}</div>
    </div>
  );
}
