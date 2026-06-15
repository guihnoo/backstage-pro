
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getEventStatusLabel, getEventStatusConfig, getEventStatus, formatDisplayDate, formatFullDate, timeRangeLabel } from '../utils/dateUtils';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import PaymentConfirmModal from './PaymentConfirmModal';
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Paperclip,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Zap,
  Building2,
  Copy,
  Plus,
  MapPin,
  Loader2,
  ExternalLink,
  Star,
  CheckSquare2,
  Share2 as ShareIcon,
} from 'lucide-react';
import EventLocationSection from '@/components/events/EventLocationSection';
import { useEvents } from '@/lib/useEvents';
import appToast from '@/lib/appToast';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

import { hardNavigate } from '@/lib/hardNavigate';

const InlineNotes = ({ event, updateEvent, onSaved }) => {
  const { primaryHex } = useCategoryTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(event.observacoes_md || '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEvent(event.id, { observacoes_md: draft.trim() || null });
      appToast.success('Observações salvas.');
      onSaved?.();
      setEditing(false);
    } catch {
      appToast.error('Erro ao salvar observações.');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          Observações
        </h3>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={4}
          placeholder="Anote informações do evento: contato do local, estacionamento, rider técnico…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none transition-colors bp-focus-input"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: primaryHex, color: '#050609' }}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          Observações
        </h3>
        <button
          type="button"
          onClick={startEdit}
          className="text-[11px] bp-hover-primary transition-colors"
          style={{ color: primaryHex }}
        >
          {event.observacoes_md ? 'Editar' : '+ Adicionar'}
        </button>
      </div>
      {event.observacoes_md ? (
        <div
          className="bg-slate-800/40 border border-slate-700/60 rounded-lg px-4 py-3 cursor-pointer hover:border-slate-600 transition-colors"
          onClick={startEdit}
        >
          <p className="text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">{event.observacoes_md}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="w-full text-left text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg px-4 py-3 hover:border-slate-500 hover:text-slate-400 transition-colors"
        >
          Clique para adicionar observações sobre este evento…
        </button>
      )}
    </div>
  );
};

const EventLifecycleBar = ({ event, dailyWork = [] }) => {
  const { primaryHex, accentHex } = useCategoryTheme();
  const status = getEventStatus(event);
  const isCancelled = status === 'cancelled';
  if (isCancelled) return null;

  const steps = [
    {
      label: 'Agendado',
      done: true,
      color: primaryHex,
    },
    {
      label: 'Realizado',
      done: status === 'completed',
      color: '#22c55e',
    },
    {
      label: 'Horas',
      done: dailyWork.length > 0,
      color: accentHex,
    },
    {
      label: 'Pago',
      done: event.payment_status === 'paid',
      color: '#34d399',
    },
  ];

  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="px-3 sm:px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex-shrink-0">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  backgroundColor: step.done ? step.color : 'transparent',
                  borderColor: step.done ? step.color : '#475569',
                }}
              >
                {step.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-[9px] font-medium leading-none ${step.done ? 'text-slate-300' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mb-4 transition-colors"
                style={{ backgroundColor: steps[i + 1].done ? steps[i].color : '#334155' }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      {doneCount < steps.length && (
        <p className="text-[10px] text-slate-500 mt-1">
          {doneCount === 1 && 'Registre horas ou marque o evento como concluído'}
          {doneCount === 2 && 'Registre as horas trabalhadas neste evento'}
          {doneCount === 3 && 'Aguardando confirmação de pagamento'}
        </p>
      )}
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, color = 'text-slate-300', isCurrency = false, formatFn }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const displayValue = formatFn ? formatFn(value) : isCurrency ? formatCurrency(value) : value;

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <Icon className={`w-4 h-4 mt-0.5 sm:mt-1 ${color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${color} break-words`}>
          {isVisible || !isCurrency ? displayValue || 'Não informado' : '•••••'}
        </p>
      </div>
    </div>
  );
};

