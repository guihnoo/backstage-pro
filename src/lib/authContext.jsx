import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { ensureUserProfile } from './ensureUserProfile';

const AuthContext = createContext();

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
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

    let profileData = await fetchProfile(nextSession.user.id);

    if (!profileData) {
      profileData = await ensureUserProfile(nextSession.user);
    }

    setProfile(profileData);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        try {
          await hydrateUser(initialSession);
        } catch (err) {
          console.error('[AuthProvider] hydrateUser', err);
        }
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          try {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
              await hydrateUser(newSession);
            } else {
              const profileData = await fetchProfile(newSession.user.id);
              setProfile(profileData);
            }
          } catch (err) {
            console.error('[AuthProvider] onAuthStateChange', err);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [hydrateUser]);

  const signInWithOAuth = async (provider) => {
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

    if (data.user) {
      await ensureUserProfile(data.user);
      const profileData = await fetchProfile(data.user.id);
      setProfile(profileData);
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
    signInWithOAuth,
    signInWithPassword,
    signUp,
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
