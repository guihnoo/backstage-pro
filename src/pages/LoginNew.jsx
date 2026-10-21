import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hardNavigate } from '@/lib/hardNavigate';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import {
  AuthScreen,
  BeamHero,
  MarqueeBand,
  AuthLabel,
  AuthPrimaryButton,
  AuthLinkButton,
  AuthNotice,
  AA_INPUT_CLASS,
} from '@/components/auth/AllAccessAuth';
import appToast from '@/lib/appToast';

function humanizeLoginError(message) {
  if (!message) return 'Erro ao entrar. Tente novamente.';
  if (message === 'Invalid login credentials') return 'invalid_credentials';
  if (message === 'Email not confirmed') return 'email_not_confirmed';
  if (message.toLowerCase().includes('email not confirmed')) return 'email_not_confirmed';
  if (message.toLowerCase().includes('invalid login')) return 'invalid_credentials';
  if (message.toLowerCase().includes('too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  return message;
}

export default function LoginNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'invalid_credentials' | 'email_not_confirmed'

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const {
    signInWithPassword,
    resetPassword,
    isAuthenticated,
    isOnboardingComplete,
    loading: authLoading,
  } = useAuth();

  const [authBootTimedOut, setAuthBootTimedOut] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      hardNavigate(isOnboardingComplete ? '/' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, isOnboardingComplete]);

  useEffect(() => {
    if (!authLoading) { setAuthBootTimedOut(false); return undefined; }
    const id = setTimeout(() => setAuthBootTimedOut(true), 10_000);
    return () => clearTimeout(id);
  }, [authLoading]);

  if ((authLoading && !authBootTimedOut) || isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div
          role="status"
          aria-label="Carregando"
          className="w-8 h-8 border-2 border-[#ffd400] border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setErrorType(null);
    try {
      setLoading(true);
      await signInWithPassword(email, password);
    } catch (err) {
      const result = humanizeLoginError(err.message);
      if (result === 'invalid_credentials' || result === 'email_not_confirmed') {
        setErrorType(result);
      } else {
        setError(result);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const target = forgotEmail || email;
    if (!target) {
      appToast.error('Informe seu email para redefinir a senha.');
      return;
    }
    try {
      setForgotLoading(true);
      await resetPassword(target);
      setForgotSent(true);
    } catch (err) {
      appToast.error(err.message || 'Não foi possível enviar o email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Recuperar senha ────────────────────────────────────────────────────────
  if (forgotMode) {
    const backToLogin = () => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); };
    return (
      <AuthScreen>
        <div className="flex-1 px-[22px] pt-12 pb-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={backToLogin}
            className="self-start h-9 pl-2 pr-3 rounded-[18px] bg-[#161616] text-white text-[13px] font-bold border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]"
          >
            ‹ Voltar
          </button>

          <h1 className="font-poster text-[44px] leading-none">PERDEU A<br />CREDENCIAL?</h1>
          <p className="text-[15px] text-[#c8c8c8] leading-snug">
            Calma, acontece até no melhor festival. Digite seu e-mail que mandamos um link para criar uma senha nova.
          </p>

          {forgotSent ? (
            <div role="status" className="rounded-2xl border-2 border-[#ffd400] p-3.5 flex flex-col gap-1.5">
              <p className="font-poster text-2xl text-[#ffd400]">LINK ENVIADO ✓</p>
              <p className="text-sm text-[#e0e0e0] leading-snug">
                Abra <span className="font-bold text-white">{forgotEmail || email}</span> no celular e toque no link. Não chegou em 2 minutos? Olhe no spam ou mande de novo.
              </p>
              <button
                type="button"
                onClick={() => setForgotSent(false)}
                className="self-start h-10 px-3.5 rounded-[20px] border border-[#333333] bg-transparent text-white text-[13px] font-extrabold"
              >
                Mandar de novo
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-2.5">
              <div>
                <AuthLabel htmlFor="forgot-email">E-mail</AuthLabel>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail || email}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={AA_INPUT_CLASS}
                  autoComplete="email"
                />
              </div>
              <AuthPrimaryButton disabled={forgotLoading || !(forgotEmail || email)}>
                {forgotLoading ? 'Enviando...' : 'Mandar link'}
              </AuthPrimaryButton>
            </form>
          )}
        </div>
      </AuthScreen>
    );
  }

  // ── Login principal ────────────────────────────────────────────────────────
  return (
    <AuthScreen>
      <BeamHero height={300}>
        <p className="font-tag text-[11px] tracking-[3px] text-[#ffd400]">ALL ACCESS · ÁREA RESTRITA</p>
        <h1 className="font-poster text-[64px] leading-[.92]">
          BACKSTAGE<br /><span className="text-[#ffd400]">PRO</span>
        </h1>
        <p className="text-[15px] text-[#c8c8c8] mt-1.5">Agenda, horas e cachê de quem vive na estrada.</p>
      </BeamHero>
      <MarqueeBand />

      <div className="flex-1 px-[22px] py-5 flex flex-col gap-2.5">
        {errorType === 'invalid_credentials' && (
          <AuthNotice title="E-MAIL OU SENHA INCORRETOS">
            <p>Se você entrou com Google antes, use o botão de Google.</p>
            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="mt-1 underline underline-offset-2 text-[#ffd400] text-[13px] font-bold"
            >
              Esqueceu ou nunca definiu sua senha?
            </button>
          </AuthNotice>
        )}
        {errorType === 'email_not_confirmed' && (
          <AuthNotice tone="warn" title="E-MAIL NÃO CONFIRMADO">
            Verifique sua caixa de entrada e clique no link de ativação.
          </AuthNotice>
        )}
        {error && <AuthNotice>{error}</AuthNotice>}

        <SocialLoginButtons />

        <div className="flex items-center gap-2.5 text-[#6a6a6a] font-tag text-[10px]">
          <span className="flex-1 h-px bg-[#222222]" />
          OU COM E-MAIL
          <span className="flex-1 h-px bg-[#222222]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <AuthLabel htmlFor="login-email" className="sr-only">E-mail</AuthLabel>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={AA_INPUT_CLASS}
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <AuthLabel htmlFor="login-password" className="sr-only">Senha</AuthLabel>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="senha"
              className={`${AA_INPUT_CLASS} pr-12`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a8a8] p-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <AuthPrimaryButton disabled={loading || !email || !password}>
            {loading ? 'Entrando...' : 'Entrar'}
          </AuthPrimaryButton>
        </form>

        <div className="flex justify-between text-sm">
          <AuthLinkButton onClick={() => setForgotMode(true)}>Esqueci a senha</AuthLinkButton>
          <Link
            to="/signup"
            className="text-[#ffd400] font-extrabold py-2 text-sm rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>
    </AuthScreen>
  );
}
