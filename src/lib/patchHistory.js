/** Notifica quando a URL muda via pushState/replaceState (popstate não dispara nesses casos). */
export function patchHistoryNotifications() {
  if (typeof window === 'undefined' || window.__bpHistoryPatch) return;
  window.__bpHistoryPatch = true;

  for (const type of ['pushState', 'replaceState']) {
    const original = history[type].bind(history);
    history[type] = (...args) => {
      const result = original(...args);
      window.dispatchEvent(new Event('bp:history'));
      return result;
    };
  }
}
