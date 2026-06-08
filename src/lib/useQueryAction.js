import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Abre fluxos via ?action= sem useSearchParams.
 * Limpa a query com navigate(replace) para manter o React Router sincronizado com a URL.
 */
export function useQueryAction(actionKey, onMatch) {
  const location = useLocation();
  const navigate = useNavigate();
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
    navigate({ pathname: location.pathname, search: '' }, { replace: true });
  }, [location.search, location.pathname, actionKey, navigate]);
}
