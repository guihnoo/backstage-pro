import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings } from '@/api/entities';
import { User } from '@/api/entities';

const FinancialVisibilityContext = createContext();

export const useFinancialVisibility = () => {
  const context = useContext(FinancialVisibilityContext);
  if (!context) {
    throw new Error('useFinancialVisibility deve ser usado dentro de FinancialVisibilityProvider');
  }
  return context;
};

export const FinancialVisibilityProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisibilitySettings();
  }, []);

  const loadVisibilitySettings = async () => {
    try {
      const user = await User.me();
      if (!user?.id) return;

      const settings = await UserSettings.filter({ owner_id: user.id });
      if (settings && settings.length > 0) {
        setIsVisible(settings[0].financial_visibility !== false);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de visibilidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async () => {
    try {
      const user = await User.me();
      if (!user?.id) return;

      const newVisibility = !isVisible;
      setIsVisible(newVisibility);

      const existingSettings = await UserSettings.filter({ owner_id: user.id });
      if (existingSettings && existingSettings.length > 0) {
        await UserSettings.update(existingSettings[0].id, { 
          financial_visibility: newVisibility 
        });
      } else {
        await UserSettings.create({ 
          owner_id: user.id,
          financial_visibility: newVisibility,
          created_by_email: user.email
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar visibilidade financeira:', error);
      // Reverter em caso de erro
      setIsVisible(!isVisible);
    }
  };

  const formatCurrency = (value) => {
    if (!isVisible) return '•••••';
    if (typeof value !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
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
        formatValue
      }}
    >
      {children}
    </FinancialVisibilityContext.Provider>
  );
};