import { Suspense, lazy } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const LegacyAppShell = lazy(() => import('@/components/layout/LegacyAppShell'));

export default function LegacyRoute({ children }) {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen text="Preparando..." />}>
      <LegacyAppShell>{children}</LegacyAppShell>
    </Suspense>
  );
}
