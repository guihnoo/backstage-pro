import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';

import { AUTH_HERO_PRIMARY } from '@/lib/categoryGear';

export default function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold, primaryHex = AUTH_HERO_PRIMARY }) {
  const visible = pullDistance > 4 || isRefreshing;
  const progress = Math.min(pullDistance / threshold, 1);
  const ready = pullDistance >= threshold;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }}
        >
          <div
            className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0c12]/90 px-3 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-lg"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: primaryHex }} />
                <span>Atualizando cockpit…</span>
              </>
            ) : (
              <>
                <motion.span
                  animate={{ rotate: ready ? 180 : progress * 180 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <ArrowDown className="h-3.5 w-3.5" style={{ color: primaryHex }} />
                </motion.span>
                <span>{ready ? 'Solte para atualizar' : 'Puxe para atualizar'}</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
