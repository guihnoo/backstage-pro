import React from 'react';
import { useAuth } from '@/lib/mockAuth';
import Login from './Login';
import DashboardSimple from './DashboardSimple';

export default function PagesRouter() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <DashboardSimple />;
}