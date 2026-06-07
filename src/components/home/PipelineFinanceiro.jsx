import { motion } from 'framer-motion';
import { NeonGlass } from '@/components/design/NeonGlass';

export default function PipelineFinanceiro({ stats, isLoading, primaryHex = '#A64AFF', accentHex = '#FFB700' }) {
  const total = stats.faturamento_pago + stats.a_receber;
  const percentualPago = total > 0 ? (stats.faturamento_pago / total) * 100 : 0;
  const percentualPendente = total > 0 ? (stats.a_receber / total) * 100 : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <NeonGlass primary={primaryHex} accent={accentHex} glow className="p-5">
        <h3 className="text-lg font-bold mb-4">Dinheiro nos Trilhos</h3>
        {isLoading ? <div className="h-8 bg-[#1a1d27] rounded animate-pulse" /> : (
          <div className="space-y-3">
            <div className="flex gap-2 h-10 rounded-lg overflow-hidden bg-[#0c0e14]/80 p-1 border border-[#23262f]">
              {percentualPago > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${percentualPago}%` }} className="rounded flex items-center justify-center text-xs font-bold text-[#06070a]" style={{ background: `linear-gradient(90deg, ${primaryHex}, ${primaryHex}cc)` }}>{percentualPago > 10 && `${percentualPago.toFixed(0)}%`}</motion.div>}
              {percentualPendente > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${percentualPendente}%` }} transition={{ delay: 0.2 }} className="rounded flex items-center justify-center text-xs font-bold text-[#06070a]" style={{ background: `linear-gradient(90deg, ${accentHex}, ${accentHex}cc)` }}>{percentualPendente > 10 && `${percentualPendente.toFixed(0)}%`}</motion.div>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: primaryHex }} /><div><p className="text-[#7c8494] text-xs font-mono uppercase">Recebido</p><p className="font-bold">R${stats.faturamento_pago.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p></div></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: accentHex }} /><div><p className="text-[#7c8494] text-xs font-mono uppercase">A Receber</p><p className="font-bold">R${stats.a_receber.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p></div></div>
            </div>
          </div>
        )}
        <div className="pt-4 mt-4 border-t border-[#23262f]">
          <p className="text-[#7c8494] text-xs font-mono uppercase mb-2">Total Pipeline</p>
          <p className="text-3xl font-extrabold" style={{ background: `linear-gradient(90deg, ${primaryHex}, ${accentHex})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>R${total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
        </div>
      </NeonGlass>
    </motion.div>
  );
}
