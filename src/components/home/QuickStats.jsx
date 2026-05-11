import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const statConfigs = [
  {
    key: 'a_receber',
    label: 'A Receber',
    icon: '💰',
    color: 'amber',
    format: (v) => `R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
  },
  {
    key: 'eventos_count',
    label: 'Eventos este Mês',
    icon: '🎤',
    color: 'cyan',
    format: (v) => `${v} evento${v !== 1 ? 's' : ''}`
  },
  {
    key: 'clientes_ativos',
    label: 'Clientes Ativos',
    icon: '👥',
    color: 'violet',
    format: (v) => `${v} cliente${v !== 1 ? 's' : ''}`
  }
];

export default function QuickStats({ stats, isLoading }) {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      {statConfigs.map((config, idx) => (
        <motion.div
          key={config.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ y: -4 }}
          className={`p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm
            bg-gradient-to-br from-gray-900/50 to-gray-800/30
            hover:border-${config.color}-500/30 transition-all cursor-pointer
            group`}
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-3xl">{config.icon}</span>
            <TrendingUp className={`w-4 h-4 text-${config.color}-400 opacity-0 group-hover:opacity-100 transition-opacity`} />
          </div>

          <p className="text-sm text-gray-400 mb-2">{config.label}</p>

          {isLoading ? (
            <div className="h-8 bg-gray-800 rounded animate-pulse" />
          ) : (
            <motion.p
              key={stats[config.key]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-2xl font-black bg-gradient-to-r from-${config.color}-400 to-${config.color}-600 bg-clip-text text-transparent`}
            >
              {config.format(stats[config.key])}
            </motion.p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
