import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StageBackdrop from '@/components/auth/StageBackdrop';
import SpotlightRays from '@/components/auth/SpotlightRays';
import FloatingEquipment from '@/components/auth/FloatingEquipment';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function SignupNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { signUp, isAuthenticated, isOnboardingComplete, loading: authLoading } = useAuth();
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

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden relative">
      <StageBackdrop />
      <SpotlightRays />
      <FloatingEquipment />

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
                Criar conta
              </h1>
              <p className="text-gray-400 text-sm">Seu cockpit profissional nos bastidores começa aqui</p>
            </div>

            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-gray-300 text-sm">
                  Enviamos um link de confirmação para <strong className="text-white">{email}</strong>.
                  Confirme o email e volte para entrar.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-violet-600"
                >
                  Ir para o login
                </Button>
              </div>
            ) : (
              <>
                <SocialLoginButtons mode="signup" />

                <div className="my-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900/40 text-gray-400">ou cadastre com email</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email profissional</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="você@empresa.com"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="bg-gray-800/50 border-gray-700 text-white pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar senha</label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 text-white font-bold"
                  >
                    {loading ? 'Criando conta...' : 'Criar minha conta'}
                  </Button>
                </form>
              </>
            )}

            <p className="text-center text-gray-500 text-xs mt-6">
              Já tem conta?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Entrar
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
