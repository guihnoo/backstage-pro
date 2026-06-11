import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/** Pulso sutil quando o valor muda (ex.: sync Realtime). */
export default function StatValuePulse({ value, children, glowColor = '#00D9FF' }) {
  const prev = useRef(value);
  const pulseKey = useRef(0);

  useEffect(() => {
    if (prev.current !== value) {
      pulseKey.current += 1;
      prev.current = value;
    }
  }, [value]);

  return (
    <motion.div
      key={pulseKey.current}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ display: 'inline-block' }}
    >
      <motion.span
        animate={{ textShadow: [`0 0 0px ${glowColor}00`, `0 0 18px ${glowColor}55`, `0 0 0px ${glowColor}00`] }}
        transition={{ duration: 0.6 }}
        className="inline-block"
      >
        {children}
      </motion.span>
    </motion.div>
  );
}
