import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const TOP_BAR_HEIGHT = '3.25rem';

export function getAppTopBarOffset() {
  return `calc(${TOP_BAR_HEIGHT} + env(safe-area-inset-top, 0px))`;
}

export default function AppTopBar() {
  const { pathname } = useLocation();
  const onProfile = pathname === '/profile';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      aria-label="Ações rápidas"
    >
      <div
        className="flex items-center justify-end gap-1 px-3 max-w-2xl mx-auto w-full"
        style={{ minHeight: TOP_BAR_HEIGHT }}
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#050609]/80 backdrop-blur-md border border-[#23262f]/80 pl-1 pr-0.5 py-0.5 shadow-lg shadow-black/30">
          <NotificationCenter compact />
          <Link
            to="/profile"
            aria-label="Perfil e configurações"
            aria-current={onProfile ? 'page' : undefined}
            className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-[#8a91a1] hover:text-white hover:bg-[#1a1d26] transition-colors"
          >
            <motion.span whileTap={{ scale: 0.9 }} className="flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </motion.span>
          </Link>
        </div>
      </div>
    </header>
  );
}
