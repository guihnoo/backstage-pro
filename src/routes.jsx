import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { FinancialVisibilityProvider } from '@/components/context/FinancialVisibilityContext';

import LoginNew from './pages/LoginNew';
import SignupNew from './pages/SignupNew';
import AppLayout from '@/components/layout/AppLayout';
import PrivacyPolicyPage from './pages/PrivacyPolicy';
import TermsOfServicePage from './pages/TermsOfService';
import OAuthUrlGuard from '@/components/auth/OAuthUrlGuard';
import NavigationSync from '@/components/NavigationSync';
import { AuthProvider } from '@/lib/authContext';
import { AppDataProvider } from '@/components/context/AppDataContext';
import { RealtimeSyncProvider } from '@/components/context/RealtimeSyncProvider';
import PushSubscriptionSync from '@/components/notifications/PushSubscriptionSync';

function RouteLoading() {
  return <LoadingSpinner fullScreen text="Carregando..." />;
}

function wrapPage(importFn) {
  return async () => {
    const { default: Page } = await importFn();
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
      <RealtimeSyncProvider>
        <AppDataProvider>
          <PushSubscriptionSync />
          <NavigationSync />
          <OAuthUrlGuard />
          <Outlet />
        </AppDataProvider>
      </RealtimeSyncProvider>
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
        element: (
          <PrivateRoute>
            <FinancialVisibilityProvider>
              <AppLayout />
            </FinancialVisibilityProvider>
          </PrivateRoute>
        ),
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
        ],
      },
      { path: '*', element: <NotFoundRedirect /> },
    ],
  },
]);
