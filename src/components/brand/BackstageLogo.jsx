import { motion } from 'framer-motion';

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
        boxShadow: '0 0 28px rgba(166, 74, 255, 0.25), 0 0 48px rgba(255, 183, 0, 0.12)',
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A64AFF] to-[#FFB700]">
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
