import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/mockAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginNew() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setTimeout(() => {
      login(email, password);
      navigate('/');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Fundo com grade de palco e holofotes */}
      <div className="absolute inset-0">
        {/* Grade de pontos em perspectiva */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="perspective(500px) rotateX(70deg)">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Holofotes laterais */}
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

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Card com blur */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 mb-4"
              >
                <Zap className="w-7 h-7 text-white" />
              </motion.div>

              <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Bem-vindo
              </h1>
              <p className="text-gray-400 text-sm">Volte aos bastidores do seu melhor trabalho</p>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="você@email.com"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20 pr-10"
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

              {/* Botão entrar */}
              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-10 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 hover:from-cyan-600 hover:via-violet-600 hover:to-amber-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-cyan-500/30"
              >
                {loading ? 'Entrando...' : 'Entrar no Backstage'}
              </Button>
            </motion.form>

            {/* Divider */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900/40 text-gray-400">novo por aqui?</span>
              </div>
            </div>

            {/* Link Signup */}
            <Button
              onClick={() => navigate('/signup')}
              variant="outline"
              className="w-full h-10 border-gray-700 text-cyan-400 hover:bg-gray-800/50 hover:text-cyan-300"
            >
              Criar sua conta
            </Button>

            {/* Demo hint */}
            <p className="text-center text-gray-500 text-xs mt-6">
              Use qualquer email/senha para demo
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
