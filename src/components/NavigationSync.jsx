import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Se a URL do browser divergir do estado do React Router, força reload para a URL correta.
 * Cobre navegação via FAB/deep links que atualizam a URL sem re-renderizar o Outlet.
 */
export default function NavigationSync() {
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    const reconcile = () => {
      const browser = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const router = `${locationRef.current.pathname}${locationRef.current.search}${locationRef.current.hash}`;
      if (browser !== router) {
        window.location.replace(browser);
      }
    };

    window.addEventListener('bp:history', reconcile);
    window.addEventListener('popstate', reconcile);
    return () => {
      window.removeEventListener('bp:history', reconcile);
      window.removeEventListener('popstate', reconcile);
    };
  }, []);

  return null;
}
