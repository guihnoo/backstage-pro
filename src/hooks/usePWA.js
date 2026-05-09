import { useEffect, useState } from 'react';

/**
 * Hook para gerenciar instalação de PWA
 */
export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Evento: app pode ser instalado
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('📱 App é instalável');
    };

    // Evento: app foi instalado
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log('✅ App instalado com sucesso!');
    };

    // Eventos de conectividade
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Offline');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar se já está instalado (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Usuário aceitou instalar');
      setIsInstallable(false);
      setDeferredPrompt(null);
    } else {
      console.log('❌ Usuário recusou instalar');
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
  };
};
