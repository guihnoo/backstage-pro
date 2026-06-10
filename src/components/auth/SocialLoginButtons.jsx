import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import {
  checkSupabaseReachable,
  getSupabaseProjectRef,
} from '@/lib/checkSupabaseReachable';
import { GoogleIcon, AppleIcon, DiscordIcon, FacebookIcon } from './ProviderIcons';

const PROVIDERS = [
  {
    id: 'google',
    label: 'Continuar com Google',
    Icon: GoogleIcon,
    className: 'bg-white text-gray-900 border-white/90 hover:bg-gray-100 shadow-sm shadow-white/10',
    iconClassName: 'w-5 h-5',
  },
  {
    id: 'apple',
    label: 'Continuar com Apple',
    Icon: AppleIcon,
    className: 'bg-black text-white border-gray-700 hover:bg-gray-900',
    iconClassName: 'w-5 h-5 text-white',
  },
  {
    id: 'discord',
    label: 'Continuar com Discord',
    Icon: DiscordIcon,
    className: 'bg-[#5865F2]/15 text-[#b8bcff] border-[#5865F2]/40 hover:bg-[#5865F2]/25',
    iconClassName: 'w-5 h-5',
  },
  {
    id: 'facebook',
    label: 'Continuar com Facebook',
    Icon: FacebookIcon,
    className: 'bg-[#1877F2]/15 text-[#93c5fd] border-[#1877F2]/40 hover:bg-[#1877F2]/25',
    iconClassName: 'w-5 h-5',
  },
];

export default function SocialLoginButtons({ mode = 'login' }) {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [backendIssue, setBackendIssue] = useState(null);

  useEffect(() => {
    let cancelled = false;

    checkSupabaseReachable().then((result) => {
      if (cancelled || result.ok) return;
      const ref = getSupabaseProjectRef(result.url);
      setBackendIssue(
        ref
          ? `Projeto Supabase "${ref}" inacessível. Rode: npm run supabase:fix-env`
          : 'Backend Supabase inacessível. Atualize VITE_SUPABASE_URL na Vercel.'
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSocialLogin = async (provider) => {
    try {
      setLoading(provider);
      setError(null);
      await signInWithOAuth(provider);
    } catch (err) {
      const message =
        err?.message?.includes('provider is not enabled')
          ? 'Este provedor ainda não está ativo no Supabase. Use Google ou email/senha.'
          : err?.message || 'Não foi possível iniciar o login social.';
      setError(message);
      setLoading(null);
    }
  };

  const verb = mode === 'signup' ? 'Cadastrar' : 'Continuar';

  return (
    <div className="space-y-3">
      {backendIssue && (
        <div className="flex gap-2 items-start rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-100/90 leading-relaxed">{backendIssue}</p>
        </div>
      )}

      {PROVIDERS.map((provider, idx) => {
        const { Icon } = provider;
        const label = provider.label.replace('Continuar', verb);

        return (
          <motion.button
            key={provider.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => handleSocialLogin(provider.id)}
            disabled={loading !== null}
            className={`relative w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${provider.className}`}
          >
            {loading === provider.id ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="absolute left-4 flex items-center justify-center w-6">
                  <Icon className={provider.iconClassName} />
                </span>
                <span>{label}</span>
              </>
            )}
          </motion.button>
        );
      })}

      {error && (
        <p className="text-xs text-amber-300/90 text-center px-2 leading-relaxed">{error}</p>
      )}

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
        <span>Autenticação segura · OAuth 2.0 · Supabase</span>
      </div>
    </div>
  );
}
