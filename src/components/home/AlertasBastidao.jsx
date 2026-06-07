import { motion } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import { NeonGlass } from '@/components/design/NeonGlass';

export default function AlertasBastidao({ alerts, isLoading, primaryHex = '#A64AFF', accentHex = '#FFB700' }) {
  if (isLoading) return <NeonGlass primary={primaryHex} className="mb-8 p-5"><div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 bg-[#1a1d27] rounded animate-pulse" />)}</div></NeonGlass>;
  if (!alerts?.length) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
      <NeonGlass primary={primaryHex} accent={accentHex} className="p-5">
        <div className="flex items-center gap-3"><span className="text-2xl">✓</span><div><p className="font-semibold" style={{ color: accentHex }}>Tudo em dia!</p><p className="text-sm text-[#8a91a1] font-mono">Nenhum pagamento atrasado.</p></div></div>
      </NeonGlass>
    </motion.div>
  );
  const overdue = alerts.filter((a) => a.type === 'overdue');
  const pending = alerts.filter((a) => a.type === 'pending');
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-3">
      <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5" style={{ color: accentHex }} /><h3 className="text-lg font-bold">Alertas do Bastidão</h3><span className="ml-auto text-xs px-2 py-1 rounded-full font-mono" style={{ background: `${accentHex}33`, color: accentHex }}>{alerts.length}</span></div>
      {overdue.map((alert, idx) => (
        <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-4 rounded-xl border border-red-500/30 bg-red-600/10">
          <div className="flex items-start gap-3"><span>🚨</span><div className="flex-1"><p className="font-semibold text-red-300 text-sm">{alert.title}</p><p className="text-xs text-red-400/80 mt-1">{alert.description}</p></div><Clock className="w-4 h-4 text-red-400" /></div>
        </motion.div>
      ))}
      {pending.map((alert, idx) => (
        <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (overdue.length + idx) * 0.05 }} className="p-4 rounded-xl border" style={{ borderColor: `${accentHex}44`, background: `${accentHex}12` }}>
          <div className="flex items-start gap-3"><span>⏳</span><div className="flex-1"><p className="font-semibold text-sm" style={{ color: accentHex }}>{alert.title}</p><p className="text-xs text-[#8a91a1] mt-1">{alert.description}</p></div><Clock className="w-4 h-4" style={{ color: accentHex }} /></div>
        </motion.div>
      ))}
    </motion.div>
  );
}
