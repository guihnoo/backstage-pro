import { useEffect } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { motion } from 'framer-motion';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';
import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { NeonLevelBars } from '@/components/design/NeonLevelBars';

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);

export default function SplashScreen() {
  useEffect(() => { const t = setTimeout(() => hardNavigate('/login'), 2500); return () => clearTimeout(t); }, []);

  return (
    <div className="fixed inset-0 bg-[#050609] flex items-center justify-center overflow-hidden">
      <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} stage />
      <div className="relative z-20 text-center px-6">
        <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.4, repeat: Infinity }} className="w-[104px] h-[104px] mx-auto mb-7 rounded-[28px] grid place-items-center" style={{ background: `conic-gradient(from 210deg, ${hero.primaryHex}, ${hero.accentHex}, ${hero.primaryHex})`, boxShadow: `0 0 50px ${hero.primaryHex}66` }}>
          <span className="text-[54px] font-black text-[#06070a] leading-none">B</span>
        </motion.div>
        <div className="text-[42px] font-black text-white leading-[0.92]">BACKSTAGE</div>
        <div className="text-[42px] font-black tracking-[0.34em] ml-[0.34em]" style={{ background: `linear-gradient(90deg, ${hero.primaryHex}, ${hero.accentHex})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>PRO</div>
        <p className="font-mono text-[11.5px] text-[#7c8494] tracking-[0.32em] mt-3.5 uppercase">Seu backstage digital</p>
        <div className="mt-8 flex justify-center"><NeonLevelBars primary={hero.primaryHex} accent={hero.accentHex} count={16} className="max-w-[180px]" /></div>
        <div className="w-[180px] h-[3px] rounded-sm bg-[#1a1d27] mx-auto mt-6 overflow-hidden">
          <motion.div className="h-full" style={{ background: `linear-gradient(90deg, ${hero.primaryHex}, ${hero.accentHex})`, boxShadow: `0 0 12px ${hero.primaryHex}` }} animate={{ width: ['0%', '100%'] }} transition={{ duration: 2.2 }} />
        </div>
      </div>
    </div>
  );
}
