import { useState, useMemo, useEffect } from 'react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  CalendarDays,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  MapPin,
  FileText,
  Zap,
  Loader2,
  MessageCircle,
  ExternalLink,
  Receipt,
  AlertTriangle,
  ClipboardCheck,
  PartyPopper,
  Copy,
  Send,
  Timer,
  Square,
  ScrollText,
  BadgeCheck,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import {
  formatDisplayDate,
  getEventStatus,
  getEventStatusConfig,
  normalizeDateString,
} from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { useDailyWork } from '@/lib/useDailyWork';
import { applyAuto12Hours } from '@/api/functions';
import { useStatusToggle } from '@/lib/useStatusToggle';
import { openWhatsAppCharge, buildEventReport, buildChargeMessage, buildProposalMessage } from '@/lib/whatsapp';
import { generatePixPayload, buildPixWhatsAppMessage } from '@/lib/pixPayload';
import { startTimer, getTimer, stopTimer } from '@/lib/timerStore';
import appToast from '@/lib/appToast';
import EventHeading from '@/components/events/EventHeading';
import EventLocationSection from '@/components/events/EventLocationSection';
import { EventChecklist } from '@/components/calendar/EventChecklist';
import { useEvents } from '@/lib/useEvents';
import { useExpenses } from '@/lib/useExpenses';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import DailyWorkModal from '@/components/calendar/DailyWorkModal';
import NFeAttachment from '@/components/shared/NFeAttachment';
import { useUserSettings } from '@/lib/useUserSettings';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EXPENSE_CATEGORY_LABELS = {
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  equipamento: 'Equipamento',
  hospedagem: 'Hospedagem',
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  outros: 'Outros',
};

function LifecycleBar({ event, hasWork }) {
  const { primaryHex, accentHex } = useCategoryTheme();
  const status = getEventStatus(event);
  if (status === 'cancelled') return null;

  const steps = [
    { label: 'Agendado', done: true, color: primaryHex },
    { label: 'Realizado', done: status === 'completed' || status === 'archived', color: '#22c55e' },
    { label: 'Horas', done: hasWork, color: accentHex },
    { label: 'Pago', done: event.payment_status === 'paid', color: '#34d399' },
  ];

  return (
    <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900/40 flex-shrink-0">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <span key={step.label} className="contents">
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  backgroundColor: step.done ? step.color : 'transparent',
                  borderColor: step.done ? step.color : '#475569',
                }}
              >
                {step.done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                style={{ backgroundColor: steps[i + 1].done ? step.color : '#334155' }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function InlineNotes({ event, updateEvent }) {
  const { primaryHex } = useCategoryTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [localText, setLocalText] = useState(event?.observacoes_md || '');

  useEffect(() => {
    setLocalText(event?.observacoes_md || '');
  }, [event?.observacoes_md]);

  const startEdit = () => {
    setDraft(localText);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEvent(event.id, { observacoes_md: draft.trim() || null });
      setLocalText(draft.trim());
      appToast.success('Observações salvas.');
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
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" /> Observações
        </h4>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          placeholder="Contato do local, estacionamento, rider técnico…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none bp-focus-input"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" /> Observações
        </h4>
        <button type="button" onClick={startEdit} className="text-[11px] transition-colors" style={{ color: primaryHex }}>
          {localText ? 'Editar' : '+ Adicionar'}
        </button>
      </div>
      {localText ? (
        <div
          role="button"
          tabIndex={0}
          onClick={startEdit}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(); } }}
          className="bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2.5 cursor-pointer hover:border-slate-600 transition-colors"
        >
          <p className="text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">{localText}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="w-full text-left text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg px-3 py-2.5 hover:border-slate-500 hover:text-slate-400 transition-colors"
        >
          Clique para adicionar observações…
        </button>
      )}
    </div>
  );
}

