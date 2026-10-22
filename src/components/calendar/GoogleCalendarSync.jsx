import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, RefreshCw, ExternalLink, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { UserSettings } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import { useEvents } from '@/lib/useEvents';
import {
  googleAuthStart,
  googleDisconnect,
  googleSyncNow,
  googleListCalendars,
  googleDedupeEvents,
} from '@/lib/googleCalendarApi';
import appToast from '@/lib/appToast';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { formatGoogleOAuthError } from '@/lib/googleOAuthErrors';
import { needsGooglePush } from '@/lib/googleSyncRules';

const labelCls = 'block font-tag text-[10px] tracking-[1px] uppercase text-[#a8a8a8] mb-1.5';
const fieldCls = 'w-full h-12 bg-[#0a0a0a] border border-[#333333] rounded-[12px] px-4 text-base font-semibold text-white placeholder:font-normal placeholder:text-[#666666] focus:outline-none focus:border-[#ffd400] transition-colors';

// O "principal" do Google tem id = e-mail; o app guarda 'primary'
const calendarValue = (c) => (c.primary ? 'primary' : c.id);

function OptionRow({ id, title, description, checked, onChange, children }) {
  return (
    <div className="rounded-[12px] bg-[#0a0a0a] border border-[#222222] p-3.5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="min-w-0 cursor-pointer">
          <span className="block text-sm font-extrabold text-white">{title}</span>
          <span className="block text-xs text-[#a8a8a8] mt-0.5">{description}</span>
        </label>
        <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      </div>
      {checked && children}
    </div>
  );
}

function syncSummary(data) {
  const parts = [`${data.synced_events || 0} enviados ao Google`];
  if (data.imported_count) parts.push(`${data.imported_count} shows trazidos do Google`);
  if (data.linked_count) parts.push(`${data.linked_count} vinculados`);
  if (data.updated_from_google) parts.push(`${data.updated_from_google} atualizados pelo Google`);
  if (data.pending_push) parts.push(`${data.pending_push} ficam para a próxima rodada`);
  return parts;
}

