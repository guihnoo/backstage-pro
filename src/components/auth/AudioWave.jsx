import { motion } from 'framer-motion';

export default function AudioWave() {
  const bars = Array.from({ length: 16 });
  const colors = ['cyan', 'violet', 'amber'];

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 px-4">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: ['20%', '80%', '40%', '100%', '30%'] }}
          transition={{
            duration: 0.8,
            delay: i * 0.05,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className={`w-2 rounded-full bg-${colors[i % 3]}-500 shadow-lg shadow-${colors[i % 3]}-500/50`}
          style={{ minHeight: '8px', height: '40%' }}
        />
      ))}
    </div>
  );
}
