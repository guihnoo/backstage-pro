import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function AnimatedStatValue({ value = 0, format, className = '', style }) {
  const spring = useSpring(0, { stiffness: 80, damping: 18 });
  const display = useTransform(spring, (v) => (format ? format(v) : String(Math.round(v))));
  const [text, setText] = useState(() => (format ? format(0) : '0'));
  const mounted = useRef(false);

  useEffect(() => {
    spring.set(Number(value) || 0);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(v));
    return () => unsub();
  }, [display]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  if (!mounted.current) {
    return (
      <span className={className} style={style}>
        {format ? format(value) : value}
      </span>
    );
  }

  return (
    <motion.span className={className} style={style}>
      {text}
    </motion.span>
  );
}
