import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hardNavigate } from '@/lib/hardNavigate';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
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

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);

export default function LoginNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signInWithPassword, isAuthenticated, isOnboardingComplete, loading: authLoading } = useAuth();

  const [authBootTimedOut, setAuthBootTimedOut] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      hardNavigate(isOnboardingComplete ? '/' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, isOnboardingComplete]);

  useEffect(() => {
    if (!authLoading) {
      setAuthBootTimedOut(false);
      return undefined;
    }
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
    try { setLoading(true); setError(null); await signInWithPassword(email, password); }
    catch (err) { setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-x-hidden relative">
      <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
      <StageBackdrop /><SpotlightRays primary={hero.primaryHex} accent={hero.accentHex} /><LightingBeams primary={hero.primaryHex} accent={hero.accentHex} />
      <FloatingEquipment categoryId={AUTH_HERO_CATEGORY} primary={hero.primaryHex} />
      <div className="relative z-10 min-h-screen flex flex-col justify-end px-5 pb-10 pt-16 max-w-lg mx-auto">
        <div className="w-[62px] h-[62px] rounded-[18px] grid place-items-center mb-4" style={{ background: `conic-gradient(from 210deg, ${hero.primaryHex}, ${hero.accentHex})`, boxShadow: `0 0 34px ${hero.primaryHex}66` }}><span className="text-[32px] font-black text-[#06070a]">B</span></div>
        <h1 className="text-3xl font-extrabold leading-tight">Bem-vindo<br />de volta.</h1>
        <p className="font-mono text-xs text-[#8a91a1] mt-2.5">O palco está esperando por você.</p>
        <NeonGlass primary={hero.primaryHex} glow className="mt-6 p-5 space-y-4">
          {error && <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex gap-2"><AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-sm text-red-300">{error}</p></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">E-mail</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="você@empresa.com" className="bg-[#080a10]/80 border-0 text-white h-12 font-mono" style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }} /></div>
            <div><label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">Senha</label><div className="relative"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-[#080a10]/80 border-0 text-white pr-10 h-12 font-mono" style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7283]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <Button type="submit" disabled={loading || !email || !password} className="w-full h-12 border-0 font-bold uppercase text-[#06070a]" style={{ background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})`, boxShadow: `0 0 26px ${hero.primaryHex}55` }}>{loading ? 'Entrando...' : 'Entrar no Backstage'}</Button>
          </form>
          <SocialLoginButtons />
          <p className="text-center text-sm text-[#8a91a1] font-mono">Novo por aqui? <Link to="/signup" style={{ color: hero.primaryHex }} className="font-semibold">Criar conta</Link></p>
        </NeonGlass>
      </div>
    </div>
  );
}
