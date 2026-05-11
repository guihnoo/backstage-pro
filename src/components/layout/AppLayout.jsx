import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, Users, Target, User } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';

const navItems = [
  { path: '/',          label: 'Home',      icon: Home },
  { path: '/calendar',  label: 'Agenda',    icon: Calendar },
  { path: '/clients',   label: 'Clientes',  icon: Users },
  { path: '/goals',     label: 'Metas',     icon: Target },
  { path: '/profile',   label: 'Perfil',    icon: User },
];

export default function AppLayout() {
  const { profile } = useAuth();
  const categoryId = profile?.category || 'audio';
  const config = getCategoryConfig(categoryId);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        {/* Blur backdrop */}
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800/60" />

        {/* Linha neon na categoria */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${config.primaryHex}50 50%, transparent 90%)` }}
        />

        <div className="relative z-10 flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className="flex-1"
            >
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="flex flex-col items-center gap-1 py-1 rounded-xl transition-all"
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-full blur-sm"
                        style={{ background: `${config.primaryHex}30` }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive ? 'bg-gray-800' : 'bg-transparent'
                      }`}
                      style={isActive ? {
                        border: `1px solid ${config.primaryHex}40`,
                        boxShadow: `0 0 12px ${config.primaryHex}25`
                      } : {}}
                    >
                      <Icon
                        className="w-5 h-5 transition-all"
                        style={{ color: isActive ? config.primaryHex : '#6b7280' }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-semibold transition-all"
                    style={{ color: isActive ? config.primaryHex : '#6b7280' }}
                  >
                    {label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
