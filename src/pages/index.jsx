import React from 'react';
import { useAuth } from '@/lib/mockAuth';
import { useLocation } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import LoginNew from './LoginNew';
import Signup from './Signup';
import DashboardSimple from './DashboardSimple';

export default function PagesRouter() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Se autenticado, mostrar dashboard
  if (isAuthenticated) {
    return <DashboardSimple />;
  }

  // Se em /signup, mostrar signup
  if (location.pathname === '/signup') {
    return <Signup />;
  }

  // Se em /login, mostrar login novo
  if (location.pathname === '/login') {
    return <LoginNew />;
  }

  // Default: splash screen (que redireciona para login)
  return <SplashScreen />;
}