import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, Users, Target, User } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/calendar', label: 'Agenda', icon: Calendar },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/profile', label: 'Perfil', icon: User },
];

export default function AppLayout() {
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  return (
    <div className="min-h-screen bg-[#050609] text-white flex flex-col">
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-[#050609]/92 backdrop-blur-xl border-t border-[#23262f]" />
        <motion.div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 10%, ${config.primaryHex}50 50%, transparent 90%)` }} />
        <div className="relative z-10 flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className="flex-1">
              {({ isActive }) => (
                <motion.div whileTap={{ scale: 0.88 }} className="relative flex flex-col items-center gap-1 py-1">
                  <Icon className="w-5 h-5" style={{ color: isActive ? config.primaryHex : '#5f6678' }} />
                  <span className="text-[10px] font-mono uppercase" style={{ color: isActive ? config.primaryHex : '#5f6678' }}>{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
