import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
}) {
  const theme = useCategoryTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-14 px-6 text-center"
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 18 }}
          className="mb-5 relative"
        >
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-20"
            style={{ background: theme.primaryHex, transform: 'scale(1.6)' }}
          />
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 40% 35%, ${theme.primaryHex}20, transparent 70%)`,
              border: `1px solid ${theme.primaryHex}28`,
            }}
          >
            <Icon className="w-9 h-9" style={{ color: theme.primaryHex, opacity: 0.7 }} />
          </div>
        </motion.div>
      )}

      <h3 className="text-lg font-bold text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-400 max-w-xs mb-7 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[260px]">
          {action && (
            <Button
              onClick={action}
              className="text-white h-11 px-6 w-full border-0 hover:brightness-110 active:scale-[0.97] transition-all font-semibold"
              style={theme.primaryStyle}
            >
              {actionLabel || 'Começar'}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction}
              className="bg-slate-800/60 border-slate-700 hover:bg-slate-700 text-slate-300 h-11 px-6 w-full"
            >
              {secondaryActionLabel || 'Voltar'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
