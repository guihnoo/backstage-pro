import { motion } from 'framer-motion';
import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

/**
 * Marca Backstage Pro — ícone PWA + wordmark opcional.
 */
export default function BackstageLogo({
  size = 56,
  showWordmark = false,
  subtitle,
  className = '',
  animate = true,
}) {
  const icon = (
    <img
      src="/icon.svg"
      alt="Backstage Pro"
      width={size}
      height={size}
      className="rounded-[22%] shrink-0"
      style={{
        boxShadow: `0 0 28px ${AUTH_HERO_PRIMARY}40, 0 0 48px ${AUTH_HERO_ACCENT}1f`,
      }}
    />
  );

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon}
      {showWordmark && (
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-tight tracking-tight text-white">
            Backstage{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(to right, ${AUTH_HERO_PRIMARY}, ${AUTH_HERO_ACCENT})`,
              }}
            >
              Pro
            </span>
          </p>
          {subtitle && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#7c8494] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
}
