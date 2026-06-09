import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { FinancialVisibilityProvider } from '@/components/context/FinancialVisibilityContext';

import LoginNew from './pages/LoginNew';
import SignupNew from './pages/SignupNew';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Goals from './pages/Goals';
import ProfileSimple from './pages/ProfileSimple';
import AppLayout from '@/components/layout/AppLayout';

const CalendarPage = lazy(() => import('./pages/Calendar'));
const ReportsPage = lazy(() => import('./pages/Reports.jsx'));
const AIMentorPage = lazy(() => import('./pages/AI_Mentor'));
const ClientsPage = lazy(() => import('./pages/Clients'));
const ExpensesPage = lazy(() => import('./pages/Expenses'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetail'));
import PrivacyPolicyPage from './pages/PrivacyPolicy';
import TermsOfServicePage from './pages/TermsOfService';
import OAuthUrlGuard from '@/components/auth/OAuthUrlGuard';
import NavigationSync from '@/components/NavigationSync';
import { AuthProvider } from '@/lib/authContext';
import { AppDataProvider } from '@/components/context/AppDataContext';

function RouteLoading() {
  return <LoadingSpinner fullScreen text="Carregando..." />;
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

function MigratedModuleRoute({ children }) {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
}

function RootShell() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <NavigationSync />
        <OAuthUrlGuard />
        <Outlet />
      </AppDataProvider>
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
      { path: '/auth/callback', element: <AuthCallback /> },
      { path: '/privacidade', element: <PrivacyPolicyPage /> },
      { path: '/privacy', element: <PrivacyPolicyPage /> },
      { path: '/termos', element: <TermsOfServicePage /> },
      { path: '/terms', element: <TermsOfServicePage /> },
      {
        path: '/onboarding',
        element: (
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        ),
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
          { index: true, element: <Home /> },
          {
            path: 'calendar',
            element: (
              <MigratedModuleRoute>
                <Suspense fallback={<RouteLoading />}>
                  <CalendarPage />
                </Suspense>
              </MigratedModuleRoute>
            ),
          },
          {
            path: 'clients',
            element: (
              <MigratedModuleRoute>
                <Suspense fallback={<RouteLoading />}>
                  <ClientsPage />
                </Suspense>
              </MigratedModuleRoute>
            ),
          },
          {
            path: 'expenses',
            element: (
              <MigratedModuleRoute>
                <Suspense fallback={<RouteLoading />}>
                  <ExpensesPage />
                </Suspense>
              </MigratedModuleRoute>
            ),
          },
          {
            path: 'reports',
            element: (
              <MigratedModuleRoute>
                <Suspense fallback={<RouteLoading />}>
                  <ReportsPage />
                </Suspense>
              </MigratedModuleRoute>
            ),
          },
          {
            path: 'client-detail',
            element: (
              <MigratedModuleRoute>
                <Suspense fallback={<RouteLoading />}>
                  <ClientDetailPage />
                </Suspense>
              </MigratedModuleRoute>
            ),
          },
          { path: 'goals', element: <Goals /> },
          { path: 'profile', element: <ProfileSimple /> },
          {
            path: 'ai-mentor',
            element: (
              <MigratedModuleRoute>
                <Suspense fallback={<RouteLoading />}>
                  <AIMentorPage />
                </Suspense>
              </MigratedModuleRoute>
            ),
          },
        ],
      },
      { path: '*', element: <NotFoundRedirect /> },
    ],
  },
]);
