import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import RouteSkeleton from '@/components/layout/RouteSkeleton';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Home, Calendar, CircleDollarSign, MoreHorizontal, Plus, Users, Receipt, Target, Sparkles, MapPin, UserCircle, X } from 'lucide-react';
import { useProfile } from '@/lib/profileOfflineContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import AppTopBar, { getAppTopBarOffset } from '@/components/layout/AppTopBar';
import OfflineBanner from '@/components/layout/OfflineBanner';
import { prefetchRoute, prefetchCriticalRoutes } from '@/lib/routePrefetch';
import AppTour from '@/components/tour/AppTour';
import { FloatingTimer } from '@/components/timer/FloatingTimer';
import { haptics } from '@/lib/haptics';
import { useUnstickBody } from '@/lib/useUnstickBody';

// Visual "All Access": preto, amarelo de credencial e rosa de alerta.
const AA_YELLOW = '#ffd400';
const AA_MUTED = '#a8a8a8';

// Barra de baixo: Início · Agenda · ➕ · Dinheiro · Mais
const leftNavItems = [
  { to: '.', match: '/', label: 'Início', icon: Home, end: true },
  { to: 'calendar', match: '/calendar', label: 'Agenda', icon: Calendar, tour: 'nav-calendar' },
];
const rightNavItems = [
  { to: 'reports', match: '/reports', label: 'Dinheiro', icon: CircleDollarSign, tour: 'nav-reports' },
];

// Itens do "Mais"
const secondaryNavItems = [
  { to: { pathname: '/reports', hash: '#mapa' }, match: '/reports#mapa', label: 'Mapa', icon: MapPin, prefetch: '/reports' },
  { to: '/clients', match: '/clients', label: 'Clientes', icon: Users },
  { to: '/expenses', match: '/expenses', label: 'Despesas', icon: Receipt },
  { to: '/goals', match: '/goals', label: 'Metas', icon: Target },
  { to: '/ai-mentor', match: '/ai-mentor', label: 'Mentor', icon: Sparkles },
  { to: '/profile', match: '/profile', label: 'Perfil', icon: UserCircle },
];

function isNavActive(pathname, matchPath, end) {
  if (end) return pathname === matchPath;
  return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
}

function NavTab({ to, match, label, icon: Icon, end, tour, active }) {
  return (
    <Link
      to={to}
      end={end}
      data-tour={tour}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onPointerEnter={() => prefetchRoute(match)}
      onTouchStart={() => prefetchRoute(match)}
      onFocus={() => prefetchRoute(match)}
      onClick={() => !active && haptics.light()}
      className="flex-1 flex justify-center min-h-[60px] min-w-0 bg-transparent border-0 p-0 cursor-pointer no-underline relative"
    >
      {active && (
        <span aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-b-full" style={{ background: AA_YELLOW }} />
      )}
      <span className="flex flex-col items-center justify-center gap-1 py-2 w-full min-w-0 active:scale-90 transition-transform">
        <Icon className="w-[22px] h-[22px] shrink-0" strokeWidth={2} style={{ color: active ? AA_YELLOW : AA_MUTED }} />
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.08em] leading-none truncate max-w-full"
          style={{ color: active ? AA_YELLOW : AA_MUTED }}
        >
          {label}
        </span>
      </span>
    </Link>
  );
}

