import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** OAuth pode cair em /?code=... se o redirect no Supabase estiver na raiz — normaliza para /auth/callback. */
export default function OAuthUrlGuard() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/auth/callback') return;

    const params = new URLSearchParams(location.search);
    const hasOAuthParams =
      params.has('code') || params.has('error') || params.has('error_description');

    if (hasOAuthParams) {
      window.location.replace(`/auth/callback${location.search}${location.hash}`);
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
}