const WorkItem = ({ work, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">

      <div className="flex justify-between items-center mb-2 gap-2">
        <p className="text-sm font-bold text-white truncate flex-1">{formatFullDate(work.date)}</p>
        <Button variant="ghost" size="sm" className="h-8 px-2 flex-shrink-0" onClick={() => onEdit(work)}>
          <Edit className="w-3 h-3 mr-1" /> Editar
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <InfoItem icon={Clock} label="Horas" value={`${work.total_hours?.toFixed(1) || 0}h`} color="bp-text-primary" />
        <InfoItem icon={Clock} label="Extras" value={`${work.overtime_hours?.toFixed(1) || 0}h`} color="text-pink-400" />
        <InfoItem icon={DollarSign} label="Cachê Dia" value={work.daily_cache || 0} isCurrency={true} color="text-green-300" />
        {work.photo_url &&
          <a href={work.photo_url} target="_blank" rel="noopener noreferrer" className="bp-text-primary hover:underline flex items-center justify-center gap-1 text-xs">
            <Paperclip className="w-3 h-3" /> Ver Foto
          </a>
        }
      </div>
      {work.notes && <p className="text-xs text-slate-400 mt-2 p-2 bg-slate-900/50 rounded break-words">{work.notes}</p>}
    </motion.div>
  );
};

const ExpenseItem = ({ expense, onEdit }) => {
  const { formatCurrency } = useFinancialVisibility();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">

      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{expense.title}</p>
          <Badge variant="secondary" className="text-xs capitalize mt-1">{expense.category}</Badge>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-amber-400">{formatCurrency(expense.amount)}</p>
            <p className="text-xs text-slate-400 whitespace-nowrap">{formatDisplayDate(expense.date)}</p>
          </div>
          {onEdit && (
            <Button variant="ghost" size="sm" className="h-8 px-2 flex-shrink-0" onClick={() => onEdit(expense)}>
              <Edit className="w-3 h-3 mr-1" /> Editar
            </Button>
          )}
        </div>
      </div>
      {expense.description && <p className="text-xs text-slate-400 mt-2 break-words">{expense.description}</p>}
    </motion.div>
  );
};

