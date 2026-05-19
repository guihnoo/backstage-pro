import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';

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
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

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

  const toggleVisibility = useCallback(() => {
    if (!user?.id) return;
    setIsVisible((prev) => {
      const next = !prev;
      writeStoredVisibility(user.id, next);
      return next;
    });
  }, [user?.id]);

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