export default function GoogleCalendarSync() {
  const { user } = useAuth();
  const { events, refetch: refetchEvents } = useEvents();
  const location = useLocation();
  const locationPathname = location.pathname;
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [lastSyncStatus, setLastSyncStatus] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [keywordsDraft, setKeywordsDraft] = useState('');

  const isConnected = Boolean(settings?.google_calendar_connected);
  const pushOn = settings?.google_push_enabled !== false;
  const importOn = settings?.google_import_enabled === true;
  const busyOn = settings?.google_busy_check_enabled !== false;

  const unsyncedCount = useMemo(() => {
    if (!isConnected || !pushOn) return 0;
    return events.filter(needsGooglePush).length;
  }, [events, isConnected, pushOn]);

  const writableCalendars = useMemo(() => calendars.filter((c) => c.writable !== false), [calendars]);

  const loadCalendars = useCallback(async () => {
    const { data } = await googleListCalendars();
    if (data?.success) {
      setCalendars(data.calendars || []);
    } else {
      setCalendars([]);
      appToast.info('Lista de agendas indisponível', {
        description: 'Conecte o Google de novo para atualizar as permissões.',
      });
    }
  }, []);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const rows = await UserSettings.filter({ user_id: user.id });
      const row = rows?.[0] ?? null;
      setSettings(row);
      setKeywordsDraft(row?.google_import_keywords || '');
      if (row?.google_calendar_connected) await loadCalendars();
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSettings(null);
    }
    setIsLoading(false);
  }, [user?.id, loadCalendars]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const connected = urlParams.get('google_connected');
    if (error) {
      appToast.error('Falha ao conectar o Google Agenda', {
        description: formatGoogleOAuthError(error),
        duration: 8000,
      });
      window.history.replaceState({}, '', locationPathname);
    }
    if (connected === '1') {
      appToast.success('Google Agenda ligado ao app!');
      window.history.replaceState({}, '', locationPathname);
      loadSettings();
    }
  }, [location.search, locationPathname, loadSettings]);

  // Atalho da Agenda ("fora do Google Agenda") abre o Perfil já nesta parte
  useEffect(() => {
    if (isLoading || new URLSearchParams(location.search).get('tab') !== 'google') return;
    document.getElementById('perfil-google')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isLoading, location.search]);

  const saveOption = async (patch) => {
    const previous = settings;
    setSettings((s) => ({ ...(s || {}), ...patch }));
    const { error } = await supabase.from('user_settings').update(patch).eq('user_id', user.id);
    if (error) {
      setSettings(previous);
      appToast.error('Não deu para salvar a opção', { description: error.message });
    }
  };

  const handleConnect = async () => {
    try {
      appToast.info('Abrindo o Google...');
      const { data } = await googleAuthStart();
      if (data?.success && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      throw new Error(data?.error || 'Não foi possível abrir o Google.');
    } catch (error) {
      const msg = error.message || '';
      const hint = /GOOGLE_CLIENT|não configurado|FunctionsFetchError|Failed to fetch/i.test(msg)
        ? 'Verifique se as Edge Functions e secrets GOOGLE_* estão no Supabase.'
        : msg;
      appToast.error('Erro ao conectar com o Google', {
        description: hint || 'Tente novamente em alguns instantes.',
        duration: 8000,
      });
    }
  };

  const handleDisconnect = async () => {
    const { data } = await googleDisconnect();
    if (data?.success === false) {
      appToast.error('Erro ao desconectar. Tente novamente.');
      return;
    }
    setCalendars([]);
    await loadSettings();
    appToast.success('Google Agenda desligado do app.');
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setLastSyncStatus(null);
    const { data } = await googleSyncNow();
    if (data?.success) {
      const parts = syncSummary(data);
      setLastSyncStatus({ success: true, message: `Pronto: ${parts.join(', ')}.` });
      appToast.success('Sincronização concluída!', { description: parts.join(' · ') });
      refetchEvents?.();
      const rows = await UserSettings.filter({ user_id: user.id }).catch(() => null);
      if (rows?.[0]) setSettings(rows[0]);
    } else {
      const message = data?.error || 'Erro na sincronização';
      setLastSyncStatus({ success: false, message });
      appToast.error('Erro na sincronização', { description: message, duration: 8000 });
    }
    setIsSyncing(false);
  };

  const handleDedupeEvents = async () => {
    setIsSyncing(true);
    const { data } = await googleDedupeEvents();
    if (data?.success) {
      appToast.success('Limpeza concluída', {
        description: `${data.removed_count || 0} duplicata(s) removida(s).`,
      });
      refetchEvents?.();
    } else {
      appToast.error('Erro ao limpar duplicatas', { description: data?.error });
    }
    setIsSyncing(false);
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-[#161616] border border-[#222222] p-6 text-center">
        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-[#ffd400]" />
        <p className="text-sm text-[#a8a8a8]">Carregando Google Agenda...</p>
      </section>
    );
  }

  const lastSyncLabel = settings?.google_last_sync_at
    ? `há ${formatDistanceToNowStrict(new Date(settings.google_last_sync_at), { locale: ptBR })}`
    : 'ainda não sincronizou';
  const syncError = settings?.google_last_sync_error;

  return (
    <>
      <section id="perfil-google" className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-4 min-w-0 scroll-mt-4" aria-labelledby="gcal-title">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Google Agenda</h2>
            <p id="gcal-title" className="font-extrabold text-white text-base mt-1">Sincronização com Google Calendar</p>
          </div>
          <Calendar className="w-6 h-6 text-[#ffd400] shrink-0" aria-hidden />
        </div>

        {syncError && (
          <div className="rounded-[12px] bg-[#1a1a1a] px-3 py-2.5 text-xs flex gap-2" style={{ borderLeft: '4px solid #ff2e88' }} role="alert">
            <AlertTriangle className="w-4 h-4 text-[#ff2e88] shrink-0 mt-0.5" />
            <p className="text-[#c8c8c8]"><span className="font-extrabold text-white">Última tentativa falhou.</span> {syncError}</p>
          </div>
        )}

        {isConnected ? (
          <>
            <div className="rounded-[12px] bg-[#0a0a0a] border border-[#222222] p-3.5 space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffd400] shrink-0" aria-hidden />
                <span className="text-sm font-extrabold text-white">Conectado</span>
                {settings?.google_account_email && (
                  <span className="font-tag text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffd400] text-[#0a0a0a] max-w-full truncate">
                    {settings.google_account_email}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a8a8a8]">
                Última sincronização: <span className="text-white font-bold">{lastSyncLabel}</span>
              </p>
              <p className="font-tag text-[10px] tracking-[1px] uppercase text-[#666666]">O app sincroniza sozinho a cada 15 min</p>
            </div>

            <div className="space-y-2">
              <OptionRow
                id="gcal-push"
                title="Enviar meus trabalhos para o Google"
                description="Cada trabalho novo ou editado aparece na sua agenda do Google."
                checked={pushOn}
                onChange={(v) => saveOption({ google_push_enabled: v })}
              >
                <div>
                  <label htmlFor="gcal-push-calendar" className={labelCls}>Agenda que recebe os trabalhos</label>
                  <select
                    id="gcal-push-calendar"
                    value={settings?.google_calendar_id || 'primary'}
                    onChange={(e) => saveOption({ google_calendar_id: e.target.value })}
                    className={fieldCls}
                  >
                    {writableCalendars.length === 0 && <option value="primary">Agenda principal</option>}
                    {writableCalendars.map((c) => (
                      <option key={calendarValue(c)} value={calendarValue(c)}>
                        {c.primary ? `${c.summary} (principal)` : c.summary}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#888888] mt-1.5">Os trabalhos já enviados continuam onde estão.</p>
                </div>
              </OptionRow>

              <OptionRow
                id="gcal-import"
                title="Trazer shows do Google para o app"
                description="Só entra o que estiver na agenda que você escolher. Compromisso pessoal fica de fora."
                checked={importOn}
                onChange={(v) => saveOption({ google_import_enabled: v })}
              >
                <div className="space-y-3">
                  <div>
                    <label htmlFor="gcal-import-calendar" className={labelCls}>Agenda dos shows</label>
                    <select
                      id="gcal-import-calendar"
                      value={settings?.google_import_calendar_id || ''}
                      onChange={(e) => saveOption({ google_import_calendar_id: e.target.value || null })}
                      className={`${fieldCls} ${settings?.google_import_calendar_id ? '' : 'border-[#ffd400]'}`}
                    >
                      <option value="">Escolha a agenda</option>
                      {calendars.map((c) => (
                        <option key={calendarValue(c)} value={calendarValue(c)}>
                          {c.primary ? `${c.summary} (principal)` : c.summary}
                        </option>
                      ))}
                    </select>
                    {!settings?.google_import_calendar_id && (
                      <p className="text-[11px] text-[#ffd400] mt-1.5">Escolha a agenda para começar a trazer os shows.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="gcal-import-keywords" className={labelCls}>Só trazer se o nome tiver (opcional)</label>
                    <input
                      id="gcal-import-keywords"
                      value={keywordsDraft}
                      onChange={(e) => setKeywordsDraft(e.target.value)}
                      onBlur={() => {
                        const next = keywordsDraft.trim() || null;
                        if (next !== (settings?.google_import_keywords || null)) saveOption({ google_import_keywords: next });
                      }}
                      placeholder="show, montagem, evento"
                      className={fieldCls}
                    />
                    <p className="text-[11px] text-[#888888] mt-1.5">
                      Útil se seus shows ficam na agenda principal junto com coisas pessoais. Separe por vírgula.
                    </p>
                  </div>
                </div>
              </OptionRow>

              <OptionRow
                id="gcal-busy"
                title="Avisar se o dia estiver ocupado no Google"
                description="Ao marcar um trabalho, o app confere sua agenda do Google e avisa se já tem compromisso."
                checked={busyOn}
                onChange={(v) => saveOption({ google_busy_check_enabled: v })}
              />
            </div>

            {unsyncedCount > 0 && (
              <div className="rounded-[12px] bg-[#1a1a1a] px-3 py-2.5 text-xs" style={{ borderLeft: '4px solid #ffd400' }}>
                <p className="text-[#c8c8c8]">
                  <span className="font-extrabold text-white">{unsyncedCount} trabalho{unsyncedCount === 1 ? '' : 's'}</span>
                  {' '}ainda não enviado{unsyncedCount === 1 ? '' : 's'} ao Google. Vão na próxima sincronização.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="w-full h-12 rounded-full bg-[#ffd400] text-[#0a0a0a] font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sincronizar agora
              </button>
              <button
                type="button"
                onClick={() => setPendingAction('dedupe')}
                disabled={isSyncing}
                className="w-full h-12 rounded-full border border-[#444444] text-white font-bold text-sm active:scale-[0.98] disabled:opacity-60"
              >
                Limpar duplicatas da agenda
              </button>
              <button
                type="button"
                onClick={() => setPendingAction('disconnect')}
                className="w-full h-12 rounded-full border border-[#ff2e88]/60 text-[#ff2e88] font-bold text-sm active:scale-[0.98]"
              >
                Desconectar
              </button>
            </div>

            {lastSyncStatus && (
              <div
                className="rounded-[12px] bg-[#1a1a1a] px-3 py-2.5 text-xs flex gap-2"
                style={{ borderLeft: `4px solid ${lastSyncStatus.success ? '#ffd400' : '#ff2e88'}` }}
                role="status"
              >
                {lastSyncStatus.success
                  ? <CheckCircle className="w-4 h-4 text-[#ffd400] shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-4 h-4 text-[#ff2e88] shrink-0 mt-0.5" />}
                <p className="text-[#c8c8c8]">{lastSyncStatus.message}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <ul className="space-y-2 text-sm text-[#c8c8c8]">
              {[
                'Seus trabalhos aparecem na agenda do Google, no celular e no computador.',
                'Shows marcados no Google entram no app — só da agenda que você escolher.',
                'Aviso quando você marca trabalho num dia que já está ocupado no Google.',
              ].map((text) => (
                <li key={text} className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd400] shrink-0 mt-2" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleConnect}
              className="w-full h-12 rounded-full bg-[#ffd400] text-[#0a0a0a] font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4" />
              Conectar ao Google
            </button>
          </>
        )}

        <p className="text-[11px] text-[#888888] text-center">
          Ao conectar, você concorda com a{' '}
          <Link to="/privacidade" className="text-[#ffd400] hover:underline">Política de Privacidade</Link>
          {' e os '}
          <Link to="/termos" className="text-[#ffd400] hover:underline">Termos de Uso</Link>.
        </p>
      </section>

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
        title={pendingAction === 'disconnect' ? 'Desligar o Google Agenda?' : 'Limpar duplicatas da agenda?'}
        description={
          pendingAction === 'disconnect'
            ? 'O app para de sincronizar com o Google. O que já está lá continua lá.'
            : 'Mantém o registro com Google vinculado ou com horas lançadas. Outros duplicados serão removidos.'
        }
        confirmLabel={pendingAction === 'disconnect' ? 'Desconectar' : 'Limpar'}
        destructive
        onConfirm={() => {
          const action = pendingAction;
          setPendingAction(null);
          if (action === 'disconnect') handleDisconnect();
          else if (action === 'dedupe') handleDedupeEvents();
        }}
      />
    </>
  );
}
