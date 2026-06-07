import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Abre fluxos via ?action= sem useSearchParams (evita suspend infinito em rotas lazy).
 * Limpa a query com history.replaceState — navigate() remontava rotas lazy e travava o Suspense.
 */
export function useQueryAction(actionKey, onMatch) {
  const location = useLocation();
  const onMatchRef = useRef(onMatch);
  const handledRef = useRef(false);
  onMatchRef.current = onMatch;

  useEffect(() => {
    handledRef.current = false;
  }, [location.search, location.pathname, actionKey]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') !== actionKey || handledRef.current) return;

    handledRef.current = true;
    onMatchRef.current();
    window.history.replaceState(window.history.state, '', location.pathname);
  }, [location.search, location.pathname, actionKey]);
}
