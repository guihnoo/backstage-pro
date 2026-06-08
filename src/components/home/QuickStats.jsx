import { motion } from 'framer-motion';
import { hardNavigate } from '@/lib/hardNavigate';
import { NeonGlass } from '@/components/design/NeonGlass';
import { ChevronRight } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

const statConfigs = [
  { key: 'faturamento_pago', label: 'Recebido', icon: '✅', route: '/reports', hint: 'Ver relatórios', financial: true },
  { key: 'a_receber', label: 'A Receber', icon: '💰', route: '/reports', hint: 'Ver relatórios', financial: true },
  { key: 'eventos_count', label: 'Shows este Mês', icon: '🎤', route: '/calendar', hint: 'Ver agenda', format: (v) => `${v} show${v !== 1 ? 's' : ''}` },
  { key: 'clientes_ativos', label: 'Clientes Ativos', icon: '👥', route: '/clients', hint: 'Ver clientes', format: (v) => `${v} cliente${v !== 1 ? 's' : ''}` },
];

export default function QuickStats({ stats, isLoading, primaryHex = '#A64AFF', accentHex = '#FFB700' }) {
  const { formatCurrency } = useFinancialVisibility();

  return (
    <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
      {statConfigs.map((config, idx) => {
        const value = stats[config.key] ?? 0;
        const display = config.financial ? formatCurrency(value) : config.format(value);
        return (
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
            <NeonGlass primary={primaryHex} accent={accentHex} className="p-4 relative">
              <div className="flex items-start justify-between">
                <span className="text-xl">{config.icon}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#4a5060] mt-0.5" />
              </div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-[#7c8494] mt-2 mb-1">{config.label}</p>
              {isLoading ? <div className="h-6 bg-[#1a1d27] rounded animate-pulse" /> : (
                <p className="text-lg font-extrabold text-white leading-tight" style={{ textShadow: `0 0 20px ${primaryHex}33` }}>{display}</p>
              )}
              <p className="text-[9px] text-[#4a5060] mt-1 font-mono">{config.hint} →</p>
            </NeonGlass>
          </motion.div>
        );
      })}
    </div>
  );
}
