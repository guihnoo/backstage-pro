import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { hardNavigate } from '@/lib/hardNavigate';
import { getCategoryConfig, CATEGORIES } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';
import {
  User, Phone, MapPin, Mail, LogOut, Save, Loader2, CheckCircle, Eye, EyeOff, Download,
  DollarSign, Target, Calendar, Camera
} from 'lucide-react';
import { createBackup } from '@/api/functions';
import { uploadUserFile } from '@/lib/uploadFile';
import appToast from '@/lib/appToast';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import PushNotificationSettings from '@/components/notifications/PushNotificationSettings';
import LiveClockBar from '@/components/home/LiveClockBar';
import { useStats } from '@/lib/useBackstageData';

export default function ProfileSimple() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { stats } = useStats(user?.id);
  const { isVisible, toggleVisibility } = useFinancialVisibility();
  const categoryId = profile?.category || 'lighting';

  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
    years_experience: profile?.years_experience != null ? String(profile.years_experience) : '',
    daily_rate: profile?.daily_rate || '',
    monthly_goal_revenue: profile?.monthly_goal_revenue || '',
    monthly_goal_events: profile?.monthly_goal_events || '',
    category: profile?.category || '',
  });

  const config = getCategoryConfig(form.category || categoryId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        years_experience: profile.years_experience != null ? String(profile.years_experience) : '',
        daily_rate: profile.daily_rate || '',
        monthly_goal_revenue: profile.monthly_goal_revenue || '',
        monthly_goal_events: profile.monthly_goal_events || '',
        category: profile.category || '',
      });
    }
  }, [profile]);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const result = await createBackup({});
      if (result?.data?.success) {
        appToast.success('Dados exportados!', { description: 'Arquivo JSON salvo no seu dispositivo.' });
      } else {
        appToast.error('Erro ao exportar', { description: result?.data?.error || 'Tente novamente.' });
      }
    } catch (err) {
      appToast.error('Erro ao exportar', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        years_experience: form.years_experience !== '' ? Number(form.years_experience) : null,
        daily_rate: form.daily_rate !== '' ? Number(form.daily_rate) : null,
        monthly_goal_revenue: form.monthly_goal_revenue !== '' ? Number(form.monthly_goal_revenue) : null,
        monthly_goal_events: form.monthly_goal_events !== '' ? Number(form.monthly_goal_events) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      appToast.error('Erro ao salvar perfil.', { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await uploadUserFile(file, { folder: 'avatars' });
      await updateProfile({ avatar_url: file_url });
      appToast.success('Foto de perfil atualizada!');
    } catch (err) {
      appToast.error('Erro ao enviar foto', { description: err.message });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    await signOut();
    hardNavigate('/login');
  };

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden px-4 pt-2 pb-8"
        style={{ background: `linear-gradient(160deg, ${config.primaryHex}15, transparent)` }}
      >
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${config.primaryHex}, transparent)` }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="max-w-2xl mx-auto mb-4 pr-28">
          <LiveClockBar primaryHex={config.primaryHex} />
          <div className="text-left mt-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Seu perfil</p>
            <h1 className="text-xl font-black text-white">Configurações</h1>
          </div>
        </div>

        <div className="text-center">
        {/* Avatar com upload */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative inline-block mb-4 max-w-full overflow-hidden"
        >
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="relative w-20 h-20 rounded-full mx-auto block overflow-hidden focus:outline-none"
            style={{
              border: `2px solid ${config.primaryHex}40`,
              boxShadow: `0 0 30px ${config.primaryHex}20`
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-3xl font-black"
                style={{ background: `linear-gradient(135deg, ${config.primaryHex}30, ${config.accentHex}20)` }}
              >
                {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              {uploadingPhoto
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />
              }
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </motion.button>
          <span className="absolute -bottom-1 -right-1 text-base">{config.emoji}</span>
          <div
            className="absolute bottom-0 right-6 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: config.primaryHex }}
          >
            <Camera className="w-3 h-3 text-white" />
          </div>
        </motion.div>

        <h1 className="text-xl font-black text-white">
          {profile?.name || user?.email?.split('@')[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: config.primaryHex }}>
          {config.label}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
        </div>
      </motion.div>

      <div className="px-4 max-w-2xl mx-auto space-y-4 w-full min-w-0">

        {/* Dados pessoais */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <NeonGlass primary={config.primaryHex} glow className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Dados Pessoais</h2>

          {[
            { key: 'name', label: 'Nome completo', icon: User, placeholder: 'Seu nome' },
            { key: 'phone', label: 'Telefone / WhatsApp', icon: Phone, placeholder: '(11) 99999-9999', type: 'tel' },
            { key: 'city', label: 'Cidade', icon: MapPin, placeholder: 'São Paulo' },
            { key: 'state', label: 'Estado', icon: MapPin, placeholder: 'SP' },
            { key: 'years_experience', label: 'Anos de experiência', icon: Calendar, placeholder: '5', type: 'number' },
          ].map(({ key, label, icon: Icon, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-base md:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>
            </div>
          ))}

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Email (conta)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-800/30 border border-slate-800/50 rounded-xl pl-10 pr-4 py-3 text-base md:text-sm text-slate-500 cursor-not-allowed"
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
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 font-mono">Área de Atuação</h2>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
            {Object.values(CATEGORIES).map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all min-w-0"
                style={form.category === cat.id ? {
                  background: `${cat.primaryHex}20`,
                  borderColor: `${cat.primaryHex}60`,
                  color: cat.primaryHex,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: '#6b7280',
                }}
              >
                <span>{cat.emoji}</span>
                <span className="truncate text-xs">{cat.label}</span>
              </button>
            ))}
          </div>
        </NeonGlass>
        </motion.div>

        {/* Especialidades */}
        {profile?.specialties?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <NeonGlass primary={config.primaryHex} className="p-5">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 font-mono">Especialidades</h2>
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

        {/* Metas e diária */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <NeonGlass primary={config.primaryHex} glow className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Metas & Precificação</h2>

          {[
            { key: 'daily_rate', label: 'Valor da diária (R$)', icon: DollarSign, placeholder: '800', type: 'number' },
            { key: 'monthly_goal_revenue', label: 'Meta de receita mensal (R$)', icon: Target, placeholder: '5000', type: 'number' },
            { key: 'monthly_goal_events', label: 'Meta de diárias por mês', icon: Calendar, placeholder: '12', type: 'number', hint: 'Dias únicos trabalhados no mês (independente de quantas empresas no mesmo dia)' },
          ].map(({ key, label, icon: Icon, placeholder, type, hint }) => (
            <div key={key}>
              <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
              {hint && <p className="text-[10px] text-slate-600 mb-1.5">{hint}</p>}
              {key === 'monthly_goal_events' && stats?.diarias_count != null && (
                <p className="text-[10px] text-cyan-400/80 mb-1.5">Este mês: {stats.diarias_count} diária{stats.diarias_count !== 1 ? 's' : ''} registrada{stats.diarias_count !== 1 ? 's' : ''}</p>
              )}
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type={type}
                  min="0"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-base md:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>
            </div>
          ))}

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
              <><Save className="w-4 h-4" /> Salvar metas</>
            )}
          </motion.button>
        </NeonGlass>
        </motion.div>

        {/* Alertas no celular */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }}>
          <PushNotificationSettings />
        </motion.div>

        {/* Google Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <GoogleCalendarSync />
        </motion.div>

        {/* Configurações */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
        <NeonGlass primary={config.primaryHex} className="p-5">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 font-mono">Configurações</h2>
          <button
            onClick={toggleVisibility}
            className="w-full flex items-center justify-between gap-3 py-3 px-1 rounded-xl transition-all hover:bg-slate-800/30 min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isVisible
                ? <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                : <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
              }
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-white">Visibilidade Financeira</p>
                <p className="text-xs text-slate-500">
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
              <p className="text-sm text-slate-300">Tem certeza que quer sair?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm font-semibold hover:bg-slate-700 transition-all"
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

        <button
          onClick={handleExportData}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-slate-300 text-xs font-mono transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {exporting ? 'Exportando...' : 'Exportar meus dados'}
        </button>
        <p className="text-center text-slate-700 text-xs pb-2 font-mono">Backstage Pro v1.0 MVP</p>
      </div>
    </NeonPageShell>
  );
}
