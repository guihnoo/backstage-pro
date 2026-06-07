import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Abre fluxos via ?action= sem useSearchParams (evita suspend infinito em rotas lazy).
 */
export function useQueryAction(actionKey, onMatch) {
  const location = useLocation();
  const navigate = useNavigate();
  const onMatchRef = useRef(onMatch);
  onMatchRef.current = onMatch;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') !== actionKey) return;
    onMatchRef.current();
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, actionKey, navigate]);
}
