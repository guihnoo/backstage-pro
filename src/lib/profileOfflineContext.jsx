import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import {
  clearOfflineProfile,
  getOfflineProfile,
  setOfflineProfile,
} from '@/lib/offlineProfileCache';

const ProfileContext = createContext(null);

async function fetchProfileRow(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Perfil efetivo: Supabase quando online; fallback do cache local quando offline.
 */
export function ProfileOfflineProvider({ children }) {
  const { user, profile: authProfile } = useAuth();
  const userId = user?.id;
  const [cachedProfile, setCachedProfile] = useState(null);
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      setCachedProfile(null);
      return;
    }
    if (authProfile) {
      setOfflineProfile(userId, authProfile);
      setCachedProfile(authProfile);
      return;
    }
    setCachedProfile(getOfflineProfile(userId));
  }, [userId, authProfile]);

  useEffect(() => {
    if (prevUserIdRef.current && !userId) {
      clearOfflineProfile(prevUserIdRef.current);
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const onReconnect = async () => {
      try {
        const row = await fetchProfileRow(userId);
        if (row) {
          setOfflineProfile(userId, row);
          setCachedProfile(row);
        }
      } catch {
        /* rede instável — cache permanece */
      }
    };

    window.addEventListener('backstage:reconnect', onReconnect);
    return () => window.removeEventListener('backstage:reconnect', onReconnect);
  }, [userId]);

  const profile = authProfile || cachedProfile;
  const value = useMemo(() => profile, [profile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const offlineProfile = useContext(ProfileContext);
  const { profile: authProfile } = useAuth();
  return offlineProfile ?? authProfile ?? null;
}
