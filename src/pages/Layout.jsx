import React from 'react';
import { FinancialVisibilityProvider } from '@/components/context/FinancialVisibilityContext';
import { AppDataProvider } from '@/components/context/AppDataContext';
import AppLayoutContent from '@/components/layout/AppLayoutContent';
import { defaultNavItems } from '@/components/layout/navConfig';
import { useAuth } from '@/lib/mockAuth';

export default function Layout({ children, currentPageName }) {
  const { user } = useAuth();

  return (
    <AppDataProvider>
      <FinancialVisibilityProvider>
        {user && (
          <AppLayoutContent
            user={user}
            currentPageName={currentPageName}
            navItems={defaultNavItems}
          >
            {children}
          </AppLayoutContent>
        )}
      </FinancialVisibilityProvider>
    </AppDataProvider>
  );
}

