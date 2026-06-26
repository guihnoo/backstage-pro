import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, CloudUpload } from 'lucide-react';
import { useOfflineSync } from '@/lib/offline/OfflineSyncProvider';
import { useConnectivity } from '@/lib/offline/useConnectivity';

const RECONNECT_SHOW_MS = 3000;

function formatOfflineSince(iso) {
  if (!iso) return null;
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min atrás`;
  return `${Math.round(mins / 60)}h atrás`;
}

/**
 * Banner informativo — detecção 100% automática (sem toggle do usuário).
 */
export default function OfflineBanner() {
  const { pendingCount, syncing } = useOfflineSync();
  const { online, offline } = useConnectivity();
  const [offlineSince, setOfflineSince] = useState(null);
  const [showReconnected, setShowReconnected] = useState(false);
  const reconnectTimer = useRef(null);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (offline) {
      setShowReconnected(false);
      clearTimeout(reconnectTimer.current);
      setOfflineSince((prev) => prev || new Date().toISOString());
      wasOfflineRef.current = true;
      return;
    }

    setOfflineSince(null);

    if (wasOfflineRef.current) {
      setShowReconnected(true);
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(() => setShowReconnected(false), RECONNECT_SHOW_MS);
      wasOfflineRef.current = false;
    }
  }, [offline]);

  useEffect(() => () => clearTimeout(reconnectTimer.current), []);

  const ago = formatOfflineSince(offlineSince);
  const showPendingOnline = online && pendingCount > 0;
  const visible = offline || showReconnected || showPendingOnline;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={offline ? 'offline' : showPendingOnline ? 'pending' : 'online'}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed left-0 right-0 z-50 flex justify-center px-3 pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' }}
        >
          {offline ? (
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/90 px-3 py-1.5 text-[11px] font-mono text-amber-200 shadow-lg backdrop-blur-md">
              <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
              <span>
                Sem internet — usando seus dados salvos
                {ago ? ` (${ago})` : ''}
              </span>
            </div>
          ) : showPendingOnline ? (
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/90 px-3 py-1.5 text-[11px] font-mono text-violet-200 shadow-lg backdrop-blur-md">
              <CloudUpload className={`h-3.5 w-3.5 shrink-0 text-violet-400 ${syncing ? 'animate-pulse' : ''}`} aria-hidden />
              <span>
                {syncing
                  ? 'Sincronizando alterações…'
                  : `${pendingCount} alteração${pendingCount > 1 ? 'ões' : ''} pendente${pendingCount > 1 ? 's' : ''}`}
              </span>
            </div>
          ) : (
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/90 px-3 py-1.5 text-[11px] font-mono text-emerald-200 shadow-lg backdrop-blur-md">
              <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
              <span>Conexão restaurada — dados atualizados</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
