import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  Users, 
  Receipt, 
  BarChart2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: Calendar, label: 'Agenda', to: createPageUrl('Calendar') },
  { icon: Users, label: 'Clientes', to: createPageUrl('Clients') },
  { icon: Home, label: 'Home', to: createPageUrl('Dashboard'), center: true },
  { icon: Receipt, label: 'Despesas', to: createPageUrl('Expenses') },
  { icon: BarChart2, label: 'Relatórios', to: createPageUrl('Reports') }
];

export default function MobileNavigation({ onQuickAction }) {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-2 pb-safe z-50 md:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          
          if (item.center) {
            return (
              <motion.div key="center" className="relative">
                <Button
                  onClick={onQuickAction}
                  className="w-14 h-14 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-900 shadow-lg"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </motion.div>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-cyan-300'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}