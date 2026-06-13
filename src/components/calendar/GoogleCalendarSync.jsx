
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Download,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { UserSettings } from '@/api/entities';
import { useAuth } from '@/lib/authContext';
import { useEvents } from '@/lib/useEvents';
import { googleAuthStart, googleDisconnect, googleSyncNow, googleListCalendars, googleImportEvents, googleDedupeEvents } from '@/api/functions';
import { Link } from 'react-router-dom';
import appToast from '@/lib/appToast';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { formatGoogleOAuthError } from '@/lib/googleOAuthErrors';
import { isCancelledEvent } from '@/lib/eventFinance';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

export default function GoogleCalendarSync() {
  const theme = useCategoryTheme();
  const { user } = useAuth();
  const { events } = useEvents();
  const location = useLocation();
  const locationPathname = location.pathname;
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [lastSyncStatus, setLastSyncStatus] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const unsyncedCount = useMemo(() => {
    if (!settings?.google_calendar_connected) return 0;
    return events.filter((e) => !e.google_event_id && !isCancelledEvent(e)).length;
  }, [events, settings?.google_calendar_connected]);

  useEffect(() => {
    if (user?.id) loadSettings();
  }, [user?.id]);

  useEffect(() => {
    checkUrlForError();
  }, [location.search, locationPathname, user?.id]);

  const checkUrlForError = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const connected = urlParams.get('google_connected');
    if (error) {
      appToast.error('Falha ao conectar Google Calendar', {
        description: formatGoogleOAuthError(error),
        duration: 8000,
      });
      window.history.replaceState({}, '', locationPathname);
    }
    if (connected === '1') {
      appToast.success('Google Calendar conectado com sucesso!');
      window.history.replaceState({}, '', locationPathname);
      loadSettings();
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const userSettings = await UserSettings.filter({ user_id: user.id });
      
      if (userSettings && userSettings.length > 0) {
        setSettings(userSettings[0]);
        if (userSettings[0].google_calendar_connected) {
          await loadCalendars();
        }
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSettings(null);
    }
    setIsLoading(false);
  };

  const loadCalendars = async () => {
    try {
      const { data } = await googleListCalendars();
      if (data.success) {
        setCalendars(data.calendars || []);
      }
    } catch (error) {
      console.error('Erro ao carregar calendários:', error);
      setCalendars([]);
      appToast.info('Lista de calendários indisponível', {
        description: 'Reconecte o Google Calendar em Perfil para atualizar permissões.',
      });
    }
  };

  const handleConnect = async () => {
    try {
      appToast.info("Redirecionando para autenticação do Google...");
      const { data } = await googleAuthStart();
      
      if (data?.success && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      throw new Error(data?.error || 'Não foi possível obter a URL de autorização do Google.');
    } catch (error) {
      console.error('Erro ao iniciar conexão:', error);
      const msg = error.message || '';
      const hint = /GOOGLE_CLIENT|não configurado|FunctionsFetchError|Failed to fetch/i.test(msg)
        ? 'Verifique se as Edge Functions e secrets GOOGLE_* estão no Supabase.'
        : msg;
      appToast.error('Erro ao conectar com Google Calendar', {
        description: hint || 'Tente novamente em alguns instantes.',
        duration: 8000,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      appToast.info("Desconectando do Google Calendar...");
      await googleDisconnect();
      await loadSettings();
      setCalendars([]);
      appToast.success("Desconectado com sucesso!");
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      appToast.error("Erro ao desconectar. Tente novamente.");
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setLastSyncStatus(null);
    
    try {
      appToast.info("Sincronizando eventos com Google Calendar...");
      const { data } = await googleSyncNow();
      
      if (data.success) {
        const parts = [];
        if (data.imported_count) parts.push(`${data.imported_count} importados`);
        if (data.linked_count) parts.push(`${data.linked_count} vinculados`);
        if (data.skipped_count) parts.push(`${data.skipped_count} ignorados (já existiam)`);
        parts.push(`${data.synced_events || 0} enviados ao Google`);
        setLastSyncStatus({
          success: true,
          message: `Sincronização concluída: ${parts.join(', ')}.`,
          timestamp: new Date()
        });
        appToast.success("Sincronização concluída!", { description: parts.join(' · ') });
      } else {
        throw new Error(data.error || 'Erro desconhecido na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setLastSyncStatus({
        success: false,
        message: error.message || 'Erro na sincronização',
        timestamp: new Date()
      });
      appToast.error('Erro na sincronização', {
        description: error.message || 'Verifique sua conexão com o Google.',
        duration: 8000,
      });
    }
    setIsSyncing(false);
  };

  const handleImportEvents = async () => {
    setIsSyncing(true);
    try {
      appToast.info("Importando eventos do Google Calendar...");
      const { data } = await googleImportEvents({ days_back: 30, days_forward: 90 });
      
      if (data.success) {
        const msg = [
          data.imported_count ? `${data.imported_count} novos` : null,
          data.linked_count ? `${data.linked_count} vinculados` : null,
          data.skipped_count ? `${data.skipped_count} ignorados` : null,
        ].filter(Boolean).join(', ') || 'Nenhum evento novo';
        appToast.success('Importação concluída', { description: msg });
      } else {
        throw new Error(data.error || 'Erro na importação');
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      appToast.error("Erro ao importar eventos. Tente novamente.");
    }
    setIsSyncing(false);
  };

  const handleDedupeEvents = async () => {
    setIsSyncing(true);
    try {
      const { data } = await googleDedupeEvents();
      if (data.success) {
        appToast.success('Limpeza concluída', {
          description: `${data.removed_count || 0} duplicata(s) removida(s).`,
        });
      } else {
        throw new Error(data.error || 'Erro na limpeza');
      }
    } catch (error) {
      appToast.error('Erro ao limpar duplicatas', { description: error.message });
    }
    setIsSyncing(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 min-w-0 overflow-hidden">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={theme.accentStyle} />
          <p className="text-slate-400">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  const isConnected = settings?.google_calendar_connected;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 min-w-0"
    >
      <Card className="bg-slate-800/50 border-slate-700 min-w-0 overflow-hidden">
        <CardHeader className="min-w-0">
          <CardTitle className="text-white flex flex-wrap items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-6 h-6 text-blue-400 shrink-0" />
            <span className="min-w-0">Sincronização com Google Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 min-w-0">
          {/* Status da Conexão */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full shrink-0 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-white font-medium">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
              {isConnected && settings?.google_account_email && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/50 max-w-full truncate">
                  {settings.google_account_email}
                </Badge>
              )}
            </div>
            
            {isConnected ? (
              <Button variant="destructive" onClick={() => setPendingAction('disconnect')} size="sm" className="w-full sm:w-auto shrink-0">
                Desconectar
              </Button>
            ) : (
              <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0">
                <ExternalLink className="w-4 h-4 mr-2" />
                Conectar ao Google
              </Button>
            )}
          </div>

          {/* Informações da Conta Conectada */}
          {isConnected && (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-sm min-w-0">
                  <span className="text-slate-400 shrink-0">Última Sincronização:</span>
                  <span className="text-white break-words text-right sm:text-left">
                    {settings.google_last_sync_at ?
                      new Date(settings.google_last_sync_at).toLocaleString('pt-BR') :
                      'Nunca'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Calendários Disponíveis:</span>
                  <span className="text-white">{calendars.length}</span>
                </div>
              </div>

              {/* Lista de Calendários */}
              {calendars.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Seus Calendários do Google
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {calendars.map((calendar, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 bg-slate-900/30 rounded p-2 min-w-0">
                        <span className="text-slate-300 text-sm truncate min-w-0 flex-1">{calendar.summary}</span>
                        <Badge variant="outline" className={`shrink-0 ${calendar.primary ? 'border-blue-400 text-blue-300' : 'border-slate-600 text-slate-400'}`}>
                          {calendar.primary ? 'Principal' : 'Secundário'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicador de eventos não sincronizados */}
              {unsyncedCount > 0 && (
                <Alert className="border-amber-500/40 bg-amber-500/10">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <AlertDescription className="text-amber-200 text-sm">
                    <strong>{unsyncedCount} evento{unsyncedCount === 1 ? '' : 's'}</strong> do app ainda não enviado{unsyncedCount === 1 ? '' : 's'} ao Google Calendar.
                    {' '}Clique em <strong>Sincronizar Agora</strong> para enviar.
                  </AlertDescription>
                </Alert>
              )}

              {/* Ações de Sincronização */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Agora
                </Button>
                
                <Button
                  onClick={() => setPendingAction('import')}
                  disabled={isSyncing}
                  variant="outline"
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600 flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Importar Eventos
                </Button>
              </div>

              <Button
                type="button"
                onClick={() => setPendingAction('dedupe')}
                disabled={isSyncing}
                variant="outline"
                className="w-full border-amber-600/40 text-amber-200 hover:bg-amber-500/10"
              >
                Limpar duplicatas da agenda
              </Button>

              {/* Status da Última Sincronização */}
              {lastSyncStatus && (
                <Alert className={lastSyncStatus.success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
                  {lastSyncStatus.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <AlertDescription className={lastSyncStatus.success ? 'text-green-300' : 'text-red-300'}>
                    {lastSyncStatus.message}
                    <br />
                    <span className="text-xs opacity-75">
                      {lastSyncStatus.timestamp.toLocaleString('pt-BR')}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Informações sobre a Sincronização */}
          {!isConnected && (
            <Alert className="border-blue-500 bg-blue-500/10">
              <Calendar className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Benefícios da Sincronização:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Seus eventos do Backstage Pro aparecem no Google Calendar</li>
                  <li>• Importação automática de eventos existentes</li>
                  <li>• Sincronização bidirecional em tempo real</li>
                  <li>• Notificações unificadas em todos os dispositivos</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-slate-500 text-center pt-2">
            Ao conectar, você concorda com a{' '}
            <Link to="/privacidade" className="text-cyan-400 hover:underline">Política de Privacidade</Link>
            {' e os '}
            <Link to="/termos" className="text-cyan-400 hover:underline">Termos de Uso</Link>.
          </p>
        </CardContent>
      </Card>
    </motion.div>

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
        title={
          pendingAction === 'disconnect' ? 'Desconectar Google Calendar?' :
          pendingAction === 'import' ? 'Importar eventos do Google?' :
          'Limpar duplicatas da agenda?'
        }
        description={
          pendingAction === 'disconnect' ? 'Você perderá a sincronização com o Google Calendar.' :
          pendingAction === 'import' ? 'Eventos dos últimos 30 dias e próximos 90 dias serão importados. Duplicatas serão ignoradas automaticamente.' :
          'Mantém o registro com Google vinculado ou com horas lançadas. Outros duplicados serão removidos.'
        }
        confirmLabel={
          pendingAction === 'disconnect' ? 'Desconectar' :
          pendingAction === 'import' ? 'Importar' :
          'Limpar'
        }
        destructive={pendingAction === 'disconnect' || pendingAction === 'dedupe'}
        onConfirm={() => {
          const action = pendingAction;
          setPendingAction(null);
          if (action === 'disconnect') handleDisconnect();
          else if (action === 'import') handleImportEvents();
          else if (action === 'dedupe') handleDedupeEvents();
        }}
      />
    </>
  );
}
