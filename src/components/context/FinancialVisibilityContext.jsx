import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { useUserSettings } from '@/lib/useUserSettings';

const STORAGE_KEY_PREFIX = 'backstage:financial_visibility:';

const FinancialVisibilityContext = createContext();

export const useFinancialVisibility = () => {
  const context = useContext(FinancialVisibilityContext);
  if (!context) {
    throw new Error('useFinancialVisibility deve ser usado dentro de FinancialVisibilityProvider');
  }
  return context;
};

function readStoredVisibility(userId) {
  if (!userId || typeof window === 'undefined') return true;
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
  if (raw === null) return true;
  return raw !== 'false';
}

function writeStoredVisibility(userId, visible) {
  if (!userId || typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, visible ? 'true' : 'false');
}

export const FinancialVisibilityProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { settings, upsert } = useUserSettings();

  // Initialize from localStorage immediately (fast), then override from Supabase
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== 'undefined' ? readStoredVisibility(null) : true
  );
  const [loading, setLoading] = useState(true);

  // Phase 1: set from localStorage as soon as we know the user
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setIsVisible(true);
      setLoading(false);
      return;
    }
    setIsVisible(readStoredVisibility(user.id));
    setLoading(false);
  }, [user?.id, authLoading]);

  // Phase 2: override with Supabase value once settings load
  useEffect(() => {
    if (!settings || !user?.id) return;
    const supabaseValue = settings.financial_visibility ?? true;
    setIsVisible(supabaseValue);
    writeStoredVisibility(user.id, supabaseValue);
  }, [settings?.financial_visibility, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVisibility = useCallback(async () => {
    if (!user?.id) return;
    const next = !isVisible;
    setIsVisible(next);
    writeStoredVisibility(user.id, next);
    try {
      await upsert({ financial_visibility: next });
    } catch {
      // revert optimistic update on error
      setIsVisible(!next);
      writeStoredVisibility(user.id, !next);
    }
  }, [user?.id, isVisible, upsert]);

  const formatCurrency = (value) => {
    if (!isVisible) return '•••••';
    if (typeof value !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatValue = (value, unit = '') => {
    if (!isVisible) return '•••••';
    return `${value}${unit}`;
  };

  return (
    <FinancialVisibilityContext.Provider
      value={{
        isVisible,
        loading,
        toggleVisibility,
        formatCurrency,
        formatValue,
      }}
    >
      {children}
    </FinancialVisibilityContext.Provider>
  );
};
