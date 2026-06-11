import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { ensureUserProfile } from './ensureUserProfile';
import { assertSupabaseReachable } from './checkSupabaseReachable';
import { withTimeout } from './withTimeout';

const AuthContext = createContext();
const PROFILE_TIMEOUT_MS = 12_000;
const SESSION_BOOT_TIMEOUT_MS = 8_000;

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const hydrateUser = useCallback(async (nextSession) => {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    let profileData = await withTimeout(
      fetchProfile(nextSession.user.id),
      PROFILE_TIMEOUT_MS,
      'Carregar perfil'
    );

    if (!profileData) {
      profileData = await withTimeout(
        ensureUserProfile(nextSession.user),
        PROFILE_TIMEOUT_MS,
        'Criar perfil'
      );
    }

    setProfile(profileData);
  }, []);

  const hydrateUserSafe = useCallback(
    (nextSession) => {
      hydrateUser(nextSession).catch((err) => {
        console.error('[AuthProvider] hydrateUser', err);
      });
    },
    [hydrateUser]
  );

  const applySession = useCallback(
    (nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        hydrateUserSafe(nextSession);
      } else {
        setProfile(null);
      }
    },
    [hydrateUserSafe]
  );

  useEffect(() => {
    let mounted = true;

    const finishBoot = () => {
      if (mounted) setLoading(false);
    };

    const bootTimeout = setTimeout(finishBoot, PROFILE_TIMEOUT_MS);

    withTimeout(supabase.auth.getSession(), SESSION_BOOT_TIMEOUT_MS, 'Inicializar sessão')
      .then(({ data: { session: initialSession } }) => {
        if (!mounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        finishBoot();
        if (initialSession?.user) {
          hydrateUserSafe(initialSession);
        }
      })
      .catch((err) => {
        console.error('[AuthProvider] getSession', err);
        finishBoot();
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        finishBoot();

        if (newSession?.user) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            hydrateUserSafe(newSession);
          } else {
            fetchProfile(newSession.user.id)
              .then(setProfile)
              .catch((err) => console.error('[AuthProvider] fetchProfile', err));
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(bootTimeout);
      subscription?.unsubscribe();
    };
  }, [hydrateUserSafe]);

  const signInWithOAuth = async (provider) => {
    await assertSupabaseReachable();

    const origin = window.location.origin;
    const options = {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: false,
    };

    if (provider === 'google') {
      options.queryParams = {
        access_type: 'offline',
        prompt: 'select_account',
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({ provider, options });
    if (error) throw error;
  };

  const signInWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      setLoading(false);
      hydrateUserSafe(data.session);
    }
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Usuário não autenticado');

    await ensureUserProfile(user);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const updatedProfile = await fetchProfile(user.id);
    setProfile(updatedProfile);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    isOnboardingComplete: profile?.onboarding_complete ?? false,
    applySession,
    signInWithOAuth,
    signInWithPassword,
    signUp,
    resetPassword,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
