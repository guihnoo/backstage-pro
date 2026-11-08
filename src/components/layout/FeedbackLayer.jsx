import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FEEDBACK_EVENT } from '@/lib/celebrate';

const COLORS = ['#ffd400', '#ff2e88', '#ffffff', '#ffd400'];

/** Confete leve em canvas (~1,2 s, 70 pedaços). Sem biblioteca. */
function burst(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: 70 }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 80,
    y: h * 0.62,
    vx: (Math.random() - 0.5) * 9,
    vy: -(6 + Math.random() * 8),
    r: 3 + Math.random() * 4,
    a: Math.random() * Math.PI,
    va: (Math.random() - 0.5) * 0.3,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  const start = performance.now();
  let raf = 0;
  const step = (t) => {
    const k = (t - start) / 1300;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    }
    if (k < 1) raf = requestAnimationFrame(step);
    else ctx.clearRect(0, 0, w, h);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Camada do ✓ animado e do confete. Montada uma vez no AppLayout. */
export default function FeedbackLayer() {
  const reduce = useReducedMotion();
  const [check, setCheck] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    let stop = () => {};
    let timer;
    const onFeedback = (e) => {
      const kind = e.detail?.kind;
      if (kind === 'save') {
        setCheck(Date.now());
        clearTimeout(timer);
        timer = setTimeout(() => setCheck(0), 950);
      } else if (kind === 'confetti' && !reduce && canvasRef.current) {
        stop();
        stop = burst(canvasRef.current);
      }
    };
    window.addEventListener(FEEDBACK_EVENT, onFeedback);
    return () => { window.removeEventListener(FEEDBACK_EVENT, onFeedback); stop(); clearTimeout(timer); };
  }, [reduce]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[210]" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <AnimatePresence>
        {check ? (
          <motion.div
            key={check}
            data-testid="save-check"
            className="absolute left-1/2 top-[38%] -translate-x-1/2 w-20 h-20 rounded-full bg-[#ffd400] shadow-[0_10px_40px_rgba(255,212,0,0.35)] flex items-center justify-center"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          >
            <svg viewBox="0 0 48 48" width="44" height="44">
              <motion.path
                d="M12 25 L21 34 L37 15"
                fill="none"
                stroke="#0a0a0a"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
