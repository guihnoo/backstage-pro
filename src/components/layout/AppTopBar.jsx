import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Inbox, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useAuth } from '@/lib/authContext';
import { isAppOwner } from '@/lib/isAppOwner';
import { useOwnerFeedbacks } from '@/lib/useFeedback';
import GlobalSearch from '@/components/layout/GlobalSearch';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const TOP_BAR_HEIGHT = '3.25rem';

// eslint-disable-next-line react-refresh/only-export-components
export function getAppTopBarOffset() {
  return `calc(${TOP_BAR_HEIGHT} + env(safe-area-inset-top, 0px))`;
}

function ProfileAvatar({ profile, primaryHex, active }) {
  const initial = (profile?.name || profile?.email || 'P').charAt(0).toUpperCase();

  return (
    <span
      className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold overflow-hidden transition-all"
      style={{
        background: profile?.avatar_url ? 'transparent' : `${primaryHex}22`,
        color: primaryHex,
        boxShadow: active ? `0 0 0 2px ${primaryHex}` : `0 0 0 1.5px ${primaryHex}55`,
      }}
    >
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

export default function AppTopBar() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const theme = useCategoryTheme();
  const owner = isAppOwner(user, profile);
  const { newCount } = useOwnerFeedbacks(owner);
  const onProfile = pathname === '/profile';
  const onInbox = pathname === '/admin/feedbacks';
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <header
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        aria-label="Ações rápidas"
      >
        <div
          className="flex items-center justify-end gap-1 px-3 max-w-2xl mx-auto w-full"
          style={{ minHeight: TOP_BAR_HEIGHT }}
        >
          <div
            data-tour="top-bar"
            className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#050609]/80 backdrop-blur-md border border-[#23262f]/80 pl-1 pr-0.5 py-0.5 shadow-lg shadow-black/30"
          >
            <button
              type="button"
              aria-label="Busca global (Ctrl+K)"
              title="Buscar (Ctrl+K)"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-[#8a91a1] hover:text-white hover:bg-[#1a1d26] transition-colors"
            >
              <motion.span whileTap={{ scale: 0.9 }} className="flex items-center justify-center">
                <Search className="w-5 h-5" />
              </motion.span>
            </button>
            <NotificationCenter compact />
          {owner && (
            <Link
              to="/admin/feedbacks"
              aria-label="Inbox de feedback"
              aria-current={onInbox ? 'page' : undefined}
              className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-[#8a91a1] hover:text-white hover:bg-[#1a1d26] transition-colors"
            >
              <motion.span whileTap={{ scale: 0.9 }} className="flex items-center justify-center">
                <Inbox className="w-5 h-5" />
              </motion.span>
              {newCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[#050609] text-[9px] font-black flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryHex }}
                >
                  {newCount > 9 ? '9+' : newCount}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/profile"
            aria-label="Perfil e configurações"
            aria-current={onProfile ? 'page' : undefined}
            className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-[#1a1d26] transition-colors"
          >
            <motion.span whileTap={{ scale: 0.9 }} className="flex items-center justify-center">
              <ProfileAvatar profile={profile} primaryHex={theme.primaryHex} active={onProfile} />
            </motion.span>
          </Link>
          </div>
        </div>
      </header>
    </>
  );
}
