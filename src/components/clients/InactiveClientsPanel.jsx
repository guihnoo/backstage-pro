import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';
import { UserX, MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { buildReactivationMessage, openWhatsAppCharge, formatWhatsAppNumber } from '@/lib/whatsapp';
import { hardNavigate } from '@/lib/hardNavigate';
import { useAuth } from '@/lib/authContext';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import appToast from '@/lib/appToast';

const INACTIVE_DAYS = 90;

export default function InactiveClientsPanel({ clientsWithStats = [] }) {
  const { profile } = useAuth();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [open, setOpen] = useState(false);

  const techName = profile?.name || '';

  const inactive = useMemo(() => {
    const today = new Date();
    return clientsWithStats
      .filter(c => {
        if (!c.stats.lastEventDate) return false; // sem nenhum evento, não é "inativo"
        const days = differenceInDays(today, parseISO(c.stats.lastEventDate));
        return days >= INACTIVE_DAYS;
      })
      .map(c => ({
        ...c,
        daysSince: differenceInDays(today, parseISO(c.stats.lastEventDate)),
      }))
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [clientsWithStats]);

  if (inactive.length === 0) return null;

  const handleReactivate = (client) => {
    const phone = client.phone;
    if (!phone) {
      appToast.error('Cliente sem telefone cadastrado');
      return;
    }
    const number = formatWhatsAppNumber(phone);
    if (!number) {
      appToast.error('Número de telefone inválido');
      return;
    }
    const msg = buildReactivationMessage({
      clientName: client.name,
      techName,
      lastEventTitle: null,
      daysSince: client.daysSince,
    });
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20">
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-amber-300">
              {inactive.length} cliente{inactive.length > 1 ? 's' : ''} inativo{inactive.length > 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-amber-500/70">
              Sem shows há mais de {INACTIVE_DAYS} dias — toque para reengajar
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-amber-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-400 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-amber-500/20"
          >
            <div className="p-4 space-y-2">
              {inactive.map((client, i) => {
                const months = Math.round(client.daysSince / 30);
                const hasPhone = !!client.phone;

                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">{client.name}</p>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 flex-shrink-0">
                          {months}m sem show
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-500">
                          {client.stats.totalEvents} show{client.stats.totalEvents !== 1 ? 's' : ''} no histórico
                        </span>
                        {client.stats.generatedRevenue > 0 && (
                          <span className="text-[11px] text-slate-400">
                            {isVisible ? formatCurrency(client.stats.generatedRevenue) : '••••'} total
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => hardNavigate(`/client-detail?id=${client.id}`)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
                        title="Ver perfil do cliente"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReactivate(client)}
                        disabled={!hasPhone}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={hasPhone ? 'Enviar mensagem de reativação via WhatsApp' : 'Sem telefone cadastrado'}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Reativar
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
