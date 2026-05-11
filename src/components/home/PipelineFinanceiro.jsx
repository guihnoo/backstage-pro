import { motion } from 'framer-motion';

export default function PipelineFinanceiro({ stats, isLoading }) {
  const total = stats.faturamento_pago + stats.a_receber;
  const percentualPago = total > 0 ? (stats.faturamento_pago / total) * 100 : 0;
  const percentualPendente = total > 0 ? (stats.a_receber / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-6 rounded-xl bg-gray-900/50 border border-gray-700/30"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Dinheiro nos Trilhos</h3>

        {isLoading ? (
          <div className="h-8 bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-3">
            {/* Barra de progresso */}
            <div className="flex gap-2 h-10 rounded-lg overflow-hidden bg-gray-800/50 p-1">
              {percentualPago > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentualPago}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                >
                  {percentualPago > 10 && `${percentualPago.toFixed(0)}%`}
                </motion.div>
              )}
              {percentualPendente > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentualPendente}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                >
                  {percentualPendente > 10 && `${percentualPendente.toFixed(0)}%`}
                </motion.div>
              )}
            </div>

            {/* Legenda */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="text-gray-400 text-xs">Recebido</p>
                  <p className="font-bold text-white">
                    R${stats.faturamento_pago.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <p className="text-gray-400 text-xs">A Receber</p>
                  <p className="font-bold text-white">
                    R${stats.a_receber.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-gray-700/30">
        <p className="text-gray-400 text-sm mb-2">Total Pipeline</p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"
        >
          R${(total).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </motion.p>
      </div>
    </motion.div>
  );
}
