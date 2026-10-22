import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hardNavigate } from '@/lib/hardNavigate';
import { formatDisplayDate, getEventStatusConfig } from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { getEventDisplay } from '@/lib/eventDisplay';
import appToast from '@/lib/appToast';
import { useAppScrollLock } from '@/lib/useAppScrollLock';

// Gaveta de ações do evento (visual All Access): grade de atalhos + Duplicar / Excluir.
function ActionTile({ icon, label, ariaLabel, onClick, primary = false, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`h-[74px] rounded-[14px] border-none flex flex-col items-center justify-center gap-1 p-1 active:scale-95 transition-transform disabled:opacity-60 ${
        primary ? 'bg-[#ffd400] text-[#0a0a0a]' : danger ? 'bg-[#1e1e1e] text-[#ff2e88]' : 'bg-[#1e1e1e] text-white'
      }`}
    >
      <span className="font-poster text-[18px] leading-none">{icon}</span>
      <span className="text-[11px] font-extrabold leading-[1.1] text-center">{label}</span>
    </button>
  );
}

export default function EventActionSheet({
  event,
  client,
  isOpen,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenHours,
  onAddExpense,
  onMarkPaid,
  onApplyManual12h,
  canApplyAuto12h,
  onCheckInLocation,
}) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [checkingIn, setCheckingIn] = useState(false);
  useAppScrollLock(Boolean(isOpen && event));

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!event) return null;

  const statusConfig = getEventStatusConfig(event);
  const { companyName, eventName, showEventSubtitle } = getEventDisplay(event, client);
  const cache = getEventCacheAmount(event);
  const isPaid = event.payment_status === 'paid';
  const dateLabel = `${formatDisplayDate(event.start_date)}${
    event.end_date && event.end_date !== event.start_date ? ` - ${formatDisplayDate(event.end_date)}` : ''
  }`;
  const initial = String(companyName || 'E').trim().charAt(0).toUpperCase();

  const handleApply12Hours = () => {
    if (onApplyManual12h) {
      onApplyManual12h(event);
    } else {
      appToast.info('Aplicar 12h automáticas em breve.', {
        description: 'Use "Registrar Horas" manualmente por enquanto.',
      });
    }
    onClose();
  };

  const handleCheckIn = async () => {
    if (!onCheckInLocation) return;
    setCheckingIn(true);
    try {
      await onCheckInLocation(event);
      onClose();
    } catch {
      // Quem chamou já mostrou o motivo (ex.: localização negada); o menu fica aberto para tentar de novo.
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[90]"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[95] bg-[#121212] border-t-[3px] border-[#ffd400] rounded-t-3xl shadow-2xl pb-safe max-h-[88dvh] flex flex-col overflow-hidden bp-focus-scope text-white"
          >
            <div className="pt-2 pb-1">
              <div className="w-11 h-[5px] rounded-[3px] bg-[#444444] mx-auto" />
            </div>

            <div className="bp-modal-scroll flex-1 min-h-0 px-[18px] pb-[22px] flex flex-col gap-2.5">
              {/* Cabeçalho */}
              <div className="flex gap-2.5 items-center">
                <div className="w-11 h-11 rounded-[10px] bg-white text-[#0a0a0a] flex items-center justify-center font-poster text-xl shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-poster text-[22px] leading-none uppercase break-words">
                    {showEventSubtitle ? eventName : companyName}
                  </div>
                  <div className="text-xs text-[#a8a8a8] mt-0.5">
                    {[showEventSubtitle ? companyName : null, dateLabel, cache > 0 ? (isVisible ? formatCurrency(cache) : '••••') : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {event.location && (
                    <div className="text-xs text-[#a8a8a8] line-clamp-1">{event.location}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-11 h-11 shrink-0 rounded-full text-[#a8a8a8] text-xl"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <div className="font-tag text-[10px] tracking-[1px] text-[#a8a8a8]">
                {String(statusConfig.label || '').toUpperCase()}
                {isPaid ? ' · PAGO' : ''}
              </div>

              {/* Grade de ações */}
              <div className="grid grid-cols-4 gap-2">
                {canApplyAuto12h && <ActionTile icon="12H" label="12h automáticas" onClick={handleApply12Hours} primary />}
                <ActionTile icon="⏱" label="Registrar horas" ariaLabel="Registrar horas" onClick={onOpenHours} primary={!canApplyAuto12h} />
                {onAddExpense && (
                  <ActionTile icon="+" label="Despesa" onClick={() => { onAddExpense(event); onClose?.(); }} />
                )}
                {onCheckInLocation && (
                  <ActionTile
                    icon={checkingIn ? '…' : '◎'}
                    label={event.location ? 'Atualizar local' : 'Check-in'}
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                  />
                )}
                <ActionTile icon={isPaid ? '↺' : 'R$'} label={isPaid ? 'Desmarcar pago' : 'Recebi'} onClick={onMarkPaid} />
                <ActionTile icon="VER" label="Ver detalhes" ariaLabel="Ver detalhes do evento" onClick={onViewDetails} />
                {event.client_id && (
                  <ActionTile
                    icon="CL"
                    label="Cliente"
                    onClick={() => { onClose(); hardNavigate(`/client-detail?id=${event.client_id}`); }}
                  />
                )}
                <ActionTile icon="✎" label="Editar" onClick={onEdit} />
              </div>

              <div className="flex gap-2">
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={onDuplicate}
                    className="flex-1 h-11 rounded-full border border-[#333333] bg-transparent text-white text-[13px] font-extrabold"
                  >
                    Duplicar pra outro dia
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDelete}
                  className="h-11 px-4 rounded-full border border-[#5a1a33] bg-transparent text-[#ff2e88] text-[13px] font-extrabold"
                >
                  Excluir
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
