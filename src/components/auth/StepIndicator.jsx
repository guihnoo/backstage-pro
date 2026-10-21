const DEFAULT_PRIMARY = '#ffd400';

/** Barrinhas de progresso dos passos (All Access). Passos já feitos e o atual ficam amarelos. */
export default function StepIndicator({ currentStep, totalSteps, primaryHex = DEFAULT_PRIMARY }) {
  return (
    <div
      className="flex gap-1 mb-6"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
      aria-label={`Passo ${currentStep} de ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <span
          key={i}
          className="flex-1 h-1 rounded-sm transition-colors duration-300"
          style={{ backgroundColor: i < currentStep ? primaryHex : '#2a2a2a' }}
        />
      ))}
    </div>
  );
}
