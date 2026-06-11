import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Wallet, ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { buildChargeMessage, openWhatsAppCharge } from '@/lib/whatsapp';
import appToast from '@/lib/appToast';

import { Input } from '@/components/ui/input';

function ReceivableSkeleton() {
  return (
    <div className="mb-8 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/50 space-y-3">
      <div className="h-5 w-40 bg-slate-800 rounded animate-pulse" />
      {[1, 2].map((i) => (
        <div key={i} className="h-14 bg-slate-800/80 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export default function AReceber({ rows, totalReceivable, isLoading, onMarkPaid }) {
  const { formatCurrency } = useFinancialVisibility();
  const [marking, setMarking] = useState(null);
  const [confirming, setConfirming] = useState(null); // clientId awaiting confirm
  const [paidAmounts, setPaidAmounts] = useState({}); // clientId → typed amount string
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (clientId) => {
    setConfirming(null);
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

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
      appToast.error('Cliente sem telefone cadastrado. Adicione no perfil do cliente.');
      hardNavigate('/clients');
      return;
    }
    const message = buildChargeMessage({
      clientName: row.clientName,
      events: row.events,
      totalAmount: row.totalAmount,
    });
    const ok = openWhatsAppCharge(row.phone, message);
    if (!ok) appToast.error('Não foi possível abrir o WhatsApp.');
  };

  const openConfirm = (row) => {
    setPaidAmounts(prev => ({ ...prev, [row.clientId]: String(row.totalAmount.toFixed(2)) }));
    setConfirming(row.clientId);
  };

  const cancelConfirm = (clientId) => {
    setConfirming(null);
    setPaidAmounts(prev => { const n = { ...prev }; delete n[clientId]; return n; });
  };

  const handleMarkPaid = async (row) => {
    setConfirming(null);
    setMarking(row.clientId);
    const typed = parseFloat(paidAmounts[row.clientId]);
    const actualAmount = isNaN(typed) || typed <= 0 ? undefined : typed;
    setPaidAmounts(prev => { const n = { ...prev }; delete n[row.clientId]; return n; });
    try {
      await onMarkPaid?.(row.clientId, actualAmount);
      appToast.success(`Pagamento de ${row.clientName} marcado como recebido!`);
    } catch {
      appToast.error('Erro ao marcar pagamento. Tente novamente.');
    } finally {
      setMarking(null);
    }
  };

  const topRows = rows.slice(0, 6);

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
          className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
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
        <p className="text-xs text-slate-500 mt-1">
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
            className="rounded-xl bg-slate-900/60 border border-slate-800/60 overflow-hidden transition-colors"
          >
            <div className="flex items-center gap-3 p-4">
              <button
                type="button"
                onClick={() => toggleExpand(row.clientId)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white text-sm truncate">{row.clientName}</p>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${expanded.has(row.clientId) ? 'rotate-180' : ''}`} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm font-bold text-amber-300 tabular-nums">
                    {formatCurrency(row.totalAmount)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {row.eventsCount} show{row.eventsCount !== 1 ? 's' : ''}
                  </span>
                  {row.maxDaysOverdue > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      {row.maxDaysOverdue}d
                    </span>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirming === row.clientId ? cancelConfirm(row.clientId) : openConfirm(row)}
                  disabled={marking === row.clientId}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    confirming === row.clientId
                      ? 'bg-slate-700/50 border border-slate-600/50 text-slate-400'
                      : 'bg-[#1a2a1a] border border-[#2a4a2a] text-[#5a8a5a] hover:border-emerald-500/50 hover:text-emerald-300'
                  }`}
                >
                  {confirming === row.clientId ? <X className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {confirming === row.clientId ? 'Cancelar' : 'Pago'}
                </motion.button>
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
            </div>

            {/* Painel de eventos individuais */}
            <AnimatePresence>
              {expanded.has(row.clientId) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 border-t border-slate-700/40 space-y-1.5">
                    {row.events.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between gap-2 py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1 h-1 rounded-full bg-amber-500/60 flex-shrink-0" />
                          <p className="text-xs text-slate-300 truncate">{ev.title}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {ev.start_date && (
                            <span className="text-[10px] text-slate-600 font-mono">
                              {format(parseISO(ev.start_date), 'dd/MM', { locale: ptBR })}
                            </span>
                          )}
                          <span className="text-xs font-bold text-amber-300 tabular-nums">{formatCurrency(ev.amount)}</span>
                          {ev.daysOverdue > 0 && (
                            <span className="text-[10px] text-red-400">{ev.daysOverdue}d</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => hardNavigate(`/client-detail?id=${row.clientId}`)}
                      className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-cyan-400 transition-colors pt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver página de {row.clientName}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Painel de confirmação com valor editável */}
            <AnimatePresence>
              {confirming === row.clientId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-emerald-500/20 bg-emerald-500/5">
                    <p className="text-xs text-emerald-400/80 mb-2">Valor recebido (ajuste se necessário):</p>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">R$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paidAmounts[row.clientId] ?? ''}
                          onChange={e => setPaidAmounts(prev => ({ ...prev, [row.clientId]: e.target.value }))}
                          className="pl-8 bg-slate-800/80 border-emerald-500/30 text-white h-9 text-sm font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={marking === row.clientId}
                        onClick={() => handleMarkPaid(row)}
                        className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold bg-emerald-600/40 border border-emerald-400/60 text-emerald-200 hover:bg-emerald-600/60 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {marking === row.clientId ? '...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {rows.length > 6 && (
        <button
          type="button"
          onClick={() => hardNavigate('/reports')}
          className="w-full mt-3 text-center text-xs text-slate-500 hover:text-cyan-400 py-2"
        >
          + {rows.length - 6} cliente{rows.length - 6 !== 1 ? 's' : ''} — ver todos
        </button>
      )}
    </motion.section>
  );
}
