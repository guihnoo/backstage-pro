import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

function formatOfflineSince(iso) {
  if (!iso) return null;
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.round(mins / 60);
  return `${hours}h atrás`;
}

export default function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [offlineSince, setOfflineSince] = useState(null);

  useEffect(() => {
    const goOffline = () => {
      setOnline(false);
      setOfflineSince((prev) => prev || new Date().toISOString());
    };
    const goOnline = () => {
      setOnline(true);
      setOfflineSince(null);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const ago = formatOfflineSince(offlineSince);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed left-0 right-0 z-50 flex justify-center px-3 pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' }}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/90 px-3 py-1.5 text-[11px] font-mono text-amber-200 shadow-lg backdrop-blur-md">
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
            <span>
              Sem conexão
              {ago ? ` — dados de ${ago}` : ' — dados podem estar desatualizados'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
