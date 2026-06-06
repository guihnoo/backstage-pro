import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StageBackdrop from '@/components/auth/StageBackdrop';
import SpotlightRays from '@/components/auth/SpotlightRays';
import FloatingEquipment from '@/components/auth/FloatingEquipment';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function LoginNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signInWithPassword, isAuthenticated, isOnboardingComplete, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(isOnboardingComplete ? '/' : '/onboarding', { replace: true });
  }, [isAuthenticated, isOnboardingComplete, navigate]);

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      await signInWithPassword(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos. Verifique seus dados ou crie uma conta.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden relative">
      <StageBackdrop />
      <SpotlightRays />
      <FloatingEquipment />

      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, delay: 1 }}
          className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-15"
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 mb-4"
              >
                <Zap className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Backstage Pro
              </h1>
              <p className="text-gray-400 text-sm">Gestão profissional para quem vive os bastidores</p>
            </div>

            <SocialLoginButtons mode="login" />

            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900/40 text-gray-400">ou entre com email</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="você@empresa.com"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-cyan-500"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-cyan-500 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-10 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 hover:from-cyan-600 hover:via-violet-600 hover:to-amber-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-cyan-500/20"
              >
                {loading ? 'Entrando...' : 'Entrar no Backstage'}
              </Button>
            </motion.form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Novo por aqui?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Criar conta gratuita
              </Link>
            </p>

            <p className="text-center text-[11px] text-gray-600 mt-4 leading-relaxed">
              Ao continuar, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
