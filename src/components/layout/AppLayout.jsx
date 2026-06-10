import { Suspense, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { motion } from 'framer-motion';
import { Home, Calendar, Users, Receipt, BarChart2, Sparkles, Target } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { checkCompletedEventsForAutoHours } from '@/lib/checkCompletedEventsForAutoHours';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const navItems = [
  { to: '.', match: '/', label: 'Home', icon: Home, end: true },
  { to: 'calendar', match: '/calendar', label: 'Agenda', icon: Calendar },
  { to: 'clients', match: '/clients', label: 'Clientes', icon: Users },
  { to: 'goals', match: '/goals', label: 'Metas', icon: Target },
  { to: 'expenses', match: '/expenses', label: 'Despesas', icon: Receipt },
  { to: 'reports', match: '/reports', label: 'Relatório', icon: BarChart2 },
  { to: 'ai-mentor', match: '/ai-mentor', label: 'IA', icon: Sparkles },
];

function isNavActive(pathname, matchPath, end) {
  if (end) return pathname === matchPath;
  return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
}

export default function AppLayout() {
  const { profile, user } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const autoHoursChecked = useRef(false);
  const mainRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const userId = user?.id;
    if (!userId || autoHoursChecked.current) return;
    autoHoursChecked.current = true;
    checkCompletedEventsForAutoHours({ userId }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="h-full bg-[#050609] text-white flex flex-col overflow-hidden">
      <div className="fixed top-3 right-3 z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <NotificationCenter />
      </div>
      <main
        ref={mainRef}
        data-app-scroll
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Suspense fallback={<LoadingSpinner fullScreen text="Carregando..." />}>
          <Outlet key={location.pathname} />
        </Suspense>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="absolute inset-0 bg-[#050609]/95 backdrop-blur-xl border-t border-[#23262f]" />
        <motion.div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 10%, ${config.primaryHex}50 50%, transparent 90%)` }} />
        <div className="relative z-10 flex items-stretch justify-around px-0.5 max-w-2xl mx-auto">
          {navItems.map(({ to, match, label, icon: Icon, end }) => {
            const active = isNavActive(location.pathname, match, end);
            return (
              <Link
                key={match}
                to={to}
                end={end}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="flex-1 flex justify-center min-h-[56px] min-w-0 bg-transparent border-0 p-0 cursor-pointer no-underline relative"
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full"
                    style={{ background: config.primaryHex, boxShadow: `0 0 8px ${config.primaryHex}` }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-0.5 py-3 px-0.5 w-full min-w-0">
                  <Icon className="w-[18px] h-[18px] shrink-0 transition-transform" style={{ color: active ? config.primaryHex : '#5f6678', transform: active ? 'translateY(-1px)' : 'none' }} />
                  <span className="text-[8px] font-mono uppercase leading-none truncate max-w-full transition-colors" style={{ color: active ? config.primaryHex : '#5f6678' }}>{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
