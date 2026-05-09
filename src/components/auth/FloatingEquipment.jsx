import { motion } from 'framer-motion';

const equipments = ['🎚️', '🎙️', '📷', '💡', '🔊', '📺', '🎬', '🎛️', '🔌', '🎭', '📡', '🎧'];

export default function FloatingEquipment() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {equipments.map((emoji, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0.05
          }}
          animate={{
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight - 100,
              Math.random() * window.innerHeight
            ],
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth + 50,
              Math.random() * window.innerWidth
            ]
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute text-3xl"
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}
