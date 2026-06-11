import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

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

    toast('Nova versão disponível', {
      id: 'pwa-update',
      duration: Infinity,
      description: 'Toque em Atualizar para carregar as últimas melhorias.',
      icon: <RefreshCw className="w-4 h-4" />,
      action: {
        label: 'Atualizar',
        onClick: () => {
          updateServiceWorker(true);
        },
      },
      cancel: {
        label: 'Depois',
        onClick: () => {},
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
