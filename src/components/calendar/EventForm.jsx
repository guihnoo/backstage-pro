import { useEffect, useMemo, useState, useCallback } from 'react';
import { differenceInDays, parseISO, format, isValid, addWeeks, addMonths, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, BookmarkPlus, TrendingUp, Star, CalendarDays, Repeat2, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import appToast from '@/lib/appToast';
import { normalizeDateString, todayLocalISO } from '@/components/utils/dateUtils';
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
import { parseBRL } from '@/lib/money';
import { MEAL_POLICY_LABELS } from '@/lib/mealPolicy';

// Dinheiro digitado (1.200,50 / 1200.5); invalido vira 0, nunca NaN.
const moneyNum = (v) => { const n = parseBRL(v); return Number.isFinite(n) ? n : 0; };

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
  meal_policy: null,
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
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatTimes, setRepeatTimes] = useState(3);
  const [repeatUnit, setRepeatUnit] = useState('weeks');
  // Visual "Novo trabalho" (prototipo All Access): faixa de dias para tocar + detalhes recolhidos.
  const [pickingEnd, setPickingEnd] = useState(false);
  const [stripOffset, setStripOffset] = useState(0);
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const seed = event || prefillData || initialData || {};
    const isEditing = Boolean(event?.id);
    const defaultDailyRate = !isEditing && Number(profile?.daily_rate) > 0 ? String(profile.daily_rate) : '';
    setFormData({
      ...defaultState,
      client_id: seed.client_id || '',
      title: seed.title || '',
      start_date: seed.start_date ? normalizeDateString(seed.start_date) : '',
      end_date: seed.end_date ? normalizeDateString(seed.end_date) : '',
      // Sem horário inventado: evento novo começa vazio (antes gravava 09:00–18:00 escondido).
      start_time: seed.start_time || '',
      end_time: seed.end_time || '',
      payment_due_date: seed.payment_due_date ? normalizeDateString(seed.payment_due_date) : '',
      payment_status: seed.payment_status || 'unpaid',
      payment_model: seed.payment_model || 'HORAS_EXTRAS',
      daily_cache_value: seed.daily_cache_value ?? defaultDailyRate,
      cache_valor_base: seed.cache_valor_base ?? '',
      meal_policy: seed.meal_policy || null,
      color: seed.color || resolveEventColor({ client_id: seed.client_id, color: seed.color }, clients.find((c) => c.id === seed.client_id)) || theme.primaryHex,
      location: seed.location || '',
      location_city: seed.location_city || '',
      location_state: seed.location_state || '',
      location_lat: seed.location_lat ?? null,
      location_lng: seed.location_lng ?? null,
      observacoes_md: seed.observacoes_md || '',
      nf_number: seed.nf_number || seed.nfe_numero || '',
      nf_issued_at: seed.nf_issued_at ? seed.nf_issued_at.slice(0, 10) : '',
    });
    // "Repetir" sempre começa desligado ao abrir o formulário (antes ficava ligado e duplicava séries).
    setRepeatEnabled(false);
    setRepeatTimes(3);
    setRepeatUnit('weeks');
    setPickingEnd(false);
    setStripOffset(0);
    setShowDateInputs(false);
    // Editando com algo preenchido nos detalhes: abre "Mais detalhes" para nao esconder o que existe.
    setShowMore(Boolean(isEditing && (seed.payment_due_date || seed.nf_number || seed.nfe_numero || seed.observacoes_md)));
    if (!isOpen) setExtraClients([]);
  }, [isOpen, event, prefillData, initialData, profile?.daily_rate, clients, theme.primaryHex]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const allClients = useMemo(() => {
    const map = new Map();
    [...clients, ...extraClients].forEach((c) => {
      if (c?.id) map.set(c.id, c);
    });
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
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
      if (created?.id && !event?.id) {
        setFormData((prev) => {
          const next = { ...prev, client_id: created.id };
          const fromClient = Number(created.default_daily_cache) || 0;
          const fromProfile = Number(profile?.daily_rate) || 0;
          if (fromClient > 0) {
            next.daily_cache_value = fromClient;
          } else if ((prev.daily_cache_value === '' || prev.daily_cache_value == null) && fromProfile > 0) {
            next.daily_cache_value = fromProfile;
          }
          if (created.policy_default_payment_model) {
            next.payment_model = created.policy_default_payment_model;
          }
          next.color = resolveEventColor({ client_id: created.id }, created);
          return next;
        });
      }
      return created;
    } catch (error) {
      appToast.error('Não foi possível criar o cliente.', {
        description: error?.message || 'Verifique conexão e migração client_type no Supabase.',
      });
      throw error;
    }
  }, [createClient, event?.id, profile?.daily_rate]);

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
    const daily = moneyNum(formData.daily_cache_value);
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

  const clientCacheHint = useMemo(() => {
    if (!formData.client_id || event?.id) return null;
    const prev3 = (allEvents || [])
      .filter(e => e.client_id === formData.client_id && Number(e.daily_cache_value) > 0)
      .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0))
      .slice(0, 3);
    if (prev3.length === 0) return null;
    const last = prev3[0];
    const avg = Math.round(prev3.reduce((s, e) => s + Number(e.daily_cache_value), 0) / prev3.length);
    return { lastValue: Number(last.daily_cache_value), avg, count: prev3.length };
  }, [allEvents, formData.client_id, event?.id]);

  // Pilulas de cliente: os 4 com show mais recente (o resto fica na busca logo abaixo).
  const quickClients = useMemo(() => {
    const lastByClient = new Map();
    for (const e of allEvents || []) {
      if (!e?.client_id || isCancelledEvent(e)) continue;
      const d = e.start_date || '';
      if (!lastByClient.has(e.client_id) || d > lastByClient.get(e.client_id)) lastByClient.set(e.client_id, d);
    }
    const ranked = allClients
      .filter((c) => lastByClient.has(c.id))
      .sort((a, b) => (lastByClient.get(b.id) > lastByClient.get(a.id) ? 1 : -1));
    const list = (ranked.length ? ranked : allClients).slice(0, 4);
    if (selectedClient && !list.some((c) => c.id === selectedClient.id)) list.unshift(selectedClient);
    return list.slice(0, 5);
  }, [allEvents, allClients, selectedClient]);

  // Faixa de 14 dias (2 semanas, comecando na segunda) em volta da data escolhida ou de hoje.
  const stripDays = useMemo(() => {
    const anchor = parseISO(formData.start_date || todayLocalISO());
    const base = addDays(startOfWeek(isValid(anchor) ? anchor : new Date(), { weekStartsOn: 1 }), stripOffset * 14);
    return Array.from({ length: 14 }, (_, i) => format(addDays(base, i), 'yyyy-MM-dd'));
  }, [formData.start_date, stripOffset]);

  const busyDays = useMemo(() => {
    const set = new Set();
    for (const e of allEvents || []) {
      if (isCancelledEvent(e) || (event && e.id === event.id) || !e.start_date) continue;
      const start = e.start_date.slice(0, 10);
      const end = (e.end_date || e.start_date).slice(0, 10);
      for (const d of stripDays) if (d >= start && d <= end) set.add(d);
    }
    return set;
  }, [allEvents, stripDays, event]);

  // 1o toque = primeiro dia; 2o toque (no mesmo dia ou depois) = ultimo dia. Tocar antes recomeca.
  const handleDayTap = (iso) => {
    const closesRange = pickingEnd && formData.start_date && iso >= formData.start_date;
    setFormData((prev) => (closesRange ? { ...prev, end_date: iso } : { ...prev, start_date: iso, end_date: iso }));
    setPickingEnd(!closesRange);
  };

  const rangeLabel = (() => {
    if (!formData.start_date) return 'nenhum dia';
    const first = parseISO(formData.start_date);
    const last = parseISO(formData.end_date || formData.start_date);
    if (!isValid(first) || !isValid(last)) return 'nenhum dia';
    const days = Math.max(1, differenceInDays(last, first) + 1);
    const fmt = (d) => format(d, 'dd MMM', { locale: ptBR }).toUpperCase();
    return days === 1 ? `${fmt(first)} · 1 dia` : `${fmt(first)} → ${fmt(last)} · ${days} dias`;
  })();

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
        daily_cache_value: moneyNum(formData.daily_cache_value),
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
        daily_cache_value: moneyNum(formData.daily_cache_value),
        cache_valor_base: formData.cache_valor_base === '' || !Number.isFinite(Number(formData.cache_valor_base))
          ? null
          : Number(formData.cache_valor_base),
        // Alimentacao: so manda quando trocou (depende da migration 041).
        ...((formData.meal_policy || null) !== (event?.meal_policy ?? null) ? { meal_policy: formData.meal_policy || null } : {}),
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
        if (repeatEnabled && repeatTimes > 0) {
          const addFn = repeatUnit === 'weeks' ? addWeeks : addMonths;
          const startBase = parseISO(payload.start_date);
          const endBase = parseISO(payload.end_date || payload.start_date);
          // Cada repetição é tentada uma vez. Se alguma falhar, o formulário fecha mesmo assim
          // (antes ficava aberto e, ao tentar de novo, duplicava os shows já criados).
          const falharam = [];
          for (let i = 1; i <= repeatTimes; i++) {
            const start_date = format(addFn(startBase, i), 'yyyy-MM-dd');
            try {
              await createEvent({
                ...payload,
                start_date,
                end_date: format(addFn(endBase, i), 'yyyy-MM-dd'),
                payment_status: 'pending',
              });
            } catch {
              falharam.push(start_date);
            }
          }
          const criados = repeatTimes + 1 - falharam.length;
          if (falharam.length) {
            appToast.error(`${criados} de ${repeatTimes + 1} shows criados`, {
              description: `Não foi possível criar: ${falharam.map((d) => d.split('-').reverse().join('/')).join(', ')}. Crie essas datas de novo.`,
            });
          } else {
            appToast.success(`${criados} eventos criados`, { description: `Série de ${criados} shows adicionada à agenda.` });
          }
        } else {
          appToast.success('Evento criado', { description: 'Já está na sua agenda.' });
        }
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

  const tagCls = 'font-tag text-[10px] tracking-[1px] uppercase text-[#a8a8a8]';

  return (
    <>
    <EventTemplateModal
      isOpen={showTemplateModal}
      onClose={() => setShowTemplateModal(false)}
      onSelectTemplate={handleSelectTemplate}
    />
    <Dialog open={isOpen} onOpenChange={onClose} modal={!clientQuickCreateOpen && !showTemplateModal}>
      <DialogContent
        className="sm:max-w-xl p-0 gap-0 flex flex-col overflow-hidden h-[95dvh] max-h-[95dvh]"
        // Sem foco automatico no 1o botao: no celular nao abre o teclado nem marca "Usar modelo".
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-[18px] pt-4 pb-2 flex-shrink-0 pr-14 space-y-0">
          <div className={tagCls}>AGENDA</div>
          <DialogTitle className="text-[30px] mt-0.5">{event?.id ? 'Editar trabalho' : 'Novo trabalho'}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
          <ScrollArea fill>
          <div className="space-y-4 px-[18px] pt-2 pb-4">
          {!event?.id && (
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="w-full h-11 rounded-[12px] border border-dashed border-[#ff2e88] text-[#ff2e88] text-[13px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              Usar um modelo salvo
            </button>
          )}

          {/* Cliente: pilulas dos mais recentes + busca/criar */}
          <div className="space-y-2">
            <Label>Cliente / contratante</Label>
            {quickClients.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto -mx-[18px] px-[18px] pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {quickClients.map((c) => {
                  const active = c.id === formData.client_id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleClientChange(c.id)}
                      className={`shrink-0 h-10 pl-2 pr-3.5 rounded-full border flex items-center gap-2 text-[13px] font-extrabold transition-colors ${
                        active ? 'bg-white border-white text-[#0a0a0a]' : 'bg-[#161616] border-[#333333] text-white'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full shrink-0" style={{ background: resolveEventColor({ client_id: c.id }, c) }} />
                      <span className="max-w-[140px] truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {clientsLoading && allClients.length === 0 ? (
              <Skeleton className="h-12 w-full rounded-[12px]" />
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
              <div className="flex items-center gap-3 px-3 py-2 rounded-[12px] bg-[#0a0a0a] border border-[#222222] text-xs">
                <div className="flex items-center gap-1 text-[#a8a8a8]">
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  <span><span className="font-semibold text-white">{clientHistory.totalShows}</span> show{clientHistory.totalShows !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-[#555555]">·</span>
                <div className="flex items-center gap-1 text-[#a8a8a8]">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0 text-[#ffd400]" />
                  <span>Média <span className="font-semibold text-white">{isVisible ? formatCurrency(clientHistory.avgCache) : '•••••'}</span></span>
                </div>
                {clientHistory.score !== null && (
                  <>
                    <span className="text-[#555555]">·</span>
                    <div className="flex items-center gap-1">
                      <Star className={`w-3.5 h-3.5 shrink-0 ${clientHistory.score >= 50 ? 'text-[#ffd400]' : 'text-[#ff2e88]'}`} />
                      <span className={`font-semibold ${clientHistory.score >= 50 ? 'text-[#ffd400]' : 'text-[#ff2e88]'}`}>{clientHistory.score}%</span>
                    </div>
                  </>
                )}
                {clientHistory.lastShowDate && (
                  <span className="text-[#666666] ml-auto">último {format(parseISO(clientHistory.lastShowDate), 'dd/MM/yy')}</span>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="ef-title" className="sr-only">Nome do evento</Label>
            <Input
              id="ef-title"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={selectedClient?.name ? `Nome do evento (padrão: ${selectedClient.name})` : 'Nome do evento (ex.: Feira Agro)'}
            />
          </div>

          {/* Dias: toque no primeiro e no ultimo */}
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <div className={tagCls}>
                Dias · <span className="text-[#ffd400]">{rangeLabel}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" aria-label="Duas semanas antes" onClick={() => setStripOffset((o) => o - 1)} className="h-8 w-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Duas semanas depois" onClick={() => setStripOffset((o) => o + 1)} className="h-8 w-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Escolher dias do trabalho">
              {stripDays.map((iso) => {
                const d = parseISO(iso);
                const inRange = Boolean(formData.start_date) && iso >= formData.start_date && iso <= (formData.end_date || formData.start_date);
                const isToday = iso === todayLocalISO();
                const weekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <button
                    key={iso}
                    type="button"
                    aria-pressed={inRange}
                    aria-label={format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    onClick={() => handleDayTap(iso)}
                    className={`relative h-[52px] rounded-[10px] border flex flex-col items-center justify-center transition-colors ${
                      inRange
                        ? 'bg-[#ffd400] border-[#ffd400] text-[#0a0a0a]'
                        : `bg-[#0a0a0a] ${isToday ? 'border-[#ffd400]' : 'border-[#2a2a2a]'} ${weekend ? 'text-[#a8a8a8]' : 'text-white'}`
                    }`}
                  >
                    <span className="font-tag text-[9px] font-bold uppercase leading-none">{format(d, 'EEE', { locale: ptBR }).slice(0, 3)}</span>
                    <span className="font-poster text-[18px] leading-none mt-1">{format(d, 'd')}</span>
                    {busyDays.has(iso) && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${inRange ? 'bg-[#0a0a0a]' : 'bg-[#ff2e88]'}`} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-[#888888]">
                {pickingEnd ? 'Agora toque no último dia (ou salve se for um dia só).' : 'Toque no primeiro dia. Ponto rosa = já tem show.'}
              </p>
              <button type="button" onClick={() => setShowDateInputs((v) => !v)} className="text-[11px] font-bold text-[#ffd400] underline underline-offset-2 shrink-0">
                {showDateInputs ? 'esconder datas' : 'digitar datas'}
              </button>
            </div>
            {showDateInputs && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ef-start-date">Data inicial</Label>
                  <Input id="ef-start-date" type="date" value={formData.start_date} onChange={(e) => setField('start_date', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ef-end-date">Data final</Label>
                  <Input id="ef-end-date" type="date" value={formData.end_date} onChange={(e) => setField('end_date', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {conflictingEvents.length > 0 && (
            <div className="rounded-[12px] bg-[#1a1a1a] px-3 py-2.5 text-xs" style={{ borderLeft: '4px solid #ff2e88' }}>
              <p className="font-extrabold text-white text-sm">
                {conflictingEvents.length === 1 ? 'Já tem show nesse dia' : `${conflictingEvents.length} shows nesses dias`}
              </p>
              <div className="space-y-0.5 mt-1">
                {conflictingEvents.slice(0, 3).map((e) => {
                  const client = allClients.find((c) => c.id === e.client_id);
                  return (
                    <p key={e.id} className="text-[#c8c8c8] truncate">
                      {e.title || client?.name || 'Evento sem nome'} — {e.start_date ? format(parseISO(e.start_date), 'dd/MM', { locale: ptBR }) : '?'}
                      {e.end_date && e.end_date !== e.start_date ? ` a ${format(parseISO(e.end_date), 'dd/MM', { locale: ptBR })}` : ''}
                    </p>
                  );
                })}
                {conflictingEvents.length > 3 && (
                  <p className="text-[#888888]">+{conflictingEvents.length - 3} mais…</p>
                )}
              </div>
            </div>
          )}

          {event?.id && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="ef-start-time">Horário inicial</Label>
                <Input id="ef-start-time" type="time" value={formData.start_time} onChange={(e) => setField('start_time', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ef-end-time">Horário final</Label>
                <Input id="ef-end-time" type="time" value={formData.end_time} onChange={(e) => setField('end_time', e.target.value)} />
              </div>
            </div>
          )}

          <EventLocationSection
            location={formData.location}
            location_city={formData.location_city}
            location_state={formData.location_state}
            location_lat={formData.location_lat}
            location_lng={formData.location_lng}
            onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          />

          {/* Cache e alimentacao em blocos (como no prototipo) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[12px] bg-[#0a0a0a] border border-[#333333] px-3 py-2 focus-within:border-[#ffd400]">
              <label htmlFor="ef-cache" className="font-tag text-[9px] uppercase text-[#a8a8a8] block">Cachê por diária</label>
              <div className="flex items-baseline gap-1">
                <span className="font-poster text-[20px] text-white">R$</span>
                <input
                  id="ef-cache"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.daily_cache_value}
                  onChange={(e) => setField('daily_cache_value', e.target.value)}
                  className="w-full min-w-0 bg-transparent font-poster text-[24px] leading-tight text-white placeholder:text-[#555555] outline-none"
                />
              </div>
              {clientCacheHint ? (
                <button
                  type="button"
                  onClick={() => setField('daily_cache_value', String(clientCacheHint.lastValue))}
                  className="text-[10px] text-[#ffd400] font-bold text-left"
                >
                  último {isVisible ? `R$ ${clientCacheHint.lastValue.toLocaleString('pt-BR')}` : '•••'} · usar
                </button>
              ) : (
                <p className="text-[10px] text-[#ffd400]">{Number(profile?.daily_rate) > 0 ? 'seu cachê padrão' : 'valor de cada dia'}</p>
              )}
            </div>
            <div className="rounded-[12px] bg-[#0a0a0a] border border-[#333333] px-3 py-2">
              <div className="font-tag text-[9px] uppercase text-[#a8a8a8]">Alimentação</div>
              <Select value={formData.meal_policy || '__cliente__'} onValueChange={(v) => setField('meal_policy', v === '__cliente__' ? null : v)}>
                <SelectTrigger aria-label="Alimentação neste evento" className="h-9 px-0 border-0 bg-transparent font-normal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__cliente__">
                    Igual ao cliente{selectedClient?.meal_policy ? ` (${MEAL_POLICY_LABELS[selectedClient.meal_policy] || ''})` : ''}
                  </SelectItem>
                  {Object.entries(MEAL_POLICY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-[#888888]">{formData.meal_policy ? 'só neste trabalho' : 'padrão do cliente'}</p>
            </div>
          </div>

          {/* Mais detalhes: cobranca, NF, observacoes, repetir */}
          <div className="rounded-[14px] border border-[#2a2a2a]">
            <button
              type="button"
              aria-expanded={showMore}
              onClick={() => setShowMore((v) => !v)}
              className="w-full h-12 px-3.5 flex items-center justify-between text-left"
            >
              <span className="text-[13px] font-extrabold text-white">Mais detalhes</span>
              <span className="flex items-center gap-2 text-[11px] text-[#888888]">
                {PAYMENT_MODELS.find((m) => m.value === formData.payment_model)?.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {showMore && (
              <div className="space-y-4 px-3.5 pb-4">
                <div className="space-y-1.5">
                  <Label>Modelo de pagamento</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAYMENT_MODELS.map((model) => (
                      <button
                        key={model.value}
                        type="button"
                        aria-pressed={formData.payment_model === model.value}
                        onClick={() => setField('payment_model', model.value)}
                        className={`h-[38px] rounded-full border text-xs font-extrabold transition-colors ${
                          formData.payment_model === model.value ? 'bg-white border-white text-[#0a0a0a]' : 'bg-transparent border-[#333333] text-[#c8c8c8]'
                        }`}
                      >
                        {model.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ef-payment-due">Vencimento do pagamento</Label>
                  <Input id="ef-payment-due" type="date" value={formData.payment_due_date} onChange={(e) => setField('payment_due_date', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ef-nf-number">Nº nota fiscal</Label>
                    <Input id="ef-nf-number" placeholder="Ex: 000123" value={formData.nf_number} onChange={(e) => setField('nf_number', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ef-nf-date">Emissão da NF</Label>
                    <Input id="ef-nf-date" type="date" value={formData.nf_issued_at} onChange={(e) => setField('nf_issued_at', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ef-notes">Observações</Label>
                  <Textarea id="ef-notes" value={formData.observacoes_md} onChange={(e) => setField('observacoes_md', e.target.value)} />
                </div>

                {!event?.id && (
                  <div className="space-y-2.5">
                    <button type="button" onClick={() => setRepeatEnabled((v) => !v)} className="flex items-center gap-2 w-full text-left">
                      <Repeat2 className={`w-4 h-4 flex-shrink-0 ${repeatEnabled ? 'text-[#ffd400]' : 'text-[#888888]'}`} />
                      <span className={`text-sm font-bold ${repeatEnabled ? 'text-white' : 'text-[#a8a8a8]'}`}>Repetir este evento</span>
                      <span className={`ml-auto w-10 h-6 rounded-full p-0.5 flex-shrink-0 transition-colors ${repeatEnabled ? 'bg-[#ffd400]' : 'bg-[#333333]'}`}>
                        <span className={`block w-5 h-5 rounded-full bg-[#0a0a0a] transition-transform ${repeatEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </span>
                    </button>
                    {repeatEnabled && (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[#a8a8a8]">Mais</span>
                          <input
                            type="number"
                            min={1}
                            max={24}
                            value={repeatTimes}
                            onChange={(e) => setRepeatTimes(Math.max(1, Math.min(24, Number(e.target.value))))}
                            className="w-16 h-10 text-center bg-[#0a0a0a] border border-[#333333] rounded-[10px] text-white text-base font-tag"
                          />
                          <span className="text-xs text-[#a8a8a8]">vezes, a cada</span>
                          {[{ v: 'weeks', l: 'Semana' }, { v: 'months', l: 'Mês' }].map((opt) => (
                            <button
                              key={opt.v}
                              type="button"
                              onClick={() => setRepeatUnit(opt.v)}
                              className={`px-3.5 h-[38px] rounded-full text-xs font-extrabold border ${
                                repeatUnit === opt.v ? 'bg-white border-white text-[#0a0a0a]' : 'border-[#333333] text-[#c8c8c8]'
                              }`}
                            >
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#888888]">Cria {repeatTimes + 1} shows no total · mesmo cliente e cachê</p>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || loading}
                  className="h-10 px-4 rounded-full border border-[#444444] text-white text-xs font-extrabold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  Salvar como modelo
                </button>
              </div>
            )}
          </div>
          </div>
          </ScrollArea>

          {/* Rodape: quanto vai render + salvar */}
          <div className="flex items-center gap-3 px-[18px] pt-2.5 pb-4 border-t border-[#222222] flex-shrink-0 pb-safe">
            <div className="min-w-0 flex-1">
              <div className="font-tag text-[10px] text-[#a8a8a8]">VAI RENDER</div>
              <div className="font-poster text-[26px] leading-none text-white truncate">
                {isVisible ? formatCurrency(eventSummary?.total || 0) : '•••••'}
              </div>
              {eventSummary && (
                <div className="font-tag text-[9px] text-[#888888] mt-0.5 truncate">
                  {eventSummary.days} {eventSummary.days === 1 ? 'dia' : 'dias'} × {isVisible ? formatCurrency(moneyNum(formData.daily_cache_value)) : '•••'}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onClose?.(false)}
              disabled={loading}
              aria-label="Cancelar"
              className="h-14 w-14 rounded-full bg-[#222222] text-white flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-14 px-7 rounded-full bg-[#ffd400] text-[#0a0a0a] font-poster text-[20px] tracking-[2px] shrink-0 active:scale-[0.98] disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SALVAR'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
