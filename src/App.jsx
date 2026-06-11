import './App.css';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { Toaster as SonnerToaster } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase';
import PwaUpdatePrompt from '@/components/pwa/PwaUpdatePrompt';
import { getAppTopBarOffset } from '@/components/layout/AppTopBar';

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
    <>
      <RouterProvider router={router} useTransitions={false} />
      <PwaUpdatePrompt />
      <SonnerToaster
        position="top-center"
        closeButton
        style={{ top: getAppTopBarOffset() }}
        offset={8}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'bg-transparent border-0 shadow-none p-0 w-full flex justify-center',
          },
        }}
      />
    </>
  );
}

export default App;
