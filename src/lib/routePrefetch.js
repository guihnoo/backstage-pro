const routeLoaders = {
  '/': () => import('@/pages/Home.jsx'),
  '/calendar': () => import('@/pages/Calendar.jsx'),
  '/clients': () => import('@/pages/Clients.jsx'),
  '/goals': () => import('@/pages/Goals.jsx'),
  '/mapa': () => import('@/pages/Mapa.jsx'),
  '/expenses': () => import('@/pages/Expenses.jsx'),
  '/reports': () => import('@/pages/Reports.jsx'),
  '/profile': () => import('@/pages/ProfileSimple.jsx'),
  '/ai-mentor': () => import('@/pages/AI_Mentor.jsx'),
};

const prefetched = new Set();

export function prefetchRoute(matchPath) {
  const loader = routeLoaders[matchPath];
  if (!loader || prefetched.has(matchPath)) return;
  prefetched.add(matchPath);
  loader().catch(() => prefetched.delete(matchPath));
}

/** Pré-carrega rotas principais após login — reduz tela em branco na 1ª navegação. */
export function prefetchCriticalRoutes() {
  if (typeof window === 'undefined') return;
  // Em rede lenta ou com economia de dados, não pré-carrega nada: a banda vai para os
  // dados da tela atual. As outras telas carregam ao tocar no menu (prefetchRoute no toque).
  const conn = navigator.connection;
  if (conn?.saveData || /(^|-)2g$|3g/.test(conn?.effectiveType || '')) return;
  // Só a Agenda (tela mais usada) e só depois que a tela atual já carregou.
  const run = () => prefetchRoute('/calendar');
  const later = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 6000 });
    else window.setTimeout(run, 1500);
  };
  window.setTimeout(later, 3000);
}
