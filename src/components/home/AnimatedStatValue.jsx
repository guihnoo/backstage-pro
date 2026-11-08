import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/**
 * Número que sobe até o valor em 0,6 s (regra única do app, 08/11). Antes era uma mola lenta
 * (mais de 1,5 s) que mostrava valores quebrados no caminho. Sempre termina no valor exato
 * e respeita "reduzir movimento".
 */
export const COUNT_UP_SECONDS = 0.6;

export default function AnimatedStatValue({ value = 0, format, className = '', style }) {
  const target = Number(value) || 0;
  const reduce = useReducedMotion();
  const fmt = (v) => (format ? format(v) : String(Math.round(v)));
  const [shown, setShown] = useState(target);
  const from = useRef(null);

  useEffect(() => {
    // Primeira pintura: sobe a partir do zero; depois, a partir do último valor.
    const start = from.current == null ? 0 : from.current;
    if (reduce || start === target) {
      setShown(target);
      from.current = target;
      return undefined;
    }
    const controls = animate(start, target, {
      duration: COUNT_UP_SECONDS,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setShown,
      onComplete: () => setShown(target),
    });
    from.current = target;
    return () => controls.stop();
  }, [target, reduce]);

  return <span className={className} style={style}>{fmt(shown === target ? target : shown)}</span>;
}
