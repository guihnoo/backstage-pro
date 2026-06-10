import { useState, useMemo, useEffect } from 'react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  MapPin,
  FileText,
  Download,
  Zap,
  Loader2,
  MessageCircle,
  ExternalLink,
  Receipt,
  Send,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import {
  formatDisplayDate,
  getEventStatus,
  getEventStatusConfig
} from '../utils/dateUtils';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { useDailyWork } from '@/lib/useDailyWork';
import { applyAuto12Hours } from '@/api/functions';
import { useStatusToggle } from '@/lib/useStatusToggle';
import { openWhatsAppCharge, formatBRL, buildEventReport } from '@/lib/whatsapp';
import { toast } from 'sonner';
import EventHeading from '@/components/events/EventHeading';
import EventLocationSection from '@/components/events/EventLocationSection';
import { useEvents } from '@/lib/useEvents';
import { useExpenses } from '@/lib/useExpenses';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { useUserSettings } from '@/lib/useUserSettings';
import {
  parseISO,
  differenceInDays,
  format
} from 'date-fns';
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

export default function EventDetailModal({
  event,
  client,
  onClose,
  onEdit,
  onDelete,
  onAddWork,
  onMarkPaid
}) {
  const { formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const { dailyWork } = useDailyWork();
  const { update: updateEvent } = useEvents();
  const { expenses, refetch: refetchExpenses } = useExpenses();
  const { settings: userSettings } = useUserSettings();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [applying12h, setApplying12h] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
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
    if (!event) return;
    setLocDraft({
      location: event.location || '',
      location_city: event.location_city || '',
      location_state: event.location_state || '',
      location_lat: event.location_lat ?? null,
      location_lng: event.location_lng ?? null,
    });
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
      await updateEvent(event.id, {
        location: patch.location?.trim() || null,
        location_city: patch.location_city || null,
        location_state: patch.location_state || null,
        location_lat: patch.location_lat,
        location_lng: patch.location_lng,
      });
      toast.success('Local do evento salvo');
    } catch (err) {
      toast.error('Erro ao salvar local', { description: err.message });
    } finally {
      setSavingLocation(false);
    }
  };

  const handleShareWhatsApp = () => {
    const phone = client?.phone;
    if (!phone) {
      toast.error('Cliente sem telefone cadastrado.');
      return;
    }
    const dateStr = event.start_date
      ? new Date(event.start_date + 'T12:00:00').toLocaleDateString('pt-BR')
      : '';
    const timeStr = event.start_time
      ? event.start_time.slice(0, 5)
      : '';
    const value = getEventCacheAmount(event);
    const parts = [`*${event.title}*`];
    if (dateStr) parts.push(`📅 ${dateStr}`);
    if (timeStr) parts.push(`🕐 ${timeStr}`);
    if (event.location) parts.push(`📍 ${event.location}`);
    if (value > 0) parts.push(`💰 ${formatBRL(value)}`);
    openWhatsAppCharge(phone, parts.join('\n'));
  };

  const handleSendReport = () => {
    const phone = client?.phone;
    if (!phone) {
      toast.error('Cliente sem telefone cadastrado.', {
        description: 'Adicione o telefone na página do cliente para enviar o relatório.',
      });
      return;
    }
    const message = buildEventReport({
      event,
      client,
      work: eventWork,
      expenses: eventExpenses,
    });
    const ok = openWhatsAppCharge(phone, message);
    if (!ok) toast.error('Não foi possível abrir o WhatsApp.');
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
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso!', { description: filename });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF', { description: err.message });
    } finally {
      setGeneratingPDF(false);
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
    return { totalHours, totalOvertime, totalEarned };
  }, [eventWork]);

  const estimatedValue = useMemo(() => {
    if (!event || eventWork.length > 0) return null;
    return getEventCacheAmount(event);
  }, [event, eventWork.length]);

  const eventExpenses = useMemo(() => {
    if (!event) return [];
    return (expenses || []).filter(e => e.event_id === event.id);
  }, [expenses, event]);

  const expenseTotals = useMemo(() => {
    const total = eventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const reimbursable = eventExpenses
      .filter(e => e.is_reimbursable && !e.reimbursed)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    return { total, reimbursable };
  }, [eventExpenses]);

  if (!event) return null;

  const status = getEventStatus(event);
  const statusConfig = getEventStatusConfig(event);
  const StatusIcon = statusConfig.icon;

  const handleApply12Hours = async () => {
    setApplying12h(true);
    try {
      const result = await applyAuto12Hours({ eventId: event.id, origin: 'manual_12h' });
      
      if (result.data.success) {
        toast.success('12 horas aplicadas automaticamente!', {
          description: 'Você pode editar depois se necessário.',
          duration: 5000
        });
        onClose();
        window.location.reload();
      } else {
        toast.error('Erro ao aplicar horas', {
          description: result.data.error || 'Tente novamente.'
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar 12h:', error);
      toast.error('Erro ao aplicar horas automáticas', {
        description: error.message || 'Tente novamente.'
      });
    } finally {
      setApplying12h(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[95dvh] bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200 flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <EventHeading event={event} client={client} size="lg" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusConfig.badgeClass}>
                  {StatusIcon && <StatusIcon className="w-4 h-4 mr-1" />}
                  {statusConfig.label}
                </Badge>
                {event.payment_status === 'paid' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Pago
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea fill className="px-6">
          <div className="space-y-6 py-6">
            
            {/* Quick Actions para evento concluído */}
            {status === 'completed' && !event.auto_hours_applied && (
              <Card className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 border-purple-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="font-bold text-purple-200">Ação Rápida Disponível</h4>
                      <p className="text-sm text-purple-300/80">
                        Aplique 12h automaticamente sem precisar registrar manualmente
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleApply12Hours}
                    disabled={applying12h}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {applying12h ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aplicando 12h...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Aplicar 12h Automáticas
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Informações Básicas */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Informações do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Data Início</p>
                    <p className="text-white font-medium">{formatDisplayDate(event.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Data Fim</p>
                    <p className="text-white font-medium">{formatDisplayDate(event.end_date)}</p>
                  </div>
                </div>

                {event.description && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-400">Descrição</p>
                      <p className="text-white">{event.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  Local do evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                    className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700"
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

            {/* Informações Financeiras */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Informações Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cachê do Evento</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(getEventCacheAmount(event))}
                  </p>
                </div>

                {eventWork.length > 0 ? (
                  <>
                    <Separator className="bg-slate-700" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Horas Trabalhadas</p>
                        <p className="text-xl font-bold text-cyan-400">{totals.totalHours}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Horas Extras</p>
                        <p className="text-xl font-bold text-orange-400">{totals.totalOvertime}h</p>
                      </div>
                    </div>
                    <Separator className="bg-slate-700" />
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Ganho</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(totals.totalEarned)}
                      </p>
                    </div>
                  </>
                ) : estimatedValue !== null && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Valor Estimado</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {formatCurrency(estimatedValue)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Baseado no cachê diário e duração do evento
                      </p>
                    </div>
                  </>
                )}

                {event.payment_due_date && event.payment_status !== 'paid' && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400 mb-0.5">Vencimento do pagamento</p>
                        <p className="text-base font-bold text-amber-400">
                          {formatDisplayDate(event.payment_due_date)}
                        </p>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Despesas do Evento */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowExpenses(v => !v)}
                    className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  >
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      Despesas do Evento
                      {eventExpenses.length > 0 && (
                        <span className="text-xs font-normal text-slate-400">
                          ({eventExpenses.length})
                        </span>
                      )}
                    </CardTitle>
                    {showExpenses ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExpenseForm(true)}
                    className="h-8 px-2.5 text-xs border-amber-600/40 text-amber-300 hover:bg-amber-500/10 flex-shrink-0"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {expenseTotals.total > 0 && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/50">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total</p>
                      <p className="text-sm font-bold text-red-300">{formatCurrency(expenseTotals.total)}</p>
                    </div>
                    {expenseTotals.reimbursable > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">A reembolsar</p>
                        <p className="text-sm font-bold text-amber-300">{formatCurrency(expenseTotals.reimbursable)}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              {showExpenses && (
                <CardContent className="pt-0">
                  {eventExpenses.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-3">
                      Nenhuma despesa registrada para este evento.
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
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  reembolsável
                                </span>
                              )}
                              {exp.reimbursed && (
                                <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  reembolsado
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-red-300 flex-shrink-0">
                            {formatCurrency(exp.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Registros de Trabalho */}
            {eventWork.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Registros de Trabalho ({eventWork.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eventWork.map((work, idx) => (
                      <div
                        key={work.id || idx}
                        className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-white">
                            {formatDisplayDate(work.date)}
                          </p>
                          <p className="text-green-400 font-bold">
                            {formatCurrency(work.daily_cache || 0)}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-slate-400">Entrada</p>
                            <p className="text-white">{work.entry_time || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Saída</p>
                            <p className="text-white">{work.exit_time || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Horas</p>
                            <p className="text-cyan-400 font-medium">{work.total_hours || 0}h</p>
                          </div>
                        </div>
                        {work.notes && (
                          <p className="text-sm text-slate-400 mt-2 italic">{work.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer com Ações */}
        <DialogFooter className="px-6 py-4 border-t border-slate-800 flex-row gap-2 flex-wrap flex-shrink-0">
          <Button
            onClick={onAddWork}
            className="flex-1 min-w-[120px] bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Horas
          </Button>
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1 min-w-[80px] border-slate-700 hover:bg-slate-800"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          {event.status === 'pending' && (
            <Button
              onClick={() => confirmEvent(event, onClose)}
              disabled={toggling === event.id}
              variant="outline"
              className="flex-1 min-w-[120px] border-blue-700 hover:bg-blue-900/20 text-blue-400"
            >
              {toggling === event.id
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <CheckCircle2 className="w-4 h-4 mr-2" />
              }
              Confirmar
            </Button>
          )}
          {status === 'completed' && event.payment_status !== 'paid' && (
            <Button
              onClick={onMarkPaid}
              variant="outline"
              className="flex-1 min-w-[140px] border-green-700 hover:bg-green-900/20 text-green-400"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Marcar como Pago
            </Button>
          )}
          <Button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            variant="outline"
            className="flex-shrink-0 border-blue-600 hover:bg-blue-900/20 text-blue-300"
            title="Baixar relatório de fechamento em PDF"
          >
            {generatingPDF
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileText className="w-4 h-4" />
            }
          </Button>
          {client?.phone && (
            <Button
              onClick={handleSendReport}
              variant="outline"
              className="flex-shrink-0 border-amber-600 hover:bg-amber-900/20 text-amber-300"
              title="Enviar relatório resumido via WhatsApp"
            >
              <Receipt className="w-4 h-4" />
            </Button>
          )}
          {client?.phone && (
            <Button
              onClick={handleShareWhatsApp}
              variant="outline"
              className="flex-shrink-0 border-green-600 hover:bg-green-900/20 text-green-400"
              title="Enviar detalhes via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
          {client?.id && (
            <Button
              onClick={() => { onClose(); hardNavigate(`/client-detail?id=${client.id}`); }}
              variant="outline"
              className="flex-shrink-0 border-slate-700 hover:bg-slate-800 text-slate-300"
              title={`Ver detalhes de ${client.name || 'cliente'}`}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={onDelete}
            variant="outline"
            className="flex-shrink-0 border-red-700 hover:bg-red-900/20 text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>

      {showExpenseForm && (
        <ExpenseForm
          open={showExpenseForm}
          onOpenChange={setShowExpenseForm}
          initialEventId={event?.id}
          onSuccess={() => {
            refetchExpenses();
            setShowExpenseForm(false);
          }}
        />
      )}
    </Dialog>
  );
}