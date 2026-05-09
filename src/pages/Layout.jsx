

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinancialVisibilityProvider } from '@/components/context/FinancialVisibilityContext';
import { AppDataProvider } from '@/components/context/AppDataContext';
import Logo from '@/components/layout/Logo';
import AppLayoutContent from '@/components/layout/AppLayoutContent';
import { defaultNavItems } from '@/components/layout/navConfig'; // Importando a configuração

// Removed unused imports for lucide-react icons that were part of the old navItems array

function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
        console.warn("Usuário não autenticado ou sessão expirada.");
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [location.pathname]);

  const handleLogout = () => {
    User.logout().then(() => {
        setUser(null);
        window.location.reload();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center">
        <Logo size="large" />
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mt-6" />
        <p className="text-slate-200 mt-4">Carregando seus dados...</p>
      </div>
    );
  }

  return children(user, handleLogout);
}

export default function Layout({ children, currentPageName }) {
  return (
    <AppDataProvider>
      <FinancialVisibilityProvider>
        <AuthGuard>
          {(user, handleLogout) => (
            user ? (
              <AppLayoutContent
                user={user}
                handleLogout={handleLogout}
                currentPageName={currentPageName}
                navItems={defaultNavItems} // Passando os itens de navegação
              >
                {children}
              </AppLayoutContent>
            ) : (
              <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <Logo size="large" className="mb-6" />
                <p className="mb-4 text-slate-300">Por favor, faça login para continuar.</p>
                <Button onClick={() => User.login()} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  Fazer Login
                </Button>
              </div>
            )
          )}
        </AuthGuard>
      </FinancialVisibilityProvider>
    </AppDataProvider>
  );
}

