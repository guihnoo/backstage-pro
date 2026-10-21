import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useConnectivity } from '@/lib/offline/useConnectivity';

/** Só aparece sem internet — sync ao reconectar é silencioso e automático. */
export default function OfflineBanner() {
  const { offline } = useConnectivity();
  const offlineSinceRef = useRef(null);

  useEffect(() => {
    if (offline) {
      offlineSinceRef.current = offlineSinceRef.current || new Date().toISOString();
    } else {
      offlineSinceRef.current = null;
    }
  }, [offline]);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed left-0 right-0 z-50 flex justify-center px-3 pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' }}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#ffd400] bg-[#ffd400] px-3 py-1.5 text-[11px] font-tag font-bold text-[#0a0a0a] shadow-lg">
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-[#0a0a0a]" aria-hidden />
            <span>Sem internet — seus dados continuam disponíveis</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
