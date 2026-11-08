import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';

const LIMIAR = 90;

/**
 * Linha que desliza (lote 3): para a esquerda revela uma ação (ex.: Excluir),
 * para a direita outra (ex.: Recebi). Passou do limite → chama a ação; senão volta.
 * Rolagem vertical continua livre (touch-action: pan-y). Sem ação, não desliza.
 */
export default function SwipeRow({
  children,
  onSwipeLeft,
  leftLabel = 'Excluir',
  leftColor = '#ff2e88',
  onSwipeRight,
  rightLabel = 'Feito',
  rightColor = '#ffd400',
  className = '',
  rounded = 'rounded-xl',
  testId,
}) {
  const x = useMotionValue(0);
  const reduce = useReducedMotion();
  const [lado, setLado] = useState(null);
  const leftOpacity = useTransform(x, [-LIMIAR, -20, 0], [1, 0.4, 0]);
  const rightOpacity = useTransform(x, [0, 20, LIMIAR], [0, 0.4, 1]);
  const pode = Boolean(onSwipeLeft || onSwipeRight);

  const voltar = () => animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`} data-testid={testId}>
      {onSwipeLeft && (
        <motion.div aria-hidden="true" style={{ opacity: leftOpacity, background: leftColor }}
          className="absolute inset-0 flex items-center justify-end pr-5 font-extrabold text-[13px] text-white uppercase tracking-wide">
          {leftLabel}
        </motion.div>
      )}
      {onSwipeRight && (
        <motion.div aria-hidden="true" style={{ opacity: rightOpacity, background: rightColor }}
          className="absolute inset-0 flex items-center justify-start pl-5 font-extrabold text-[13px] text-[#0a0a0a] uppercase tracking-wide">
          {rightLabel}
        </motion.div>
      )}
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        drag={pode && !reduce ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: onSwipeLeft ? -160 : 0, right: onSwipeRight ? 160 : 0 }}
        dragElastic={0.15}
        onDrag={(_, info) => setLado(info.offset.x < 0 ? 'esq' : 'dir')}
        onDragEnd={(_, info) => {
          const dx = info.offset.x;
          if (dx <= -LIMIAR && onSwipeLeft) {
            voltar();
            if (typeof navigator !== 'undefined') navigator.vibrate?.(15);
            onSwipeLeft();
          } else if (dx >= LIMIAR && onSwipeRight) {
            voltar();
            if (typeof navigator !== 'undefined') navigator.vibrate?.(15);
            onSwipeRight();
          } else {
            voltar();
          }
          setLado(null);
        }}
        data-swiping={lado || undefined}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
