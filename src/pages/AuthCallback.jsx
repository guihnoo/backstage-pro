import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import { Button } from '@/components/ui/button';
import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';
import { getCategoryConfig } from '@/lib/categoryConfig';

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setError('A conexão está demorando. Verifique sua internet e tente entrar novamente.');
      }
    }, 15_000);

    async function finishOAuth() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error_description') || params.get('error');

      if (oauthError) {
        if (!cancelled) {
          setError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
        }
        return;
      }

      const code = params.get('code');

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          throw new Error('Não foi possível confirmar sua sessão. Tente entrar novamente.');
        }

        const profile = await ensureUserProfile(session.user);

        window.history.replaceState({}, document.title, '/auth/callback');

        if (cancelled) return;

        clearTimeout(timeoutId);
        navigate(profile?.onboarding_complete ? '/' : '/onboarding', { replace: true });
      } catch (err) {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setError(err.message || 'Falha ao concluir login social.');
        }
      }
    }

    finishOAuth();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [navigate]);

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
    </div>
  );
}
