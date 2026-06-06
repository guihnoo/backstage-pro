import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

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

        navigate(profile?.onboarding_complete ? '/' : '/onboarding', { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Falha ao concluir login social.');
        }
      }
    }

    finishOAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900/60 border border-red-500/30 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold">Não foi possível entrar</h1>
          <p className="text-sm text-gray-400 leading-relaxed">{error}</p>
          <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700">
            <Link to="/login">Voltar ao login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center"
      >
        <Zap className="w-6 h-6 text-white" />
      </motion.div>
      <p className="text-gray-400 text-sm">Conectando sua conta…</p>
    </div>
  );
}
