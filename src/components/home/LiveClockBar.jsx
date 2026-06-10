import { motion } from 'framer-motion';
import { useLiveClock } from '@/hooks/useLiveClock';

export default function LiveClockBar({ primaryHex = '#EAB308', isLive = false }) {
  const { timeShort } = useLiveClock();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"
      style={{ color: isLive ? primaryHex : '#6b7283' }}
    >
      {isLive && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
          style={{ background: primaryHex }}
        />
      )}
      <span>{timeShort}</span>
    </motion.div>
  );
}
