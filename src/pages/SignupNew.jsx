import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hardNavigate } from '@/lib/hardNavigate';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
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
import { toast } from 'sonner';

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);

export default function SignupNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen bg-[#050609] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: hero.primaryHex, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || password.length < 6) return;
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
      toast.success('Email reenviado! Verifique sua caixa de entrada.');
    } catch (err) {
      toast.error(err.message || 'Não foi possível reenviar.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-x-hidden relative">
      <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
      <StageBackdrop />
      <SpotlightRays primary={hero.primaryHex} accent={hero.accentHex} />
      <LightingBeams primary={hero.primaryHex} accent={hero.accentHex} />
      <FloatingEquipment categoryId={AUTH_HERO_CATEGORY} primary={hero.primaryHex} />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black">Entre no backstage.</h1>
            <p className="text-sm text-[#8a91a1] mt-2 font-mono">Crie sua conta de freelancer.</p>
          </div>

          <NeonGlass primary={hero.primaryHex} glow className="p-5 space-y-5">
            <SocialLoginButtons mode="signup" />

            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-center"
              >
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Confirme seu email</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Enviamos um link para <span className="text-white font-mono">{email}</span>.<br />
                      Clique no link para ativar sua conta.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent text-xs"
                  >
                    {resendLoading ? 'Reenviando...' : 'Reenviar email'}
                  </Button>
                  <Button asChild variant="outline" className="w-full border-[#23262f] bg-transparent">
                    <Link to="/login">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                      Já confirmei — Ir para login
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">E-mail</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#080a10]/80 border-0 text-white h-12 font-mono"
                    style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">Senha</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-[#080a10]/80 border-0 text-white pr-10 h-12 font-mono"
                      style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7283]">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 6 && (
                    <p className="text-[11px] text-red-400 mt-1.5 font-mono">Mínimo 6 caracteres</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email || password.length < 6}
                  className="w-full h-12 border-0 font-bold uppercase text-[#06070a]"
                  style={{ background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})` }}
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-[#8a91a1] font-mono">
              Já tem conta?{' '}
              <Link to="/login" style={{ color: hero.primaryHex }}>Entrar</Link>
            </p>
          </NeonGlass>
        </motion.div>
      </div>
    </div>
  );
}
