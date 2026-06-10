import { useState, useEffect } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/lib/eventCategories';
import StepIndicator from '@/components/auth/StepIndicator';
import CategoryPicker from '@/components/auth/CategoryPicker';
import SpecialtyPicker from '@/components/auth/SpecialtyPicker';
import StageBackdrop from '@/components/auth/StageBackdrop';
import SpotlightRays from '@/components/auth/SpotlightRays';
import FloatingEquipment from '@/components/auth/FloatingEquipment';

export default function Onboarding() {
  const { user, profile, updateProfile, isOnboardingComplete } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Se onboarding já foi completo, redireciona ao dashboard
  useEffect(() => {
    if (isOnboardingComplete) {
      hardNavigate('/');
    }
  }, [isOnboardingComplete]);

  // Step 1: Identidade
  const [name, setName] = useState(() => profile?.name || user?.email?.split('@')[0] || '');
  const [phone, setPhone] = useState(() => profile?.phone || '');
  const [city, setCity] = useState(() => profile?.city || '');
  const [state, setState] = useState(() => profile?.state || '');

  // Step 2: Categoria
  const [selectedCategory, setSelectedCategory] = useState(() => profile?.category || '');

  // Step 3: Especialidades
  const [selectedSpecialties, setSelectedSpecialties] = useState(() => profile?.specialties || []);

  // Step 4: Metas
  const [yearsExperience, setYearsExperience] = useState(() => profile?.years_experience || 0);
  const [dailyRate, setDailyRate] = useState(() => profile?.daily_rate || '');
  const [monthlyGoalEvents, setMonthlyGoalEvents] = useState(() => profile?.monthly_goal_events || 10);
  const [monthlyGoalRevenue, setMonthlyGoalRevenue] = useState(() => profile?.monthly_goal_revenue || '');

  const handleNextStep = () => {
    if (step === 1 && !name) {
      setError('Nome é obrigatório');
      return;
    }
    if (step === 2 && !selectedCategory) {
      setError('Selecione uma categoria');
      return;
    }
    if (step === 3 && selectedSpecialties.length === 0) {
      setError('Selecione pelo menos uma especialidade');
      return;
    }
    if (step === 4 && (!dailyRate || !monthlyGoalRevenue)) {
      setError('Preencha todos os campos de metas');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label;

      await updateProfile({
        name,
        phone,
        city,
        state,
        category: selectedCategory,
        category_label: categoryLabel,
        specialties: selectedSpecialties,
        years_experience: yearsExperience,
        daily_rate: parseFloat(dailyRate),
        monthly_goal_events: parseInt(monthlyGoalEvents),
        monthly_goal_revenue: parseFloat(monthlyGoalRevenue),
        onboarding_complete: true,
      });

      hardNavigate('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-x-hidden relative">
      <StageBackdrop />
      <SpotlightRays />
      <FloatingEquipment />

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, delay: 1 }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-15"
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-start sm:items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-5 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                  Complete seu perfil
                </h1>
                <p className="text-slate-400 text-sm mt-1">Vamos conhecer você melhor</p>
              </div>
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-slate-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
            </div>

            <StepIndicator currentStep={step} totalSteps={5} />

            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Identidade */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome completo</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Telefone / WhatsApp</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Cidade</label>
                      <Input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="São Paulo"
                        className="bg-slate-800/50 border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
                      <Input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="SP"
                        className="bg-slate-800/50 border-slate-700"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={!name}
                    className="w-full bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 disabled:opacity-50"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Categoria */}
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
                    className="w-full bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 disabled:opacity-50"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Step 3: Especialidades */}
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
                    className="w-full bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 disabled:opacity-50"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Step 4: Metas */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Anos de experiência</label>
                    <Input
                      type="number"
                      min="0"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(parseInt(e.target.value))}
                      placeholder="5"
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Valor por diária (R$)</label>
                    <p className="text-xs text-slate-500 mb-2">
                      Usado como padrão ao criar eventos quando o cliente não tiver cachê próprio.
                    </p>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="500"
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta de eventos/mês</label>
                    <Input
                      type="number"
                      min="1"
                      value={monthlyGoalEvents}
                      onChange={(e) => setMonthlyGoalEvents(parseInt(e.target.value))}
                      placeholder="10"
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta de faturamento/mês (R$)</label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={monthlyGoalRevenue}
                      onChange={(e) => setMonthlyGoalRevenue(e.target.value)}
                      placeholder="5000"
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={!dailyRate || !monthlyGoalRevenue}
                    className="w-full bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 disabled:opacity-50"
                  >
                    Continuar
                  </Button>
                </motion.div>
              )}

              {/* Step 5: Confirmação */}
              {step === 5 && (
                <motion.div
                  key="step5"
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
                    <CheckCircle2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  </motion.div>

                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Tudo pronto, {name}! 🎉</h3>
                    <p className="text-slate-400">Seu perfil foi criado com sucesso</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-6 text-left space-y-3 border border-slate-700">
                    <div>
                      <p className="text-slate-400 text-sm">Profissão</p>
                      <p className="text-white font-semibold">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Especialidades</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSpecialties.map((spec) => (
                          <span key={spec} className="bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1 rounded-full text-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Valor por diária</p>
                      <p className="text-white font-semibold">R$ {parseFloat(dailyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                    className="w-full h-11 bg-gradient-to-r from-purple-500 via-purple-600 to-amber-500 hover:from-purple-600 hover:via-purple-700 hover:to-amber-600 text-white font-bold shadow-lg shadow-purple-500/30"
                  >
                    {loading ? 'Criando perfil...' : 'Entrar no Backstage'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
