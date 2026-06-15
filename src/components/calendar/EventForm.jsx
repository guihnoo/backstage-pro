import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { differenceInDays, parseISO, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, BookmarkPlus, TrendingUp, Star, CalendarDays } from 'lucide-react';
import appToast from '@/lib/appToast';
import { hardNavigate } from '@/lib/hardNavigate';
import { normalizeDateString } from '@/components/utils/dateUtils';
import { useEvents } from '@/lib/useEvents';
import { getEventCacheAmount, isCancelledEvent } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { EventTemplate } from '@/api/entities';
import EventTemplateModal from './EventTemplateModal';
import { DEFAULT_EVENT_COLOR, resolveEventColor } from '@/lib/brandColors';
import { useClients } from '@/lib/useClients';
import ClientCombobox from '@/components/clients/ClientCombobox';
import EventLocationSection from '@/components/events/EventLocationSection';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const PAYMENT_MODELS = [
  { value: 'HORAS_EXTRAS', label: 'Horas Extras' },
  { value: 'MEIO_CACHE_E_DOBRA', label: 'Meio Cache e Dobra' },
];

const defaultState = {
  client_id: '',
  title: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  payment_due_date: '',
  payment_status: 'unpaid',
  payment_model: 'HORAS_EXTRAS',
  daily_cache_value: '',
  cache_valor_base: '',
  color: DEFAULT_EVENT_COLOR,
  location: '',
  location_city: '',
  location_state: '',
  location_lat: null,
  location_lng: null,
  observacoes_md: '',
  nf_number: '',
  nf_issued_at: '',
};