export default function AppLayout() {
  useUnstickBody(); // destrava a tela se uma janela fechar e deixar o app sem toque
  const profile = useProfile();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const mainRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // As 12 h automáticas não rodam mais sozinhas ao abrir o app (auditoria 1B):
  // o usuário aplica pelo botão "12h" do evento, e só os dias sem registro são preenchidos.
  // Enquanto isso, dia sem registro já conta a diária no valor do evento (eventFinance).

  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);

  // Na primeira abertura a página já começa no topo: rolar aqui obrigaria o celular
  // a medir a tela inteira no meio do desenho (~0,6 s com CPU lenta).
  const firstPathRef = useRef(true);
  useEffect(() => {
    if (firstPathRef.current) {
      firstPathRef.current = false;
      return;
    }
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    setShowMoreSheet(false);
    // Evita scroll travado se algum modal/sheet não limpou o lock
    document.body.removeAttribute('data-scroll-lock');
  }, [location.pathname]);

  const themeVars = {
    '--bp-primary': config.primaryHex,
    '--bp-accent': config.accentHex,
    '--bp-glow': config.bgGlow,
    '--bp-muted': '#8a91a1',
  };

  const moreActive = secondaryNavItems.some(({ match }) => !match.includes('#') && isNavActive(location.pathname, match, false));

  const openNewEvent = () => {
    haptics.light();
    setShowMoreSheet(false);
    // O ➕ abre "Novo trabalho" na Agenda; o "t" garante que abre de novo a cada toque.
    navigate(`/calendar?action=new-event&t=${Date.now()}`);
  };

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: 'easeOut' }}>
    <div
      className="h-full bg-[#050609] text-white flex flex-col overflow-hidden"
      style={themeVars}
    >
      <AppTour />
      <AppTopBar />
      <OfflineBanner />
      <main
        ref={mainRef}
        data-app-scroll
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y"
        style={{
          paddingTop: getAppTopBarOffset(),
          paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Suspense fallback={<RouteSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <nav
        data-tour="bottom-nav"
        aria-label="Navegação principal"
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="absolute inset-0 bg-[#0a0a0a] border-t border-[#222222]" />
        <div className="relative z-10 flex items-center justify-around px-1 max-w-2xl mx-auto">
          {leftNavItems.map((item) => (
            <NavTab key={item.match} {...item} active={isNavActive(location.pathname, item.match, item.end)} />
          ))}

          {/* ➕ Novo trabalho */}
          <div className="flex-1 flex justify-center min-w-0">
            <button
              type="button"
              aria-label="Novo trabalho"
              data-tour="nav-new-event"
              onClick={openNewEvent}
              className="w-[58px] h-[58px] -mt-3 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: AA_YELLOW, color: '#0a0a0a', boxShadow: '0 6px 18px rgba(255,212,0,0.25)' }}
            >
              <Plus className="w-7 h-7" strokeWidth={2.8} />
            </button>
          </div>

          {rightNavItems.map((item) => (
            <NavTab key={item.match} {...item} active={isNavActive(location.pathname, item.match, item.end)} />
          ))}

          {/* Mais */}
          <button
            type="button"
            aria-label="Mais opções"
            aria-expanded={showMoreSheet}
            onClick={() => { haptics.light(); setShowMoreSheet(v => !v); }}
            className="flex-1 flex justify-center min-h-[60px] min-w-0 bg-transparent border-0 p-0 cursor-pointer relative"
          >
            {moreActive && (
              <span aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-b-full" style={{ background: AA_YELLOW }} />
            )}
            <span className="flex flex-col items-center justify-center gap-1 py-2 w-full min-w-0 active:scale-90 transition-transform">
              <MoreHorizontal className="w-[22px] h-[22px] shrink-0" style={{ color: moreActive || showMoreSheet ? AA_YELLOW : AA_MUTED }} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] leading-none" style={{ color: moreActive || showMoreSheet ? AA_YELLOW : AA_MUTED }}>
                Mais
              </span>
            </span>
          </button>
        </div>
      </nav>

      {/* Gaveta "Mais" */}
      <AnimatePresence>
        {showMoreSheet && (
          <>
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[89]"
              onClick={() => setShowMoreSheet(false)}
            />
            <motion.div
              key="more-sheet"
              role="dialog"
              aria-label="Mais opções"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[90] bg-[#121212] rounded-t-3xl"
              style={{ borderTop: `3px solid ${AA_YELLOW}`, paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 max-w-2xl mx-auto">
                <span className="font-poster text-3xl leading-none tracking-wide text-white">MAIS</span>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setShowMoreSheet(false)}
                  className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 pb-4 max-w-2xl mx-auto">
                {secondaryNavItems.map(({ to, match, label, icon: Icon, prefetch }) => {
                  const active = !match.includes('#') && isNavActive(location.pathname, match, false);
                  return (
                    <button
                      key={match}
                      type="button"
                      onClick={() => { navigate(to); setShowMoreSheet(false); }}
                      onPointerEnter={() => prefetchRoute(prefetch || match)}
                      className="flex flex-col items-center justify-center gap-2 h-[84px] rounded-2xl transition-transform active:scale-95"
                      style={{ background: active ? AA_YELLOW : '#1c1c1c', color: active ? '#0a0a0a' : '#ffffff' }}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] leading-none">{label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FloatingTimer />
    </div>
    </MotionConfig>
  );
}
