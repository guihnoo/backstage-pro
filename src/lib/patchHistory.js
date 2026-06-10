/** Notifica quando a URL muda via pushState/replaceState (popstate não dispara nesses casos).
 *  Ignora chamadas internas do React Router (state contém propriedade `idx`).
 *  Sem este filtro, cada navegação React Router dispara bp:history → NavigationSync.reconcile
 *  chama navigate() novamente antes do commit → loop que cancela a navegação pendente. */
export function patchHistoryNotifications() {
  if (typeof window === 'undefined' || window.__bpHistoryPatch) return;
  window.__bpHistoryPatch = true;

  for (const type of ['pushState', 'replaceState']) {
    const original = history[type].bind(history);
    history[type] = (...args) => {
      const result = original(...args);
      const state = args[0];
      const isReactRouterNav =
        state !== null && typeof state === 'object' && 'idx' in state;
      if (!isReactRouterNav) {
        window.dispatchEvent(new Event('bp:history'));
      }
      return result;
    };
  }
}
