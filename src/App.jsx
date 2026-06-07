import './App.css';
import Pages from '@/pages/index.jsx';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { AuthProvider } from '@/lib/authContext';
import { AppDataProvider } from '@/components/context/AppDataContext';
import { BrowserRouter } from 'react-router-dom';
import { isSupabaseConfigured } from '@/lib/supabase';

function ConfigMissingScreen() {
  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold text-amber-400">Backstage Pro</h1>
        <p className="text-slate-400 text-sm">
          Configure <span className="text-amber-300">VITE_SUPABASE_URL</span> e{' '}
          <span className="text-amber-300">VITE_SUPABASE_ANON_KEY</span> na Vercel (Settings →
          Environment Variables) e faça redeploy.
        </p>
        <p className="text-slate-500 text-xs">Local: copie .env.example para .env.local</p>
      </div>
    </div>
  );
}

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigMissingScreen />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <Pages />
          <Toaster />
          <SonnerToaster position="top-center" richColors closeButton />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
