import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { hardNavigate } from '@/lib/hardNavigate';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import { useAuth } from '@/lib/authContext';
import { withTimeout } from '@/lib/withTimeout';

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
  const { applySession } = useAuth();
  const [error, setError] = useState(null);
  const [showEscape, setShowEscape] = useState(false);
  const finishedRef = useRef(false);

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
      hardNavigate(profile?.onboarding_complete ? '/' : '/onboarding', { replace: true });
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

      // Recovery flow — redireciona para a página de redefinição de senha
      const callbackType = params.get('type');
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
            hardNavigate('/login', { replace: true });
            finishedRef.current = true;
            return;
          }
          throw new Error('Não foi possível confirmar sua sessão. Tente entrar novamente.');
        }

        applySession(session);

        // Fluxo de recuperação de senha — vai para página de nova senha
        if (callbackType === 'recovery') {
          clearTimeout(timeoutId);
          finishedRef.current = true;
          hardNavigate('/reset-password', { replace: true });
          return;
        }

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
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex items-center justify-center p-6">
        <div role="alert" className="max-w-md w-full rounded-2xl bg-[#161616] border-2 border-[#ff2e88] p-6 space-y-3">
          <p className="font-poster text-[32px] leading-none text-[#ff2e88]">NÃO FOI POSSÍVEL ENTRAR</p>
          <p className="text-sm text-[#e0e0e0] leading-relaxed">{error}</p>
          <Link
            to="/login"
            className="flex items-center justify-center h-12 rounded-3xl bg-[#ffd400] text-[#0a0a0a] font-poster text-xl tracking-[2px]"
          >
            VOLTAR AO LOGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center gap-4">
      <div
        role="status"
        aria-label="Conectando sua conta"
        className="w-12 h-12 rounded-full border-4 border-[#ffd400] border-t-transparent animate-spin"
      />
      <p className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">CONECTANDO SUA CONTA...</p>
      {showEscape && (
        <Link
          to="/login"
          className="text-xs text-[#c8c8c8] underline underline-offset-2 mt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400] rounded-sm"
        >
          Demorou demais? Voltar ao login
        </Link>
      )}
    </div>
  );
}
