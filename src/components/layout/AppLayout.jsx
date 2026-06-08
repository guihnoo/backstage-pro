import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, Users, User, Receipt, BarChart2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { checkCompletedEventsForAutoHours } from '@/lib/checkCompletedEventsForAutoHours';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/calendar', label: 'Agenda', icon: Calendar },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/expenses', label: 'Despesas', icon: Receipt },
  { path: '/reports', label: 'Relatório', icon: BarChart2 },
  { path: '/profile', label: 'Perfil', icon: User },
];

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

  // Reseta o scroll do container ao mudar de rota
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#050609] text-white flex flex-col">
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 min-h-0"><Outlet /></main>
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-[#050609]/95 backdrop-blur-xl border-t border-[#23262f]" />
        <motion.div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 10%, ${config.primaryHex}50 50%, transparent 90%)` }} />
        <div className="relative z-10 flex items-stretch justify-around px-1 max-w-2xl mx-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className="flex-1 flex justify-center">
              {({ isActive }) => (
                <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-0.5 py-3 px-1 w-full">
                  <Icon className="w-5 h-5" style={{ color: isActive ? config.primaryHex : '#5f6678' }} />
                  <span className="text-[9px] font-mono uppercase leading-none truncate max-w-full" style={{ color: isActive ? config.primaryHex : '#5f6678' }}>{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
