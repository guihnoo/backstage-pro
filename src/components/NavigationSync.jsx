import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { registerAppNavigate } from '@/lib/appNavigate';

/**
 * Mantém hardNavigate e deep links alinhados ao React Router sem full reload.
 */
export default function NavigationSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    registerAppNavigate(navigate);
    return () => registerAppNavigate(null);
  }, [navigate]);

  useEffect(() => {
    const onPopState = () => {
      const browser = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const router = `${locationRef.current.pathname}${locationRef.current.search}${locationRef.current.hash}`;
      if (browser !== router) {
        navigate(browser, { replace: true });
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigate]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onMessage = (event) => {
      const url = event.data?.url;
      if (event.data?.type === 'backstage-navigate' && typeof url === 'string') {
        navigate(url);
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [navigate]);

  return null;
}
