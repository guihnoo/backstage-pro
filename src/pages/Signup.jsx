import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/mockAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/lib/eventCategories';
import StepIndicator from '@/components/auth/StepIndicator';
import CategoryPicker from '@/components/auth/CategoryPicker';
import SpecialtyPicker from '@/components/auth/SpecialtyPicker';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [selectedCategory, setSelectedCategory] = useState('');

  // Step 3
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);

  const handleNextStep = () => {
    if (step === 1 && !name) return;
    if (step === 1 && !email) return;
    if (step === 1 && password !== confirmPassword) return;
    if (step === 2 && !selectedCategory) return;
    if (step === 3 && selectedSpecialties.length === 0) return;
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      const userData = {
        name,
        email,
        category: selectedCategory,
        specialties: selectedSpecialties,
        role: CATEGORIES.find(c => c.id === selectedCategory)?.label
      };
      login(email, password, userData);
      navigate('/');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Fundo com spotlight */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, delay: 1 }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-15"
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl"
        >
          {/* Card */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  Crie sua conta
                </h1>
                <p className="text-gray-400 text-sm mt-1">Cadastre-se no backstage digital</p>
              </div>
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={step} totalSteps={4} />

            {/* Step 1 — Dados Básicos */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome completo</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="você@email.com"
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirme a senha</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`bg-gray-800/50 border-gray-700 ${
                        confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
                      }`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-red-400 text-xs mt-2">Senhas não correspondem</p>
                    )}
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={!name || !email || !password || password !== confirmPassword}
                    className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 disabled:opacity-50"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Step 2 — Selecionar Categoria */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Qual é sua área?</h3>
                    <CategoryPicker selected={selectedCategory} onSelect={setSelectedCategory} />
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={!selectedCategory}
                    className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 disabled:opacity-50"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Step 3 — Especialidades */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Suas especialidades</h3>
                    <SpecialtyPicker
                      categoryId={selectedCategory}
                      selected={selectedSpecialties}
                      onSelect={setSelectedSpecialties}
                    />
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={selectedSpecialties.length === 0}
                    className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 disabled:opacity-50"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Step 4 — Confirmação */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 0.6 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  </motion.div>

                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Bem-vindo, {name}! 🎉</h3>
                    <p className="text-gray-400">Seu perfil foi criado com sucesso</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-6 text-left space-y-3 border border-gray-700">
                    <div>
                      <p className="text-gray-400 text-sm">Profissão</p>
                      <p className="text-white font-semibold">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Especialidades</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSpecialties.map((spec) => (
                          <span key={spec} className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 px-3 py-1 rounded-full text-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-8 h-8 text-amber-400 mx-auto opacity-50" />
                  </motion.div>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 hover:from-cyan-600 hover:via-violet-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-cyan-500/30"
                  >
                    {loading ? 'Criando conta...' : 'Entrar no Backstage'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {step < 4 && (
              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  Já tem conta?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Faça login aqui
                  </button>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
