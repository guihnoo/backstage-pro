import { cn } from '@/lib/utils';

const GRADIENT_ID = 'bs-logo-wave';

/**
 * Marca Backstage Pro — inspirada em ondas de frequência + palco (original).
 */
export default function BackstageLogo({
  size = 'md',
  showWordmark = false,
  className,
  primary = '#A64AFF',
  accent = '#00D9FF',
}) {
  const sizes = {
    sm: { box: 40, icon: 40, title: 'text-sm', tag: 'text-[9px]' },
    md: { box: 62, icon: 62, title: 'text-lg', tag: 'text-[10px]' },
    lg: { box: 80, icon: 80, title: 'text-xl', tag: 'text-xs' },
    xl: { box: 120, icon: 120, title: 'text-2xl', tag: 'text-xs' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={cn('flex flex-col items-start', className)}>
      <div
        className="relative rounded-[22%] overflow-hidden shrink-0"
        style={{
          width: s.box,
          height: s.box,
          boxShadow: `0 0 32px ${primary}44, 0 8px 24px rgba(0,0,0,0.45)`,
        }}
      >
        <svg
          viewBox="0 0 512 512"
          width={s.icon}
          height={s.icon}
          className="block"
          aria-hidden
        >
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor={primary} />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
          </defs>
          <rect width="512" height="512" fill="#050609" />
          <g fill="none" stroke={`url(#${GRADIENT_ID})`} strokeLinecap="round">
            <ellipse cx="256" cy="248" rx="168" ry="72" strokeWidth="2.2" opacity="0.35" />
            <ellipse cx="256" cy="248" rx="142" ry="60" strokeWidth="2.4" opacity="0.5" />
            <ellipse cx="256" cy="248" rx="116" ry="48" strokeWidth="2.6" opacity="0.65" />
            <ellipse cx="256" cy="248" rx="90" ry="36" strokeWidth="2.8" opacity="0.8" />
            <ellipse cx="256" cy="248" rx="64" ry="24" strokeWidth="3" />
          </g>
          <text
            x="256"
            y="278"
            textAnchor="middle"
            fontFamily="Archivo, system-ui, sans-serif"
            fontSize="148"
            fontWeight="800"
            fill="#FFFFFF"
          >
            B
          </text>
        </svg>
      </div>
      {showWordmark && (
        <div className="mt-3">
          <p className={cn('font-extrabold tracking-wide text-white uppercase leading-none', s.title)}>
            Backstage Pro
          </p>
          <p
            className={cn('font-mono uppercase tracking-[0.2em] mt-1', s.tag)}
            style={{ color: `${primary}cc` }}
          >
            Gestão de palco
          </p>
        </div>
      )}
    </div>
  );
}
