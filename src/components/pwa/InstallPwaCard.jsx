import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const DISMISSED_KEY = 'bp_install_prompt_dismissed';

import { AUTH_HERO_PRIMARY } from '@/lib/categoryGear';

export default function InstallPwaCard({ primaryHex = AUTH_HERO_PRIMARY }) {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === '1'
  );

  const handleInstall = async () => {
    const accepted = await installApp();
    if (!accepted) setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const show = isInstallable && !isInstalled && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="rounded-xl border px-4 py-3 flex items-center gap-3"
          style={{
            borderColor: `${primaryHex}30`,
            background: `${primaryHex}08`,
          }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${primaryHex}20` }}
          >
            <Smartphone className="w-4 h-4" style={{ color: primaryHex }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">Instalar como app</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">Acesso direto na tela inicial, sem precisar do navegador</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: primaryHex }}
            >
              <Download className="w-3 h-3" />
              Instalar
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
