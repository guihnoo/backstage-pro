import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Users, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';

export function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  const actions = [
    {
      id: 'event',
      icon: Calendar,
      label: 'Novo evento',
      style: { backgroundColor: config.primaryHex },
      to: '/calendar?action=new-event',
    },
    {
      id: 'client',
      icon: Users,
      label: 'Novo cliente',
      style: { backgroundColor: '#7c3aed' },
      to: '/clients?action=new-client',
    },
    {
      id: 'expense',
      icon: DollarSign,
      label: 'Nova despesa',
      style: { backgroundColor: config.accentHex, color: '#050609' },
      to: '/expenses?action=new',
    },
  ];

  const handleAction = (to) => {
    setIsOpen(false);
    hardNavigate(to);
  };

  return (
    <div
      data-tour="fab-actions"
      className="fixed right-5 z-40"
      style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-20 right-0 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isOpen &&
            actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.85 }}
                  transition={{ duration: 0.18, delay: idx * 0.06 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleAction(action.to)}
                  aria-label={action.label}
                  style={action.style}
                  className="flex items-center gap-2.5 px-4 h-11 rounded-full text-white text-sm font-semibold shadow-lg"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{action.label}</span>
                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Fechar menu de ações' : 'Abrir menu de ações'}
        aria-expanded={isOpen}
        className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl transition-shadow"
        style={{
          background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`,
          boxShadow: `0 8px 32px ${config.primaryHex}55`,
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}

export default FloatingActions;