export default function EventDetailModal({
  event,
  client,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onAddWork: _onAddWork,
  onMarkPaid
}) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { profile } = useAuth();
  const { primaryHex } = useCategoryTheme();
  const { dailyWork } = useDailyWork();
  const { update: updateEvent } = useEvents();
  const { expenses, refetch: refetchExpenses } = useExpenses();
  const { settings: userSettings } = useUserSettings();
  const [activeTab, setActiveTab] = useState('resumo');
  const [activeTimer, setActiveTimer] = useState(() => getTimer());
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [applying12h, setApplying12h] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [workModalDate, setWorkModalDate] = useState(null);
  const [showExpenses, setShowExpenses] = useState(true);
  const [locDraft, setLocDraft] = useState({
    location: '',
    location_city: '',
    location_state: '',
    location_lat: null,
    location_lng: null,
  });
  const { confirmEvent, toggling } = useStatusToggle();

  useEffect(() => {
    const onTimer = (e) => setActiveTimer(e.detail);
    window.addEventListener('backstage:timer', onTimer);
    return () => window.removeEventListener('backstage:timer', onTimer);
  }, []);

  const handleToggleTimer = () => {
    if (activeTimer?.eventId === event?.id) {
      stopTimer();
    } else {
      startTimer({ eventId: event.id, eventTitle: event.title });
      appToast.success('Timer iniciado!', { description: 'O cronômetro está rodando em background.' });
    }
  };

  useEffect(() => {
    if (!event) return;
    setLocDraft({
      location: event.location || '',
      location_city: event.location_city || '',
      location_state: event.location_state || '',
      location_lat: event.location_lat ?? null,
      location_lng: event.location_lng ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?.location, event?.location_city, event?.location_state, event?.location_lat, event?.location_lng]);

  const locationDirty =
    event &&
    (locDraft.location !== (event.location || '') ||
      locDraft.location_lat !== (event.location_lat ?? null) ||
      locDraft.location_lng !== (event.location_lng ?? null));

  const persistLocation = async (patch = locDraft) => {
    if (!event?.id) return;
    setSavingLocation(true);
    try {
      const updated = await updateEvent(event.id, {
        location: patch.location?.trim() || null,
        location_city: patch.location_city || null,
        location_state: patch.location_state || null,
        location_lat: patch.location_lat,
        location_lng: patch.location_lng,
      });
      if (updated) {
        setLocDraft({
          location: updated.location || '',
          location_city: updated.location_city || '',
          location_state: updated.location_state || '',
          location_lat: updated.location_lat ?? null,
          location_lng: updated.location_lng ?? null,
        });
      }
      appToast.success('Local salvo', { description: 'Endereço atualizado no evento.' });
    } catch (err) {
      appToast.error('Erro ao salvar local', { description: err.message });
    } finally {
      setSavingLocation(false);
    }
  };

  const handleChargeWhatsApp = () => {
    const phone = client?.phone;
    if (!phone) { appToast.error('Cliente sem telefone cadastrado.'); return; }
    const value = getEventCacheAmount(event);
    const message = buildChargeMessage({
      clientName: client?.name,
      events: [{ title: event.title, start_date: event.start_date, amount: value }],
      totalAmount: value,
    });
    openWhatsAppCharge(phone, message);
  };

  const handleCopyPix = () => {
    const pixKey = userSettings?.pix_key;
    if (!pixKey) { appToast.error('Chave PIX não cadastrada.', { description: 'Adicione sua chave PIX no Perfil.' }); return; }
    const amount = getEventCacheAmount(event);
    const payload = generatePixPayload({
      pixKey,
      merchantName: userSettings?.report_full_name || profile?.full_name || 'Tecnico',
      merchantCity: event.location_city || 'Brasil',
      amount,
      txId: (event.title || 'show').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
    });
    navigator.clipboard?.writeText(payload).then(() =>
      appToast.success('PIX copiado!', { description: 'Cole no app do banco para pagar.' })
    );
  };

  const handlePixWhatsApp = () => {
    const phone = client?.phone;
    const pixKey = userSettings?.pix_key;
    if (!pixKey) { appToast.error('Chave PIX não cadastrada no Perfil.'); return; }
    const amount = getEventCacheAmount(event);
    const payload = generatePixPayload({
      pixKey,
      merchantName: userSettings?.report_full_name || profile?.full_name || 'Tecnico',
      merchantCity: event.location_city || 'Brasil',
      amount,
      txId: (event.title || 'show').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
    });
    const msg = buildPixWhatsAppMessage({
      clientName: client?.name,
      eventTitle: event.title,
      amount,
      pixKey,
      pixKeyType: userSettings?.pix_key_type || 'Chave PIX',
      pixPayloadStr: payload,
    });
    if (phone) {
      openWhatsAppCharge(phone, msg);
    } else {
      navigator.clipboard?.writeText(msg).then(() =>
        appToast.success('Mensagem PIX copiada!', { description: 'Cole no WhatsApp do cliente.' })
      );
    }
  };

  const handleSendProposal = () => {
    const phone = client?.phone;
    const value = getEventCacheAmount(event);
    const msg = buildProposalMessage({
      clientName: client?.name,
      techName: userSettings?.report_full_name || profile?.full_name,
      eventTitle: event.title,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location,
      locationCity: event.location_city,
      amount: value,
      pixKey: userSettings?.pix_key,
      pixKeyType: userSettings?.pix_key_type,
      notes: event.observacoes_md,
    });
    if (phone) {
      openWhatsAppCharge(phone, msg);
    } else {
      navigator.clipboard?.writeText(msg).then(() =>
        appToast.success('Proposta copiada!', { description: 'Cole no WhatsApp do cliente.' })
      );
    }
  };

  const handleSendReport = () => {
    const phone = client?.phone;
    if (!phone) { appToast.error('Cliente sem telefone cadastrado.', { description: 'Adicione o telefone na página do cliente.' }); return; }
    const message = buildEventReport({ event, client, work: eventWork, expenses: eventExpenses });
    const ok = openWhatsAppCharge(phone, message);
    if (!ok) appToast.error('Não foi possível abrir o WhatsApp.');
  };

  const handleDownloadPDF = async () => {
    if (generatingPDF) return;
    setGeneratingPDF(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { EventPDFDocument } = await import('@/lib/EventPDFDocument');
      const reportSettings = {
        report_full_name: userSettings?.report_full_name || null,
        report_subtitle:  userSettings?.report_subtitle  || null,
        report_profession:userSettings?.report_profession|| null,
        pix_key:          userSettings?.pix_key          || null,
        pix_key_type:     userSettings?.pix_key_type     || 'Chave PIX',
      };
      const blob = await pdf(
        <EventPDFDocument
          event={event}
          client={client}
          work={eventWork}
          expenses={eventExpenses}
          profile={profile || {}}
          reportSettings={reportSettings}
        />
      ).toBlob();
      const clientSlug = (client?.name || 'cliente').replace(/\s+/g, '_').substring(0, 20);
      const dateSlug = event?.start_date ? event.start_date.replace(/-/g, '') : format(new Date(), 'yyyyMMdd');
      const filename = `Fechamento_${clientSlug}_${dateSlug}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      appToast.success('PDF gerado com sucesso!', { description: filename });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      appToast.error('Erro ao gerar PDF', { description: err.message });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDownloadContract = async () => {
    if (generatingContract) return;
    setGeneratingContract(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { ContractPDFDocument } = await import('@/lib/ContractPDFDocument');
      const blob = await pdf(
        <ContractPDFDocument event={event} client={client} settings={userSettings || {}} />
      ).toBlob();
      const clientSlug = (client?.name || 'cliente').replace(/\s+/g, '_').substring(0, 20);
      const dateSlug = event?.start_date ? event.start_date.replace(/-/g, '') : format(new Date(), 'yyyyMMdd');
      const filename = `Contrato_${clientSlug}_${dateSlug}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      appToast.success('Contrato gerado!', { description: filename });
    } catch (err) {
      appToast.error('Erro ao gerar contrato', { description: err.message });
    } finally {
      setGeneratingContract(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (generatingReceipt) return;
    setGeneratingReceipt(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { ReceiptPDFDocument } = await import('@/lib/ReceiptPDFDocument');
      const blob = await pdf(
        <ReceiptPDFDocument event={event} client={client} settings={userSettings || {}} />
      ).toBlob();
      const clientSlug = (client?.name || 'cliente').replace(/\s+/g, '_').substring(0, 20);
      const dateSlug = event?.start_date ? event.start_date.replace(/-/g, '') : format(new Date(), 'yyyyMMdd');
      const filename = `Recibo_${clientSlug}_${dateSlug}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      appToast.success('Recibo gerado!', { description: filename });
    } catch (err) {
      appToast.error('Erro ao gerar recibo', { description: err.message });
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const handleApply12Hours = async () => {
    setApplying12h(true);
    try {
      const result = await applyAuto12Hours({ eventId: event.id, origin: 'manual_12h' });
      if (result.data.success) {
        appToast.success('12 horas aplicadas automaticamente!', { description: 'Você pode editar depois se necessário.', duration: 5000 });
        onMarkPaid?.();
        onClose();
      } else {
        appToast.error('Erro ao aplicar horas', { description: result.data.error || 'Tente novamente.' });
      }
    } catch (error) {
      console.error('Erro ao aplicar 12h:', error);
      appToast.error('Erro ao aplicar horas automáticas', { description: error.message || 'Tente novamente.' });
    } finally {
      setApplying12h(false);
    }
  };

  // Hooks must be called before any conditional return
  const eventWork = useMemo(() => {
    if (!event) return [];
    return (dailyWork || []).filter(w => w.event_id === event.id);
  }, [dailyWork, event]);

  const totals = useMemo(() => {
    const totalHours = eventWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);
    const totalOvertime = eventWork.reduce((sum, w) => sum + (w.overtime_hours || 0), 0);
    const totalEarned = eventWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
    const hourlyRate = totalHours > 0 && totalEarned > 0 ? totalEarned / totalHours : null;
    return { totalHours, totalOvertime, totalEarned, hourlyRate };
  }, [eventWork]);

  const estimatedValue = useMemo(() => {
    if (!event || eventWork.length > 0) return null;
    return getEventCacheAmount(event);
  }, [event, eventWork.length]);

  const eventDays = useMemo(() => {
    const start = event?.start_date;
    const end = event?.end_date || event?.start_date;
    if (!start || !end || start === end) return [];
    const days = [];
    const cursor = new Date(start + 'T00:00:00');
    const last = new Date(end + 'T00:00:00');
    const now = normalizeDateString(new Date());
    while (cursor <= last) {
      const d = normalizeDateString(cursor);
      const work = eventWork.find(w => normalizeDateString(w.date) === d);
      days.push({ date: d, work, isToday: d === now, isPast: d < now, isFuture: d > now });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [event, eventWork]);

  const eventExpenses = useMemo(() => {
    if (!event) return [];
    return (expenses || []).filter(e => e.event_id === event.id);
  }, [expenses, event]);

  const expenseTotals = useMemo(() => {
    const total = eventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const reimbursable = eventExpenses.filter(e => e.is_reimbursable && !e.reimbursed).reduce((sum, e) => sum + (e.amount || 0), 0);
    return { total, reimbursable };
  }, [eventExpenses]);

  const profitSummary = useMemo(() => {
    if (!event) return null;
    const revenue = Number(event.paid_amount) > 0 ? Number(event.paid_amount) : getEventCacheAmount(event) || 0;
    if (revenue <= 0 && expenseTotals.total <= 0) return null;
    const profit = revenue - expenseTotals.total;
    const margin = revenue > 0 ? (profit / revenue) * 100 : null;
    return { revenue, expenses: expenseTotals.total, profit, margin };
  }, [event, expenseTotals.total]);

  if (!event) return null;

  const today = normalizeDateString(new Date());
  const eventStart = event.start_date || '';
  const eventEnd = event.end_date || event.start_date || '';
  const todayInEventRange = eventStart && today >= eventStart && today <= eventEnd;

  const status = getEventStatus(event);
  const statusConfig = getEventStatusConfig(event);
  const StatusIcon = statusConfig.icon;
  const hasWork = eventWork.length > 0 || Boolean(event.auto_hours_applied);

  // Primary CTA based on event status
  let primaryCTA = null;
  if (status === 'pending') {
    primaryCTA = (
      <Button
        onClick={() => confirmEvent(event, onClose)}
        disabled={toggling === event.id}
        className="flex-1 hover:opacity-90"
        style={{ backgroundColor: primaryHex }}
      >
        {toggling === event.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
        Confirmar
      </Button>
    );
  } else if (['scheduled', 'confirmed'].includes(status) && todayInEventRange) {
    primaryCTA = (
      <Button
        onClick={() => { setWorkModalDate(null); setShowWorkModal(true); }}
        className="flex-1 hover:opacity-90"
        style={{ backgroundColor: primaryHex }}
      >
        <Plus className="w-4 h-4 mr-2" />Registrar Horas
      </Button>
    );
  } else if ((status === 'completed' || status === 'archived') && event.payment_status !== 'paid') {
    primaryCTA = (
      <Button onClick={onMarkPaid} className="flex-1 bg-emerald-700 hover:bg-emerald-600">
        <CheckCircle2 className="w-4 h-4 mr-2" />Confirmar Recebimento
      </Button>
    );
  } else if ((status === 'completed' || status === 'archived') && event.payment_status === 'paid') {
    primaryCTA = (
      <Button onClick={handleDownloadPDF} disabled={generatingPDF} className="flex-1 bg-blue-700 hover:bg-blue-600">
        {generatingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
        PDF Fechamento
      </Button>
    );
  } else {
    primaryCTA = (
      <Button onClick={() => onEdit?.(event)} className="flex-1 hover:opacity-90" style={{ backgroundColor: primaryHex }}>
        <Edit className="w-4 h-4 mr-2" />Editar
      </Button>
    );
  }

  // CRM card: Próximos Passos / Evento fechado
  const horasDone = hasWork;
  const pagamentoDone = event.payment_status === 'paid';
  const allDone = horasDone && pagamentoDone;

  const crmCard = (status === 'completed' || status === 'archived') ? (
    allDone ? (
      <Card className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-700/40">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <PartyPopper className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-emerald-300 text-sm">Evento fechado!</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">
                {totals.totalHours > 0 ? `${totals.totalHours}h registradas` : 'Horas OK'}
                {' · Pagamento confirmado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            NF-e <ArrowRight className="w-3 h-3" />
          </button>
        </CardContent>
      </Card>
    ) : (
      <Card className="bg-slate-800/60 border-amber-700/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-300">
            <ClipboardCheck className="w-4 h-4" />
            Próximos passos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {/* Horas */}
          <div className="flex items-center gap-3">
            {horasDone
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              : <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${horasDone ? 'text-slate-400 line-through' : 'text-white'}`}>
                Registrar horas trabalhadas
              </p>
              {horasDone && totals.totalHours > 0 && (
                <p className="text-xs text-emerald-400">{totals.totalHours}h · {isVisible ? formatCurrency(totals.totalEarned) : '••••'}</p>
              )}
            </div>
            {!horasDone && (
              <div className="flex gap-1.5 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={handleApply12Hours}
                  disabled={applying12h}
                  className="h-7 px-2 text-xs text-white hover:opacity-90"
                  style={{ backgroundColor: primaryHex }}
                >
                  {applying12h ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3 mr-1" />12h</>}
                </Button>
                {todayInEventRange && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setWorkModalDate(null); setShowWorkModal(true); }}
                    className="h-7 px-2 text-xs border-slate-600 hover:bg-slate-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />Manual
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="flex items-center gap-3">
            {pagamentoDone
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              : <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${pagamentoDone ? 'text-slate-400 line-through' : 'text-white'}`}>
                Confirmar recebimento
              </p>
              {!pagamentoDone && event.payment_due_date && (
                <p className="text-xs text-amber-400">Vence {formatDisplayDate(event.payment_due_date)}</p>
              )}
            </div>
            {!pagamentoDone && (
              <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                <Button size="sm" onClick={onMarkPaid} className="h-7 px-2 text-xs bg-emerald-700 hover:bg-emerald-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Pago
                </Button>
                {userSettings?.pix_key && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={client?.phone ? handlePixWhatsApp : handleCopyPix}
                    className="h-7 px-2 text-xs border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/20"
                    title={client?.phone ? 'Enviar PIX via WhatsApp' : 'Copiar PIX'}
                  >
                    <Receipt className="w-3 h-3 mr-1" />PIX
                  </Button>
                )}
                {client?.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleChargeWhatsApp}
                    className="h-7 px-2 text-xs border-green-700/50 text-green-400 hover:bg-green-900/20"
                    title="Cobrar via WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* NF-e — aponta para aba Fiscal */}
          <div className="flex items-center gap-3 pt-1 border-t border-slate-700/50">
            {(event.nfe_arquivo_url || event.nfe_numero)
              ? <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              : <Circle className="w-5 h-5 text-blue-500/50 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Emitir e registrar NF-e</p>
              <p className="text-xs text-slate-400">
                {event.nfe_numero ? `NF ${event.nfe_numero}` : 'Emita no gov.br e anexe aqui'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('fiscal')}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Fiscal <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </CardContent>
      </Card>
    )
  ) : null;

  return (
    <>
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[95dvh] bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200 flex flex-col p-0 overflow-hidden bp-focus-scope">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <EventHeading event={event} client={client} size="lg" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusConfig.badgeClass}>
                  {StatusIcon && <StatusIcon className="w-4 h-4 mr-1" />}
                  {statusConfig.label}
                </Badge>
                {event.payment_status === 'paid' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-4 h-4 mr-1" />Pago
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Lifecycle bar */}
        <LifecycleBar event={event} hasWork={hasWork} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 pt-3 flex-shrink-0">
            <TabsList className="w-full bg-slate-800/60 border border-slate-700/40 h-9 p-0.5">
              <TabsTrigger
                value="resumo"
                className="flex-1 text-xs h-8 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 rounded-md"
              >
                Resumo
              </TabsTrigger>
              <TabsTrigger
                value="trabalho"
                className="flex-1 text-xs h-8 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 rounded-md"
              >
                Trabalho{eventWork.length > 0 ? ` (${eventWork.length})` : ''}
              </TabsTrigger>
              <TabsTrigger
                value="fiscal"
                className="flex-1 text-xs h-8 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 rounded-md"
              >
                Fiscal{(event.nfe_arquivo_url || event.nfe_numero) ? ' ●' : ''}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea fill className="px-6">

            {/* ── RESUMO ── */}
            <TabsContent value="resumo" className="mt-0 pt-4 space-y-4 pb-6 data-[state=inactive]:hidden">

              {crmCard}

              {/* Informações básicas */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 bp-text-primary" />
                    Informações do Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {event.start_date === event.end_date || !event.end_date ? (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Data</p>
                      <p className="text-white font-medium text-sm">{formatDisplayDate(event.start_date)}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Data Início</p>
                        <p className="text-white font-medium text-sm">{formatDisplayDate(event.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Data Fim</p>
                        <p className="text-white font-medium text-sm">{formatDisplayDate(event.end_date)}</p>
                      </div>
                    </div>
                  )}
                  {event.description && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Descrição</p>
                      <p className="text-white text-sm break-words">{event.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Local */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 bp-text-primary" />
                    Local do evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
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
                      className="w-full sm:w-auto hover:opacity-90"
                      style={{ backgroundColor: primaryHex }}
                    >
                      {savingLocation ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar local'}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Observações */}
              <InlineNotes event={event} updateEvent={updateEvent} />

              {/* Checklist */}
              <EventChecklist
                items={event.checklist_items ?? []}
                onChange={async (next) => { await updateEvent(event.id, { checklist_items: next }); }}
              />
            </TabsContent>

            {/* ── TRABALHO ── */}
            <TabsContent value="trabalho" className="mt-0 pt-4 space-y-4 pb-6 data-[state=inactive]:hidden">

              {/* Financeiro */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">Cachê contratado</p>
                    <p className="text-lg font-bold text-green-400">
                      {isVisible ? formatCurrency(getEventCacheAmount(event)) : '••••'}
                    </p>
                  </div>
                  {eventWork.length > 0 && (
                    <>
                      <Separator className="bg-slate-700" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">Horas</p>
                          <p className="text-base font-bold bp-text-primary">{totals.totalHours}h</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">Extras</p>
                          <p className="text-base font-bold text-orange-400">{totals.totalOvertime}h</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">Total ganho</p>
                          <p className="text-base font-bold text-green-400">{isVisible ? formatCurrency(totals.totalEarned) : '••••'}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {eventWork.length === 0 && estimatedValue !== null && (
                    <>
                      <Separator className="bg-slate-700" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Valor estimado</p>
                          <p className="text-[10px] text-slate-500">Baseado no cachê × duração</p>
                        </div>
                        <p className="text-lg font-bold text-yellow-400">{isVisible ? formatCurrency(estimatedValue) : '••••'}</p>
                      </div>
                    </>
                  )}
                  {profitSummary && expenseTotals.total > 0 && (
                    <>
                      <Separator className="bg-slate-700" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">Receita</p>
                          <p className="text-base font-bold bp-text-primary">{isVisible ? formatCurrency(profitSummary.revenue) : '••••'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">Despesas</p>
                          <p className="text-base font-bold text-red-400">{isVisible ? formatCurrency(profitSummary.expenses) : '••••'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-0.5">Lucro</p>
                          <p className={`text-base font-bold ${profitSummary.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isVisible ? formatCurrency(profitSummary.profit) : '••••'}
                          </p>
                        </div>
                      </div>
                      {profitSummary.margin !== null && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span>Margem</span>
                            <span className={profitSummary.margin >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                              {Math.round(profitSummary.margin)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.max(0, Math.min(100, profitSummary.margin))}%`,
                                background: profitSummary.margin >= 70 ? '#10b981' : profitSummary.margin >= 40 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {event.payment_due_date && event.payment_status !== 'paid' && (
                    <>
                      <Separator className="bg-slate-700" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Vencimento</p>
                          <p className="text-base font-bold text-amber-400">{formatDisplayDate(event.payment_due_date)}</p>
                        </div>
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Cronômetro */}
              {['pending', 'scheduled', 'confirmed'].includes(status) && (
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-white">Cronômetro</p>
                    <p className="text-xs text-slate-400">
                      {activeTimer?.eventId === event.id ? 'Timer ativo' : 'Registre seu tempo em andamento'}
                    </p>
                  </div>
                  <Button
                    onClick={handleToggleTimer}
                    variant="outline"
                    size="sm"
                    className={`transition-colors ${
                      activeTimer?.eventId === event.id
                        ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : ''
                    }`}
                    style={activeTimer?.eventId !== event.id ? { borderColor: `${primaryHex}99`, color: primaryHex } : undefined}
                  >
                    {activeTimer?.eventId === event.id
                      ? <><Square className="w-4 h-4 fill-red-400 mr-2" />Parar</>
                      : <><Timer className="w-4 h-4 mr-2" />Iniciar</>
                    }
                  </Button>
                </div>
              )}

              {/* Timeline de dias (multi-day) */}
              {eventDays.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
                      <CalendarDays className="w-4 h-4 bp-text-primary" />
                      Dias do evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {eventDays.map(({ date, work, isToday, isPast, isFuture }) => {
                        const label = format(new Date(date + 'T00:00:00'), 'd MMM', { locale: ptBR });
                        const canRegister = isToday || isPast;
                        return (
                          <button
                            key={date}
                            type="button"
                            disabled={isFuture}
                            onClick={() => {
                              if (!canRegister) return;
                              setWorkModalDate(date);
                              setShowWorkModal(true);
                            }}
                            className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                              work ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : isToday ? 'border-2 text-white hover:opacity-80'
                              : isPast ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                              : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                            }`}
                            style={isToday && !work ? { borderColor: primaryHex, background: `${primaryHex}20`, color: primaryHex } : undefined}
                          >
                            <span>{label}</span>
                            <span className="text-[9px] opacity-80">
                              {work ? `${work.total_hours || 0}h` : isToday ? 'hoje' : isPast ? 'faltou' : '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {eventDays.some(d => d.isPast && !d.work) && (
                      <p className="text-[11px] text-red-400/70 mt-2">
                        Toque num dia vermelho para registrar horas em atraso.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Registros de Trabalho */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 bp-text-primary" />
                    Horas trabalhadas
                    {eventWork.length > 0 && <span className="text-slate-500 font-normal text-xs">({eventWork.length})</span>}
                  </h4>
                  {todayInEventRange && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setWorkModalDate(null); setShowWorkModal(true); }}
                      className="h-7 px-2 text-xs border-slate-600 hover:bg-slate-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />Registrar
                    </Button>
                  )}
                </div>
                {eventWork.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-lg">
                    Nenhum registro de trabalho ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eventWork.map((work, idx) => {
                      const dayRate = work.total_hours > 0 && work.daily_cache > 0 ? work.daily_cache / work.total_hours : null;
                      return (
                        <div key={work.id || idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-white text-sm">{formatDisplayDate(work.date)}</p>
                            <div className="text-right">
                              <p className="text-green-400 font-bold text-sm">{isVisible ? formatCurrency(work.daily_cache || 0) : '••••'}</p>
                              {dayRate && <p className="text-[10px] text-amber-400/70">{isVisible ? formatCurrency(dayRate) : '••••'}/h</p>}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div><p className="text-slate-400 text-xs">Entrada</p><p className="text-white">{work.entry_time || '-'}</p></div>
                            <div><p className="text-slate-400 text-xs">Saída</p><p className="text-white">{work.exit_time || '-'}</p></div>
                            <div><p className="text-slate-400 text-xs">Horas</p><p className="bp-text-primary font-medium">{work.total_hours || 0}h</p></div>
                          </div>
                          {work.notes && <p className="text-sm text-slate-400 mt-2 italic break-words">{work.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Despesas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenses(v => !v)}
                    className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  >
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      Despesas
                      {eventExpenses.length > 0 && <span className="text-xs font-normal text-slate-400">({eventExpenses.length})</span>}
                    </h4>
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showExpenses ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                    </svg>
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExpenseForm(true)}
                    className="h-7 px-2 text-xs border-amber-600/40 text-amber-300 hover:bg-amber-500/10 flex-shrink-0"
                  >
                    <Plus className="w-3 h-3 mr-1" />Adicionar
                  </Button>
                </div>
                {expenseTotals.total > 0 && (
                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <span className="text-slate-400">Total: <span className="text-red-300 font-bold">{isVisible ? formatCurrency(expenseTotals.total) : '••••'}</span></span>
                    {expenseTotals.reimbursable > 0 && (
                      <span className="text-slate-400">A reembolsar: <span className="text-amber-300 font-bold">{isVisible ? formatCurrency(expenseTotals.reimbursable) : '••••'}</span></span>
                    )}
                  </div>
                )}
                {showExpenses && (
                  eventExpenses.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-lg">
                      Nenhuma despesa registrada.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {eventExpenses.map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{exp.title || exp.category}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500">{EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}</span>
                              {exp.date && (
                                <span className="text-[10px] text-slate-600">
                                  · {format(new Date(exp.date + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
                                </span>
                              )}
                              {exp.is_reimbursable && !exp.reimbursed && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />reembolsável
                                </span>
                              )}
                              {exp.reimbursed && (
                                <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />reembolsado
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-red-300 flex-shrink-0">
                            {isVisible ? formatCurrency(exp.amount) : '••••'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </TabsContent>

            {/* ── FISCAL ── */}
            <TabsContent value="fiscal" className="mt-0 pt-4 space-y-5 pb-6 data-[state=inactive]:hidden">

              {/* NF-e upload + AI */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Nota Fiscal Eletrônica
                </h4>
                <NFeAttachment event={event} client={client} />
              </div>

              <Separator className="bg-slate-800" />

              {/* PIX */}
              {userSettings?.pix_key && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    PIX
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={handleCopyPix}
                      className="flex-1 min-w-[120px] border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/20"
                    >
                      <Copy className="w-4 h-4 mr-2" />Copiar PIX
                    </Button>
                    {client?.phone && (
                      <Button
                        variant="outline"
                        onClick={handlePixWhatsApp}
                        className="flex-1 min-w-[120px] border-green-700/50 text-green-400 hover:bg-green-900/20"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />Enviar PIX
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <Separator className="bg-slate-800" />

              {/* Documentos PDF */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Documentos
                </h4>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={generatingPDF}
                    variant="outline"
                    className="w-full justify-start border-blue-600/50 hover:bg-blue-900/20 text-blue-300"
                  >
                    {generatingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                    Relatório de Fechamento
                  </Button>
                  {event.payment_status === 'paid' && (
                    <Button
                      onClick={handleDownloadReceipt}
                      disabled={generatingReceipt}
                      variant="outline"
                      className="w-full justify-start border-green-600/50 hover:bg-green-900/20 text-green-300"
                    >
                      {generatingReceipt ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BadgeCheck className="w-4 h-4 mr-2" />}
                      Recibo de Pagamento
                    </Button>
                  )}
                  {['pending', 'scheduled', 'confirmed'].includes(status) && (
                    <Button
                      onClick={handleDownloadContract}
                      disabled={generatingContract}
                      variant="outline"
                      className="w-full justify-start border-emerald-600/50 hover:bg-emerald-900/20 text-emerald-300"
                    >
                      {generatingContract ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScrollText className="w-4 h-4 mr-2" />}
                      Contrato de Serviços
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open('https://www.nfse.gov.br/EmissorNacional/Login', '_blank', 'noopener,noreferrer')}
                    className="w-full justify-start border-slate-700 text-slate-400 hover:bg-slate-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />Portal NFS-e Nacional
                  </Button>
                </div>
              </div>
            </TabsContent>

          </ScrollArea>
        </Tabs>

        {/* Footer simplificado: 1 CTA primário + timer + ··· */}
        <DialogFooter className="px-6 py-4 border-t border-slate-800 flex-row gap-2 flex-shrink-0">
          {primaryCTA}

          {['confirmed', 'scheduled', 'pending'].includes(status) && (
            <Button
              onClick={handleToggleTimer}
              variant="outline"
              size="icon"
              className={`flex-shrink-0 transition-colors ${
                activeTimer?.eventId === event.id
                  ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : ''
              }`}
              style={activeTimer?.eventId !== event.id ? { borderColor: `${primaryHex}99`, color: primaryHex } : undefined}
              title={activeTimer?.eventId === event.id ? 'Parar timer' : 'Iniciar timer'}
            >
              {activeTimer?.eventId === event.id
                ? <Square className="w-4 h-4 fill-red-400" />
                : <Timer className="w-4 h-4" />
              }
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="flex-shrink-0 border-slate-700 hover:bg-slate-800">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="bg-slate-900 border-slate-700 text-slate-200 min-w-[180px]">
              <DropdownMenuItem onClick={() => onEdit?.(event)} className="gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                <Edit className="w-4 h-4" /> Editar evento
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(event)} className="gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                  <Copy className="w-4 h-4" /> Duplicar
                </DropdownMenuItem>
              )}
              {client?.id && (
                <DropdownMenuItem
                  onClick={() => { onClose(); hardNavigate(`/client-detail?id=${client.id}`); }}
                  className="gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                >
                  <ExternalLink className="w-4 h-4" /> Ver cliente
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-800" />
              {['pending', 'scheduled', 'confirmed'].includes(status) && (
                <DropdownMenuItem onClick={handleSendProposal} className="gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                  <Send className="w-4 h-4" /> Enviar proposta
                </DropdownMenuItem>
              )}
              {client?.phone && (
                <>
                  <DropdownMenuItem onClick={handleChargeWhatsApp} className="gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                    <MessageCircle className="w-4 h-4" /> Cobrar via WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendReport} className="gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                    <Receipt className="w-4 h-4" /> Enviar relatório
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={() => onDelete?.(event?.id)}
                className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-900/20 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" /> Excluir evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <DailyWorkModal
      isOpen={showWorkModal}
      onClose={() => { setShowWorkModal(false); setWorkModalDate(null); }}
      date={workModalDate ? new Date(workModalDate + 'T00:00:00') : new Date()}
      event={event}
      onSuccess={() => { setShowWorkModal(false); setWorkModalDate(null); }}
    />

    <ExpenseForm
      open={showExpenseForm}
      onOpenChange={setShowExpenseForm}
      initialEventId={event?.id}
      onSuccess={() => {
        refetchExpenses();
        setShowExpenseForm(false);
      }}
    />
    </>
  );
}
