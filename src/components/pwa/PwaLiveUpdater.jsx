import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import appToast from '@/lib/appToast';

/** Intervalo de checagem por nova versão (app em primeiro plano). */
const UPDATE_CHECK_MS = 45_000;

let controllerChangeHookBound = false;
let pollListenersBound = false;

/**
 * Mantém o PWA sempre na versão mais recente:
 * - verifica updates ao abrir, voltar ao app, reconectar e a cada N segundos
 * - aplica nova versão automaticamente (sem pedir refresh manual)
 */
export default function PwaLiveUpdater() {
  const applyingRef = useRef(false);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration || pollListenersBound) return;
      pollListenersBound = true;

      const checkForUpdate = () => {
        if (document.visibilityState !== 'visible') return;
        registration.update().catch(() => {});
      };

      checkForUpdate();
      window.setInterval(checkForUpdate, UPDATE_CHECK_MS);
      document.addEventListener('visibilitychange', checkForUpdate);
      window.addEventListener('focus', checkForUpdate);
      window.addEventListener('online', checkForUpdate);

      if ('serviceWorker' in navigator && !controllerChangeHookBound) {
        controllerChangeHookBound = true;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (applyingRef.current) return;
          applyingRef.current = true;
          window.location.reload();
        });
      }
    },
  });

  useEffect(() => {
    if (!needRefresh || applyingRef.current) return;
    applyingRef.current = true;

    appToast.info('Atualizando o app…', {
      id: 'pwa-auto-update',
      description: 'Carregando a versão mais recente.',
      duration: 1500,
    });

    const timer = window.setTimeout(() => {
      updateServiceWorker(true);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
