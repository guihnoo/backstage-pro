import { motion } from 'framer-motion';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';

const DEFAULT_PRIMARY = getCategoryConfig(AUTH_HERO_CATEGORY).primaryHex;

export default function StepIndicator({ currentStep, totalSteps, primaryHex = DEFAULT_PRIMARY }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i < currentStep ? 32 : i === currentStep ? 32 : 8,
            backgroundColor: i <= currentStep ? primaryHex : '#374151'
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}