export default function EventForm({
  isOpen = false,
  onClose,
  event,
  clients = [],
  clientsLoading = false,
  prefillData,
  initialData,
  onSuccess,
}) {
  const { user, profile } = useAuth();
  const theme = useCategoryTheme();
  const { create: createEvent, update: updateEvent, events: allEvents } = useEvents();
  const { create: createClient } = useClients();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [extraClients, setExtraClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [clientQuickCreateOpen, setClientQuickCreateOpen] = useState(false);
  const [formData, setFormData] = useState(defaultState);

  useEffect(() => {
    if (!isOpen) return;

    const seed = event || prefillData || initialData || {};
    setFormData({
      ...defaultState,
      client_id: seed.client_id || '',
      title: seed.title || '',
      start_date: seed.start_date ? normalizeDateString(seed.start_date) : '',
      end_date: seed.end_date ? normalizeDateString(seed.end_date) : '',
      start_time: seed.start_time || '09:00',
      end_time: seed.end_time || '18:00',
      payment_due_date: seed.payment_due_date ? normalizeDateString(seed.payment_due_date) : '',
      payment_status: seed.payment_status || 'unpaid',
      payment_model: seed.payment_model || 'HORAS_EXTRAS',
      daily_cache_value: seed.daily_cache_value ?? '',
      cache_valor_base: seed.cache_valor_base ?? '',
      color: seed.color || resolveEventColor({ client_id: seed.client_id, color: seed.color }, clients.find((c) => c.id === seed.client_id)) || theme.primaryHex,
      location: seed.location || '',
      location_city: seed.location_city || '',
      location_state: seed.location_state || '',
      location_lat: seed.location_lat ?? null,
      location_lng: seed.location_lng ?? null,
      observacoes_md: seed.observacoes_md || '',
      nf_number: seed.nf_number || '',
      nf_issued_at: seed.nf_issued_at ? seed.nf_issued_at.slice(0, 10) : '',
    });
    if (!isOpen) setExtraClients([]);
  }, [isOpen, event, prefillData, initialData]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const allClients = useMemo(() => {
    const map = new Map();
    [...clients, ...extraClients].forEach((c) => {
      if (c?.id) map.set(c.id, c);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [clients, extraClients]);

  const selectedClient = useMemo(
    () => allClients.find((c) => c.id === formData.client_id),
    [allClients, formData.client_id],
  );

  const clientHistory = useMemo(() => {
    if (!formData.client_id || !allEvents.length) return null;
    const clientEvents = allEvents.filter(
      (e) => e.client_id === formData.client_id && !isCancelledEvent(e)
    );
    if (clientEvents.length === 0) return null;
    const totalShows = clientEvents.length;
    const totalRevenue = clientEvents.reduce((sum, e) => sum + getEventCacheAmount(e), 0);
    const avgCache = totalRevenue / totalShows;
    const paidCount = clientEvents.filter((e) => e.payment_status === 'paid').length;
    const completedCount = clientEvents.filter((e) => e.status === 'completed').length;
    const score = completedCount > 0 ? Math.round((paidCount / completedCount) * 100) : null;
    const sorted = [...clientEvents].sort((a, b) =>
      (b.start_date || '') > (a.start_date || '') ? 1 : -1
    );
    const lastShowDate = sorted[0]?.start_date || null;
    const isCurrentEvent = event && sorted[0]?.id === event?.id;
    const lastForDisplay = isCurrentEvent ? sorted[1]?.start_date || null : lastShowDate;
    return { totalShows, avgCache, score, lastShowDate: lastForDisplay };
  }, [formData.client_id, allEvents, event]);

  const handleCreateClient = useCallback(async (data) => {
    try {
      const created = await createClient(data);
      setExtraClients((prev) => [...prev, created]);
      return created;
    } catch (error) {
      appToast.error('Não foi possível criar o cliente.', {
        description: error?.message || 'Verifique conexão e migração client_type no Supabase.',
      });
      throw error;
    }
  }, [createClient]);

  const conflictingEvents = useMemo(() => {
    if (!formData.start_date) return [];
    try {
      const newStart = parseISO(formData.start_date);
      const newEnd = parseISO(formData.end_date || formData.start_date);
      if (!isValid(newStart) || !isValid(newEnd)) return [];
      return allEvents.filter((e) => {
        if (isCancelledEvent(e)) return false;
        if (event && e.id === event.id) return false;
        if (!e.start_date) return false;
        try {
          const eStart = parseISO(e.start_date);
          const eEnd = parseISO(e.end_date || e.start_date);
          return isValid(eStart) && isValid(eEnd) && eStart <= newEnd && eEnd >= newStart;
        } catch { return false; }
      });
    } catch { return []; }
  }, [formData.start_date, formData.end_date, allEvents, event]);

  const eventSummary = useMemo(() => {
    const daily = Number(formData.daily_cache_value) || 0;
    if (!formData.start_date || daily <= 0) return null;
    try {
      const start = parseISO(formData.start_date);
      const end = parseISO(formData.end_date || formData.start_date);
      const days = Math.max(1, differenceInDays(end, start) + 1);
      const total = Math.round(daily * days * 100) / 100;
      return { days, total };
    } catch {
      return null;
    }
  }, [formData.start_date, formData.end_date, formData.daily_cache_value]);

  const handleClientChange = (clientId) => {
    const client = allClients.find((c) => c.id === clientId);
    setFormData((prev) => {
      const next = { ...prev, client_id: clientId };
      if (event || !client) return next;

      const cacheEmpty = prev.daily_cache_value === '' || prev.daily_cache_value == null;
      if (cacheEmpty) {
        const fromClient = Number(client.default_daily_cache) || 0;
        const fromProfile = Number(profile?.daily_rate) || 0;
        const value = fromClient > 0 ? fromClient : fromProfile;
        if (value > 0) next.daily_cache_value = value;
      }
      if (client.policy_default_payment_model) {
        next.payment_model = client.policy_default_payment_model;
      }
      if (!event?.id) {
        next.color = resolveEventColor({ client_id: clientId }, client);
      }
      return next;
    });
  };

  const handleSelectTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      title: template.title || prev.title,
      payment_model: template.payment_model || prev.payment_model,
      daily_cache_value: template.daily_cache_value ?? prev.daily_cache_value,
      color: template.color || prev.color,
    }));
    setShowTemplateModal(false);
    appToast.success(`Template "${template.name}" aplicado`);
  };

  const handleSaveTemplate = async () => {
    if (!formData.title.trim()) {
      appToast.error('Preencha o título antes de salvar o template');
      return;
    }
    setSavingTemplate(true);
    try {
      await EventTemplate.create({
        user_id: user.id,
        name: formData.title.trim(),
        title: formData.title.trim(),
        payment_model: formData.payment_model,
        daily_cache_value: formData.daily_cache_value === '' ? 0 : Number(formData.daily_cache_value),
        color: formData.color,
      });
      appToast.success('Template salvo!', { description: `"${formData.title}" disponível para próximos eventos.` });
    } catch (err) {
      appToast.error('Erro ao salvar template', { description: err.message });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_id || !formData.start_date) {
      appToast.error('Preencha cliente e data inicial.');
      return;
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      appToast.error('Data de término não pode ser anterior à data de início.');
      return;
    }

    const selectedClient = allClients.find((c) => c.id === formData.client_id);
    const eventTitle = formData.title.trim() || selectedClient?.name || 'Evento';

    setLoading(true);

    try {
      const isNew = !event?.id;
      const payload = {
        client_id: formData.client_id,
        title: eventTitle,
        start_date: normalizeDateString(formData.start_date),
        end_date: formData.end_date ? normalizeDateString(formData.end_date) : normalizeDateString(formData.start_date),
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        payment_due_date: formData.payment_due_date ? normalizeDateString(formData.payment_due_date) : null,
        payment_status: formData.payment_status || 'pending',
        ...(event?.id ? { status: event.status || 'pending' } : { status: 'pending' }),
        payment_model: formData.payment_model || 'HORAS_EXTRAS',
        daily_cache_value: formData.daily_cache_value === '' ? 0 : Number(formData.daily_cache_value),
        cache_valor_base: formData.cache_valor_base === '' ? null : Number(formData.cache_valor_base),
        color: resolveEventColor({ client_id: formData.client_id, color: formData.color }, selectedClient),
        location: formData.location?.trim() || null,
        location_city: formData.location_city || null,
        location_state: formData.location_state || null,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        observacoes_md: formData.observacoes_md || null,
        nf_number: formData.nf_number?.trim() || null,
        nf_issued_at: formData.nf_issued_at || null,
      };

      if (event?.id) {
        await updateEvent(event.id, payload);
        appToast.success('Evento atualizado', { description: 'Alterações salvas com sucesso.' });
      } else {
        await createEvent(payload);
        appToast.success('Evento criado', { description: 'Já está na sua agenda.' });
      }

      onSuccess?.();
      onClose?.(false);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      appToast.error('Não foi possível salvar o evento', {
        description: error?.message || 'Verifique cliente, datas e conexão.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <EventTemplateModal
      isOpen={showTemplateModal}
      onClose={() => setShowTemplateModal(false)}
      onSelectTemplate={handleSelectTemplate}
    />
    <Dialog open={isOpen} onOpenChange={onClose} modal={!clientQuickCreateOpen && !showTemplateModal}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white p-0 flex flex-col overflow-hidden h-[95dvh] max-h-[95dvh] bp-focus-scope">
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">{event?.id ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            {!event?.id && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateModal(true)}
                className="bp-hover-primary hover:bg-[color-mix(in_srgb,var(--bp-primary)_10%,transparent)] gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Usar template
              </Button>
            )}
          </div>
        </DialogHeader>

        <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
          <ScrollArea fill>
          <div className="space-y-4 p-4 sm:p-6 pb-2">
          <div className="space-y-2">
            <Label>Cliente</Label>
            {clientsLoading && allClients.length === 0 ? (
              <div className="h-11 rounded-md bg-slate-800 border border-slate-700 animate-pulse" />
            ) : allClients.length === 0 ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                <p className="text-sm text-amber-100">
                  Cadastre um cliente antes de criar um evento na agenda.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
                  onClick={() => {
                    onClose?.(false);
                    hardNavigate('/clients?action=new-client');
                  }}
                >
                  Cadastrar primeiro cliente
                </Button>
              </div>
            ) : (
              <ClientCombobox
                clients={allClients}
                value={formData.client_id}
                onChange={handleClientChange}
                onCreateClient={handleCreateClient}
                onQuickCreateOpenChange={setClientQuickCreateOpen}
              />
            )}
            {clientHistory && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  <span><span className="font-semibold text-white">{clientHistory.totalShows}</span> show{clientHistory.totalShows !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1 text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>Média <span className="font-semibold text-white">{isVisible ? formatCurrency(clientHistory.avgCache) : '•••••'}</span></span>
                </div>
                {clientHistory.score !== null && (
                  <>
                    <span className="text-slate-700">·</span>
                    <div className="flex items-center gap-1">
                      <Star className={`w-3.5 h-3.5 shrink-0 ${clientHistory.score >= 80 ? 'text-emerald-400' : clientHistory.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`} />
                      <span className={`font-semibold ${clientHistory.score >= 80 ? 'text-emerald-400' : clientHistory.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{clientHistory.score}%</span>
                    </div>
                  </>
                )}
                {clientHistory.lastShowDate && (
                  <>
                    <span className="text-slate-700 ml-auto">último {format(parseISO(clientHistory.lastShowDate), "dd/MM/yy")}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nome do evento (opcional)</Label>
            <Input
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={selectedClient?.name ? `Padrão: ${selectedClient.name}` : 'Usa o nome do cliente se vazio'}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setField('start_date', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setField('end_date', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>

          {conflictingEvents.length > 0 && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-xs">
              <span className="text-amber-400 text-base leading-none mt-0.5">⚠</span>
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-amber-300">
                  {conflictingEvents.length === 1 ? 'Conflito de agenda' : `${conflictingEvents.length} conflitos de agenda`}
                </p>
                <div className="space-y-0.5">
                  {conflictingEvents.slice(0, 3).map((e) => {
                    const client = allClients.find((c) => c.id === e.client_id);
                    return (
                      <p key={e.id} className="text-amber-200/70 truncate">
                        {e.title || client?.name || 'Evento sem nome'} — {e.start_date ? format(parseISO(e.start_date), 'dd/MM', { locale: ptBR }) : '?'}
                        {e.end_date && e.end_date !== e.start_date ? ` a ${format(parseISO(e.end_date), 'dd/MM', { locale: ptBR })}` : ''}
                      </p>
                    );
                  })}
                  {conflictingEvents.length > 3 && (
                    <p className="text-amber-200/50">+{conflictingEvents.length - 3} mais…</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {event?.id && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário inicial</Label>
                <Input type="time" value={formData.start_time} onChange={(e) => setField('start_time', e.target.value)} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>Horário final</Label>
                <Input type="time" value={formData.end_time} onChange={(e) => setField('end_time', e.target.value)} className="bg-slate-800 border-slate-700" />
              </div>
            </div>
          )}
          {!event?.id && (
            <p className="text-xs text-slate-500 rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
              Horários são registrados no dia do evento (toque longo na barra da agenda ou aba Horas).
            </p>
          )}

          <EventLocationSection
            location={formData.location}
            location_city={formData.location_city}
            location_state={formData.location_state}
            location_lat={formData.location_lat}
            location_lng={formData.location_lng}
            onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cachê por Dia (R$)</Label>
              <Input type="number" step="0.01" min="0" value={formData.daily_cache_value} onChange={(e) => setField('daily_cache_value', e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Modelo de pagamento</Label>
              <Select value={formData.payment_model} onValueChange={(value) => setField('payment_model', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PAYMENT_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vencimento do pagamento</Label>
            <Input
              type="date"
              value={formData.payment_due_date}
              onChange={(e) => setField('payment_due_date', e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {eventSummary && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl border text-sm"
              style={theme.activeSurfaceStyle}
            >
              <span className="text-slate-400">
                {eventSummary.days} {eventSummary.days === 1 ? 'dia' : 'dias'} × R$ {Number(formData.daily_cache_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="font-bold" style={theme.accentStyle}>
                = R$ {eventSummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nº Nota Fiscal</Label>
              <Input
                placeholder="Ex: 000123"
                value={formData.nf_number}
                onChange={(e) => setField('nf_number', e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de emissão NF</Label>
              <Input
                type="date"
                value={formData.nf_issued_at}
                onChange={(e) => setField('nf_issued_at', e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={formData.observacoes_md} onChange={(e) => setField('observacoes_md', e.target.value)} className="bg-slate-800 border-slate-700" />
          </div>
          </div>
          </ScrollArea>

          <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 sm:px-6 border-t border-slate-700 flex-shrink-0 pb-safe">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveTemplate}
              disabled={savingTemplate || loading}
              className="sm:mr-auto border-slate-600 text-slate-400 hover:text-slate-200 gap-1.5 h-11"
            >
              {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              Salvar como template
            </Button>
            <Button type="button" variant="outline" onClick={() => onClose?.(false)} disabled={loading} className="h-11">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-white h-11 border-0 hover:brightness-110 active:brightness-95 transition-[filter]"
              style={theme.primaryStyle}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : event?.id ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
