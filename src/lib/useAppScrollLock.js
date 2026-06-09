import { useEffect } from 'react';

const LOCK_ATTR = 'data-scroll-lock';

/**
 * Trava o scroll do container principal (`[data-app-scroll]`) enquanto
 * overlays customizados (sheets, modais manuais) estão abertos.
 * Dialogs Radix já disparam o seletor CSS via role="dialog".
 */
export function useAppScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    const current = Number(document.body.getAttribute(LOCK_ATTR) || '0');
    document.body.setAttribute(LOCK_ATTR, String(current + 1));

    return () => {
      const next = Number(document.body.getAttribute(LOCK_ATTR) || '1') - 1;
      if (next <= 0) {
        document.body.removeAttribute(LOCK_ATTR);
      } else {
        document.body.setAttribute(LOCK_ATTR, String(next));
      }
    };
  }, [locked]);
}
