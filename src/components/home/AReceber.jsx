import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Wallet, ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { buildChargeMessage, openWhatsAppCharge } from '@/lib/whatsapp';
import appToast from '@/lib/appToast';
import { Skeleton } from '@/components/ui/skeleton';
import { haptics } from '@/lib/haptics';

function ReceivableSkeleton() {
  return (
    <div className="mb-8 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/50 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AReceber({ rows, totalReceivable, isLoading, onMarkPaid, onOpenEvent }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [marking, setMarking] = useState(null);
  const [confirming, setConfirming] = useState(null); // clientId awaiting confirm
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
      <div className="mb-4 px-4 py-3 rounded-2xl bg-[#161616] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#ffd400] flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-[#0a0a0a]" />
        </div>
        <div>
          <p className="font-extrabold text-sm text-white">Ninguém te devendo</p>
          <p className="text-xs text-[#a8a8a8]">Nenhum cachê pendente de clientes.</p>
        </div>
      </div>
    );
  }

  const handleCharge = (row) => {
    if (!row.phone) {
      haptics.error();
      appToast.error('Cliente sem telefone cadastrado. Adicione no perfil do cliente.');
      hardNavigate('/clients');
      return;
    }
    haptics.medium();
    const message = buildChargeMessage({
      clientName: row.clientName,
      events: row.events,
      totalAmount: row.totalAmount,
    });
    const ok = openWhatsAppCharge(row.phone, message);
    if (!ok) appToast.error('Não foi possível abrir o WhatsApp.');
  };

  const handleMarkPaid = async (row) => {
    haptics.success();
    setConfirming(null);
    setMarking(row.clientId);
    try {
      await onMarkPaid?.(row.clientId, row.totalAmount);
      appToast.success(`Pagamento integral de ${row.clientName} confirmado!`);
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
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="w-4 h-4 text-[#ff2e88] shrink-0" />
          <h3 className="font-tag text-xs font-bold tracking-[0.14em] text-[#a8a8a8] uppercase truncate">Clientes em aberto</h3>
          <span className="font-tag text-xs font-bold text-[#0a0a0a] bg-[#ff2e88] px-2 py-0.5 rounded-full shrink-0">
            {isVisible ? formatCurrency(totalReceivable) : '••••'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => hardNavigate('/reports')}
          className="text-xs text-slate-500 flex items-center gap-1 transition-colors bp-hover-primary shrink-0"
        >
          Ver todos
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {topRows.map((row, idx) => (
          <motion.div
            key={row.clientId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl bg-[#161616] border border-[#222222] overflow-hidden transition-colors"
          >
            <div className="flex items-center gap-3 p-3.5">
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
                  <span className="text-sm font-extrabold text-[#ff2e88] tabular-nums">
                    {isVisible ? formatCurrency(row.totalAmount) : '••••'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {row.eventsCount} show{row.eventsCount !== 1 ? 's' : ''}
                  </span>
                  {row.maxDaysOverdue > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      {row.maxDaysOverdue}d atraso
                    </span>
                  ) : row.maxDaysOverdue < 0 && (
                    <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                      show em {-row.maxDaysOverdue}d
                    </span>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirming === row.clientId ? setConfirming(null) : setConfirming(row.clientId)}
                  disabled={marking === row.clientId}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    confirming === row.clientId
                      ? 'bg-[#222222] border border-[#333333] text-[#a8a8a8]'
                      : 'border border-[#333333] text-white'
                  }`}
                >
                  {confirming === row.clientId ? <X className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {confirming === row.clientId ? 'Cancelar' : 'Pago'}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCharge(row)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#ff2e88] text-[#0a0a0a] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Cobrar
                </motion.button>
              </div>
            </div>

            {/* Painel de eventos individuais (clique no evento abre o Fechamento / PDF) */}
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
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onOpenEvent ? onOpenEvent(ev, 'fiscal') : hardNavigate(`/calendar?event=${ev.id}`)}
                        className="w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-800/70 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ff2e88] flex-shrink-0" />
                          <p className="text-xs text-slate-200 truncate">{ev.title}</p>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {ev.start_date && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {format(parseISO(ev.start_date), 'dd/MM', { locale: ptBR })}
                            </span>
                          )}
                          <span className="text-xs font-bold text-white tabular-nums">
                            {isVisible ? formatCurrency(ev.amount) : '••••'}
                          </span>
                          <span className="text-[10px] text-blue-400 font-medium">
                            PDF / NF-e →
                          </span>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => hardNavigate(`/client-detail?id=${row.clientId}`)}
                      className="flex items-center gap-1.5 text-[10px] text-slate-500 transition-colors pt-1 bp-hover-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver página de {row.clientName}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmação direta de pagamento integral */}
            <AnimatePresence>
              {confirming === row.clientId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 border-t border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3">
                    <p className="text-xs text-emerald-300">
                      Confirmar recebimento integral de <span className="font-mono font-bold">{isVisible ? formatCurrency(row.totalAmount) : '••••'}</span>?
                    </p>
                    <button
                      type="button"
                      disabled={marking === row.clientId}
                      onClick={() => handleMarkPaid(row)}
                      className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-bold bg-emerald-600/40 border border-emerald-400/60 text-emerald-200 hover:bg-emerald-600/60 transition-colors disabled:opacity-50 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {marking === row.clientId ? '...' : 'Confirmar'}
                    </button>
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
          className="w-full mt-3 text-center text-xs text-slate-500 py-2 bp-hover-primary transition-colors"
        >
          + {rows.length - 6} cliente{rows.length - 6 !== 1 ? 's' : ''} — ver todos
        </button>
      )}
    </motion.section>
  );
}
