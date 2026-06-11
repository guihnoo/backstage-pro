import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hardNavigate } from '@/lib/hardNavigate';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StageBackdrop from '@/components/auth/StageBackdrop';
import { SpotlightRays } from '@/components/auth/SpotlightRays';
import { FloatingEquipment } from '@/components/auth/FloatingEquipment';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { NeonGlass } from '@/components/design/NeonGlass';
import { LightingBeams } from '@/components/design/LightingBeams';
import appToast from '@/lib/appToast';
import BackstageLogo from '@/components/brand/BackstageLogo';

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);

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
      <div className="min-h-screen bg-[#050609] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: hero.primaryHex, borderTopColor: 'transparent' }}
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

  // ── Forgot password panel ──────────────────────────────────────────────────
  if (forgotMode) {
    return (
      <div className="min-h-screen bg-[#050609] text-white overflow-x-hidden relative">
        <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
        <StageBackdrop />
        <SpotlightRays primary={hero.primaryHex} accent={hero.accentHex} />
        <LightingBeams primary={hero.primaryHex} accent={hero.accentHex} />

        <div className="relative z-10 min-h-screen flex flex-col justify-end px-5 pb-10 pt-16 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); }}
            className="flex items-center gap-1.5 text-sm mb-6 font-mono"
            style={{ color: hero.primaryHex }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </button>

          <h1 className="text-2xl font-extrabold">Redefinir senha</h1>
          <p className="text-[#8a91a1] font-mono text-xs mt-2 mb-6">
            Enviaremos um link para você criar uma nova senha.
          </p>

          <NeonGlass primary={hero.primaryHex} glow className="p-5 space-y-4">
            {forgotSent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Mail className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="font-semibold text-white">Email enviado!</p>
                <p className="text-sm text-slate-400">
                  Verifique <span className="text-white font-mono">{forgotEmail || email}</span> e clique no link para definir sua nova senha.
                </p>
                <Button
                  type="button"
                  onClick={() => { setForgotMode(false); setForgotSent(false); }}
                  className="w-full border-0 font-bold text-[#06070a]"
                  style={{ background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})` }}
                >
                  Voltar ao login
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">E-mail</label>
                  <Input
                    type="email"
                    value={forgotEmail || email}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="você@empresa.com"
                    className="bg-[#080a10]/80 border-0 text-white h-12 font-mono"
                    style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }}
                    autoComplete="email"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading || !(forgotEmail || email)}
                  className="w-full h-12 border-0 font-bold uppercase text-[#06070a]"
                  style={{
                    background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})`,
                    boxShadow: `0 0 26px ${hero.primaryHex}55`,
                  }}
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
              </form>
            )}
          </NeonGlass>
        </div>
      </div>
    );
  }

  // ── Login principal ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-x-hidden relative">
      <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
      <StageBackdrop />
      <SpotlightRays primary={hero.primaryHex} accent={hero.accentHex} />
      <LightingBeams primary={hero.primaryHex} accent={hero.accentHex} />
      <FloatingEquipment categoryId={AUTH_HERO_CATEGORY} primary={hero.primaryHex} />

      <div className="relative z-10 min-h-screen flex flex-col justify-end px-5 pb-10 pt-16 max-w-lg mx-auto">
        <BackstageLogo size={62} showWordmark subtitle="Gestão de eventos" className="mb-4" />

        <h1 className="text-3xl font-extrabold leading-tight mt-2">Bem-vindo<br />de volta.</h1>
        <p className="font-mono text-xs text-[#8a91a1] mt-2.5">O palco está esperando por você.</p>

        <NeonGlass primary={hero.primaryHex} glow className="mt-6 p-5 space-y-4">
          {/* Erro: credenciais inválidas */}
          <AnimatePresence>
            {errorType === 'invalid_credentials' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/15 border border-red-500/40 rounded-xl p-4 space-y-2"
              >
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">Email ou senha incorretos</p>
                    <p className="text-xs text-red-200/70 mt-0.5">
                      Se você entrou com Google antes, use o botão abaixo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs underline underline-offset-2 font-mono"
                  style={{ color: hero.primaryHex }}
                >
                  Esqueceu ou nunca definiu sua senha?
                </button>
              </motion.div>
            )}

            {/* Erro: email não confirmado */}
            {errorType === 'email_not_confirmed' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-4"
              >
                <div className="flex gap-2">
                  <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Email não confirmado</p>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      Verifique sua caixa de entrada e clique no link de ativação.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Erro genérico */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="você@empresa.com"
                className="bg-[#080a10]/80 border-0 text-white h-12 font-mono"
                style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-mono tracking-widest text-[#6b7283] uppercase">Senha</label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-[10px] font-mono underline underline-offset-2 text-[#6b7283] hover:text-slate-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#080a10]/80 border-0 text-white pr-10 h-12 font-mono"
                  style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7283]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-12 border-0 font-bold uppercase text-[#06070a]"
              style={{
                background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})`,
                boxShadow: `0 0 26px ${hero.primaryHex}55`,
              }}
            >
              {loading ? 'Entrando...' : 'Entrar no Backstage'}
            </Button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-[#23262f]" />
            <span className="text-[11px] text-[#6b7283] font-mono">ou</span>
            <div className="flex-1 h-px bg-[#23262f]" />
          </div>

          <SocialLoginButtons />

          <p className="text-center text-sm text-[#8a91a1] font-mono">
            Novo por aqui?{' '}
            <Link to="/signup" style={{ color: hero.primaryHex }} className="font-semibold">
              Criar conta
            </Link>
          </p>
        </NeonGlass>
      </div>
    </div>
  );
}
