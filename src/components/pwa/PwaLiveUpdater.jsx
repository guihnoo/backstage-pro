import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import appToast from '@/lib/appToast';
import { hasNewerBuild, hardRefresh, isUserBusy } from '@/lib/appBuild';

/** Intervalo de checagem por nova versão (app em primeiro plano). */
const UPDATE_CHECK_MS = 45_000;
/** Depois de tanto tempo ocupado, atualiza mesmo assim (versão velha demais é pior que perder um rascunho). */
const MAX_DEFER_MS = 10 * 60_000;

let pollListenersBound = false;

/**
 * Mantém o PWA sempre na versão mais recente:
 * - verifica updates ao abrir, voltar ao app, reconectar e a cada N segundos
 * - confere também o número da versão publicada (não depende do service worker, que o iPhone
 *   costuma segurar em segundo plano)
 * - aplica a versão nova sozinho, mas espera o usuário terminar de digitar/fechar a janela
 */
export default function PwaLiveUpdater() {
  const applyingRef = useRef(false);
  const busySinceRef = useRef(null);

  const applyWhenIdle = () => {
    if (applyingRef.current) return;
    if (isUserBusy()) {
      busySinceRef.current ??= Date.now();
      if (Date.now() - busySinceRef.current < MAX_DEFER_MS) return; // tenta de novo na próxima checagem
    }
    applyingRef.current = true;
    appToast.info('Atualizando o app…', {
      id: 'pwa-auto-update',
      description: 'Carregando a versão mais recente.',
      duration: 1500,
    });
    window.setTimeout(() => hardRefresh(), 500);
  };

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (pollListenersBound) return;
      pollListenersBound = true;

      const checkForUpdate = async () => {
        if (document.visibilityState !== 'visible') return;
        registration?.update().catch(() => {});
        if (await hasNewerBuild()) applyWhenIdle();
      };

      checkForUpdate();
      window.setInterval(checkForUpdate, UPDATE_CHECK_MS);
      document.addEventListener('visibilitychange', checkForUpdate);
      window.addEventListener('focus', checkForUpdate);
      window.addEventListener('online', checkForUpdate);
      // O recarregamento pelo "controllerchange" fica no index.html (roda antes do React)
    },
  });

  useEffect(() => {
    if (!needRefresh || applyingRef.current) return;
    if (isUserBusy()) return;
    applyingRef.current = true;
    appToast.info('Atualizando o app…', { id: 'pwa-auto-update', description: 'Carregando a versão mais recente.', duration: 1500 });
    const timer = window.setTimeout(() => updateServiceWorker(true), 400);
    return () => window.clearTimeout(timer);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
