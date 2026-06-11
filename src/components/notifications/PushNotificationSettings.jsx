import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Smartphone } from 'lucide-react';
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
} from '@/lib/pushNotifications';

export default function PushNotificationSettings() {
  const { user, profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const supported = isPushSupported();
  const permission = getPushPermission();
  const vapidReady = Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);

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
          .select('push_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) setEnabled(Boolean(data?.push_enabled));
      } catch {
        if (!cancelled) setEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const persistEnabled = async (value) => {
    const { error } = await supabase.from('user_settings').upsert(
      { user_id: user.id, push_enabled: value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
    setEnabled(value);
  };

  const handleEnable = async () => {
    if (!user?.id) return;
    setBusy(true);
    try {
      if (!vapidReady) {
        await showTestNotification();
        await persistEnabled(true);
        appToast.success('Notificações locais ativadas', {
          description: 'Push no servidor será configurado em breve.',
        });
        return;
      }
      await subscribeToPush(user.id);
      await persistEnabled(true);
      appToast.success('Alertas no celular ativados!', {
        description: 'Shows, pagamentos e metas importantes chegam aqui.',
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
      await persistEnabled(false);
      appToast.info('Notificações desativadas');
    } catch (err) {
      appToast.error('Erro ao desativar', { description: err.message });
    } finally {
      setBusy(false);
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
            Shows de hoje/amanhã e pagamentos atrasados — direto na barra do sistema.
          </p>
        </div>
      </div>

      {!supported && (
        <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          Seu navegador não suporta push. Use Chrome no Android ou instale o app na Tela de Início (iOS 16.4+).
        </p>
      )}

      {iosHint && supported && (
        <p className="text-xs text-cyan-300/80 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-3">
          No iPhone: adicione o Backstage à Tela de Início antes de ativar notificações.
        </p>
      )}

      {permission === 'denied' && (
        <p className="text-xs text-red-300/90 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
          Notificações bloqueadas. Abra Configurações do celular → Backstage → permitir notificações.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
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
    </NeonGlass>
  );
}
