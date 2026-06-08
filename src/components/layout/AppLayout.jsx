import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, Users, Receipt, BarChart2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { checkCompletedEventsForAutoHours } from '@/lib/checkCompletedEventsForAutoHours';
import { generateUserNotifications } from '@/lib/generateNotifications';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const navItems = [
  { path: '/', label: 'Home', icon: Home, end: true },
  { path: '/calendar', label: 'Agenda', icon: Calendar },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/expenses', label: 'Despesas', icon: Receipt },
  { path: '/reports', label: 'Relatório', icon: BarChart2 },
  { path: '/ai-mentor', label: 'IA', icon: Sparkles },
];

function isNavActive(pathname, itemPath, end) {
  if (end) return pathname === itemPath;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function AppLayout() {
  const { profile, user } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const autoHoursChecked = useRef(false);
  const mainRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__testNavigate = (path) => navigate(path);
    }
  }, [navigate]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId || autoHoursChecked.current) return;
    autoHoursChecked.current = true;
    checkCompletedEventsForAutoHours({ userId }).catch(() => {});
    generateUserNotifications(userId).catch(() => {});
  }, [user?.id]);

  // Reseta o scroll do container ao mudar de rota
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="h-full bg-[#050609] text-white flex flex-col overflow-hidden" data-router-path={location.pathname}>
      {/* Notificações — fixo no canto superior direito */}
      <div className="fixed top-3 right-3 z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <NotificationCenter />
      </div>
      <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        <Outlet key={location.pathname} />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="absolute inset-0 bg-[#050609]/95 backdrop-blur-xl border-t border-[#23262f]" />
        <motion.div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 10%, ${config.primaryHex}50 50%, transparent 90%)` }} />
        <div className="relative z-10 flex items-stretch justify-around px-1 max-w-2xl mx-auto">
          {navItems.map(({ path, label, icon: Icon, end }) => {
            const active = isNavActive(location.pathname, path, end);
            return (
              <NavLink
                key={path}
                to={path}
                end={end}
                aria-label={label}
                className="flex-1 flex justify-center min-h-[56px] bg-transparent border-0 p-0 cursor-pointer no-underline"
              >
                <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-0.5 py-3 px-1 w-full">
                  <Icon className="w-5 h-5" style={{ color: active ? config.primaryHex : '#5f6678' }} />
                  <span className="text-[9px] font-mono uppercase leading-none truncate max-w-full" style={{ color: active ? config.primaryHex : '#5f6678' }}>{label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
