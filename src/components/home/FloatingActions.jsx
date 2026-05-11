import { motion } from 'framer-motion';
import { Plus, Calendar, Clock, DollarSign } from 'lucide-react';
import { useState } from 'react';

export default function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: 'event',
      icon: Calendar,
      label: '+ Evento',
      color: 'bg-cyan-600 hover:bg-cyan-700',
      tooltip: 'Novo evento'
    },
    {
      id: 'hours',
      icon: Clock,
      label: '+ Horas',
      color: 'bg-violet-600 hover:bg-violet-700',
      tooltip: 'Registrar horas'
    },
    {
      id: 'expense',
      icon: DollarSign,
      label: '+ Despesa',
      color: 'bg-amber-600 hover:bg-amber-700',
      tooltip: 'Nova despesa'
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Menu expandido */}
      <motion.div
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-20 right-0 space-y-3 mb-4"
      >
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{
                opacity: isOpen ? 1 : 0,
                scale: isOpen ? 1 : 0.8,
                x: isOpen ? 0 : 20
              }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg transition-all`}
              title={action.tooltip}
            >
              <Icon className="w-6 h-6" />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Botão principal */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Plus className="w-7 h-7" />
        </motion.div>
      </motion.button>
    </div>
  );
}
