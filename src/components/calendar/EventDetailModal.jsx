import { useState, useMemo, useEffect } from 'react';
import PaymentConfirmModal from '@/components/reports/PaymentConfirmModal';
import { getEventCacheAmount, calculateEventReceivableAmount, isEstimatedWork, isCancelledEvent, isDoneEvent } from '@/lib/eventFinance';
import { buildEventClosing } from '@/lib/eventClosing';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { generatePixPayload, generatePixQrDataUrl, buildPixWhatsAppMessage } from '@/lib/pixPayload';
import { createClosingShareLink } from '@/lib/closingShareLink';
import { startTimer, getTimer, stopTimer } from '@/lib/timerStore';
import appToast from '@/lib/appToast';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { getEventDisplay } from '@/lib/eventDisplay';
import EventLocationSection from '@/components/events/EventLocationSection';
import { EventChecklist } from '@/components/calendar/EventChecklist';
import EquipmentChecklist from '@/components/events/EquipmentChecklist';
import { normalizeKit } from '@/lib/equipment';
import { buildQuote, quoteMessage } from '@/lib/quote';
import ClientRatingSection from '@/components/events/ClientRatingSection';
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
  quilometragem: 'Quilometragem',
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
    <div className="px-6 py-2.5 border-b border-[#222222] bg-[#141414] flex-shrink-0">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <span key={step.label} className="contents">
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  backgroundColor: step.done ? step.color : 'transparent',
                  borderColor: step.done ? step.color : '#555555',
                }}
              >
                {step.done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-[9px] font-medium leading-none ${step.done ? 'text-[#e0e0e0]' : 'text-[#666666]'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mb-4 transition-colors"
                style={{ backgroundColor: steps[i + 1].done ? step.color : '#333333' }}
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
        <h4 className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#a8a8a8]" /> Observações
        </h4>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          placeholder="Contato do local, estacionamento, rider técnico…"
          className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#888888] resize-none focus:outline-none bp-focus-input"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-[#a8a8a8] hover:text-white px-3 py-1.5 rounded-lg border border-[#262626] transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: primaryHex, color: '#0a0a0a' }}
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
        <h4 className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#a8a8a8]" /> Observações
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
          className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-2.5 cursor-pointer hover:border-[#333333] transition-colors"
        >
          <p className="text-sm text-[#e0e0e0] whitespace-pre-wrap break-words leading-relaxed">{localText}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="w-full text-left text-xs text-[#888888] border border-dashed border-[#262626] rounded-lg px-3 py-2.5 hover:border-[#444444] hover:text-[#a8a8a8] transition-colors"
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
  onMarkPaid,
  initialTab = 'resumo',
}) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { user, profile } = useAuth();
  const { primaryHex } = useCategoryTheme();
  const { dailyWork, delete: deleteDailyWorkEntry } = useDailyWork();
  const { update: updateEvent } = useEvents();
  const { expenses, refetch: refetchExpenses } = useExpenses();
  const { settings: userSettings, upsert: upsertUserSettings } = useUserSettings();
  const [activeTab, setActiveTab] = useState(initialTab || 'resumo');
  const [activeTimer, setActiveTimer] = useState(() => getTimer());
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sharingPDF, setSharingPDF] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [applying12h, setApplying12h] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [workModalDate, setWorkModalDate] = useState(null);
  const [editingWorkEntry, setEditingWorkEntry] = useState(null);
  const [confirmDeleteWorkId, setConfirmDeleteWorkId] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [showExpenses, setShowExpenses] = useState(true);
  const [editingPixInline, setEditingPixInline] = useState(false);
  const [quickPixType, setQuickPixType] = useState('CPF');
  const [quickPixKey, setQuickPixKey] = useState('');
  const [savingQuickPix, setSavingQuickPix] = useState(false);
  const [locDraft, setLocDraft] = useState({
    location: '',
    location_city: '',
    location_state: '',
    location_lat: null,
    location_lng: null,
  });
  const { confirmEvent, toggling } = useStatusToggle();

  useEffect(() => {
    if (userSettings) {
      setQuickPixKey(userSettings.pix_key || '');
      setQuickPixType(userSettings.pix_key_type || 'CPF');
    }
  }, [userSettings]);

  const handleSaveQuickPix = async () => {
    if (!quickPixKey.trim()) return;
    setSavingQuickPix(true);
    try {
      await upsertUserSettings({
        pix_key: quickPixKey.trim(),
        pix_key_type: quickPixType,
      });
      setEditingPixInline(false);
      appToast.success('Chave PIX salva!', { description: 'Já incluída no PDF e na cobrança do evento.' });
    } catch (err) {
      appToast.error('Erro ao salvar PIX', { description: err.message });
    } finally {
      setSavingQuickPix(false);
    }
  };

  const closeWorkModal = () => {
    setShowWorkModal(false);
    setWorkModalDate(null);
    setEditingWorkEntry(null);
  };

  const openWorkModal = (dateStr, workEntry = null) => {
    setWorkModalDate(dateStr || null);
    setEditingWorkEntry(workEntry);
    setShowWorkModal(true);
  };

  const handleConfirmDeleteWork = async () => {
    if (!confirmDeleteWorkId) return;
    try {
      await deleteDailyWorkEntry(confirmDeleteWorkId);
      appToast.success('Registro de horas excluído.');
      closeWorkModal();
    } catch (err) {
      console.error('Erro ao excluir registro de trabalho:', err);
      appToast.error('Não foi possível excluir o registro.');
    } finally {
      setConfirmDeleteWorkId(null);
    }
  };

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
    const value = receivableAmount;
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
    const amount = receivableAmount;
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
    const amount = receivableAmount;
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

  const buildFullReportMessage = () => {
    const pixKey = userSettings?.pix_key || '';
    const pixKeyType = userSettings?.pix_key_type || 'Chave PIX';
    const providerName = userSettings?.report_full_name || profile?.name || profile?.full_name || '';
    const pixPayloadStr = pixKey
      ? generatePixPayload({
          pixKey,
          merchantName: providerName || 'Tecnico',
          merchantCity: profile?.city || event.location_city || 'Brasil',
          amount: receivableAmount,
          txId: (event.title || 'show').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
        })
      : '';
    return buildEventReport({
      event,
      client,
      work: eventWork,
      expenses: eventExpenses,
      pixKey,
      pixKeyType,
      pixPayloadStr,
      providerName,
    });
  };

  const handleSendReport = () => {
    const phone = client?.phone;
    const message = buildFullReportMessage();
    if (!phone) {
      navigator.clipboard?.writeText(message).then(() =>
        appToast.success('Relatório completo copiado!', { description: 'Cole no WhatsApp do contratante.' })
      );
      return;
    }
    const ok = openWhatsAppCharge(phone, message);
    if (!ok) appToast.error('Não foi possível abrir o WhatsApp.');
  };

  const handleCopyClosingLink = async () => {
    try {
      const url = await createClosingShareLink({
        event,
        client,
        work: eventWork,
        expenses: eventExpenses,
        profile: { ...(profile || {}), email: profile?.email || user?.email || '' },
        userSettings: userSettings || {},
      });
      await navigator.clipboard?.writeText(url);
      appToast.success('Link de Fechamento & PIX copiado!', {
        description: 'Envie para a produtora visualizar o fechamento, QR Code PIX e NF-e no navegador.',
      });
    } catch (err) {
      appToast.error('Não foi possível copiar o link', { description: err.message });
    }
  };

  const generateClosingPdfBlob = async () => {
    const { pdf } = await import('@react-pdf/renderer');
    const { EventPDFDocument } = await import('@/lib/EventPDFDocument');
    const pixKey = userSettings?.pix_key || null;
    const providerName = userSettings?.report_full_name || profile?.name || profile?.full_name || 'Prestador';
    let pixQrDataUrl = '';
    if (pixKey) {
      pixQrDataUrl = await generatePixQrDataUrl({
        pixKey,
        merchantName: providerName,
        merchantCity: profile?.city || event?.location_city || 'Brasil',
        amount: receivableAmount,
        txId: (event?.title || client?.name || 'SHOW').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
      });
    }
    const reportSettings = {
      report_full_name:  userSettings?.report_full_name  || profile?.name || profile?.full_name || null,
      report_subtitle:   userSettings?.report_subtitle   || null,
      report_profession: userSettings?.report_profession || null,
      cpf_cnpj:          userSettings?.cpf_cnpj          || profile?.cnpj || profile?.cpf_cnpj || null,
      phone:             profile?.phone                  || null,
      email:             profile?.email                  || user?.email || null,
      pix_key:           pixKey,
      pix_key_type:      userSettings?.pix_key_type      || 'Chave PIX',
      pix_qr_data_url:   pixQrDataUrl || null,
    };
    const enrichedProfile = {
      ...(profile || {}),
      email: profile?.email || user?.email || '',
    };
    const enrichedExpenses = await Promise.all(
      (eventExpenses || []).map(async (exp) => {
        if (!exp.is_reimbursable || !exp.receipt_url) return exp;
        if (String(exp.receipt_url).startsWith('data:image/')) {
          return { ...exp, receipt_data_url: exp.receipt_url };
        }
        try {
          const resp = await fetch(exp.receipt_url);
          if (!resp.ok) return exp;
          const b = await resp.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(b);
          });
          return dataUrl.startsWith('data:image/') ? { ...exp, receipt_data_url: dataUrl } : exp;
        } catch {
          return exp;
        }
      })
    );
    const blob = await pdf(
      <EventPDFDocument
        event={event}
        client={client}
        work={eventWork}
        expenses={enrichedExpenses}
        profile={enrichedProfile}
        reportSettings={reportSettings}
      />
    ).toBlob();
    const clientSlug = (client?.name || event?.title || 'cliente').replace(/\s+/g, '_').substring(0, 20);
    const dateSlug = event?.start_date ? event.start_date.replace(/-/g, '') : format(new Date(), 'yyyyMMdd');
    const filename = `Fechamento_${clientSlug}_${dateSlug}.pdf`;
    return { blob, filename };
  };

  const handleDownloadPDF = async () => {
    if (generatingPDF) return;
    setGeneratingPDF(true);
    try {
      const { blob, filename } = await generateClosingPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      appToast.success('PDF de Fechamento gerado!', { description: filename });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      appToast.error('Erro ao gerar PDF', { description: err.message });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSharePDF = async () => {
    if (sharingPDF) return;
    setSharingPDF(true);
    try {
      const { blob, filename } = await generateClosingPdfBlob();
      const message = buildFullReportMessage();
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });
      const filesToShare = [pdfFile];

      if (event?.nfe_arquivo_url) {
        try {
          const resp = await fetch(event.nfe_arquivo_url);
          if (resp.ok) {
            const nfeBlob = await resp.blob();
            const nfeName = event.nfe_arquivo_nome || `NFe_${event.nfe_numero || event.nf_number || 'anexo'}.pdf`;
            const nfeFile = new File([nfeBlob], nfeName, { type: nfeBlob.type || 'application/pdf' });
            filesToShare.push(nfeFile);
          }
        } catch {
          // Em caso de falha de rede/CORS no anexo da NF-e, envia ao menos o PDF de Fechamento
        }
      }

      const shareableFiles = (typeof navigator !== 'undefined' && navigator.canShare)
        ? (navigator.canShare({ files: filesToShare })
            ? filesToShare
            : (navigator.canShare({ files: [pdfFile] }) ? [pdfFile] : null))
        : null;

      if (shareableFiles) {
        await navigator.share({
          title: `Fechamento — ${event?.title || client?.name || 'Evento'}`,
          text: message,
          files: shareableFiles,
        });
        appToast.success(
          shareableFiles.length > 1
            ? 'PDF de Fechamento + NF-e prontos para envio!'
            : 'PDF pronto para envio!'
        );
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        if (client?.phone) {
          openWhatsAppCharge(client.phone, message);
          appToast.success('PDF baixado + WhatsApp aberto!', {
            description: 'Anexe o PDF recém-baixado na conversa do WhatsApp.',
          });
        } else {
          await navigator.clipboard?.writeText(message);
          appToast.success('PDF baixado + Relatório copiado!', {
            description: filename,
          });
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Erro ao compartilhar PDF:', err);
        appToast.error('Erro ao enviar PDF', { description: err.message });
      }
    } finally {
      setSharingPDF(false);
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

  // Orçamento em PDF (ideia #111): no celular abre o compartilhar (WhatsApp) com o PDF;
  // no computador baixa o PDF e abre o WhatsApp do cliente com a mensagem.
  const handleQuotePDF = async () => {
    if (generatingQuote) return;
    setGeneratingQuote(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { QuotePDFDocument } = await import('@/lib/QuotePDFDocument');
      const quote = buildQuote({ event, client, settings: userSettings || {}, profile: profile || {} });
      const blob = await pdf(<QuotePDFDocument quote={quote} />).toBlob();
      // Nome do arquivo sem acento (abre igual em qualquer celular/computador)
      const clientSlug = (client?.name || 'cliente').normalize('NFD').replace(/\p{M}/gu, '')
        .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'cliente';
      const filename = `Orcamento_${clientSlug}_${quote.number}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });
      const message = quoteMessage(quote);
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Orçamento — ${event?.title || 'Evento'}`, text: message, files: [file] });
        appToast.success('Orçamento pronto para enviar!');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        if (client?.phone) {
          openWhatsAppCharge(client.phone, message);
          appToast.success('Orçamento baixado + WhatsApp aberto', { description: 'Anexe o PDF na conversa.' });
        } else {
          appToast.success('Orçamento gerado!', { description: filename });
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') appToast.error('Erro ao gerar orçamento', { description: err?.message });
    } finally {
      setGeneratingQuote(false);
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

  // Valor único do evento: horas lançadas + diária dos dias sem registro (Lote 3).
  // É o mesmo número da cobrança (WhatsApp/PIX), do "a receber" e do recebimento.
  const receivableAmount = useMemo(
    () => (event ? calculateEventReceivableAmount(event, eventWork) : 0),
    [event, eventWork]
  );

  const estimatedValue = useMemo(() => {
    if (!event || eventWork.length > 0) return null;
    return getEventCacheAmount(event);
  }, [event, eventWork.length]);

  const eventDays = useMemo(() => {
    const start = event?.start_date;
    const end = event?.end_date || event?.start_date;
    if (!start || !end) return [];
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
    const revenue = Number(event.paid_amount) > 0 ? Number(event.paid_amount) : receivableAmount || 0;
    if (revenue <= 0 && expenseTotals.total <= 0) return null;
    const profit = revenue - expenseTotals.total;
    const margin = revenue > 0 ? (profit / revenue) * 100 : null;
    return { revenue, expenses: expenseTotals.total, profit, margin };
  }, [event, expenseTotals.total, receivableAmount]);

  if (!event) return null;

  // Fechamento do evento inteiro (todos os dias) — aparece quando o evento terminou ou já possui horas registradas hoje.
  const closingTodayIso = normalizeDateString(new Date());
  const closingEnd = event.end_date || event.start_date || '';
  const hasAnyWork = eventWork.length > 0 || Boolean(event.auto_hours_applied);
  const eventEnded =
    Boolean(closingEnd) &&
    !isCancelledEvent(event) &&
    (closingEnd < closingTodayIso || (closingEnd === closingTodayIso && hasAnyWork));
  const closing = eventEnded ? buildEventClosing(event, eventWork, eventExpenses) : null;
  const fmtDayShort = (iso) => String(iso || '').slice(5, 10).split('-').reverse().join('/');
  const savedNfeNum = event.nfe_numero || event.nf_number || '';
  const hasLinkedNfe = Boolean(savedNfeNum || event.nfe_arquivo_url);

  const closingSummaryCard = closing ? (
    <Card className="bg-[#161616] border-[#333333]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-[#a8a8a8]">Valor total no Fechamento</p>
            <p className="text-2xl font-black text-white font-tag">
              {isVisible ? formatCurrency(closing.total) : '••••'}
            </p>
            <p className="text-xs text-[#a8a8a8]">
              {closing.rows.length} {closing.rows.length === 1 ? 'dia' : 'dias'} · {closing.totalHoras} h
              {closing.totalReembolsos > 0 && isVisible ? ` · reembolso ${formatCurrency(closing.totalReembolsos)}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              userSettings?.pix_key
                ? 'bg-[#ffd400]/10 border-[#ffd400]/30 text-[#ffd400]'
                : 'bg-[#ffd400]/10 border-[#ffd400]/30 text-[#ffd400]'
            }`}>
              {userSettings?.pix_key ? '✓ PIX no PDF' : '⚠ Sem PIX no PDF'}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              hasLinkedNfe
                ? 'bg-[#ffd400]/10 border-[#ffd400]/30 text-[#ffd400]'
                : 'bg-[#222222] border-[#333333] text-[#e0e0e0]'
            }`}>
              {hasLinkedNfe ? `✓ NF-e ${savedNfeNum || 'anexada'}` : 'NF-e opcional'}
            </span>
          </div>
        </div>

        {closing.semHoras.length > 0 && (
          <div className="rounded-lg border border-[#ffd400]/40 bg-[#ffd400]/10 p-3 text-sm text-[#ffd400]">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Faltam horas em {closing.semHoras.length} {closing.semHoras.length === 1 ? 'dia' : 'dias'}: {closing.semHoras.map(fmtDayShort).join(', ')}
            </p>
            <p className="text-xs text-[#ffd400]/80 mt-1">Esses dias entram no relatório com a diária, sem horas extras.</p>
            <button
              type="button"
              onClick={() => { setActiveTab('trabalho'); openWorkModal(closing.semHoras[0], null); }}
              className="mt-2 text-xs font-semibold underline underline-offset-2"
            >
              Lançar horas agora
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  ) : null;

  // Confirmar recebimento só com as horas preenchidas (regra do dono); o usuário pode
  // escolher "cobrar assim mesmo".
  // Confirmar recebimento usa a mesma janela das outras telas: o usuario digita o VALOR REAL
  // que caiu na conta (regra do dono), escolhe a forma e a data; a janela ja trava se faltarem horas.
  const requestMarkPaid = () => {
    if (event.payment_status === 'paid') return;
    setPayModalOpen(true);
  };

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
      <Button onClick={requestMarkPaid} className="flex-1">
        <CheckCircle2 className="w-4 h-4 mr-2" />Confirmar Recebimento
      </Button>
    );
  } else if ((status === 'completed' || status === 'archived') && event.payment_status === 'paid') {
    primaryCTA = (
      <Button onClick={handleDownloadPDF} disabled={generatingPDF} className="flex-1 bg-[#ffd400] text-[#0a0a0a] hover:bg-[#ffe033] font-bold">
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
      <Card className="rounded-2xl bg-[#161616] border-[#ffd400]/60 shadow-none">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#ffd400]/20 flex items-center justify-center flex-shrink-0">
              <PartyPopper className="w-5 h-5 text-[#ffd400]" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#ffd400] text-sm">Evento fechado!</p>
              <p className="text-xs text-[#ffd400]/70 mt-0.5">
                {totals.totalHours > 0 ? `${totals.totalHours}h registradas` : 'Horas OK'}
                {' · Pagamento confirmado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-[#ffd400] hover:text-[#ffd400] transition-colors"
          >
            NF-e & PDF <ArrowRight className="w-3 h-3" />
          </button>
        </CardContent>
      </Card>
    ) : (
      <Card className="bg-[#161616] border-[#ffd400]/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-[#ffd400]">
            <ClipboardCheck className="w-4 h-4" />
            Próximos passos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {/* Horas */}
          <div className="flex items-center gap-3">
            {horasDone
              ? <CheckCircle2 className="w-5 h-5 text-[#ffd400] flex-shrink-0" />
              : <Circle className="w-5 h-5 text-[#888888] flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${horasDone ? 'text-[#a8a8a8] line-through' : 'text-white'}`}>
                Registrar horas trabalhadas
              </p>
              {horasDone && totals.totalHours > 0 && (
                <p className="text-xs text-[#ffd400]">{totals.totalHours}h · {isVisible ? formatCurrency(totals.totalEarned) : '••••'}</p>
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
                    onClick={() => openWorkModal(null, null)}
                    className="h-7 px-2 text-xs border-[#333333] hover:bg-[#222222]"
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
              ? <CheckCircle2 className="w-5 h-5 text-[#ffd400] flex-shrink-0" />
              : <Circle className="w-5 h-5 text-[#888888] flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${pagamentoDone ? 'text-[#a8a8a8] line-through' : 'text-white'}`}>
                Confirmar recebimento ({isVisible ? formatCurrency(receivableAmount) : '••••'})
              </p>
              {!pagamentoDone && event.payment_due_date && (
                <p className="text-xs text-[#ffd400]">Vence {formatDisplayDate(event.payment_due_date)}</p>
              )}
            </div>
            {!pagamentoDone && (
              <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                <Button size="sm" onClick={requestMarkPaid} className="h-7 px-2 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Pago
                </Button>
              </div>
            )}
          </div>

          {/* Fechamento / NF-e / PDF — aponta para aba Fiscal */}
          <div className="flex items-center gap-3 pt-1 border-t border-[#262626]">
            {(event.nfe_arquivo_url || event.nfe_numero)
              ? <CheckCircle2 className="w-5 h-5 text-[#ffd400] flex-shrink-0" />
              : <Circle className="w-5 h-5 text-[#ffd400]/50 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Fechamento, NF-e & PDF com PIX</p>
              <p className="text-xs text-[#a8a8a8]">
                {event.nfe_numero ? `NF ${event.nfe_numero} vinculada` : 'Anexar NF-e e gerar relatório PDF'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('fiscal')}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-[#ffd400] hover:text-[#ffd400] transition-colors"
            >
              Abrir Dinheiro <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </CardContent>
      </Card>
    )
  ) : null;

  // Cabeçalho "credencial": data curta + título grande (empresa/evento)
  const headerDisplay = (() => {
    const { companyName, eventName, showEventSubtitle } = getEventDisplay(event, client);
    return showEventSubtitle
      ? { bigTitle: eventName, subtitle: event?.client_id && companyName !== 'Sem empresa' ? companyName : null }
      : { bigTitle: companyName, subtitle: null };
  })();
  const headerDateLabel = (() => {
    const start = event?.start_date ? new Date(`${String(event.start_date).slice(0, 10)}T12:00:00`) : null;
    const end = event?.end_date ? new Date(`${String(event.end_date).slice(0, 10)}T12:00:00`) : null;
    if (!start || Number.isNaN(start.getTime())) return 'DATA A DEFINIR';
    const fmt = (d) => format(d, 'EEE d MMM', { locale: ptBR }).replace(/\./g, '').toUpperCase();
    if (end && !Number.isNaN(end.getTime()) && end.getTime() !== start.getTime()) return `${fmt(start)} → ${fmt(end)}`;
    return fmt(start);
  })();

  return (
    <>
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[95dvh] bg-[#0a0a0a] border-[#222222] text-white flex flex-col p-0 overflow-hidden bp-focus-scope [&>button:last-child]:text-[#0a0a0a] [&>button:last-child]:opacity-100">

        {/* Header: credencial amarela do evento (visual All Access) */}
        <DialogHeader className="flex-shrink-0 space-y-0 text-left">
          {/* Titulo para leitor de tela (exigido pelo Radix) */}
          <DialogTitle className="sr-only">{event?.title || client?.name || 'Detalhes do evento'}</DialogTitle>
          <DialogDescription className="sr-only">Detalhes, horas e pagamento do evento</DialogDescription>
          <div className="px-5 pt-4 pb-4" style={{ background: '#ffd400', color: '#0a0a0a' }}>
            <p className="font-tag text-[11px] font-bold tracking-[0.14em] pr-10">{headerDateLabel}</p>
            <p className="font-poster text-[30px] leading-[0.95] uppercase mt-1.5 pr-8 break-words">{headerDisplay.bigTitle}</p>
            {headerDisplay.subtitle && (
              <p className="text-sm font-bold mt-1 truncate">{headerDisplay.subtitle}</p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#0a0a0a] text-[#ffd400] font-tag text-[10px] font-bold uppercase">
                {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                {statusConfig.label}
              </span>
              {event.payment_status === 'paid' && (
                <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#0a0a0a] text-white font-tag text-[10px] font-bold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />Pago
                </span>
              )}
            </div>
          </div>
          <div className="h-2" style={{ background: 'repeating-linear-gradient(90deg, #ffd400 0 14px, #0a0a0a 14px 20px)' }} />
        </DialogHeader>

        {/* Lifecycle bar */}
        <LifecycleBar event={event} hasWork={hasWork} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-5 pt-3 flex-shrink-0">
            <TabsList className="w-full bg-transparent h-10 p-0 gap-1.5">
              <TabsTrigger
                value="resumo"
                className="flex-1 text-[13px] font-extrabold h-10 rounded-full border border-[#333333] text-white data-[state=active]:bg-[#ffd400] data-[state=active]:border-[#ffd400] data-[state=active]:text-[#0a0a0a] data-[state=active]:shadow-none"
              >
                Resumo
              </TabsTrigger>
              <TabsTrigger
                value="trabalho"
                className="flex-1 text-[13px] font-extrabold h-10 rounded-full border border-[#333333] text-white data-[state=active]:bg-[#ffd400] data-[state=active]:border-[#ffd400] data-[state=active]:text-[#0a0a0a] data-[state=active]:shadow-none"
              >
                Horas{eventWork.length > 0 ? ` (${eventWork.length})` : ''}
              </TabsTrigger>
              <TabsTrigger
                value="fiscal"
                className="flex-1 text-[13px] font-extrabold h-10 rounded-full border border-[#333333] text-white data-[state=active]:bg-[#ffd400] data-[state=active]:border-[#ffd400] data-[state=active]:text-[#0a0a0a] data-[state=active]:shadow-none"
              >
                Dinheiro{(event.nfe_arquivo_url || event.nfe_numero) ? ' ●' : ''}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea fill className="px-6">

            {/* ── RESUMO ── */}
            <TabsContent value="resumo" className="mt-0 pt-4 space-y-4 pb-6 data-[state=inactive]:hidden">

              {crmCard}

              {/* Informações básicas */}
              <Card className="rounded-2xl bg-[#161616] border-[#222222] shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 bp-text-primary" />
                    Informações do Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {event.start_date === event.end_date || !event.end_date ? (
                    <div>
                      <p className="text-xs text-[#a8a8a8] mb-1">Data</p>
                      <p className="text-white font-medium text-sm">{formatDisplayDate(event.start_date)}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#a8a8a8] mb-1">Data Início</p>
                        <p className="text-white font-medium text-sm">{formatDisplayDate(event.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#a8a8a8] mb-1">Data Fim</p>
                        <p className="text-white font-medium text-sm">{formatDisplayDate(event.end_date)}</p>
                      </div>
                    </div>
                  )}
                  {event.description && (
                    <div>
                      <p className="text-xs text-[#a8a8a8] mb-1">Descrição</p>
                      <p className="text-white text-sm break-words">{event.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Local */}
              <Card className="rounded-2xl bg-[#161616] border-[#222222] shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 bp-text-primary" />
                    Local do evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <EventLocationSection
                    showLabel={false}
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

              {/* Equipamento: o que levar e o que voltou (ideia #113) */}
              <EquipmentChecklist
                items={event.equipment_items ?? []}
                onChange={async (next) => { await updateEvent(event.id, { equipment_items: next }); }}
                kit={normalizeKit(userSettings?.equipment_kit)}
                onSaveKit={async (kit) => {
                  const r = await upsertUserSettings({ equipment_kit: kit });
                  if (r?._somenteNoAparelho) throw new Error('Salvo só neste aparelho; tente de novo com internet.');
                }}
                // Show terminado (último dia antes de hoje): abre em Volta e avisa o que falta voltar
                done={isDoneEvent(event) && String(event.end_date || event.start_date || '').slice(0, 10) < new Date().toLocaleDateString('sv-SE')}
              />

              {/* Avaliacao do cliente (vinha so na janela dos Relatorios) */}
              <ClientRatingSection event={event} updateEvent={updateEvent} />
            </TabsContent>

            {/* ── TRABALHO ── */}
            <TabsContent value="trabalho" className="mt-0 pt-4 space-y-4 pb-6 data-[state=inactive]:hidden">

              {/* Financeiro */}
              <Card className="rounded-2xl bg-[#161616] border-[#222222] shadow-none">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-[#ffd400]" />
                    Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#a8a8a8]">Cachê contratado</p>
                    <p className="text-lg font-bold text-[#ffd400]">
                      {isVisible ? formatCurrency(getEventCacheAmount(event)) : '••••'}
                    </p>
                  </div>
                  {eventWork.length > 0 && (
                    <>
                      <Separator className="bg-[#222222]" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-[#888888] mb-0.5">Horas</p>
                          <p className="text-base font-bold bp-text-primary">{totals.totalHours}h</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#888888] mb-0.5">Extras</p>
                          <p className="text-base font-bold text-[#ffd400]">{totals.totalOvertime}h</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#888888] mb-0.5">Total a receber</p>
                          <p className="text-base font-bold text-[#ffd400]">{isVisible ? formatCurrency(receivableAmount) : '••••'}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {eventWork.length === 0 && estimatedValue !== null && (
                    <>
                      <Separator className="bg-[#222222]" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#a8a8a8]">Valor estimado</p>
                          <p className="text-[10px] text-[#888888]">Baseado no cachê × duração</p>
                        </div>
                        <p className="text-lg font-bold text-[#ffd400]">{isVisible ? formatCurrency(estimatedValue) : '••••'}</p>
                      </div>
                    </>
                  )}
                  {profitSummary && expenseTotals.total > 0 && (
                    <>
                      <Separator className="bg-[#222222]" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-[#888888] mb-0.5">Receita</p>
                          <p className="text-base font-bold bp-text-primary">{isVisible ? formatCurrency(profitSummary.revenue) : '••••'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#888888] mb-0.5">Despesas</p>
                          <p className="text-base font-bold text-[#ff2e88]">{isVisible ? formatCurrency(profitSummary.expenses) : '••••'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#888888] mb-0.5">Lucro</p>
                          <p className={`text-base font-bold ${profitSummary.profit >= 0 ? 'text-[#ffd400]' : 'text-[#ff2e88]'}`}>
                            {isVisible ? formatCurrency(profitSummary.profit) : '••••'}
                          </p>
                        </div>
                      </div>
                      {profitSummary.margin !== null && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-[#888888] mb-1">
                            <span>Margem</span>
                            <span className={profitSummary.margin >= 0 ? 'text-[#ffd400] font-bold' : 'text-[#ff2e88] font-bold'}>
                              {Math.round(profitSummary.margin)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#222222] overflow-hidden">
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
                      <Separator className="bg-[#222222]" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#a8a8a8]">Vencimento</p>
                          <p className="text-base font-bold text-[#ffd400]">{formatDisplayDate(event.payment_due_date)}</p>
                        </div>
                        <AlertTriangle className="w-4 h-4 text-[#ffd400] flex-shrink-0" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Cronômetro */}
              {['pending', 'scheduled', 'confirmed', 'in_progress'].includes(status) && (
                <div className="flex items-center justify-between p-3 bg-[#161616] rounded-lg border border-[#262626]">
                  <div>
                    <p className="font-tag text-[11px] tracking-[2px] uppercase text-[#a8a8a8]">Cronômetro</p>
                    <p className="text-xs text-[#a8a8a8]">
                      {activeTimer?.eventId === event.id ? 'Timer ativo' : 'Registre seu tempo em andamento'}
                    </p>
                  </div>
                  <Button
                    onClick={handleToggleTimer}
                    variant="outline"
                    size="sm"
                    className={`transition-colors ${
                      activeTimer?.eventId === event.id
                        ? 'border-[#ff2e88]/50 bg-[#ff2e88]/10 text-[#ff2e88] hover:bg-[#ff2e88]/20'
                        : ''
                    }`}
                    style={activeTimer?.eventId !== event.id ? { borderColor: `${primaryHex}99`, color: primaryHex } : undefined}
                  >
                    {activeTimer?.eventId === event.id
                      ? <><Square className="w-4 h-4 fill-[#ff2e88] mr-2" />Parar</>
                      : <><Timer className="w-4 h-4 mr-2" />Iniciar</>
                    }
                  </Button>
                </div>
              )}

              {/* Timeline de dias (multi-day) */}
              {eventDays.length > 0 && (
                <Card className="rounded-2xl bg-[#161616] border-[#222222] shadow-none">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 bp-text-primary" />
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
                              openWorkModal(date, work || null);
                            }}
                            className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                              work && isEstimatedWork(work) ? 'bg-[#ffd400]/10 border-[#ffd400]/40 text-[#ffd400]'
                              : work ? 'bg-[#ffd400]/10 border-[#ffd400]/40 text-[#ffd400]'
                              : isToday ? 'border-2 text-white hover:opacity-80'
                              : isPast ? 'bg-[#ff2e88]/10 border-[#ff2e88]/30 text-[#ff2e88] hover:bg-[#ff2e88]/20'
                              : 'bg-[#1a1a1a] border-[#262626] text-[#666666] cursor-not-allowed'
                            }`}
                            style={isToday && !work ? { borderColor: primaryHex, background: `${primaryHex}20`, color: primaryHex } : undefined}
                          >
                            <span>{label}</span>
                            <span className="text-[9px] opacity-80">
                              {work ? (isEstimatedWork(work) ? '12h est.' : `${work.total_hours || 0}h`) : isToday ? 'hoje' : isPast ? 'faltou' : '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {eventDays.some(d => d.isPast && !d.work) && (
                      <p className="text-[11px] text-[#ff2e88]/70 mt-2">
                        Toque num dia vermelho para registrar horas em atraso.
                      </p>
                    )}
                    {eventDays.some(d => d.work && isEstimatedWork(d.work)) && (
                      <p className="text-[11px] text-[#ffd400]/70 mt-2">
                        Dias em âmbar foram fechados com 12 h automáticas — toque para lançar as horas reais.
                      </p>
                    )}
                    {eventDays.some(d => d.work) && (
                      <p className="text-[11px] text-[#ffd400]/70 mt-2">
                        Dias verdes já registrados — toque para editar as horas.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Registros de Trabalho */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 bp-text-primary" />
                    Horas trabalhadas
                    {eventWork.length > 0 && <span className="text-[#888888] font-normal text-xs">({eventWork.length})</span>}
                  </h4>
                  {todayInEventRange && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openWorkModal(null, null)}
                      className="h-7 px-2 text-xs border-[#333333] hover:bg-[#222222]"
                    >
                      <Plus className="w-3 h-3 mr-1" />Registrar
                    </Button>
                  )}
                </div>
                {eventWork.length === 0 ? (
                  <p className="text-sm text-[#888888] text-center py-4 border border-dashed border-[#262626] rounded-lg">
                    Nenhum registro de trabalho ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eventWork.map((work, idx) => {
                      const dayRate = work.total_hours > 0 && work.daily_cache > 0 ? work.daily_cache / work.total_hours : null;
                      return (
                        <div key={work.id || idx} className="p-3 bg-[#161616] rounded-lg border border-[#262626]">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <p className="font-medium text-white text-sm">{formatDisplayDate(work.date)}</p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <div className="text-right mr-1">
                                <p className="text-[#ffd400] font-bold text-sm">{isVisible ? formatCurrency(work.daily_cache || 0) : '••••'}</p>
                                {dayRate && <p className="text-[10px] text-[#ffd400]/70">{isVisible ? formatCurrency(dayRate) : '••••'}/h</p>}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#a8a8a8] hover:text-white"
                                onClick={() => openWorkModal(normalizeDateString(work.work_date || work.date), work)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-[#ff2e88] hover:text-[#ff2e88] hover:bg-[#ff2e88]/10"
                                aria-label="Excluir registro de horas"
                                onClick={() => setConfirmDeleteWorkId(work.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div><p className="text-[#a8a8a8] text-xs">Entrada</p><p className="text-white">{work.entry_time || '-'}</p></div>
                            <div><p className="text-[#a8a8a8] text-xs">Saída</p><p className="text-white">{work.exit_time || '-'}</p></div>
                            <div><p className="text-[#a8a8a8] text-xs">Horas</p><p className="bp-text-primary font-medium">{work.total_hours || 0}h</p></div>
                          </div>
                          {work.notes && <p className="text-sm text-[#a8a8a8] mt-2 italic break-words">{work.notes}</p>}
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
                    <h4 className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-[#ffd400]" />
                      Despesas
                      {eventExpenses.length > 0 && <span className="text-xs font-normal text-[#a8a8a8]">({eventExpenses.length})</span>}
                    </h4>
                    <svg className="w-4 h-4 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showExpenses ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                    </svg>
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExpenseForm(true)}
                    className="h-7 px-2 text-xs border-[#ffd400]/40 text-[#ffd400] hover:bg-[#ffd400]/10 flex-shrink-0"
                  >
                    <Plus className="w-3 h-3 mr-1" />Adicionar
                  </Button>
                </div>
                {expenseTotals.total > 0 && (
                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <span className="text-[#a8a8a8]">Total: <span className="text-[#ff2e88] font-bold">{isVisible ? formatCurrency(expenseTotals.total) : '••••'}</span></span>
                    {expenseTotals.reimbursable > 0 && (
                      <span className="text-[#a8a8a8]">A reembolsar: <span className="text-[#ffd400] font-bold">{isVisible ? formatCurrency(expenseTotals.reimbursable) : '••••'}</span></span>
                    )}
                  </div>
                )}
                {showExpenses && (
                  eventExpenses.length === 0 ? (
                    <p className="text-sm text-[#888888] text-center py-4 border border-dashed border-[#262626] rounded-lg">
                      Nenhuma despesa registrada.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {eventExpenses.map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#161616] border border-[#262626]">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{exp.title || exp.category}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#888888]">{EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}</span>
                              {exp.date && (
                                <span className="text-[10px] text-[#666666]">
                                  · {format(new Date(exp.date + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
                                </span>
                              )}
                              {exp.is_reimbursable && !exp.reimbursed && (
                                <span className="text-[10px] text-[#ffd400] flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />reembolsável
                                </span>
                              )}
                              {exp.reimbursed && (
                                <span className="text-[10px] text-[#ffd400] flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />reembolsado
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-[#ff2e88] flex-shrink-0">
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

              {closingSummaryCard}

              {/* NF-e upload + AI */}
              <div>
                <h4 className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2 mb-3">
                  <FileText className="w-3.5 h-3.5 text-[#ffd400]" />
                  Nota Fiscal Eletrônica
                </h4>
                <NFeAttachment event={event} client={client} />
              </div>

              <Separator className="bg-[#1a1a1a]" />

              {/* PIX */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-[#ffd400]" />
                    Dados de Pagamento (PIX no PDF)
                  </h4>
                  {userSettings?.pix_key && (
                    <button
                      type="button"
                      onClick={() => setEditingPixInline((v) => !v)}
                      className="text-xs text-[#a8a8a8] hover:text-white underline underline-offset-2"
                    >
                      {editingPixInline ? 'Fechar edição' : 'Alterar chave'}
                    </button>
                  )}
                </div>

                {userSettings?.pix_key && !editingPixInline ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#e0e0e0] bg-[#0a0a0a] border border-[#222222] rounded-[12px] px-3 py-2.5 font-tag">
                      {userSettings.pix_key_type || 'Chave PIX'}: <span className="text-[#ffd400] font-bold">{userSettings.pix_key}</span>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={handleCopyPix}
                        className="flex-1 min-w-[120px]"
                      >
                        <Copy className="w-4 h-4 mr-2" />Copiar PIX Copia e Cola
                      </Button>
                      {client?.phone && (
                        <Button
                          variant="outline"
                          onClick={handlePixWhatsApp}
                          className="flex-1 min-w-[120px]"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />Enviar PIX
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[12px] border border-[#222222] bg-[#0a0a0a] p-3 space-y-2.5">
                    <p className="text-xs text-[#a8a8a8]">
                      Cadastre sua chave PIX para que ela e o código Copia e Cola saiam automaticamente no PDF de Fechamento.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={quickPixType}
                        onChange={(e) => setQuickPixType(e.target.value)}
                        className="h-11 rounded-[12px] bg-[#161616] border border-[#333333] px-3 text-base text-white"
                      >
                        {['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Chave aleatória'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={quickPixKey}
                        onChange={(e) => setQuickPixKey(e.target.value)}
                        placeholder="Sua chave PIX..."
                        className="h-11 flex-1 min-w-[150px] rounded-[12px] bg-[#161616] border border-[#333333] px-3 text-base text-white placeholder:text-[#666666] focus:outline-none focus:border-[#ffd400]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingQuickPix || !quickPixKey.trim()}
                        onClick={handleSaveQuickPix}
                        className="h-11 px-4 text-xs"
                      >
                        {savingQuickPix ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar PIX'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-[#1a1a1a]" />

              {/* Documentos PDF */}
              <div>
                <h4 className="font-tag text-[11px] font-normal tracking-[2px] uppercase text-[#a8a8a8] flex items-center gap-2 mb-3">
                  <FileText className="w-3.5 h-3.5 text-[#a8a8a8]" />
                  Documentos e Fechamento
                </h4>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={generatingPDF}
                    variant="outline"
                    className="w-full h-auto min-h-[52px] py-2.5 justify-start whitespace-normal text-left rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-white hover:bg-[#161616] font-bold"
                  >
                    {generatingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                    Baixar fechamento em PDF
                  </Button>
                  <Button
                    onClick={handleSharePDF}
                    disabled={sharingPDF}
                    variant="outline"
                    className="w-full h-auto min-h-[52px] py-2.5 justify-start whitespace-normal text-left rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-white hover:bg-[#161616] font-bold"
                  >
                    {sharingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Enviar PDF + PIX no WhatsApp
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCopyClosingLink}
                    variant="outline"
                    className="w-full h-auto min-h-[52px] py-2.5 justify-start whitespace-normal text-left rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-white hover:bg-[#161616] font-bold"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Copiar link do fechamento (para a produtora)
                  </Button>
                  {event.payment_status === 'paid' && (
                    <Button
                      onClick={handleDownloadReceipt}
                      disabled={generatingReceipt}
                      variant="outline"
                      className="w-full h-auto min-h-[52px] py-2.5 justify-start whitespace-normal text-left rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-white hover:bg-[#161616] font-bold"
                    >
                      {generatingReceipt ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BadgeCheck className="w-4 h-4 mr-2" />}
                      Recibo de Pagamento
                    </Button>
                  )}
                  {['pending', 'scheduled', 'confirmed', 'in_progress'].includes(status) && (
                    <Button
                      onClick={handleQuotePDF}
                      disabled={generatingQuote}
                      variant="outline"
                      className="w-full h-auto min-h-[52px] py-2.5 justify-start whitespace-normal text-left rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-white hover:bg-[#161616] font-bold"
                    >
                      {generatingQuote ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      Orçamento em PDF
                    </Button>
                  )}
                  {['pending', 'scheduled', 'confirmed', 'in_progress'].includes(status) && (
                    <Button
                      onClick={handleDownloadContract}
                      disabled={generatingContract}
                      variant="outline"
                      className="w-full h-auto min-h-[52px] py-2.5 justify-start whitespace-normal text-left rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-white hover:bg-[#161616] font-bold"
                    >
                      {generatingContract ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScrollText className="w-4 h-4 mr-2" />}
                      Contrato de Serviços
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open('https://www.nfse.gov.br/EmissorNacional/Login', '_blank', 'noopener,noreferrer')}
                    className="w-full h-auto min-h-[52px] py-2.5 justify-start whitespace-normal text-left rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-white hover:bg-[#161616] font-bold"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />Portal NFS-e Nacional
                  </Button>
                </div>
              </div>
            </TabsContent>

          </ScrollArea>
        </Tabs>

        {/* Footer simplificado: 1 CTA primário + timer + ··· */}
        <DialogFooter className="px-6 py-4 border-t border-[#222222] flex-row gap-2 flex-shrink-0">
          {primaryCTA}

          {['confirmed', 'scheduled', 'pending'].includes(status) && (
            <Button
              onClick={handleToggleTimer}
              variant="outline"
              size="icon"
              className={`flex-shrink-0 transition-colors ${
                activeTimer?.eventId === event.id
                  ? 'border-[#ff2e88]/50 bg-[#ff2e88]/10 text-[#ff2e88] hover:bg-[#ff2e88]/20'
                  : ''
              }`}
              style={activeTimer?.eventId !== event.id ? { borderColor: `${primaryHex}99`, color: primaryHex } : undefined}
              title={activeTimer?.eventId === event.id ? 'Parar timer' : 'Iniciar timer'}
            >
              {activeTimer?.eventId === event.id
                ? <Square className="w-4 h-4 fill-[#ff2e88]" />
                : <Timer className="w-4 h-4" />
              }
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Mais ações do trabalho" className="flex-shrink-0 border-[#262626] hover:bg-[#1a1a1a]">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="bg-[#161616] border-[#262626] text-white min-w-[180px]">
              <DropdownMenuItem onClick={() => onEdit?.(event)} className="gap-2 cursor-pointer hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]">
                <Edit className="w-4 h-4" /> Editar evento
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(event)} className="gap-2 cursor-pointer hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]">
                  <Copy className="w-4 h-4" /> Duplicar
                </DropdownMenuItem>
              )}
              {client?.id && (
                <DropdownMenuItem
                  onClick={() => { onClose(); hardNavigate(`/client-detail?id=${client.id}`); }}
                  className="gap-2 cursor-pointer hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]"
                >
                  <ExternalLink className="w-4 h-4" /> Ver cliente
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-[#1a1a1a]" />
              {['pending', 'scheduled', 'confirmed'].includes(status) && (
                <DropdownMenuItem onClick={handleSendProposal} className="gap-2 cursor-pointer hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]">
                  <Send className="w-4 h-4" /> Enviar proposta (texto)
                </DropdownMenuItem>
              )}
              {['pending', 'scheduled', 'confirmed'].includes(status) && (
                <DropdownMenuItem onClick={handleQuotePDF} className="gap-2 cursor-pointer hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]">
                  <FileText className="w-4 h-4" /> Orçamento em PDF
                </DropdownMenuItem>
              )}
              {client?.phone && (
                <>
                  <DropdownMenuItem onClick={handleChargeWhatsApp} className="gap-2 cursor-pointer hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]">
                    <MessageCircle className="w-4 h-4" /> Cobrar via WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendReport} className="gap-2 cursor-pointer hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]">
                    <Receipt className="w-4 h-4" /> Enviar relatório
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-[#1a1a1a]" />
              <DropdownMenuItem
                onClick={() => onDelete?.(event?.id)}
                className="gap-2 cursor-pointer text-[#ff2e88] focus:text-[#ff2e88] focus:bg-[#ff2e88]/20 hover:bg-[#ff2e88]/20"
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
      onClose={closeWorkModal}
      date={workModalDate ? new Date(workModalDate + 'T00:00:00') : new Date()}
      event={event}
      existingWork={editingWorkEntry}
      onSuccess={closeWorkModal}
    />

    <ConfirmDialog
      open={!!confirmDeleteWorkId}
      onOpenChange={(open) => !open && setConfirmDeleteWorkId(null)}
      title="Excluir registro de horas?"
      description="Esta ação não pode ser desfeita. O cachê calculado para este dia será removido."
      confirmLabel="Excluir"
      destructive
      onConfirm={handleConfirmDeleteWork}
    />

    <ExpenseForm
      open={showExpenseForm}
      onOpenChange={setShowExpenseForm}
      initialEventId={event?.id}
      // Sem a lista, o campo "Trabalho" aparecia vazio (a despesa ligava, mas não mostrava a qual show).
      events={event ? [event] : []}
      onSuccess={() => {
        refetchExpenses();
        setShowExpenseForm(false);
      }}
    />
      <PaymentConfirmModal
        event={event}
        client={client}
        dailyWork={eventWork}
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSuccess={() => { setPayModalOpen(false); onMarkPaid?.(); }}
      />
    </>
  );
}
