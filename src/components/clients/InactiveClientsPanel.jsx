import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserX, MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { buildReactivationMessage, formatWhatsAppNumber } from '@/lib/whatsapp';
import { hardNavigate } from '@/lib/hardNavigate';
import { useAuth } from '@/lib/authContext';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import appToast from '@/lib/appToast';

import { ACTIVE_CLIENT_DAYS as INACTIVE_DAYS } from '@/lib/clientActivity';

export default function InactiveClientsPanel({ clientsWithStats = [] }) {
  const { profile } = useAuth();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [open, setOpen] = useState(false);

  const techName = profile?.name || '';

  const inactive = useMemo(() => {
    // Mesma regra da lista: inativo com historico (sem nenhum show nao ha o que reativar).
    return clientsWithStats
      .filter(c => !c.stats.isActive && c.stats.daysSinceLastEvent != null)
      .map(c => ({
        ...c,
        daysSince: c.stats.daysSinceLastEvent,
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
    <div className="rounded-xl border border-[#ffd400]/20 bg-[#ffd400]/5 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#ffd400]/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#ffd400]/15 border border-[#ffd400]/20">
            <UserX className="w-4 h-4 text-[#ffd400]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#ffd400]">
              {inactive.length} cliente{inactive.length > 1 ? 's' : ''} inativo{inactive.length > 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-[#ffd400]/70">
              Sem shows há mais de {INACTIVE_DAYS} dias — toque para reengajar
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#ffd400] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#ffd400] flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#ffd400]/20"
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
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1f1f1f]/60 border border-[#2a2a2a]/50"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">{client.name}</p>
                        <span className="text-[10px] text-[#ffd400] bg-[#ffd400]/10 border border-[#ffd400]/20 rounded px-1.5 py-0.5 flex-shrink-0">
                          {months}m sem show
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-[#888888]">
                          {client.stats.totalEvents} show{client.stats.totalEvents !== 1 ? 's' : ''} no histórico
                        </span>
                        {client.stats.generatedRevenue > 0 && (
                          <span className="text-[11px] text-[#a8a8a8]">
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
                        className="p-1.5 rounded-lg text-[#888888] hover:text-[#c8c8c8] hover:bg-[#2a2a2a]/50 transition-colors"
                        title="Ver perfil do cliente"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReactivate(client)}
                        disabled={!hasPhone}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#ffd400] border border-[#ffd400]/30 bg-[#ffd400]/10 hover:bg-[#ffd400]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
