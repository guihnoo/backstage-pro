import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import appToast from '@/lib/appToast';

/**
 * Avisa quando há nova versão do app (service worker) e permite atualizar sem limpar cache manual.
 */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  useEffect(() => {
    if (!needRefresh) return;

    appToast.action('Nova versão disponível', {
      id: 'pwa-update',
      description: 'Toque em Atualizar para carregar as últimas melhorias.',
      type: 'info',
      icon: RefreshCw,
      action: {
        label: 'Atualizar',
        onClick: () => updateServiceWorker(true),
      },
      cancel: {
        label: 'Depois',
        onClick: () => {},
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
