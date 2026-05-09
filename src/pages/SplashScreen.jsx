import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center overflow-hidden">
      {/* Fundo com spotlight */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Holofote 1 */}
        <motion.div
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"
        />
        {/* Holofote 2 */}
        <motion.div
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 2.5, delay: 0.3, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-15"
        />
        {/* Holofote 3 */}
        <motion.div
          animate={{ opacity: [0, 0.25, 0] }}
          transition={{ duration: 2.5, delay: 0.6, repeat: Infinity }}
          className="absolute -bottom-32 left-1/2 w-80 h-80 bg-violet-500 rounded-full blur-3xl opacity-15"
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 text-center">
        {/* Logo com glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 20px rgba(34, 211, 238, 0.3)',
              '0 0 40px rgba(34, 211, 238, 0.6)',
              '0 0 20px rgba(34, 211, 238, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 mb-8"
        >
          <Zap className="w-12 h-12 text-white" />
        </motion.div>

        {/* Título com efeito letra por letra */}
        <motion.h1 className="text-5xl font-black mb-2">
          {'Backstage Pro'.split('').map((char, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0, 1], y: [10, 0] }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400 bg-clip-text text-transparent"
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-cyan-300 text-xl font-light tracking-wider"
        >
          Seu backstage digital
        </motion.p>

        {/* Barra de progresso */}
        <motion.div
          animate={{ width: ['0%', '100%'] }}
          transition={{ duration: 2.5, ease: 'linear' }}
          className="h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 mt-8 rounded-full"
        />
      </div>
    </div>
  );
}
