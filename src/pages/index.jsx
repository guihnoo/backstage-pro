import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';

// Pages
import SplashScreen from './SplashScreen';
import LoginNew from './LoginNew';
import Onboarding from './Onboarding';
import Home from './Home';
import Goals from './Goals';
import ProfileSimple from './ProfileSimple';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Páginas legadas (ainda funcionais, apenas com design antigo)
import CalendarPage from './Calendar';
import ClientsPage from './Clients';

// ─── Guard: rota protegida (só para usuários autenticados) ───
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ─── Guard: redireciona usuário já autenticado ───────────────
function PublicRoute({ children }) {
  const { isAuthenticated, isOnboardingComplete, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (isAuthenticated && !isOnboardingComplete) return <Navigate to="/onboarding" replace />;
  if (isAuthenticated && isOnboardingComplete) return <Navigate to="/" replace />;
  return children;
}

// ─── Guard: força conclusão do onboarding ───────────────────
function OnboardingRoute({ children }) {
  const { isAuthenticated, isOnboardingComplete, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isOnboardingComplete) return <Navigate to="/" replace />;
  return children;
}

export default function PagesRouter() {
  return (
    <Routes>
      {/* ─── Rotas públicas ─── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginNew />
          </PublicRoute>
        }
      />
      <Route
        path="/splash"
        element={<SplashScreen />}
      />

      {/* ─── Onboarding ─── */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      {/* ─── App (layout com bottom nav) ─── */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        {/* Tela principal */}
        <Route index element={<Home />} />

        {/* Agenda (página legada — mantida funcional) */}
        <Route path="calendar" element={<CalendarPage />} />

        {/* Clientes (página legada — mantida funcional) */}
        <Route path="clients" element={<ClientsPage />} />

        {/* Metas e gamificação */}
        <Route path="goals" element={<Goals />} />

        {/* Perfil */}
        <Route path="profile" element={<ProfileSimple />} />
      </Route>

      {/* ─── Fallback ─── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}