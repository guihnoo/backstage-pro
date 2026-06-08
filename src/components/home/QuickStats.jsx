import { motion } from 'framer-motion';
import { hardNavigate } from '@/lib/hardNavigate';
import { NeonGlass } from '@/components/design/NeonGlass';
import { ChevronRight } from 'lucide-react';

const statConfigs = [
  { key: 'a_receber', label: 'A Receber', icon: '💰', route: '/reports', hint: 'Ver relatórios', format: (v) => `R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
  { key: 'eventos_count', label: 'Eventos este Mês', icon: '🎤', route: '/calendar', hint: 'Ver agenda', format: (v) => `${v} evento${v !== 1 ? 's' : ''}` },
  { key: 'clientes_ativos', label: 'Clientes Ativos', icon: '👥', route: '/clients', hint: 'Ver clientes', format: (v) => `${v} cliente${v !== 1 ? 's' : ''}` },
];

export default function QuickStats({ stats, isLoading, primaryHex = '#A64AFF', accentHex = '#FFB700' }) {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      {statConfigs.map((config, idx) => (
        <motion.div
          key={config.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => hardNavigate(config.route)}
          className="cursor-pointer"
        >
          <NeonGlass primary={primaryHex} accent={accentHex} className="p-5 relative">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{config.icon}</span>
              <ChevronRight className="w-4 h-4 text-[#4a5060] mt-1" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7c8494] mt-3 mb-2">{config.label}</p>
            {isLoading ? <div className="h-8 bg-[#1a1d27] rounded animate-pulse" /> : (
              <p className="text-2xl font-extrabold text-white" style={{ textShadow: `0 0 20px ${primaryHex}33` }}>{config.format(stats[config.key])}</p>
            )}
            <p className="text-[10px] text-[#4a5060] mt-1 font-mono">{config.hint} →</p>
          </NeonGlass>
        </motion.div>
      ))}
    </div>
  );
}
