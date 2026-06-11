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
import BackstageLogo from '@/components/brand/BackstageLogo';

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);

export default function SignupNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { signUp, isAuthenticated, isOnboardingComplete, loading: authLoading } = useAuth();

  useEffect(() => { if (isAuthenticated) hardNavigate(isOnboardingComplete ? '/' : '/onboarding', { replace: true }); }, [isAuthenticated, isOnboardingComplete]);
  if (authLoading || isAuthenticated) return <div className="min-h-screen bg-[#050609] flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: hero.primaryHex, borderTopColor: 'transparent' }} /></div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || password.length < 6) return;
    try { setLoading(true); setError(null); await signUp(email, password); setSuccess(true); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-x-hidden relative">
      <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
      <StageBackdrop /><SpotlightRays primary={hero.primaryHex} accent={hero.accentHex} /><LightingBeams primary={hero.primaryHex} accent={hero.accentHex} />
      <FloatingEquipment categoryId={AUTH_HERO_CATEGORY} primary={hero.primaryHex} />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <BackstageLogo size="lg" primary={hero.primaryHex} accent={hero.accentHex} showWordmark className="items-center" />
            <h1 className="text-2xl font-black mt-5">Entre no backstage.</h1>
            <p className="text-sm text-[#8a91a1] mt-2 font-mono">Crie sua conta de freelancer.</p>
          </div>
          <NeonGlass primary={hero.primaryHex} glow className="p-5 space-y-5">
            <SocialLoginButtons mode="signup" />
            {success ? <div className="text-center space-y-3 text-sm"><p>Confirme seu email para ativar a conta.</p><Button asChild variant="outline" className="w-full border-[#23262f] bg-transparent"><Link to="/login">Ir para login</Link></Button></div> : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex gap-2"><AlertCircle className="w-5 h-5 text-red-400" /><p className="text-sm text-red-300">{error}</p></div>}
                <div><label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">E-mail</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#080a10]/80 border-0 text-white h-12 font-mono" style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }} /></div>
                <div><label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">Senha</label><div className="relative"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#080a10]/80 border-0 text-white pr-10 h-12 font-mono" style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                <Button type="submit" disabled={loading || !email || password.length < 6} className="w-full h-12 border-0 font-bold uppercase text-[#06070a]" style={{ background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})` }}>{loading ? 'Criando...' : 'Criar conta'}</Button>
              </form>
            )}
            <p className="text-center text-sm text-[#8a91a1] font-mono">Já tem conta? <Link to="/login" style={{ color: hero.primaryHex }}>Entrar</Link></p>
          </NeonGlass>
        </motion.div>
      </div>
    </div>
  );
}
