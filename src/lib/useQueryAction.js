import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Abre fluxos via ?action= sem useSearchParams.
 * Limpa a query com replaceState para manter a URL sem remount da rota.
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
    window.history.replaceState({}, '', location.pathname);
  }, [location.search, location.pathname, actionKey]);
}
