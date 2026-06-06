import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';

const AppDataContext = createContext(null);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData deve ser usado dentro de AppDataProvider');
  }
  return context;
};

const TABLE_MAP = {
  events: 'events',
  dailyWork: 'daily_work',
  clients: 'clients',
  expenses: 'expenses',
};

async function fetchFromSupabase(tableName, userId) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

function mapSupabaseUser(sessionUser, profile) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: profile?.full_name || sessionUser.email?.split('@')[0] || 'Usuário',
    avatar: profile?.avatar_url,
    category: profile?.category,
    role: profile?.role,
    specialties: profile?.specialties || [],
  };
}

export const AppDataProvider = ({ children }) => {
  const { user: sessionUser, profile, loading: authLoading } = useAuth();
  const authUser = mapSupabaseUser(sessionUser, profile);

  const [data, setData] = useState({
    events: [],
    dailyWork: [],
    clients: [],
    expenses: [],
    user: authUser || null,
  });

  const [loading, setLoading] = useState({
    events: false,
    dailyWork: false,
    clients: false,
    expenses: false,
    user: true,
  });

  const [error, setError] = useState({});

  const dataLoaded = useRef({
    events: false,
    dailyWork: false,
    clients: false,
    expenses: false,
  });

  // Sync auth user into data
  useEffect(() => {
    if (authLoading) return;
    setData(prev => ({ ...prev, user: authUser || null }));
    setLoading(prev => ({ ...prev, user: false }));
  }, [authUser, authLoading]);

  const loadEntity = useCallback(async (entityKey, _unused, forceRefresh = false) => {
    if (dataLoaded.current[entityKey] && !forceRefresh) return;

    const userId = authUser?.id;
    if (!userId) {
      if (!authLoading) {
        setError(prev => ({ ...prev, [entityKey]: 'Usuário não autenticado.' }));
      }
      return;
    }

    setLoading(prev => ({ ...prev, [entityKey]: true }));
    setError(prev => {
      const e = { ...prev };
      delete e[entityKey];
      return e;
    });

    try {
      const tableName = TABLE_MAP[entityKey];
      const result = await fetchFromSupabase(tableName, userId);
      setData(prev => ({ ...prev, [entityKey]: result }));
      dataLoaded.current[entityKey] = true;
    } catch (err) {
      console.error(`Erro ao carregar ${entityKey}:`, err);
      setError(prev => ({ ...prev, [entityKey]: err.message || `Falha ao carregar ${entityKey}` }));
    } finally {
      setLoading(prev => ({ ...prev, [entityKey]: false }));
    }
  }, [authUser, authLoading]);

  const refreshData = useCallback(async (entityKey = null) => {
    const keys = entityKey ? [entityKey] : Object.keys(TABLE_MAP);
    keys.forEach(k => { dataLoaded.current[k] = false; });
    await Promise.all(keys.map(k => loadEntity(k, null, true)));
  }, [loadEntity]);

  const loadEvents = useCallback((force = false) => loadEntity('events', null, force), [loadEntity]);
  const loadDailyWork = useCallback((force = false) => loadEntity('dailyWork', null, force), [loadEntity]);
  const loadClients = useCallback((force = false) => loadEntity('clients', null, force), [loadEntity]);
  const loadExpenses = useCallback((force = false) => loadEntity('expenses', null, force), [loadEntity]);

  const value = {
    data,
    loading,
    error,
    refreshData,
    loadEvents,
    loadDailyWork,
    loadClients,
    loadExpenses,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};
