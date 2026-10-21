import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hardNavigate } from '@/lib/hardNavigate';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import {
  AuthScreen,
  AuthLabel,
  AuthPrimaryButton,
  AuthNotice,
  AA_INPUT_CLASS,
} from '@/components/auth/AllAccessAuth';
import appToast from '@/lib/appToast';

/** Nome provisório da credencial, tirado do começo do e-mail enquanto a pessoa digita. */
function credentialName(email) {
  const local = (email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  return local ? local.toUpperCase() : 'SEU NOME AQUI';
}

export default function SignupNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { signUp, isAuthenticated, isOnboardingComplete, loading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) hardNavigate(isOnboardingComplete ? '/' : '/onboarding', { replace: true });
  }, [isAuthenticated, isOnboardingComplete]);

  if (authLoading || isAuthenticated) {
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
    if (!email || password.length < 6 || !acceptedTerms) return;
    try {
      setLoading(true);
      setError(null);
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already')) {
        setError('Este email já está cadastrado. Tente entrar ou recuperar sua senha.');
      } else if (msg.toLowerCase().includes('password')) {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError(msg || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      setResendLoading(true);
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (resendError) throw resendError;
      appToast.success('Email reenviado! Verifique sua caixa de entrada.');
    } catch (err) {
      appToast.error(err.message || 'Não foi possível reenviar.');
    } finally {
      setResendLoading(false);
    }
  };

  const initial = (email.trim()[0] || '?').toUpperCase();

  return (
    <AuthScreen>
      <div className="flex-1 px-[22px] pt-12 pb-6 flex flex-col gap-3">
        <p className="font-tag text-[11px] tracking-[3px] text-[#ff2e88]">NOVA CREDENCIAL</p>
        <h1 className="font-poster text-[44px] leading-none">CRIAR CONTA</h1>

        <div className="rounded-2xl bg-[#ffd400] text-[#0a0a0a] px-3.5 py-3 flex gap-3 items-center" aria-hidden="true">
          <div className="w-14 h-14 rounded-[10px] bg-[#0a0a0a] text-[#ffd400] flex items-center justify-center font-poster text-2xl">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-tag text-[10px] font-bold">CREW · 2026</p>
            <p className="font-poster text-2xl leading-none truncate">{credentialName(email)}</p>
            <p className="text-xs font-bold">sua credencial vai sendo montada</p>
          </div>
        </div>

        {success ? (
          <div role="status" className="rounded-2xl border-2 border-[#ffd400] p-3.5 flex flex-col gap-2">
            <p className="font-poster text-2xl text-[#ffd400]">CONFIRME SEU E-MAIL ✓</p>
            <p className="text-sm text-[#e0e0e0] leading-snug">
              Enviamos um link para <span className="font-bold text-white">{email}</span>. Clique nele para ativar a conta. Não chegou? Olhe no spam.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="h-10 px-3.5 rounded-[20px] border border-[#333333] bg-transparent text-white text-[13px] font-extrabold disabled:opacity-50"
              >
                {resendLoading ? 'Reenviando...' : 'Reenviar e-mail'}
              </button>
              <Link
                to="/login"
                className="h-10 px-3.5 rounded-[20px] bg-[#ffd400] text-[#0a0a0a] text-[13px] font-extrabold inline-flex items-center"
              >
                Já confirmei · Entrar
              </Link>
            </div>
          </div>
        ) : (
          <>
            <SocialLoginButtons mode="signup" />

            <div className="flex items-center gap-2.5 text-[#6a6a6a] font-tag text-[10px]">
              <span className="flex-1 h-px bg-[#222222]" />
              OU COM E-MAIL
              <span className="flex-1 h-px bg-[#222222]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              {error && <AuthNotice>{error}</AuthNotice>}

              <div>
                <AuthLabel htmlFor="signup-email" className="sr-only">E-mail</AuthLabel>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={AA_INPUT_CLASS}
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="relative">
                  <AuthLabel htmlFor="signup-password" className="sr-only">Senha</AuthLabel>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="crie uma senha (mínimo 6 letras)"
                    className={`${AA_INPUT_CLASS} pr-12`}
                    autoComplete="new-password"
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
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-[#ff2e88] mt-1.5 font-tag">Mínimo 6 caracteres</p>
                )}
              </div>

              <label className="flex gap-2.5 items-start text-[13px] text-[#c8c8c8] leading-snug cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-[22px] h-[22px] shrink-0 accent-[#ffd400]"
                />
                <span>
                  Li e aceito os{' '}
                  <Link to="/termos" className="underline text-white">Termos de uso</Link> e a{' '}
                  <Link to="/privacidade" className="underline text-white">Política de privacidade</Link>.
                  Meus dados são meus e posso apagar a conta quando quiser.
                </span>
              </label>

              <AuthPrimaryButton disabled={loading || !email || password.length < 6 || !acceptedTerms}>
                {loading ? 'Criando conta...' : 'Criar minha conta'}
              </AuthPrimaryButton>
            </form>

            <p className="text-center text-sm text-[#c8c8c8]">
              Já tenho conta ·{' '}
              <Link to="/login" className="text-[#ffd400] font-extrabold rounded-sm">Entrar</Link>
            </p>
          </>
        )}
      </div>
    </AuthScreen>
  );
}
