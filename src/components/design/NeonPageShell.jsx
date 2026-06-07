import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';

export function NeonPageShell({ primary = '#A64AFF', accent = '#FFB700', stage = false, className = '', children }) {
  return (
    <div className={`relative min-h-full bg-[#050609] text-white ${className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <NeonAtmosphere primary={primary} accent={accent} stage={stage} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
