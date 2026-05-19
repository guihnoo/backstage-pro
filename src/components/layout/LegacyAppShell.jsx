import { Suspense } from 'react';
import { AppDataProvider } from '@/components/context/AppDataContext';
import { FinancialVisibilityProvider } from '@/components/context/FinancialVisibilityContext';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

/** Providers legados (Base44) — só carregam nas rotas Agenda/Clientes. */
export default function LegacyAppShell({ children }) {
  return (
    <AppDataProvider>
      <FinancialVisibilityProvider>
        <Suspense fallback={<LoadingSpinner fullScreen text="Carregando módulo..." />}>
          {children}
        </Suspense>
      </FinancialVisibilityProvider>
    </AppDataProvider>
  );
}
