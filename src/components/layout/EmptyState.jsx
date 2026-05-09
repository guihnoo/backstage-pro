import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4 text-center"
    >
      {Icon && (
        <div className="mb-4 sm:mb-6">
          <Icon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-slate-600 mx-auto" />
        </div>
      )}
      
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm sm:text-base text-slate-400 max-w-md mb-6 sm:mb-8">
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          {action && (
            <Button
              onClick={action}
              className="bg-cyan-600 hover:bg-cyan-700 text-white h-12 min-h-[44px] px-6 sm:px-8 w-full sm:w-auto"
            >
              {actionLabel || 'Começar'}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white h-12 min-h-[44px] px-6 sm:px-8 w-full sm:w-auto"
            >
              {secondaryActionLabel || 'Voltar'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}