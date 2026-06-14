import { motion } from 'framer-motion';
import { hardNavigate } from '@/lib/hardNavigate';
import { NeonGlass } from '@/components/design/NeonGlass';
import { ChevronRight } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import AnimatedStatValue from '@/components/home/AnimatedStatValue';
import StatValuePulse from '@/components/home/StatValuePulse';

import { AUTH_HERO_PRIMARY, AUTH_HERO_ACCENT } from '@/lib/categoryGear';

const statConfigs = [
  { key: 'faturamento_pago', label: 'Recebido', icon: '✅', route: '/reports', hint: 'Ver relatórios', financial: true },
  { key: 'a_receber', label: 'A Receber', icon: '💰', route: '/reports', hint: 'Ver relatórios', financial: true },
  { key: 'horas_trabalhadas', label: 'Horas no Mês', icon: '⏱️', route: '/reports', hint: 'Ver relatórios', format: (v) => `${Number(v).toFixed(1)}h` },
  { key: 'diarias_count', label: 'Diárias no Mês', icon: '📅', route: '/goals', hint: 'Ver metas', format: (v) => `${v} dia${v !== 1 ? 's' : ''}` },
];

export default function QuickStats({ stats, isLoading, primaryHex = AUTH_HERO_PRIMARY, accentHex = AUTH_HERO_ACCENT }) {
  const { formatCurrency } = useFinancialVisibility();

  return (
    <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
      {statConfigs.map((config, idx) => {
        const value = stats[config.key] ?? 0;
        const displayFormat = config.financial
          ? (v) => formatCurrency(v)
          : config.format;

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
              {isLoading ? (
                <div className="h-6 bg-[#1a1d27] rounded animate-pulse" />
              ) : (
                <StatValuePulse value={value} glowColor={primaryHex}>
                  <AnimatedStatValue
                    value={value}
                    format={displayFormat}
                    className="text-lg font-extrabold text-white leading-tight block"
                    style={{ textShadow: `0 0 20px ${primaryHex}33` }}
                  />
                </StatValuePulse>
              )}
              <p className="text-[9px] text-[#4a5060] mt-1 font-mono">{config.hint} →</p>
            </NeonGlass>
          </motion.div>
        );
      })}
    </div>
  );
}
