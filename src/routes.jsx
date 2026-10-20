/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { FinancialVisibilityProvider } from '@/components/context/FinancialVisibilityContext';

import OAuthUrlGuard from '@/components/auth/OAuthUrlGuard';
import NavigationSync from '@/components/NavigationSync';
import { AuthProvider } from '@/lib/authContext';
import { ProfileOfflineProvider } from '@/lib/profileOfflineContext';
import { OfflineSyncProvider } from '@/lib/offline/OfflineSyncProvider';
import { AppDataProvider } from '@/components/context/AppDataContext';
import { RealtimeSyncProvider } from '@/components/context/RealtimeSyncProvider';
import PushSubscriptionSync from '@/components/notifications/PushSubscriptionSync';
import { withChunkReload } from '@/lib/chunkReload';

// Carregados sob demanda: quem abre o login não baixa o app inteiro, e quem já está
// logado não baixa as telas de login/cadastro/termos.
const LoginNew = lazy(withChunkReload(() => import('./pages/LoginNew')));
const SignupNew = lazy(withChunkReload(() => import('./pages/SignupNew')));
const PrivacyPolicyPage = lazy(withChunkReload(() => import('./pages/PrivacyPolicy')));
const TermsOfServicePage = lazy(withChunkReload(() => import('./pages/TermsOfService')));

function RouteLoading() {
  return <LoadingSpinner fullScreen text="Carregando..." />;
}

function wrapPage(importFn) {
  return async () => {
    const { default: Page } = await withChunkReload(importFn)();
    function PageWithBoundary() {
      const location = useLocation();
      return (
        <ErrorBoundary key={location.pathname}>
          <Page />
        </ErrorBoundary>
      );
    }
    return { Component: PageWithBoundary, HydrateFallback: RouteLoading };
  };
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function NotFoundRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <RouteLoading />;
  return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isOnboardingComplete, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (isAuthenticated && !isOnboardingComplete) return <Navigate to="/onboarding" replace />;
  if (isAuthenticated && isOnboardingComplete) return <Navigate to="/" replace />;
  return children;
}

function OnboardingRoute({ children }) {
  const { isAuthenticated, isOnboardingComplete, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isOnboardingComplete) return <Navigate to="/" replace />;
  return children;
}

function RootShell() {
  return (
    <AuthProvider>
      <ProfileOfflineProvider>
        <OfflineSyncProvider>
          <RealtimeSyncProvider>
            <AppDataProvider>
              <PushSubscriptionSync />
              <NavigationSync />
              <OAuthUrlGuard />
              <Suspense fallback={<RouteLoading />}>
                <Outlet />
              </Suspense>
            </AppDataProvider>
          </RealtimeSyncProvider>
        </OfflineSyncProvider>
      </ProfileOfflineProvider>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootShell />,
    children: [
      {
        path: '/login',
        element: (
          <PublicRoute>
            <LoginNew />
          </PublicRoute>
        ),
      },
      {
        path: '/signup',
        element: (
          <PublicRoute>
            <SignupNew />
          </PublicRoute>
        ),
      },
      { path: '/auth/callback', lazy: wrapPage(() => import('./pages/AuthCallback')) },
      { path: '/reset-password', lazy: wrapPage(() => import('./pages/ResetPassword')) },
      { path: '/privacidade', element: <PrivacyPolicyPage /> },
      { path: '/privacy', element: <PrivacyPolicyPage /> },
      { path: '/termos', element: <TermsOfServicePage /> },
      { path: '/terms', element: <TermsOfServicePage /> },
      { path: '/fechamento', lazy: wrapPage(() => import('./pages/PublicClosingPage')) },
      {
        path: '/onboarding',
        element: (
          <OnboardingRoute>
            <Outlet />
          </OnboardingRoute>
        ),
        children: [{ index: true, lazy: wrapPage(() => import('./pages/Onboarding')) }],
      },
      {
        path: '/',
        // Moldura carregada pelo próprio roteador: assim ela e a tela (Início, Agenda…) são
        // baixadas AO MESMO TEMPO. Antes a moldura só começava depois da tela (3,4 s no celular).
        lazy: async () => {
          const { default: AppLayout } = await withChunkReload(() => import('@/components/layout/AppLayout'))();
          function PrivateAppLayout() {
            return (
              <PrivateRoute>
                <FinancialVisibilityProvider>
                  <AppLayout />
                </FinancialVisibilityProvider>
              </PrivateRoute>
            );
          }
          return { Component: PrivateAppLayout, HydrateFallback: RouteLoading };
        },
        children: [
          { index: true, lazy: wrapPage(() => import('./pages/Home')) },
          { path: 'calendar', lazy: wrapPage(() => import('./pages/Calendar')) },
          { path: 'clients', lazy: wrapPage(() => import('./pages/Clients')) },
          { path: 'expenses', lazy: wrapPage(() => import('./pages/Expenses')) },
          { path: 'reports', lazy: wrapPage(() => import('./pages/Reports.jsx')) },
          { path: 'client-detail', lazy: wrapPage(() => import('./pages/ClientDetail')) },
          { path: 'goals', lazy: wrapPage(() => import('./pages/Goals')) },
          { path: 'profile', lazy: wrapPage(() => import('./pages/ProfileSimple')) },
          { path: 'help', lazy: wrapPage(() => import('./pages/AppHelp')) },
          { path: 'ai-mentor', lazy: wrapPage(() => import('./pages/AI_Mentor')) },
          { path: 'admin/feedbacks', lazy: wrapPage(() => import('./pages/AdminFeedbacks')) },
          { path: 'admin/empresas', lazy: wrapPage(() => import('./pages/AdminEmpresas')) },
        ],
      },
      { path: '*', element: <NotFoundRedirect /> },
    ],
  },
]);
