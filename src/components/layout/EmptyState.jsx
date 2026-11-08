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
          initial={{ y: -18, rotate: -6, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 160, damping: 12 }}
          className="mb-6 relative flex flex-col items-center"
          aria-hidden="true"
        >
          {/* Credencial do app (fita rosa + crachá com faixa ALL ACCESS), como na logo (08/11). */}
          <div className="w-3 h-9 rounded-sm bg-[#ff2e88]" />
          <div className="-mt-1 w-[104px] rounded-[14px] bg-[#f4f4f4] shadow-[0_14px_40px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="mx-auto mt-2 w-6 h-1.5 rounded-full bg-[#0a0a0a]/25" />
            <div className="flex items-center justify-center h-14">
              <Icon className="w-8 h-8 text-[#0a0a0a]" />
            </div>
            <div className="bg-[#ffd400] text-[#0a0a0a] font-tag text-[9px] font-bold tracking-[2px] text-center py-1">ALL ACCESS</div>
            <div className="flex justify-center gap-[2px] py-2">
              {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2].map((w, i) => <span key={i} className="h-3 bg-[#0a0a0a]" style={{ width: w }} />)}
            </div>
          </div>
        </motion.div>
      )}

      <h3 className="font-poster text-[24px] uppercase tracking-wide text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[#a8a8a8] max-w-xs mb-7 leading-relaxed">
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
              className="bg-[#1f1f1f] border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#c8c8c8] h-11 px-6 w-full"
            >
              {secondaryActionLabel || 'Voltar'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
