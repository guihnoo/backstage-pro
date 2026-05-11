import { motion } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';

export default function AlertasBastidao({ alerts, isLoading }) {
  if (isLoading) {
    return (
      <div className="mb-8 p-6 rounded-xl bg-gray-900/50 border border-gray-700/30">
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8 p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="text-green-300 font-semibold">Tudo em dia!</p>
            <p className="text-sm text-green-400/70">Nenhum pagamento atrasado. Você arrebassa!</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const overdue = alerts.filter((a) => a.type === 'overdue');
  const pending = alerts.filter((a) => a.type === 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 space-y-3"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Alertas do Bastidão</h3>
        {alerts.length > 0 && (
          <span className="ml-auto text-xs bg-amber-600 text-white px-2 py-1 rounded-full">
            {alerts.length}
          </span>
        )}
      </div>

      {/* Overdue */}
      {overdue.map((alert, idx) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-4 rounded-lg bg-gradient-to-r from-red-600/20 to-red-600/10 border border-red-500/30 hover:border-red-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-300 text-sm">{alert.title}</p>
              <p className="text-xs text-red-400/80 mt-1">{alert.description}</p>
            </div>
            <Clock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          </div>
        </motion.div>
      ))}

      {/* Pending */}
      {pending.map((alert, idx) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: (overdue.length + idx) * 0.05 }}
          className="p-4 rounded-lg bg-gradient-to-r from-amber-600/20 to-amber-600/10 border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-300 text-sm">{alert.title}</p>
              <p className="text-xs text-amber-400/80 mt-1">{alert.description}</p>
            </div>
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
