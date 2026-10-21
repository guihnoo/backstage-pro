import { useState, useEffect, useMemo } from 'react';
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
import { getCategoryConfig } from '@/lib/categoryConfig';
import { LOOP, loopAnim } from '@/lib/liteMotion';

const CTA_CLASS =
  'w-full h-14 rounded-[28px] border-0 bg-[#ffd400] hover:bg-[#ffd400] text-[#0a0a0a] font-poster text-[22px] tracking-[2px] uppercase disabled:opacity-50';
const LABEL_CLASS = 'block font-tag text-[11px] tracking-[1px] uppercase text-[#a8a8a8] mb-1.5';
const INPUT_CLASS =
  'h-[52px] rounded-[14px] border border-[#333333] bg-[#161616] text-white placeholder:text-[#6a6a6a] focus-visible:border-[#ffd400]';

/** Converte texto do formulário em número ("1.200,50", "1200.5"); inválido → fallback. */
function toNumber(value, fallback) {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  const n = Number(text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text);
  return Number.isFinite(n) ? n : fallback;
}

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

  const onboardingTheme = useMemo(
    () => getCategoryConfig(selectedCategory || 'lighting'),
    [selectedCategory]
  );

  const onboardingCssVars = useMemo(
    () => ({
      '--bp-primary': onboardingTheme.primaryHex,
      '--bp-accent': onboardingTheme.accentHex,
      '--bp-glow': onboardingTheme.bgGlow,
    }),
    [onboardingTheme]
  );



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
        // Campo vazio ou inválido nunca vira NaN no banco.
        years_experience: Math.max(0, Math.round(toNumber(yearsExperience, 0))),
        daily_rate: toNumber(dailyRate, 0),
        monthly_goal_events: Math.max(0, Math.round(toNumber(monthlyGoalEvents, 0))),
        monthly_goal_revenue: toNumber(monthlyGoalRevenue, 0),
        onboarding_complete: true,
      });

      hardNavigate('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden relative" style={onboardingCssVars}>
      <div className="relative z-10 min-h-screen flex items-start sm:items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-[#0a0a0a] p-5 sm:p-8 sm:rounded-2xl sm:border sm:border-[#222222] bp-focus-scope">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h1 className="font-poster text-[38px] leading-none text-white uppercase">
                  Complete seu perfil
                </h1>
                <p className="text-[#a8a8a8] text-sm mt-1">Vamos conhecer você melhor</p>
              </div>
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-[#161616]"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
            </div>

            <StepIndicator
              currentStep={step}
              totalSteps={5}
            />

            {error && (
              <div className="mb-6 bg-[#161616] border-2 border-[#ff2e88] rounded-2xl p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#ff2e88] flex-shrink-0" />
                <p className="text-sm text-[#e0e0e0]">{error}</p>
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
                    <label htmlFor="ob-name" className={LABEL_CLASS}>Nome completo</label>
                    <Input
                      id="ob-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="ob-phone" className={LABEL_CLASS}>Telefone / WhatsApp</label>
                    <Input
                      id="ob-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ob-city" className={LABEL_CLASS}>Cidade</label>
                      <Input
                        id="ob-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="São Paulo"
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div>
                      <label htmlFor="ob-state" className={LABEL_CLASS}>Estado</label>
                      <Input
                        id="ob-state"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="SP"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={!name}
                    className={CTA_CLASS}
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
                    <CategoryPicker
                selected={selectedCategory}
                onSelect={(cat) => {
                  // Trocar de área limpa as especialidades da área anterior.
                  if (cat !== selectedCategory) setSelectedSpecialties([]);
                  setSelectedCategory(cat);
                }}
              />
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={!selectedCategory}
                    className={CTA_CLASS}
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
                    className={CTA_CLASS}
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
                    <label htmlFor="ob-years-exp" className={LABEL_CLASS}>Anos de experiência</label>
                    <Input
                      id="ob-years-exp"
                      type="number"
                      min="0"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="5"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="ob-daily-rate" className={LABEL_CLASS}>Valor por diária (R$)</label>
                    <p className="text-xs text-[#a8a8a8] mb-2">
                      Usado como padrão ao criar eventos quando o cliente não tiver cachê próprio.
                    </p>
                    <Input
                      id="ob-daily-rate"
                      type="number"
                      min="0"
                      step="50"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="500"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="ob-goal-events" className={LABEL_CLASS}>Meta de diárias/mês</label>
                    <p className="text-xs text-[#a8a8a8] mb-2">Dias únicos trabalhados no mês — várias empresas no mesmo dia contam como 1 diária.</p>
                    <Input
                      id="ob-goal-events"
                      type="number"
                      min="1"
                      value={monthlyGoalEvents}
                      onChange={(e) => setMonthlyGoalEvents(e.target.value)}
                      placeholder="12"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="ob-goal-revenue" className={LABEL_CLASS}>Meta de faturamento/mês (R$)</label>
                    <Input
                      id="ob-goal-revenue"
                      type="number"
                      min="0"
                      step="100"
                      value={monthlyGoalRevenue}
                      onChange={(e) => setMonthlyGoalRevenue(e.target.value)}
                      placeholder="5000"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={!dailyRate || !monthlyGoalRevenue}
                    className={CTA_CLASS}
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
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#ffd400' }} />
                  </motion.div>

                  <div>
                    <h3 className="font-poster text-[30px] uppercase text-white mb-2">Tudo pronto, {name}! 🎉</h3>
                    <p className="text-[#a8a8a8]">Confira seus dados e toque em Entrar para salvar</p>
                  </div>

                  <div className="bg-[#161616] rounded-2xl p-6 text-left space-y-3">
                    <div>
                      <p className="text-[#a8a8a8] text-sm">Profissão</p>
                      <p className="text-white font-semibold">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</p>
                    </div>
                    <div>
                      <p className="text-[#a8a8a8] text-sm">Especialidades</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSpecialties.map((spec) => (
                          <span
                            key={spec}
                            className="px-3 py-1 rounded-full text-sm border"
                            style={{ background: '#ffd400', borderColor: '#ffd400', color: '#0a0a0a' }}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[#a8a8a8] text-sm">Valor por diária</p>
                      <p className="text-white font-semibold">R$ {toNumber(dailyRate, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <motion.div
                    animate={loopAnim({ y: [0, -10, 0] })}
                    transition={{ duration: 2, repeat: LOOP }}
                  >
                    <Sparkles className="w-8 h-8 text-[#ffd400] mx-auto opacity-50" />
                  </motion.div>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={CTA_CLASS}
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
