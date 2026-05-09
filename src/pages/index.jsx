import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Lazy loading das páginas para code-splitting
const Calendar = React.lazy(() => import('./Calendar'));
const Dashboard = React.lazy(() => import('./Dashboard'));
const Clients = React.lazy(() => import('./Clients'));
const Expenses = React.lazy(() => import('./Expenses'));
const ReportsPage = React.lazy(() => import('./reports'));
const ClientDetail = React.lazy(() => import('./ClientDetail'));
const Profile = React.lazy(() => import('./Profile'));
const AIMentorPage = React.lazy(() => import('./AI_Mentor'));
const PrivacyPolicy = React.lazy(() => import('./PrivacyPolicy'));

const PAGES = {
  Calendar,
  Dashboard,
  Clients,
  Expenses,
  Reports: ReportsPage,
  reports: ReportsPage,
  ClientDetail,
  Profile,
  AI_Mentor: AIMentorPage,
  AIReports: AIMentorPage,
  PrivacyPolicy
};

// Componente de loading melhorado
const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center h-64"
  >
    <div className="text-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
      <p className="text-slate-400 text-sm">Carregando página...</p>
    </div>
  </motion.div>
);

export default function PagesRouter() {
  // Lógica de roteamento (mantendo a existente)
  const path = window.location.pathname;
  const pageName = path === '/' ? 'Dashboard' : path.slice(1);
  
  // Tratar rotas com parâmetros
  let resolvedPageName = pageName;
  if (path.startsWith('/clients/') && path !== '/clients') {
    resolvedPageName = 'ClientDetail';
  }

  const Page = PAGES[resolvedPageName] || (() => (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-red-400 mb-4">Página não encontrada</h1>
      <p className="text-slate-400">A página "{pageName}" não existe.</p>
    </div>
  ));

  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
}