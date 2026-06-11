/** Prefetch de chunks lazy alinhados a routes.jsx (touch/hover na bottom nav). */
const prefetchers = {
  '/': () => import('@/pages/Home'),
  '/calendar': () => import('@/pages/Calendar'),
  '/clients': () => import('@/pages/Clients'),
  '/goals': () => import('@/pages/Goals'),
  '/expenses': () => import('@/pages/Expenses'),
  '/reports': () => import('@/pages/Reports.jsx'),
  '/profile': () => import('@/pages/ProfileSimple'),
  '/ai-mentor': () => import('@/pages/AI_Mentor'),
};

const started = new Set();

export function prefetchRoute(matchPath) {
  const load = prefetchers[matchPath];
  if (!load || started.has(matchPath)) return;
  started.add(matchPath);
  load().catch(() => {
    started.delete(matchPath);
  });
}
