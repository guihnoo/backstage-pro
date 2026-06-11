import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { checkSupabaseReachable, getSupabaseProjectRef } from '@/lib/checkSupabaseReachable';
import { GoogleIcon } from './ProviderIcons';
import { useEffect } from 'react';

export default function SocialLoginButtons({ mode = 'login' }) {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendIssue, setBackendIssue] = useState(null);

  useEffect(() => {
    let cancelled = false;
    checkSupabaseReachable().then((result) => {
      if (cancelled || result.ok) return;
      const ref = getSupabaseProjectRef(result.url);
      setBackendIssue(
        ref
          ? `Projeto Supabase "${ref}" inacessível.`
          : 'Backend inacessível. Verifique sua conexão.'
      );
    });
    return () => { cancelled = true; };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithOAuth('google');
    } catch (err) {
      const message =
        err?.message?.includes('provider is not enabled')
          ? 'Login com Google não está ativo no momento.'
          : err?.message || 'Não foi possível iniciar o login com Google.';
      setError(message);
      setLoading(false);
    }
  };

  const verb = mode === 'signup' ? 'Cadastrar' : 'Continuar';

  return (
    <div className="space-y-3">
      {backendIssue && (
        <div className="flex gap-2 items-start rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-100/90 leading-relaxed">{backendIssue}</p>
        </div>
      )}

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleGoogleLogin}
        disabled={loading}
        className="relative w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white text-gray-900 border-white/90 hover:bg-gray-100 shadow-sm shadow-white/10"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        ) : (
          <>
            <span className="absolute left-4 flex items-center justify-center w-6">
              <GoogleIcon className="w-5 h-5" />
            </span>
            <span>{verb} com Google</span>
          </>
        )}
      </motion.button>

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
