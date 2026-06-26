import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { AUTH_HERO_PRIMARY } from '@/lib/categoryGear';

export default function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold, primaryHex = AUTH_HERO_PRIMARY }) {
  const visible = pullDistance > 4 || isRefreshing;
  const progress = Math.min(pullDistance / threshold, 1);
  const ready = pullDistance >= threshold;

  const size = 36;
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - progress * circumference;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }}
        >
          <div
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0a0c12]/92 pl-1.5 pr-4 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-xl shadow-xl"
            style={{
              boxShadow: ready
                ? `0 0 0 1px ${primaryHex}40, 0 8px 24px ${primaryHex}20`
                : '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {isRefreshing ? (
              <>
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                    <motion.circle
                      cx={size / 2} cy={size / 2} r={r}
                      fill="none"
                      stroke={primaryHex}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset: [circumference, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  </svg>
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: primaryHex }} />
                </div>
                <span style={{ color: '#c0c8d8' }}>Atualizando…</span>
              </>
            ) : (
              <>
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                    <motion.circle
                      cx={size / 2} cy={size / 2} r={r}
                      fill="none"
                      stroke={ready ? primaryHex : `${primaryHex}80`}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      style={{ filter: ready ? `drop-shadow(0 0 4px ${primaryHex}80)` : 'none' }}
                    />
                  </svg>
                  <motion.div
                    animate={{ rotate: ready ? 180 : progress * 160 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  >
                    <RefreshCw className="w-3 h-3" style={{ color: ready ? primaryHex : '#8a91a1' }} />
                  </motion.div>
                </div>
                <motion.span
                  animate={{ color: ready ? '#ffffff' : '#8a91a1' }}
                  transition={{ duration: 0.15 }}
                >
                  {ready ? 'Solte para atualizar' : 'Puxe para atualizar'}
                </motion.span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
