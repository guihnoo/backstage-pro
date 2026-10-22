import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/authContext';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';
import { getCategoryConfig, CATEGORIES, resolveCategoryId } from '@/lib/categoryConfig';
import { WORK_LOG_MODES } from '@/lib/workLogMode';
import { ratesListToMap, ratesMapToList, normalizeRoleRates } from '@/lib/roleRates';
import {
  User, Phone, MapPin, Mail, LogOut, Save, Loader2, CheckCircle, Eye, EyeOff, Download,
  DollarSign, Target, Calendar, Camera, MessageCircle, Inbox, Building2, ChevronRight, Compass, BookOpen, Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import { isAppOwner } from '@/lib/isAppOwner';
import { useOwnerFeedbacks } from '@/lib/useFeedback';
import { createBackup } from '@/api/functions';
import { uploadUserFile } from '@/lib/uploadFile';
import appToast from '@/lib/appToast';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import PushNotificationSettings from '@/components/notifications/PushNotificationSettings';
import { useStats } from '@/lib/useBackstageData';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import InstallPwaCard from '@/components/pwa/InstallPwaCard';
import EventTemplatesManager from '@/components/calendar/EventTemplatesManager';
import { requestAppTour } from '@/lib/appTourBus';
import { useUserSettings } from '@/lib/useUserSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/lib/useEvents';
import { isDoneEvent } from '@/lib/eventFinance';
import DeleteAccountDialog from '@/components/profile/DeleteAccountDialog';

const PIX_TYPES = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Chave aleatória'];

function profileToForm(profile) {
  return {
    name: profile?.name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
    years_experience: profile?.years_experience != null ? String(profile.years_experience) : '',
    daily_rate: profile?.daily_rate || '',
    monthly_goal_revenue: profile?.monthly_goal_revenue || '',
    monthly_goal_events: profile?.monthly_goal_events || '',
    category: resolveCategoryId(profile?.category || ''),
    work_log_mode: profile?.work_log_mode === 'ponto' ? 'ponto' : 'completo',
  };
}

// Campo digitado vira texto ("12") e o gravado pode ser número (12): compara como texto
function sameFields(a, b) {
  return Object.keys(b).every((k) => String(a[k] ?? '').trim() === String(b[k] ?? '').trim());
}

function settingsToPix(settings) {
  return {
    pix_key: settings?.pix_key || '',
    pix_key_type: settings?.pix_key_type || 'CPF',
    cpf_cnpj: settings?.cpf_cnpj || '',
    report_subtitle: settings?.report_subtitle || '',
  };
}

function ProfileSkeleton() {
  return (
    <div className="min-h-full pb-28 px-4 max-w-2xl mx-auto space-y-6 pt-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-6 w-36 rounded" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
      </div>
      {/* Stats widget */}
      <div className="grid grid-cols-4 gap-2">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
      {/* Form sections */}
      {[0,1,2].map(i => (
        <div key={i} className="rounded-2xl border border-[#222222]/50 bg-[#161616]/30 p-4 space-y-3">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function ProfileSimple() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { settings: userSettings, upsert: upsertSettings } = useUserSettings();
  // Resumo do mes saiu do Perfil (repetia Home/Metas); fica so o "puxar para atualizar".
  const { refetch: refetchStats } = useStats(user?.id);
  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(refetchStats);
  const { isVisible, toggleVisibility } = useFinancialVisibility();
  const { events: allEvents } = useEvents();
  const crewStats = useMemo(() => {
    const valid = (allEvents || []).filter((e) => isDoneEvent(e));
    const cities = new Set(valid.map((e) => (e.location_city || '').trim().toLowerCase()).filter(Boolean));
    return { shows: valid.length, cities: cities.size };
  }, [allEvents]);
  const categoryId = profile?.category || 'lighting';

  const [form, setForm] = useState(() => profileToForm(profile));
  // Outras funções com cachê diferente (ideia #109): { categoria: 'valor digitado' }
  const [rates, setRates] = useState(() => ratesListToMap(profile?.role_rates));

  const config = getCategoryConfig(form.category || categoryId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pixForm, setPixForm] = useState(() => settingsToPix(null));
  const photoInputRef = useRef(null);
  const owner = isAppOwner(user, profile);
  const { newCount: ownerNewFeedbacks } = useOwnerFeedbacks(owner);

  useEffect(() => {
    if (profile) {
      setForm(profileToForm(profile));
      setRates(ratesListToMap(profile.role_rates));
    }
  }, [profile]);

  useEffect(() => {
    if (userSettings) setPixForm(settingsToPix(userSettings));
  }, [userSettings]);

  // A barra de salvar só aparece quando algo mudou em relação ao que está gravado
  const isDirty = useMemo(
    () => !sameFields(form, profileToForm(profile)) || !sameFields(pixForm, settingsToPix(userSettings))
      || JSON.stringify(ratesMapToList(rates, form.category)) !== JSON.stringify(normalizeRoleRates(profile?.role_rates, form.category)),
    [form, pixForm, rates, profile, userSettings]
  );

  const handleExportData = async () => {
    setExporting(true);
    try {
      const result = await createBackup({});
      if (result?.data?.success) {
        appToast.success('Dados exportados!', { description: 'Arquivo JSON salvo no seu dispositivo.' });
      } else {
        appToast.error('Erro ao exportar', { description: result?.data?.error || 'Tente novamente.' });
      }
    } catch (err) {
      appToast.error('Erro ao exportar', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  // Um botao Salvar so (missao 196d6): grava perfil e PIX/PDF. Se uma parte falhar, avisa qual
  // e mantem o que foi digitado na tela para tentar de novo.
  const handleSave = async () => {
    setSaving(true);
    let perfilOk = false;
    try {
      await updateProfile({
        ...form,
        years_experience: form.years_experience !== '' ? Number(form.years_experience) : null,
        daily_rate: form.daily_rate !== '' ? Number(form.daily_rate) : null,
        monthly_goal_revenue: form.monthly_goal_revenue !== '' ? Number(form.monthly_goal_revenue) : null,
        monthly_goal_events: form.monthly_goal_events !== '' ? Number(form.monthly_goal_events) : null,
        role_rates: ratesMapToList(rates, form.category),
      });
      perfilOk = true;
      const temPix = pixForm.pix_key.trim() || pixForm.cpf_cnpj.trim() || pixForm.report_subtitle.trim()
        || userSettings?.pix_key || userSettings?.cpf_cnpj || userSettings?.report_subtitle;
      if (temPix) {
        const r = await upsertSettings({
          pix_key: pixForm.pix_key.trim(),
          pix_key_type: pixForm.pix_key_type,
          cpf_cnpj: pixForm.cpf_cnpj.trim() || null,
          report_subtitle: pixForm.report_subtitle.trim() || null,
        });
        if (r?._somenteNoAparelho) {
          appToast.warning('Perfil salvo. PIX salvo so neste aparelho.', {
            description: 'O servidor nao recebeu o PIX. Tente de novo mais tarde.',
          });
          return;
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      appToast.error(perfilOk ? 'Perfil salvo, mas o PIX nao foi salvo.' : 'Erro ao salvar perfil.', { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await uploadUserFile(file, { folder: 'avatars' });
      await updateProfile({ avatar_url: file_url });
      appToast.success('Foto de perfil atualizada!');
    } catch (err) {
      appToast.error('Erro ao enviar foto', { description: err.message });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    await signOut();
    hardNavigate('/login');
  };

  // Conta já apagada no servidor: só limpa a sessão local e volta ao login
  const handleAccountDeleted = async () => {
    await signOut().catch(() => {});
    hardNavigate('/login');
  };

  if (!profile) return <ProfileSkeleton />;

  const displayName = profile?.name || user?.email?.split('@')[0] || '';
  const sinceYear = (profile?.created_at || user?.created_at || '').slice(0, 4);
  const place = [form.city, form.state].filter(Boolean).join(', ');
  const fieldCls = 'w-full h-12 bg-[#0a0a0a] border border-[#333333] rounded-[12px] pl-10 pr-4 text-base font-semibold text-white placeholder:font-normal placeholder:text-[#666666] focus:outline-none focus:border-[#ffd400] transition-colors';
  const labelCls = 'block font-tag text-[10px] tracking-[1px] uppercase text-[#a8a8a8] mb-1.5';
  const rowCls = 'w-full flex items-center justify-between gap-3 h-14 px-4 rounded-[12px] bg-[#0a0a0a] border border-[#222222] transition-colors hover:border-[#444444] min-w-0';

  return (
    <div className="relative min-h-full overflow-x-clip bg-[#0a0a0a] text-white pb-28">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} primaryHex="#ffd400" />

      <div className="px-4 pt-3 max-w-2xl xl:max-w-6xl mx-auto space-y-3 w-full min-w-0">
        {/* Cabecalho */}
        <div className="flex items-center justify-between">
          <h1 className="font-poster text-[40px] leading-none uppercase tracking-wide">Perfil</h1>
          <Link
            to="/help"
            aria-label="Ajuda do app"
            className="h-10 w-10 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center font-poster text-[18px]"
          >
            ?
          </Link>
        </div>

        {/* Crew pass (credencial amarela) */}
        <section className="relative rounded-[18px] bg-[#ffd400] text-[#0a0a0a] p-4 pt-6 overflow-hidden">
          <span className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full bg-[#0a0a0a]" aria-hidden />
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              aria-label="Trocar foto de perfil"
              className="relative w-16 h-16 rounded-[14px] bg-[#0a0a0a] text-[#ffd400] overflow-hidden flex items-center justify-center shrink-0 font-poster text-[32px]"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase() || '?'
              )}
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-tl-[8px] bg-[#ffd400] flex items-center justify-center">
                {uploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </span>
            </button>
            <div className="min-w-0">
              <div className="font-tag text-[10px] tracking-[1px] font-bold">CREW PASS{sinceYear ? ` · DESDE ${sinceYear}` : ''}</div>
              <div className="font-poster text-[30px] leading-none uppercase truncate" title={displayName}>{displayName}</div>
              <div className="text-[13px] font-bold truncate">{config.label}{place ? ` · ${place}` : ''}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {[
              { value: crewStats.shows, label: 'SHOWS' },
              { value: crewStats.cities, label: 'CIDADES' },
              { value: form.years_experience || '—', label: 'ANOS NA ESTRADA' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-[10px] bg-[#0a0a0a]/10 px-2.5 py-2">
                <div className="font-poster text-[22px] leading-none">{value}</div>
                <div className="font-tag text-[9px] font-bold mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('perfil-dados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full h-11 mt-3 rounded-full bg-[#0a0a0a] text-white text-sm font-extrabold active:scale-[0.98]"
          >
            Editar perfil e foto
          </button>
          <p className="font-tag text-[10px] mt-2 truncate opacity-70">{user?.email}</p>
        </section>

        {/* Funcao e cache padrao */}
        <section className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3">
          <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Minhas funções e cachês</h2>
          <div className={labelCls}>Função principal</div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(CATEGORIES).map((cat) => {
              const active = form.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                  className={`h-11 flex items-center gap-2 px-3 rounded-[12px] border text-[13px] font-extrabold transition-colors min-w-0 ${
                    active ? 'bg-white border-white text-[#0a0a0a]' : 'bg-[#0a0a0a] border-[#2a2a2a] text-[#c8c8c8]'
                  }`}
                >
                  <span className="w-1.5 h-5 rounded-full shrink-0" style={{ background: cat.primaryHex }} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
          <div>
            <label htmlFor="goals-daily_rate" className={labelCls}>Cachê da função principal por diária (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                id="goals-daily_rate"
                type="number"
                min="0"
                value={form.daily_rate}
                onChange={(e) => setForm((f) => ({ ...f, daily_rate: e.target.value }))}
                placeholder="800"
                className={fieldCls}
              />
            </div>
            <p className="text-[11px] text-[#888888] mt-1">Já vem preenchido quando você cria um trabalho novo.</p>
          </div>
          <div data-testid="outras-funcoes">
            <div className={labelCls}>Outras funções (cachê diferente)</div>
            {Object.keys(rates).filter((id) => id !== form.category).length > 0 && (
              <div className="space-y-2 mb-2">
                {Object.keys(rates).filter((id) => id !== form.category).map((id) => (
                  <div key={id} className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 truncate text-[13px] font-extrabold text-white">{CATEGORIES[id]?.label || id}</span>
                    <div className="relative w-36 shrink-0">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`Cachê de ${CATEGORIES[id]?.label || id}`}
                        value={rates[id]}
                        onChange={(e) => setRates((r) => ({ ...r, [id]: e.target.value }))}
                        placeholder="950"
                        className={fieldCls}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Tirar ${CATEGORIES[id]?.label || id}`}
                      onClick={() => setRates((r) => { const next = { ...r }; delete next[id]; return next; })}
                      className="w-9 h-9 shrink-0 rounded-full border border-[#333333] text-[#a8a8a8] flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {Object.values(CATEGORIES).filter((cat) => cat.id !== form.category && !(cat.id in rates)).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setRates((r) => ({ ...r, [cat.id]: '' }))}
                  className="h-8 px-3 rounded-full bg-transparent border border-dashed border-[#444444] text-xs font-bold text-[#c8c8c8]"
                >
                  + {cat.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#888888] mt-1">No Novo trabalho você escolhe a função e o cachê dela já vem preenchido.</p>
          </div>
          {profile?.specialties?.length > 0 && (
            <div>
              <div className={labelCls}>Especialidades</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.specialties.map((spec) => (
                  <span key={spec} className="h-8 px-3 rounded-full bg-[#0a0a0a] border border-[#333333] text-xs font-bold text-white flex items-center">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Como registra o trabalho (ideia #107) */}
        <section className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3">
          <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Como você registra o trabalho</h2>
          <div className="grid grid-cols-1 gap-2">
            {WORK_LOG_MODES.map((m) => {
              const active = form.work_log_mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setForm((f) => ({ ...f, work_log_mode: m.id }))}
                  className={`text-left rounded-[14px] border px-3.5 py-3 transition-colors ${
                    active ? 'bg-white border-white text-[#0a0a0a]' : 'bg-[#0a0a0a] border-[#2a2a2a] text-white'
                  }`}
                >
                  <span className="block text-[14px] font-extrabold">{m.label}</span>
                  <span className={`block text-[12px] mt-0.5 ${active ? 'text-[#333333]' : 'text-[#888888]'}`}>{m.hint}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#888888]">Vale para todos os trabalhos; dá para mudar só um no Novo trabalho › Mais detalhes.</p>
        </section>

        {/* Dados pessoais */}
        <section id="perfil-dados" className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3 scroll-mt-20">
          <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Meus dados</h2>
          {[
            { key: 'name', label: 'Nome completo', icon: User, placeholder: 'Seu nome' },
            { key: 'phone', label: 'Telefone / WhatsApp', icon: Phone, placeholder: '(11) 99999-9999', type: 'tel' },
            { key: 'city', label: 'Cidade', icon: MapPin, placeholder: 'São Paulo' },
            { key: 'state', label: 'Estado', icon: MapPin, placeholder: 'SP' },
            { key: 'years_experience', label: 'Anos na estrada', icon: Calendar, placeholder: '5', type: 'number' },
          ].map(({ key, label, icon: Icon, placeholder, type = 'text' }) => (
            <div key={key}>
              <label htmlFor={`profile-${key}`} className={labelCls}>{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <input
                  id={`profile-${key}`}
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={fieldCls}
                />
              </div>
            </div>
          ))}
          <div>
            <label htmlFor="profile-email" className={labelCls}>Email (conta)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input id="profile-email" value={user?.email || ''} disabled className={`${fieldCls} text-[#888888] cursor-not-allowed`} />
            </div>
          </div>
        </section>

        {/* Recebimento e fechamento (PIX + PDF) */}
        <section className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3">
          <div>
            <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Recebimento e fechamento</h2>
            <p className="text-xs text-[#888888] mt-1">Vai na cobrança pelo WhatsApp, no PIX copia e cola e no PDF de fechamento.</p>
          </div>
          <div>
            <label htmlFor="pix-key-type" className={labelCls}>Tipo de chave PIX</label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo de chave PIX">
              {PIX_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={pixForm.pix_key_type === t}
                  onClick={() => setPixForm((f) => ({ ...f, pix_key_type: t }))}
                  className={`h-9 px-3.5 rounded-full border text-xs font-extrabold ${
                    pixForm.pix_key_type === t ? 'bg-white border-white text-[#0a0a0a]' : 'border-[#333333] text-[#c8c8c8]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              id="pix-key-type"
              value={pixForm.pix_key_type}
              onChange={(e) => setPixForm((f) => ({ ...f, pix_key_type: e.target.value }))}
              className="sr-only"
              tabIndex={-1}
            >
              {PIX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pix-key" className={labelCls}>Chave PIX</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                id="pix-key"
                type="text"
                value={pixForm.pix_key}
                onChange={(e) => setPixForm((f) => ({ ...f, pix_key: e.target.value }))}
                placeholder="sua@chave.pix"
                className={fieldCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="profile-cpf-cnpj" className={labelCls}>CPF ou CNPJ (MEI)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                id="profile-cpf-cnpj"
                type="text"
                value={pixForm.cpf_cnpj}
                onChange={(e) => setPixForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00 ou 000.000.000-00"
                className={fieldCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="profile-report-subtitle" className={labelCls}>Subtítulo no PDF (opcional)</label>
            <input
              id="profile-report-subtitle"
              type="text"
              value={pixForm.report_subtitle}
              onChange={(e) => setPixForm((f) => ({ ...f, report_subtitle: e.target.value }))}
              placeholder="Ex: Engenharia de Áudio & RF · MEI"
              className={`${fieldCls} pl-4`}
            />
          </div>
        </section>

        {/* Meta do mes */}
        <section className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3">
          <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Minha meta do mês</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'monthly_goal_events', label: 'Diárias', placeholder: '12', icon: Calendar },
              { key: 'monthly_goal_revenue', label: 'Faturamento (R$)', placeholder: '5000', icon: Target },
            ].map(({ key, label, placeholder, icon: Icon }) => (
              <div key={key}>
                <label htmlFor={`goals-${key}`} className={labelCls}>{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <input
                    id={`goals-${key}`}
                    type="number"
                    min="0"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={fieldCls}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#888888]">Diária = dia trabalhado (dois clientes no mesmo dia contam um).</p>
        </section>

        {/* Salvar unico (dados, funcao, metas e PIX): barra presa em cima do menu, so com alteracao.
            Fica no body para o "fixed" nao depender das animacoes da pagina. */}
        {(isDirty || saving || saved) && createPortal(
          <div
            role="region"
            aria-label="Salvar alterações do perfil"
            className="fixed left-0 right-0 z-20 bg-[#0a0a0a] border-t border-[#222222]"
            style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
              <p className="flex-1 min-w-0 text-xs text-[#a8a8a8]">
                {saved ? 'Tudo salvo.' : 'Alterações não salvas'}
              </p>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || (!isDirty && saved)}
                className={`h-11 px-6 rounded-full font-poster text-[18px] tracking-[2px] flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] disabled:opacity-80 ${
                  saved ? 'bg-white text-[#0a0a0a]' : 'bg-[#ffd400] text-[#0a0a0a]'
                }`}
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> SALVANDO</>
                ) : saved ? (
                  <><CheckCircle className="w-5 h-5" /> SALVO</>
                ) : (
                  <><Save className="w-5 h-5" /> SALVAR ALTERAÇÕES</>
                )}
              </button>
            </div>
          </div>,
          document.body,
        )}

        {/* Avisos e Google Agenda (componentes proprios) */}
        <EventTemplatesManager primaryHex="#ffd400" />

        <PushNotificationSettings />
        <GoogleCalendarSync />

        {/* Ajuda e suporte */}
        <section className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-2">
          <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase pb-1">Ajuda e suporte</h2>
          <Link to="/help" className={rowCls}>
            <span className="flex items-center gap-3 min-w-0">
              <BookOpen className="w-5 h-5 shrink-0 text-[#ffd400]" />
              <span className="text-sm font-bold text-white">Abrir manual do app</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#666666] shrink-0" />
          </Link>
          <button
            type="button"
            onClick={() => {
              hardNavigate('/');
              window.setTimeout(() => requestAppTour(), 400);
            }}
            className={rowCls}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Compass className="w-5 h-5 shrink-0 text-[#a8a8a8]" />
              <span className="text-sm font-bold text-white">Rever tour do app</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#666666] shrink-0" />
          </button>
          <button type="button" onClick={() => setFeedbackOpen(true)} className={rowCls}>
            <span className="flex items-center gap-3 min-w-0">
              <MessageCircle className="w-5 h-5 shrink-0 text-[#ffd400]" />
              <span className="text-sm font-bold text-white">Enviar feedback</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#666666] shrink-0" />
          </button>
          {owner && (
            <Link to="/admin/feedbacks" className={rowCls}>
              <span className="flex items-center gap-3 min-w-0">
                <Inbox className="w-5 h-5 shrink-0 text-[#ffd400]" />
                <span className="text-sm font-bold text-white">Inbox de feedback</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {ownerNewFeedbacks > 0 && (
                  <span className="font-tag text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff2e88] text-[#0a0a0a]">
                    {ownerNewFeedbacks} novo{ownerNewFeedbacks !== 1 ? 's' : ''}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-[#666666]" />
              </span>
            </Link>
          )}
          {owner && (
            <Link to="/admin/empresas" className={rowCls}>
              <span className="flex items-center gap-3 min-w-0">
                <Building2 className="w-5 h-5 shrink-0 text-[#ffd400]" />
                <span className="text-sm font-bold text-white">Catálogo de empresas</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#666666] shrink-0" />
            </Link>
          )}
        </section>

        {/* Conta */}
        <section className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-2">
          <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase pb-1">Conta</h2>
          <button type="button" onClick={toggleVisibility} className={rowCls} aria-pressed={isVisible}>
            <span className="flex items-center gap-3 min-w-0 text-left">
              {isVisible ? <Eye className="w-5 h-5 shrink-0 text-[#ffd400]" /> : <EyeOff className="w-5 h-5 text-[#888888] shrink-0" />}
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">Mostrar valores</span>
                <span className="block text-[11px] text-[#888888]">{isVisible ? 'Valores visíveis em todo o app' : 'Valores escondidos (modo privado)'}</span>
              </span>
            </span>
            <span className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${isVisible ? 'bg-[#ffd400]' : 'bg-[#333333]'}`}>
              <span className={`block w-5 h-5 rounded-full bg-[#0a0a0a] transition-transform ${isVisible ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
          </button>
          <Link to="/privacidade" className={rowCls}>
            <span className="text-sm font-bold text-white">Privacidade e termos</span>
            <ChevronRight className="w-4 h-4 text-[#666666] shrink-0" />
          </Link>
          <button type="button" onClick={handleExportData} disabled={exporting} className={`${rowCls} disabled:opacity-50`}>
            <span className="text-sm font-bold text-white">{exporting ? 'Exportando...' : 'Baixar meus dados'}</span>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-[#a8a8a8]" /> : <Download className="w-4 h-4 text-[#666666] shrink-0" />}
          </button>
          {showLogoutConfirm ? (
            <div className="rounded-[12px] bg-[#0a0a0a] border border-[#ff2e88]/40 p-3 space-y-2.5">
              <p className="text-sm font-bold text-white text-center">Tem certeza que quer sair?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowLogoutConfirm(false)} className="flex-1 h-11 rounded-full border border-[#444444] text-white text-sm font-extrabold">
                  Cancelar
                </button>
                <button type="button" onClick={handleLogout} className="flex-1 h-11 rounded-full bg-[#ff2e88] text-[#0a0a0a] text-sm font-extrabold">
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowLogoutConfirm(true)} className={rowCls}>
              <span className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-[#ff2e88]" />
                <span className="text-sm font-bold text-[#ff2e88]">Sair da conta</span>
              </span>
            </button>
          )}
          <button type="button" onClick={() => setShowDeleteAccount(true)} className={rowCls}>
            <span className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-[#ff2e88]" />
              <span className="text-sm font-bold text-[#ff2e88]">Excluir minha conta</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#666666] shrink-0" />
          </button>
        </section>

        <DeleteAccountDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount} onDeleted={handleAccountDeleted} />

        <InstallPwaCard primaryHex="#ffd400" />

        <p className="text-center text-[#555555] text-xs pb-2 font-tag">Backstage Pro v1.0</p>
      </div>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        primaryHex="#ffd400"
      />
    </div>
  );
}
