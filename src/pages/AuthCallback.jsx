import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import { useAuth } from '@/lib/authContext';
import { withTimeout } from '@/lib/withTimeout';
import { Button } from '@/components/ui/button';
import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';
import { getCategoryConfig } from '@/lib/categoryConfig';

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);
const EXCHANGE_TIMEOUT_MS = 8_000;
const PROFILE_TIMEOUT_MS = 6_000;
const OVERALL_TIMEOUT_MS = 12_000;

function humanizeAuthError(err) {
  const message = err?.message || '';
  const code = err?.code || err?.error_code || '';

  if (message.includes('non-ISO-8859-1')) {
    return 'Erro temporário de conexão com o servidor. Aguarde alguns segundos e tente entrar novamente.';
  }
  if (
    code === 'pkce_code_verifier_not_found' ||
    message.toLowerCase().includes('code verifier')
  ) {
    return 'A sessão de login expirou. Volte ao login e clique em Google novamente.';
  }
  if (code === 'flow_state_not_found' || message.includes('flow state')) {
    return 'Este link de login não é mais válido. Inicie o login novamente.';
  }
  if (message.includes('provider is not enabled')) {
    return 'Login com Google ainda não está ativo. Use email e senha ou contate o suporte.';
  }
  if (message.includes('demorou demais')) {
    return 'A conexão está demorando. Verifique sua internet e tente entrar novamente.';
  }

  return message || 'Falha ao concluir login social.';
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const { applySession } = useAuth();
  const [error, setError] = useState(null);
  const [showEscape, setShowEscape] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const fail = (message) => {
      if (cancelled || finishedRef.current) return;
      finishedRef.current = true;
      setError(message);
    };

    const succeed = (profile) => {
      if (cancelled || finishedRef.current) return;
      finishedRef.current = true;
      window.history.replaceState({}, document.title, '/auth/callback');
      navigateRef.current(profile?.onboarding_complete ? '/' : '/onboarding', { replace: true });
    };

    const escapeId = setTimeout(() => {
      if (!finishedRef.current) setShowEscape(true);
    }, 4_000);

    const timeoutId = setTimeout(() => {
      fail('A conexão está demorando. Verifique sua internet e tente entrar novamente.');
    }, OVERALL_TIMEOUT_MS);

    async function finishOAuth() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error_description') || params.get('error');

      if (oauthError) {
        fail(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
        return;
      }

      const code = params.get('code');

      try {
        if (code) {
          const { error: exchangeError } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            EXCHANGE_TIMEOUT_MS,
            'Confirmar login'
          );
          if (exchangeError) throw exchangeError;
        }

        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          EXCHANGE_TIMEOUT_MS,
          'Carregar sessão'
        );
        if (sessionError) throw sessionError;

        if (!session?.user) {
          if (!code) {
            navigateRef.current('/login', { replace: true });
            finishedRef.current = true;
            return;
          }
          throw new Error('Não foi possível confirmar sua sessão. Tente entrar novamente.');
        }

        applySession(session);

        const profile = await withTimeout(
          ensureUserProfile(session.user),
          PROFILE_TIMEOUT_MS,
          'Preparar perfil'
        );

        if (cancelled) return;
        clearTimeout(timeoutId);
        succeed(profile);
      } catch (err) {
        if (!cancelled) {
          clearTimeout(timeoutId);
          fail(humanizeAuthError(err));
        }
      }
    }

    finishOAuth();

    return () => {
      cancelled = true;
      clearTimeout(escapeId);
      clearTimeout(timeoutId);
    };
  }, [applySession]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#050609] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
        </div>
        <div className="relative z-10 max-w-md w-full bg-[#0a0c12]/80 border border-red-500/30 rounded-2xl p-8 text-center space-y-4 backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold">Não foi possível entrar</h1>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <Button
            asChild
            className="w-full text-white"
            style={{ backgroundColor: hero.primaryHex }}
          >
            <Link to="/login">Voltar ao login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050609] text-white flex flex-col items-center justify-center gap-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})` }}
      >
        <Zap className="w-6 h-6 text-white" />
      </motion.div>
      <p className="relative z-10 text-slate-400 text-sm font-mono tracking-wide">Conectando sua conta…</p>
      {showEscape && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-2"
        >
          <Link
            to="/login"
            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300 transition-colors"
          >
            Demorou demais? Voltar ao login
          </Link>
        </motion.div>
      )}
    </div>
  );
}
