import { motion } from 'framer-motion';

export default function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i < currentStep ? 32 : i === currentStep ? 32 : 8,
            backgroundColor: i < currentStep ? '#22d3ee' : i === currentStep ? '#22d3ee' : '#374151'
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}