const EventDetailModal = React.memo(function EventDetailModal({
  event,
  dailyWork = [],
  expenses = [],
  client,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onPaymentUpdate,
  onWorkEdit,
  onExpenseEdit,
  onApply12h,
  onAddExpense,
  onAddWork,
}) {
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const { update: updateEvent } = useEvents();
  const { primaryHex, accentHex } = useCategoryTheme();
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingDraft, setRatingDraft] = useState(null);
  const [ratingNotesDraft, setRatingNotesDraft] = useState('');
  const [ratingHover, setRatingHover] = useState(0);
  const [locDraft, setLocDraft] = useState({
    location: '',
    location_city: '',
    location_state: '',
    location_lat: null,
    location_lng: null,
  });

  useEffect(() => {
    if (!event) return;
    setLocDraft({
      location: event.location || '',
      location_city: event.location_city || '',
      location_state: event.location_state || '',
      location_lat: event.location_lat ?? null,
      location_lng: event.location_lng ?? null,
    });
    setRatingDraft(event.client_rating ?? null);
    setRatingNotesDraft(event.client_rating_notes || '');
  }, [event?.id, event?.location, event?.location_city, event?.location_state, event?.location_lat, event?.location_lng]);

  const locationDirty =
    event &&
    (locDraft.location !== (event.location || '') ||
      locDraft.location_lat !== (event.location_lat ?? null) ||
      locDraft.location_lng !== (event.location_lng ?? null));

  const saveRating = async (stars, notes) => {
    if (!event?.id) return;
    setSavingRating(true);
    try {
      await updateEvent(event.id, { client_rating: stars, client_rating_notes: notes || null });
      appToast.success('Avaliação salva');
    } catch {
      appToast.error('Erro ao salvar avaliação');
    } finally {
      setSavingRating(false);
    }
  };

  const persistLocation = async (patch = locDraft) => {
    if (!event?.id) return;
    setSavingLocation(true);
    try {
      await updateEvent(event.id, {
        location: patch.location?.trim() || null,
        location_city: patch.location_city || null,
        location_state: patch.location_state || null,
        location_lat: patch.location_lat,
        location_lng: patch.location_lng,
      });
      appToast.success('Local do evento salvo');
    } catch (err) {
      appToast.error('Erro ao salvar local', { description: err.message });
    } finally {
      setSavingLocation(false);
    }
  };

  const statusConfig = useMemo(() => event ? getEventStatusConfig(event) : {}, [event]);
  const statusLabel = useMemo(() => event ? getEventStatusLabel(event) : '', [event]);

  const stats = useMemo(() => {
    if (!event || !dailyWork) return {};

    const totalHours = dailyWork.reduce((sum, work) => sum + (work.total_hours || 0), 0);
    const totalOvertime = dailyWork.reduce((sum, work) => sum + (work.overtime_hours || 0), 0);
    const fromWork = dailyWork.reduce((sum, work) => sum + (work.daily_cache || 0), 0);
    const totalRevenue = fromWork > 0 ? fromWork : getEventCacheAmount(event);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netRevenue = totalRevenue - totalExpenses;

    return { totalHours, totalOvertime, totalRevenue, totalExpenses, netRevenue };
  }, [event, dailyWork, expenses]);

  const canApply12h = useMemo(() => {
    if (!event) return false;
    const isCompleted = getEventStatus(event) === 'completed';
    return isCompleted && (!dailyWork || dailyWork.length === 0) && !event.auto_hours_applied;
  }, [event, dailyWork]);

  const [markingDone, setMarkingDone] = useState(false);

  const isPastAndNotCompleted = useMemo(() => {
    if (!event?.start_date) return false;
    const eventDate = new Date(event.start_date + 'T23:59:59');
    return eventDate < new Date() && (event.status === 'scheduled' || event.status === 'confirmed');
  }, [event]);

  if (!event) return null;

  const handlePaymentUpdate = () => {
    setShowPaymentConfirm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentConfirm(false);
    onPaymentUpdate();
  };

  const handleMarkCompleted = async () => {
    setMarkingDone(true);
    try {
      await updateEvent(event.id, { status: 'completed' });
      appToast.success('Evento marcado como realizado!');
      onPaymentUpdate?.();
      onClose?.();
    } catch {
      appToast.error('Erro ao atualizar status do evento.');
    } finally {
      setMarkingDone(false);
    }
  };

  const handleShareEvent = () => {
    const { formatCurrency } = (() => {
      // inline formatter — doesn't need hook here
      const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
      return { formatCurrency: fmt };
    })();

    const dateStr = event.start_date
      ? new Date(event.start_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : '';
    const parts = [
      `📋 *${event.title}*`,
      dateStr ? `📅 ${dateStr}` : null,
      event.start_time ? `🕐 ${event.start_time.slice(0, 5)}` : null,
      (event.location || event.location_city) ? `📍 ${[event.location, event.location_city].filter(Boolean).join(' — ')}` : null,
      getEventCacheAmount(event) > 0 ? `💰 ${formatCurrency(getEventCacheAmount(event))}` : null,
      event.notes ? `📝 ${event.notes}` : null,
      '',
      '_Backstage Pro_',
    ].filter(l => l !== null).join('\n');

    if (navigator.share) {
      navigator.share({ text: parts }).catch(() => {});
    } else {
      navigator.clipboard.writeText(parts);
      appToast.success('Detalhes copiados!', { description: 'Cole no WhatsApp ou onde preferir.' });
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent hideDefaultClose className="sm:max-w-4xl h-[95dvh] max-h-[95dvh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 overflow-hidden flex flex-col bp-focus-scope">
          <DialogHeader className={`p-3 sm:p-4 md:p-6 border-b ${statusConfig.borderColor} flex-shrink-0`}>
            <div className="flex justify-between items-start gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={`${statusConfig.badgeClass} border text-xs`}>{statusLabel}</Badge>
                  {client && (
                    <button
                      type="button"
                      onClick={() => { onClose(); hardNavigate(`/client-detail?id=${event.client_id}`); }}
                      className="flex items-center gap-1 sm:gap-2 text-xs text-slate-300 hover:text-[var(--bp-primary)] transition-colors group"
                    >
                      <Building2 className="w-3 h-3 text-slate-400 group-hover:text-[var(--bp-primary)] flex-shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">{client.name}</span>
                    </button>
                  )}
                </div>
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold font-display truncate pr-2">
                  {event.title}
                </DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 min-w-[44px] min-h-[44px]">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </DialogHeader>

          <EventLifecycleBar event={event} dailyWork={dailyWork} />

          <ScrollArea fill>
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 pb-safe">

              {canApply12h && (
                <Alert className="bg-blue-900/40 border-blue-700 text-blue-200">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col gap-2 w-full">
                    <AlertDescription className="text-sm">
                      Evento concluído sem registros. Deseja aplicar 12h de trabalho?
                    </AlertDescription>
                    <Button
                      size="sm"
                      onClick={() => onApply12h(event)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-10 min-h-[44px]"
                    >
                      <Zap className="w-4 h-4 mr-2" /> Aplicar 12h
                    </Button>
                  </div>
                </Alert>
              )}

              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-3 sm:p-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
                    <InfoItem icon={DollarSign} label="Receita Bruta" value={stats.totalRevenue || 0} isCurrency color="text-green-300" />
                    <InfoItem icon={FileText} label="Despesas" value={stats.totalExpenses || 0} isCurrency color="text-amber-400" />
                    <InfoItem icon={DollarSign} label="Receita Líquida" value={stats.netRevenue || 0} isCurrency color={stats.netRevenue >= 0 ? 'bp-text-primary' : 'text-red-400'} />
                    <InfoItem icon={Clock} label="Total Horas" value={`${stats.totalHours?.toFixed(1) || 0}h`} color="text-slate-300" />
                  </div>
                  {stats.totalExpenses > 0 && stats.totalRevenue > 0 && (() => {
                    const margin = ((stats.netRevenue / stats.totalRevenue) * 100);
                    return (
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Margem de lucro</span>
                          <span className={margin >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {Math.round(margin)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.max(0, Math.min(100, margin))}%`,
                              background: margin >= 70 ? '#10b981' : margin >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-white text-sm sm:text-base">Detalhes do Evento</h3>
                  <InfoItem icon={Calendar} label="Período" value={`${formatFullDate(event.start_date)} - ${formatFullDate(event.end_date)}`} />
                  <InfoItem icon={Clock} label="Horário" value={timeRangeLabel(event)} />
                  <InfoItem icon={DollarSign} label="Valor Diária Base" value={event.daily_cache_value || 0} isCurrency />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-white text-sm sm:text-base">Detalhes do Pagamento</h3>
                  <InfoItem
                    icon={event.payment_status === 'paid' ? CheckCircle : AlertTriangle}
                    label="Status Pagamento"
                    value={event.payment_status === 'paid' ? 'Recebido' : 'Pendente'}
                    color={event.payment_status === 'paid' ? 'text-green-400' : 'text-amber-400'}
                  />

                  {event.payment_status === 'paid' ? (
                    <InfoItem icon={Calendar} label="Data do Recebimento" value={event.paid_date ? formatFullDate(event.paid_date) : null} />
                  ) : (
                    <InfoItem icon={Calendar} label="Vencimento" value={event.payment_due_date ? formatFullDate(event.payment_due_date) : null} />
                  )}
                  {event.paid_amount > 0 && <InfoItem icon={DollarSign} label="Valor Recebido" value={event.paid_amount} isCurrency />}
                  {event.nf_number && (
                    <InfoItem icon={FileText} label="Nota Fiscal" value={`NF ${event.nf_number}${event.nf_issued_at ? ` · ${formatFullDate(event.nf_issued_at)}` : ''}`} color="text-emerald-400" />
                  )}
                </div>
              </div>

              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-3 sm:p-4 space-y-3">
                  <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 bp-text-primary" />
                    Local do evento
                  </h3>
                  <EventLocationSection
                    location={locDraft.location}
                    location_city={locDraft.location_city}
                    location_state={locDraft.location_state}
                    location_lat={locDraft.location_lat}
                    location_lng={locDraft.location_lng}
                    onChange={(patch) => setLocDraft((prev) => ({ ...prev, ...patch }))}
                    onGpsCaptured={(captured) => persistLocation(captured)}
                  />
                  {locationDirty && (
                    <Button
                      type="button"
                      onClick={() => persistLocation()}
                      disabled={savingLocation}
                      className="w-full sm:w-auto hover:opacity-90 h-10 min-h-[44px]"
                      style={{ backgroundColor: primaryHex }}
                    >
                      {savingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar local'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <InlineNotes event={event} updateEvent={updateEvent} onSaved={onPaymentUpdate} />

              {/* Avaliação do cliente — só para eventos concluídos com cliente */}
              {event.status === 'completed' && event.client_id && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    Avaliação do cliente
                  </h3>
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg px-4 py-3 space-y-3">
                    {/* Estrelas */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => { setRatingDraft(star); saveRating(star, ratingNotesDraft); }}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                          className="p-0.5 transition-transform hover:scale-110"
                          title={`${star} estrela${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className="w-6 h-6 transition-colors"
                            fill={(ratingHover || ratingDraft || 0) >= star ? '#fbbf24' : 'none'}
                            stroke={(ratingHover || ratingDraft || 0) >= star ? '#fbbf24' : '#64748b'}
                          />
                        </button>
                      ))}
                      {ratingDraft && (
                        <span className="ml-2 text-xs text-amber-400 font-medium">
                          {['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'][ratingDraft]}
                        </span>
                      )}
                      {savingRating && <Loader2 className="w-4 h-4 text-slate-500 animate-spin ml-2" />}
                    </div>
                    {/* Nota de avaliação */}
                    {ratingDraft && (
                      <textarea
                        value={ratingNotesDraft}
                        onChange={e => setRatingNotesDraft(e.target.value)}
                        onBlur={() => ratingDraft && saveRating(ratingDraft, ratingNotesDraft)}
                        placeholder="Observação sobre o cliente (opcional)…"
                        rows={2}
                        className="w-full bg-slate-700/50 border border-slate-600/60 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm sm:text-base">
                    Registros de Trabalho ({dailyWork.length})
                  </h3>
                  {dailyWork.length > 0 && (
                    <span
                      className="text-xs rounded-full px-2.5 py-0.5 border bp-text-primary bp-surface-primary"
                      style={accentHex ? { color: accentHex, background: `${accentHex}1a`, borderColor: `${accentHex}33` } : undefined}
                    >
                      {stats.totalHours?.toFixed(1)}h total
                    </span>
                  )}
                </div>
                {dailyWork.length > 0 ? (
                  <div className="space-y-3">
                    {[...dailyWork]
                      .sort((a, b) => (a.work_date || a.date || '') < (b.work_date || b.date || '') ? -1 : 1)
                      .map((work) => <WorkItem key={work.id} work={work} onEdit={onWorkEdit} />)}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhum registro de trabalho para este evento.</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm sm:text-base">
                    Despesas ({expenses.length})
                  </h3>
                  {expenses.length > 0 && (
                    <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                      {Number(stats.totalExpenses || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })} total
                    </span>
                  )}
                </div>
                {expenses.length > 0 ? (
                  <div className="space-y-3">
                    {expenses.map((exp) => <ExpenseItem key={exp.id} expense={exp} onEdit={onExpenseEdit} />)}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhuma despesa registrada para este evento.</p>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-3 sm:p-4 bg-slate-900/50 border-t border-slate-700 flex flex-col sm:flex-row gap-2 sm:justify-between flex-shrink-0 pb-safe">
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onEdit(event)}
                className="flex-1 sm:flex-none bg-slate-800 border-slate-700 hover:bg-slate-700 text-white px-3 py-2 text-xs sm:text-sm h-10 min-h-[44px]"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Editar
              </Button>
              {onDuplicate && (
                <Button
                  variant="outline"
                  onClick={() => { onDuplicate(event); onClose(); }}
                  className="flex-1 sm:flex-none bg-slate-800 border-slate-700 hover:bg-slate-700 bp-text-primary px-3 py-2 text-xs sm:text-sm h-10 min-h-[44px]"
                  title="Criar cópia deste evento"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Duplicar
                </Button>
              )}
              {event.client_id && (
                <Button
                  variant="outline"
                  onClick={() => { onClose(); hardNavigate(`/client-detail?id=${event.client_id}`); }}
                  className="flex-1 sm:flex-none bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 px-3 py-2 text-xs sm:text-sm h-10 min-h-[44px]"
                  title="Ver página do cliente"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Cliente
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleShareEvent}
                className="flex-1 sm:flex-none bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm h-10 min-h-[44px]"
                title="Compartilhar detalhes do evento"
              >
                <ShareIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Compartilhar
              </Button>
              <Button
                variant="destructive"
                onClick={() => onDelete(event.id)}
                className="flex-1 sm:flex-none text-xs sm:text-sm h-10 min-h-[44px]"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Excluir
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {isPastAndNotCompleted && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={markingDone}
                  className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm h-10 min-h-[44px]"
                  title="Marcar este evento como realizado"
                >
                  {markingDone
                    ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    : <CheckSquare2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                  Realizado
                </Button>
              )}
              {onAddWork && (
                <Button
                  variant="outline"
                  onClick={() => onAddWork(event)}
                  className="flex-1 sm:flex-none bg-slate-800 border bp-text-primary bp-hover-primary text-xs sm:text-sm h-10 min-h-[44px]"
                  style={accentHex ? { color: accentHex, borderColor: `${accentHex}80` } : undefined}
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Horas
                </Button>
              )}
              {onAddExpense && (
                <Button
                  variant="outline"
                  onClick={() => onAddExpense(event)}
                  className="flex-1 sm:flex-none bg-slate-800 border-amber-600/50 hover:bg-amber-900/20 text-amber-400 text-xs sm:text-sm h-10 min-h-[44px]"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Despesa
                </Button>
              )}
              {event.payment_status !== 'paid' && (
                <Button
                  onClick={handlePaymentUpdate}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-10 min-h-[44px]"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Confirmar Recebimento
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showPaymentConfirm &&
          <PaymentConfirmModal
            event={event}
            isOpen={showPaymentConfirm}
            onClose={() => setShowPaymentConfirm(false)}
            onSuccess={handlePaymentSuccess} />
        }
      </AnimatePresence>
    </>
  );
});

export default EventDetailModal;
