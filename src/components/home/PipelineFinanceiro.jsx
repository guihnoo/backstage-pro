import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NeonGlass } from '@/components/design/NeonGlass';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

export default function PipelineFinanceiro({ stats, isLoading, primaryHex = '#A64AFF', accentHex = '#FFB700' }) {
  const navigate = useNavigate();
  const { formatCurrency } = useFinancialVisibility();
  const total = stats.faturamento_pago + stats.a_receber;
  const percentualPago = total > 0 ? (stats.faturamento_pago / total) * 100 : 0;
  const percentualPendente = total > 0 ? (stats.a_receber / total) * 100 : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <NeonGlass primary={primaryHex} accent={accentHex} glow className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Dinheiro nos Trilhos</h3>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="text-xs text-[#7c8494] hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            Ver relatório
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {isLoading ? <div className="h-8 bg-[#1a1d27] rounded animate-pulse" /> : (
          <div className="space-y-3">
            <div className="flex gap-2 h-10 rounded-lg overflow-hidden bg-[#0c0e14]/80 p-1 border border-[#23262f]">
              {percentualPago > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${percentualPago}%` }} className="rounded flex items-center justify-center text-xs font-bold text-[#06070a]" style={{ background: `linear-gradient(90deg, ${primaryHex}, ${primaryHex}cc)` }}>{percentualPago > 10 && `${percentualPago.toFixed(0)}%`}</motion.div>}
              {percentualPendente > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${percentualPendente}%` }} transition={{ delay: 0.2 }} className="rounded flex items-center justify-center text-xs font-bold text-[#06070a]" style={{ background: `linear-gradient(90deg, ${accentHex}, ${accentHex}cc)` }}>{percentualPendente > 10 && `${percentualPendente.toFixed(0)}%`}</motion.div>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/reports')}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-left"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: primaryHex }} />
                <div>
                  <p className="text-[#7c8494] text-xs font-mono uppercase">Recebido</p>
                  <p className="font-bold">{formatCurrency(stats.faturamento_pago)}</p>
                </div>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/reports')}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-left"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: accentHex }} />
                <div>
                  <p className="text-[#7c8494] text-xs font-mono uppercase">A Receber</p>
                  <p className="font-bold">{formatCurrency(stats.a_receber)}</p>
                </div>
              </motion.button>
            </div>
          </div>
        )}
        <div className="pt-4 mt-4 border-t border-[#23262f]">
          <p className="text-[#7c8494] text-xs font-mono uppercase mb-2">Total Pipeline</p>
          <p className="text-3xl font-extrabold" style={{ background: `linear-gradient(90deg, ${primaryHex}, ${accentHex})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{formatCurrency(total)}</p>
        </div>
      </NeonGlass>
    </motion.div>
  );
}
