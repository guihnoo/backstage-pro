import React, { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download, X, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallBanner() {
  const { isInstallable, isOnline, installApp } = usePWA();
  const [dismissedInstall, setDismissedInstall] = useState(false);

  const showInstallBanner = isInstallable && !dismissedInstall;

  return (
    <AnimatePresence>
      {/* Status Online/Offline */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-amber-900/30 border-b border-amber-800/50 px-4 py-2 flex items-center gap-2"
        >
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-amber-300">
            Você está offline. Os dados em cache estão disponíveis.
          </p>
        </motion.div>
      )}

      {/* Banner de Instalação */}
      {showInstallBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-b border-cyan-800/50 px-4 py-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Download className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-cyan-300 font-medium">
                Instale Backstage Pro como app
              </p>
              <p className="text-xs text-cyan-400/70">
                Acesso rápido e funciona offline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={installApp}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-1" />
              Instalar
            </Button>
            <button
              onClick={() => setDismissedInstall(true)}
              className="text-cyan-400/60 hover:text-cyan-300 p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
