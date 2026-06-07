import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useNavigate } from 'react-router-dom';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';
import {
  User, Phone, MapPin, Mail, LogOut, Save, ChevronRight, Loader2, CheckCircle, Eye, EyeOff
} from 'lucide-react';

export default function ProfileSimple() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { isVisible, toggleVisibility } = useFinancialVisibility();
  const navigate = useNavigate();
  const categoryId = profile?.category || 'lighting';
  const config = getCategoryConfig(categoryId);

  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-screen pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden px-4 pt-6 pb-8 text-center"
        style={{ background: `linear-gradient(160deg, ${config.primaryHex}15, transparent)` }}
      >
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${config.primaryHex}, transparent)` }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative inline-block mb-4"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black mx-auto"
            style={{
              background: `linear-gradient(135deg, ${config.primaryHex}30, ${config.accentHex}20)`,
              border: `2px solid ${config.primaryHex}40`,
              boxShadow: `0 0 30px ${config.primaryHex}20`
            }}
          >
            {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="absolute -bottom-1 -right-1 text-base">{config.emoji}</span>
        </motion.div>

        <h1 className="text-xl font-black text-white">
          {profile?.name || user?.email?.split('@')[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: config.primaryHex }}>
          {config.label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
      </motion.div>

      <div className="px-4 max-w-2xl mx-auto space-y-4">

        {/* Dados pessoais */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <NeonGlass primary={config.primaryHex} glow className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider font-mono">Dados Pessoais</h2>

          {[
            { key: 'name', label: 'Nome completo', icon: User, placeholder: 'Seu nome' },
            { key: 'phone', label: 'Telefone / WhatsApp', icon: Phone, placeholder: '(11) 99999-9999', type: 'tel' },
            { key: 'city', label: 'Cidade', icon: MapPin, placeholder: 'São Paulo' },
            { key: 'state', label: 'Estado', icon: MapPin, placeholder: 'SP' },
          ].map(({ key, label, icon: Icon, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
            </div>
          ))}

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Email (conta)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                value={user?.email || ''}
                disabled
                className="w-full bg-gray-800/30 border border-gray-800/50 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Botão salvar */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" /> Salvo!</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar alterações</>
            )}
          </motion.button>
        </NeonGlass>
        </motion.div>

        {/* Categoria */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <NeonGlass primary={config.primaryHex} className="p-5">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 font-mono">Sua Categoria</h2>
          <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{
              background: `${config.primaryHex}10`,
              borderColor: `${config.primaryHex}30`
            }}
          >
            <span className="text-2xl">{config.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-white">{config.label}</p>
              <p className="text-xs text-gray-400">{config.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
          <p className="text-xs text-gray-600 mt-3 text-center">
            Para mudar sua categoria, refaça o onboarding no próximo update.
          </p>
        </NeonGlass>
        </motion.div>

        {/* Especialidades */}
        {profile?.specialties?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <NeonGlass primary={config.primaryHex} className="p-5">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 font-mono">Especialidades</h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map(spec => (
                <span
                  key={spec}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: `${config.primaryHex}15`,
                    border: `1px solid ${config.primaryHex}30`,
                    color: config.primaryHex
                  }}
                >
                  {spec}
                </span>
              ))}
            </div>
          </NeonGlass>
          </motion.div>
        )}

        {/* Metas (readonly info) */}
        {(profile?.monthly_goal_revenue || profile?.monthly_goal_events) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <NeonGlass primary={config.primaryHex} className="p-5">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 font-mono">Metas Mensais</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/40 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Receita</p>
                <p className="text-lg font-black text-white mt-1">
                  R${(profile.monthly_goal_revenue || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-gray-800/40 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Eventos</p>
                <p className="text-lg font-black text-white mt-1">
                  {profile.monthly_goal_events || 0} shows
                </p>
              </div>
            </div>
          </NeonGlass>
          </motion.div>
        )}

        {/* Configurações */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
        <NeonGlass primary={config.primaryHex} className="p-5">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 font-mono">Configurações</h2>
          <button
            onClick={toggleVisibility}
            className="w-full flex items-center justify-between py-3 px-1 rounded-xl transition-all hover:bg-gray-800/30"
          >
            <div className="flex items-center gap-3">
              {isVisible
                ? <Eye className="w-4 h-4 text-cyan-400" />
                : <EyeOff className="w-4 h-4 text-gray-500" />
              }
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Visibilidade Financeira</p>
                <p className="text-xs text-gray-500">
                  {isVisible ? 'Valores visíveis em todo o app' : 'Valores ocultos — modo privado'}
                </p>
              </div>
            </div>
            <div
              className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
              style={{ background: isVisible ? config.primaryHex : 'rgb(55,65,81)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                style={{ left: isVisible ? '24px' : '4px' }}
              />
            </div>
          </button>
        </NeonGlass>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <NeonGlass primary={config.primaryHex} className="p-4">
          {showLogoutConfirm ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-300">Tem certeza que quer sair?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-semibold hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl bg-red-900/60 border border-red-800/50 text-red-400 text-sm font-bold hover:bg-red-900/80 transition-all"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-500/70 hover:text-red-400 text-sm font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          )}
        </NeonGlass>
        </motion.div>

        <p className="text-center text-gray-700 text-xs pb-2 font-mono">Backstage Pro v1.0 MVP</p>
      </div>
    </NeonPageShell>
  );
}
