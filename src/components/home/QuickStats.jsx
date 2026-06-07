import { motion } from 'framer-motion';
import { NeonGlass } from '@/components/design/NeonGlass';

const statConfigs = [
  { key: 'a_receber', label: 'A Receber', icon: '💰', format: (v) => `R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
  { key: 'eventos_count', label: 'Eventos este Mês', icon: '🎤', format: (v) => `${v} evento${v !== 1 ? 's' : ''}` },
  { key: 'clientes_ativos', label: 'Clientes Ativos', icon: '👥', format: (v) => `${v} cliente${v !== 1 ? 's' : ''}` },
];

export default function QuickStats({ stats, isLoading, primaryHex = '#A64AFF', accentHex = '#FFB700' }) {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      {statConfigs.map((config, idx) => (
        <motion.div key={config.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -4 }}>
          <NeonGlass primary={primaryHex} accent={accentHex} className="p-5">
            <span className="text-2xl">{config.icon}</span>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7c8494] mt-3 mb-2">{config.label}</p>
            {isLoading ? <div className="h-8 bg-[#1a1d27] rounded animate-pulse" /> : (
              <p className="text-2xl font-extrabold text-white" style={{ textShadow: `0 0 20px ${primaryHex}33` }}>{config.format(stats[config.key])}</p>
            )}
          </NeonGlass>
        </motion.div>
      ))}
    </div>
  );
}
