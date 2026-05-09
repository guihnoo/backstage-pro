import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/mockAuth';
import { LogOut, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DashboardSimple() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-violet-500 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Backstage Pro
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stat Cards */}
            {[
              { label: 'Eventos Agendados', value: '12', icon: '🎤' },
              { label: 'Clientes', value: '8', icon: '👥' },
              { label: 'Receita Este Mês', value: 'R$ 8.500', icon: '💰' }
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-2">Bem-vindo ao Backstage Pro! 🚀</h2>
            <p className="text-gray-400 mb-4">
              Novo design dark moderno está pronto. Este é um protótipo com dados mockados.
              Em breve, integraremos o Supabase para funcionalidades completas.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>✅ Login com autenticação mockada</p>
              <p>✅ Novo design escuro com cyan e violet</p>
              <p>✅ Responsive e moderno</p>
              <p>🔜 Integração com Supabase (próximo passo)</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
