const routeLoaders = {
  '/': () => import('@/pages/Home.jsx'),
  '/calendar': () => import('@/pages/Calendar.jsx'),
  '/clients': () => import('@/pages/Clients.jsx'),
  '/goals': () => import('@/pages/Goals.jsx'),
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
  const run = () => {
    ['/', '/calendar', '/reports', '/clients'].forEach(prefetchRoute);
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 800);
  }
}
