import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import LegacyRoute from '@/components/layout/LegacyRoute';

import LoginNew from './LoginNew';
import Onboarding from './Onboarding';
import Home from './Home';
import Goals from './Goals';
import ProfileSimple from './ProfileSimple';
import AppLayout from '@/components/layout/AppLayout';

const CalendarPage = lazy(() => import('./Calendar'));
const ClientsPage = lazy(() => import('./Clients'));

function RouteLoading() {
  return <LoadingSpinner fullScreen text="Carregando..." />;
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <RouteLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
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

export default function PagesRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginNew />
          </PublicRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route
          path="calendar"
          element={
            <LegacyRoute>
              <CalendarPage />
            </LegacyRoute>
          }
        />
        <Route
          path="clients"
          element={
            <LegacyRoute>
              <ClientsPage />
            </LegacyRoute>
          }
        />
        <Route path="goals" element={<Goals />} />
        <Route path="profile" element={<ProfileSimple />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
