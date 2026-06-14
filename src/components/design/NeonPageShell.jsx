import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

export function NeonPageShell({ primary = AUTH_HERO_PRIMARY, accent = AUTH_HERO_ACCENT, stage = false, className = '', children }) {
  return (
    <div className={`relative min-h-full overflow-x-clip bg-[#050609] text-white ${className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <NeonAtmosphere primary={primary} accent={accent} stage={stage} />
      </div>
      <div className="relative z-10 min-w-0">{children}</div>
    </div>
  );
}
