import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Event } from '@/api/entities';
import { DailyWork } from '@/api/entities';
import { Client } from '@/api/entities';
import { User } from '@/api/entities';
import { Expense } from '@/api/entities';

const AppDataContext = createContext(null);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData deve ser usado dentro de AppDataProvider');
  }
  return context;
};

// Função de retry otimizada com backoff exponencial
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error.response?.status === 429;
      const isNetworkError = !error.response;

      if ((isRateLimit || isNetworkError) && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`🔄 Tentativa ${attempt}/${maxRetries} falhou. Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Função crítica para carregar dados do usuário com múltiplas estratégias
const loadAllUserData = async (Entity, user) => {
  try {
    console.log(`🔍 Carregando ${Entity.name} para ${user.email}...`);
    
    const searchStrategies = [
      { filter: { owner_id: user.id }, name: 'owner_id' },
      { filter: { created_by: user.email }, name: 'created_by' },
      { filter: { created_by_email: user.email }, name: 'created_by_email' }
    ];

    let allFoundData = [];
    
    for (const strategy of searchStrategies) {
      try {
        const data = await retryWithBackoff(() => Entity.filter(strategy.filter));
        const validData = Array.isArray(data) ? data : [];
        if (validData.length > 0) {
          console.log(`  ✅ ${Entity.name} por ${strategy.name}: ${validData.length} registros`);
        }
        allFoundData = [...allFoundData, ...validData];
      } catch (error) {
        console.warn(`  ⚠️ Erro ao buscar ${Entity.name} por ${strategy.name}:`, error.message);
      }
    }

    // Remover duplicatas
    const uniqueDataMap = new Map();
    allFoundData.forEach(item => {
      if (item?.id) {
        uniqueDataMap.set(item.id, item);
      }
    });

    const finalData = Array.from(uniqueDataMap.values());
    console.log(`  📊 ${Entity.name} - Total: ${finalData.length} registros únicos`);

    // Migração automática para owner_id
    const recordsToMigrate = finalData.filter(item => !item.owner_id);
    if (recordsToMigrate.length > 0) {
      console.log(`  🔄 Migrando ${recordsToMigrate.length} registros de ${Entity.name}...`);
      try {
        for (const item of recordsToMigrate) {
          await Entity.update(item.id, { owner_id: user.id });
        }
        console.log(`  ✅ Migração de ${Entity.name} concluída`);
        finalData.forEach(item => {
          if (!item.owner_id) {
            item.owner_id = user.id;
          }
        });
      } catch (migrationError) {
        console.error(`  ❌ Erro na migração de ${Entity.name}:`, migrationError);
      }
    }

    return finalData;
  } catch (error) {
    console.error(`❌ Erro crítico ao carregar ${Entity.name}:`, error);
    return [];
  }
};

export const AppDataProvider = ({ children }) => {
  const [data, setData] = useState({
    events: [],
    dailyWork: [],
    clients: [],
    expenses: [],
    user: null,
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
  
  const userLoadAttempted = useRef(false);

  // Função genérica para carregar entidade
  const loadEntity = useCallback(async (entityKey, Entity, forceRefresh = false) => {
    if (dataLoaded.current[entityKey] && !forceRefresh) {
      return;
    }
    if (loading[entityKey]) {
      return;
    }

    setLoading(prev => ({ ...prev, [entityKey]: true }));
    setError(prev => {
      const newErrors = { ...prev };
      delete newErrors[entityKey];
      return newErrors;
    });

    try {
      if (!data.user?.id) {
        if (loading.user) {
          console.warn(`⏳ Aguardando carregamento do usuário para ${entityKey}...`);
          setLoading(prev => ({ ...prev, [entityKey]: false }));
          return;
        } else {
          throw new Error("Usuário não autenticado.");
        }
      }
      
      const entityData = await loadAllUserData(Entity, data.user);
      
      setData(prev => ({ ...prev, [entityKey]: entityData }));
      dataLoaded.current[entityKey] = true;
      console.log(`✅ ${entityKey} carregado: ${entityData.length} registros`);
    } catch (err) {
      console.error(`🔴 Erro ao carregar ${entityKey}:`, err);
      setError(prev => ({ ...prev, [entityKey]: err.message || `Falha ao carregar ${entityKey}` }));
    } finally {
      setLoading(prev => ({ ...prev, [entityKey]: false }));
    }
  }, [data.user, loading]);

  // Carregar usuário na inicialização
  useEffect(() => {
    if (userLoadAttempted.current) return;
    userLoadAttempted.current = true;

    const loadUser = async () => {
      setLoading(prev => ({ ...prev, user: true }));
      try {
        const user = await retryWithBackoff(() => User.me());
        if (!user?.id) throw new Error('Usuário não autenticado.');
        setData(prev => ({ ...prev, user }));
        console.log(`👤 Usuário autenticado: ${user.email}`);
      } catch (err) {
        console.error('🔴 Erro ao carregar usuário:', err);
        setError(prev => ({ ...prev, user: err.message || 'Falha ao carregar usuário.' }));
        setData(prev => ({ ...prev, user: null }));
      } finally {
        setLoading(prev => ({ ...prev, user: false }));
      }
    };
    loadUser();
  }, []);

  // Refresh de dados
  const refreshData = useCallback(async (entityKey = null) => {
    const force = true;
    const refreshTasks = {
      events: () => loadEntity('events', Event, force),
      dailyWork: () => loadEntity('dailyWork', DailyWork, force),
      clients: () => loadEntity('clients', Client, force),
      expenses: () => loadEntity('expenses', Expense, force),
    };

    if (entityKey && refreshTasks[entityKey]) {
      console.log(`🔄 Refresh de ${entityKey}...`);
      await refreshTasks[entityKey]();
    } else {
      console.log('🔄 Refresh de todos os dados...');
      await Promise.all(Object.values(refreshTasks).map(task => task()));
    }
  }, [loadEntity]);

  // Funções individuais de carregamento (memoizadas)
  const loadEvents = useCallback((force = false) => loadEntity('events', Event, force), [loadEntity]);
  const loadDailyWork = useCallback((force = false) => loadEntity('dailyWork', DailyWork, force), [loadEntity]);
  const loadClients = useCallback((force = false) => loadEntity('clients', Client, force), [loadEntity]);
  const loadExpenses = useCallback((force = false) => loadEntity('expenses', Expense, force), [loadEntity]);

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