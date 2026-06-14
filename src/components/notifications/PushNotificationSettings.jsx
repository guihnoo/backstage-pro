import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Smartphone, Send } from 'lucide-react';
import appToast from '@/lib/appToast';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { NeonGlass } from '@/components/design/NeonGlass';
import { getCategoryConfig } from '@/lib/categoryConfig';
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  showTestNotification,
  sendServerTestPush,
} from '@/lib/pushNotifications';

const PREF_ITEMS = [
  { key: 'push_events', label: 'Shows', hint: 'Hoje e amanhã' },
  { key: 'push_payments', label: 'Pagamentos', hint: 'Atrasados' },
  { key: 'push_goals', label: 'Metas', hint: 'Quase na meta do mês' },
];

export default function PushNotificationSettings() {
  const { user, profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const [prefs, setPrefs] = useState({
    push_enabled: false,
    push_events: true,
    push_payments: true,
    push_goals: false,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const supported = isPushSupported();
  const permission = getPushPermission();
  const vapidReady = Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);
  const enabled = prefs.push_enabled;

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('push_enabled, push_events, push_payments, push_goals')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled && data) {
          let pushEnabled = Boolean(data.push_enabled);
          if (pushEnabled && vapidReady && isPushSupported()) {
            try {
              const reg = await navigator.serviceWorker.getRegistration();
              const sub = await reg?.pushManager?.getSubscription();
              const { count } = await supabase
                .from('push_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
              if (!sub || (count ?? 0) === 0) {
                pushEnabled = false;
                await supabase.from('user_settings').upsert(
                  {
                    user_id: user.id,
                    push_enabled: false,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id' }
                );
              }
            } catch {
              /* usuário reativa no perfil */
            }
          } else if (pushEnabled && !vapidReady) {
            pushEnabled = false;
          }
          setPrefs({
            push_enabled: pushEnabled,
            push_events: data.push_events !== false,
            push_payments: data.push_payments !== false,
            push_goals: Boolean(data.push_goals),
          });
        }
      } catch {
        if (!cancelled) {
          setPrefs((p) => ({ ...p, push_enabled: false }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persistPrefs = async (updates) => {
    const next = { ...prefs, ...updates };
    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: user.id,
        ...next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
    setPrefs(next);
  };

  const handleEnable = async () => {
    if (!user?.id) return;
    setBusy(true);
    try {
      if (!vapidReady) {
        appToast.error('Push não configurado no servidor', {
          description:
            'A variável VITE_VAPID_PUBLIC_KEY precisa estar no build de produção. Use "Testar notificação" após corrigir.',
        });
        return;
      }
      await subscribeToPush(user.id);
      await persistPrefs({ push_enabled: true });
      await showTestNotification();
      appToast.success('Alertas no celular ativados!', {
        description: 'Shows, pagamentos e metas chegam na barra do sistema.',
      });
    } catch (err) {
      appToast.error('Não foi possível ativar', { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!user?.id) return;
    setBusy(true);
    try {
      await unsubscribeFromPush(user.id);
      await persistPrefs({ push_enabled: false });
      appToast.info('Notificações desativadas');
    } catch (err) {
      appToast.error('Erro ao desativar', { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handlePrefToggle = async (key) => {
    if (!enabled || !user?.id) return;
    setBusy(true);
    try {
      await persistPrefs({ [key]: !prefs[key] });
    } catch (err) {
      appToast.error('Erro ao salvar preferência', { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleServerTest = async () => {
    if (!vapidReady) {
      try {
        await showTestNotification();
        appToast.success('Notificação local enviada');
      } catch (err) {
        appToast.error('Teste falhou', { description: err.message });
      }
      return;
    }
    setTesting(true);
    try {
      const result = await sendServerTestPush();
      appToast.success('Push do servidor enviado!', {
        description: result?.sent ? `${result.sent} dispositivo(s)` : undefined,
      });
    } catch (err) {
      appToast.error('Teste do servidor falhou', { description: err.message });
    } finally {
      setTesting(false);
    }
  };

  const iosHint =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    !window.navigator.standalone &&
    !window.matchMedia('(display-mode: standalone)').matches;

  return (
    <NeonGlass primary={config.primaryHex} className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${config.primaryHex}22` }}
        >
          <Smartphone className="w-5 h-5" style={{ color: config.primaryHex }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Alertas no celular
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Shows de hoje/amanhã e pagamentos atrasados — 8h e 18h (horário de Brasília).
          </p>
        </div>
      </div>

      {!supported && (
        <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          Seu navegador não suporta push. Use Chrome no Android ou instale o app na Tela de Início (iOS 16.4+).
        </p>
      )}

      {iosHint && supported && (
        <p
          className="text-xs rounded-lg p-3 mb-3"
          style={{
            color: `${config.primaryHex}cc`,
            backgroundColor: `${config.primaryHex}1a`,
            border: `1px solid ${config.primaryHex}33`,
          }}
        >
          No iPhone: adicione o Backstage à Tela de Início antes de ativar notificações.
        </p>
      )}

      {!vapidReady && supported && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3 space-y-1">
          <p className="text-xs font-semibold text-amber-300">Notificações push pendentes de configuração</p>
          <p className="text-xs text-amber-400/90">
            A variável <code className="font-mono bg-slate-800 px-1 rounded">VITE_VAPID_PUBLIC_KEY</code> não está no build de produção.
          </p>
          <p className="text-xs text-amber-400/80">
            Acesse <strong>Vercel → Project → Settings → Environment Variables</strong>, adicione a chave e faça um novo deploy. Depois, reabra o app e toque em "Ativar alertas".
          </p>
        </div>
      )}

      {permission === 'denied' && (
        <p className="text-xs text-red-300/90 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
          Notificações bloqueadas. Abra Configurações do celular → Backstage → permitir notificações.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          {enabled ? (
            <Bell className="w-4 h-4 text-emerald-400" />
          ) : (
            <BellOff className="w-4 h-4 text-slate-500" />
          )}
          <span>{loading ? 'Carregando...' : enabled ? 'Ativado' : 'Desativado'}</span>
        </div>

        <button
          type="button"
          disabled={!supported || busy || loading || permission === 'denied'}
          onClick={enabled ? handleDisable : handleEnable}
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50"
          style={{
            background: enabled
              ? 'rgb(55 65 81)'
              : `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`,
            color: enabled ? '#94a3b8' : '#06070a',
          }}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin inline" />
          ) : enabled ? (
            'Desativar'
          ) : (
            'Ativar'
          )}
        </button>
      </div>

      {enabled && (
        <div className="space-y-3 border-t border-white/5 pt-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Tipos de alerta</p>
          {PREF_ITEMS.map(({ key, label, hint }) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 cursor-pointer"
            >
              <span className="text-sm text-slate-300">
                {label}
                <span className="block text-[10px] text-slate-500">{hint}</span>
              </span>
              <input
                type="checkbox"
                checked={prefs[key]}
                disabled={busy}
                onChange={() => handlePrefToggle(key)}
                className="h-4 w-4 rounded accent-amber-400"
              />
            </label>
          ))}

          <button
            type="button"
            disabled={testing || permission === 'denied'}
            onClick={handleServerTest}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Testar notificação
          </button>
        </div>
      )}
    </NeonGlass>
  );
}
