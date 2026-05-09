import { motion } from 'framer-motion';

export default function SpotlightRays() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Raio 1 */}
      <motion.svg
        animate={{ rotateZ: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-0 left-1/4 w-96 h-96"
        viewBox="0 0 200 300"
      >
        <defs>
          <linearGradient id="ray1" x1="100" y1="0" x2="0" y2="300">
            <stop offset="0%" stopColor="rgba(251,191,36,0.6)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </linearGradient>
        </defs>
        <polygon points="100,0 0,300 200,300" fill="url(#ray1)" />
      </motion.svg>

      {/* Raio 2 */}
      <motion.svg
        animate={{ rotateZ: [1, -3, 1] }}
        transition={{ duration: 5, delay: 1, repeat: Infinity }}
        className="absolute top-0 left-1/2 w-96 h-96"
        viewBox="0 0 200 300"
      >
        <defs>
          <linearGradient id="ray2" x1="100" y1="0" x2="0" y2="300">
            <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        <polygon points="100,0 0,300 200,300" fill="url(#ray2)" />
      </motion.svg>

      {/* Raio 3 */}
      <motion.svg
        animate={{ rotateZ: [-1, 2, -1] }}
        transition={{ duration: 4.5, delay: 0.5, repeat: Infinity }}
        className="absolute top-0 right-1/4 w-96 h-96"
        viewBox="0 0 200 300"
      >
        <defs>
          <linearGradient id="ray3" x1="100" y1="0" x2="200" y2="300">
            <stop offset="0%" stopColor="rgba(168,85,247,0.5)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
        </defs>
        <polygon points="100,0 200,300 0,300" fill="url(#ray3)" />
      </motion.svg>
    </div>
  );
}
