import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Wallet, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { buildChargeMessage, openWhatsAppCharge } from '@/lib/whatsapp';
import { toast } from 'sonner';

function ReceivableSkeleton() {
  return (
    <div className="mb-8 p-5 rounded-2xl bg-gray-900/50 border border-gray-800/50 space-y-3">
      <div className="h-5 w-40 bg-gray-800 rounded animate-pulse" />
      {[1, 2].map((i) => (
        <div key={i} className="h-14 bg-gray-800/80 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export default function AReceber({ rows, totalReceivable, isLoading, onMarkPaid }) {
  const { formatCurrency } = useFinancialVisibility();
  const [marking, setMarking] = useState(null); // clientId being confirmed
  const [confirming, setConfirming] = useState(null); // clientId awaiting confirm tap

  if (isLoading) return <ReceivableSkeleton />;

  if (!rows?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 border border-emerald-500/25"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-emerald-300">A receber zerado</p>
            <p className="text-sm text-emerald-400/70">Nenhum cachê pendente de clientes.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleCharge = (row) => {
    if (!row.phone) {
      toast.error('Cliente sem telefone cadastrado. Adicione no perfil do cliente.');
      hardNavigate('/clients');
      return;
    }
    const message = buildChargeMessage({
      clientName: row.clientName,
      events: row.events,
      totalAmount: row.totalAmount,
    });
    const ok = openWhatsAppCharge(row.phone, message);
    if (!ok) toast.error('Não foi possível abrir o WhatsApp.');
  };

  const handleMarkPaid = async (row) => {
    if (confirming !== row.clientId) {
      setConfirming(row.clientId);
      setTimeout(() => setConfirming(c => c === row.clientId ? null : c), 3000);
      return;
    }
    setConfirming(null);
    setMarking(row.clientId);
    try {
      await onMarkPaid?.(row.clientId);
      toast.success(`Pagamento de ${row.clientName} marcado como recebido!`);
    } catch {
      toast.error('Erro ao marcar pagamento. Tente novamente.');
    } finally {
      setMarking(null);
    }
  };

  const topRows = rows.slice(0, 5);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">A receber</h3>
        </div>
        <button
          type="button"
          onClick={() => hardNavigate('/reports')}
          className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
        >
          Ver relatório
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 mb-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-amber-600/5">
        <p className="text-xs uppercase tracking-wider text-amber-400/80 mb-1">Total pendente</p>
        <p className="text-2xl font-black text-white tabular-nums">
          {formatCurrency(totalReceivable)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {rows.length} cliente{rows.length !== 1 ? 's' : ''} com pagamento em aberto
        </p>
      </div>

      <div className="space-y-2">
        {topRows.map((row, idx) => (
          <motion.div
            key={row.clientId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-900/60 border border-gray-800/60 hover:border-gray-700/80 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{row.clientName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-bold text-amber-300 tabular-nums">
                  {formatCurrency(row.totalAmount)}
                </span>
                <span className="text-xs text-gray-500">
                  {row.eventsCount} show{row.eventsCount !== 1 ? 's' : ''}
                </span>
                {row.maxDaysOverdue > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {row.maxDaysOverdue}d
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <AnimatePresence mode="wait">
                {confirming === row.clientId ? (
                  <motion.button
                    key="confirm"
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMarkPaid(row)}
                    disabled={marking === row.clientId}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600/30 border border-emerald-400/60 text-emerald-300 hover:bg-emerald-600/50 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar
                  </motion.button>
                ) : (
                  <motion.button
                    key="paid"
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMarkPaid(row)}
                    disabled={marking === row.clientId}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold bg-[#1a2a1a] border border-[#2a4a2a] text-[#5a8a5a] hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pago
                  </motion.button>
                )}
              </AnimatePresence>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCharge(row)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-green-600/20 border border-green-500/40 text-green-300 hover:bg-green-600/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Cobrar
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {rows.length > 5 && (
        <button
          type="button"
          onClick={() => hardNavigate('/reports')}
          className="w-full mt-3 text-center text-xs text-gray-500 hover:text-cyan-400 py-2"
        >
          + {rows.length - 5} cliente{rows.length - 5 !== 1 ? 's' : ''} — ver todos
        </button>
      )}
    </motion.section>
  );
}
