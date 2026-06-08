
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useUserSettings } from '@/lib/useUserSettings';
import { getCategoryConfig, CATEGORIES } from '@/lib/categoryConfig';
import { hardNavigate } from '@/lib/hardNavigate';
import { motion } from 'framer-motion';
import {
  Loader2, Save, LogOut, User,
  Briefcase, Target, Star, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import BackupManager from '@/components/settings/BackupManager';

const CATEGORY_LIST = Object.values(CATEGORIES);

function SectionCard({ primary, children, title, icon: Icon }) {
  return (
    <NeonGlass primary={primary} className="p-5 space-y-4">
      {title && (
        <div className="flex items-center gap-2 pb-2 border-b border-[#23262f]">
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: primary }} />}
          <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: primary }}>{title}</h2>
        </div>
      )}
      {children}
    </NeonGlass>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[#7c8494] font-mono uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  const { settings, upsert } = useUserSettings();
  const config = getCategoryConfig(profile?.category || 'lighting');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    state: '',
    category: '',
    years_experience: '',
    daily_rate: '',
    monthly_goal_events: '',
    monthly_goal_revenue: '',
  });
  const [financialVisible, setFinancialVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        category: profile.category || '',
        years_experience: profile.years_experience != null ? String(profile.years_experience) : '',
        daily_rate: profile.daily_rate != null ? String(profile.daily_rate) : '',
        monthly_goal_events: profile.monthly_goal_events != null ? String(profile.monthly_goal_events) : '',
        monthly_goal_revenue: profile.monthly_goal_revenue != null ? String(profile.monthly_goal_revenue) : '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (settings !== null) {
      setFinancialVisible(settings?.financial_visibility ?? true);
    }
  }, [settings]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setIsSaving(true);
    try {
      await Promise.all([
        updateProfile({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          category: form.category || null,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
          monthly_goal_events: form.monthly_goal_events ? Number(form.monthly_goal_events) : null,
          monthly_goal_revenue: form.monthly_goal_revenue ? Number(form.monthly_goal_revenue) : null,
        }),
        upsert({ ...(settings || {}), financial_visibility: financialVisible }),
      ]);
      toast.success('Perfil salvo!');
    } catch (err) {
      toast.error('Erro ao salvar', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(); hardNavigate('/login'); }
    catch { toast.error('Erro ao sair'); }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: config.primaryHex }} />
      </div>
    );
  }

  const firstName = form.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profissional';
  const categoryConfig = getCategoryConfig(form.category || 'lighting');

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 px-4 pb-28 max-w-lg mx-auto">

        {/* Avatar + nome */}
        <div className="flex items-center gap-4 py-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-[#050609] flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})` }}
          >
            {(firstName[0] || '?').toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white leading-tight">{firstName}</h1>
            <p className="text-xs font-mono" style={{ color: config.primaryHex }}>
              {categoryConfig.emoji} {categoryConfig.label}
            </p>
            <p className="text-[10px] text-[#5a6070] font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Identidade */}
        <SectionCard primary={config.primaryHex} title="Identidade" icon={User}>
          <FieldRow label="Nome">
            <Input value={form.name} onChange={set('name')} placeholder="Seu nome completo" className="bg-[#0e1018] border-[#23262f] text-white" />
          </FieldRow>
          <FieldRow label="Telefone / WhatsApp">
            <Input value={form.phone} onChange={set('phone')} placeholder="+55 11 9 0000-0000" type="tel" className="bg-[#0e1018] border-[#23262f] text-white" />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Cidade">
              <Input value={form.city} onChange={set('city')} placeholder="São Paulo" className="bg-[#0e1018] border-[#23262f] text-white" />
            </FieldRow>
            <FieldRow label="Estado">
              <Input value={form.state} onChange={set('state')} placeholder="SP" maxLength={2} className="bg-[#0e1018] border-[#23262f] text-white uppercase" />
            </FieldRow>
          </div>
        </SectionCard>

        {/* Profissional */}
        <SectionCard primary={config.primaryHex} title="Profissional" icon={Briefcase}>
          <FieldRow label="Área de Atuação">
            <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="bg-[#0e1018] border-[#23262f] text-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0e1018] border-[#23262f] text-white">
                {CATEGORY_LIST.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Anos de Experiência">
            <Input
              value={form.years_experience}
              onChange={set('years_experience')}
              type="number"
              min="0"
              max="50"
              placeholder="Ex: 5"
              className="bg-[#0e1018] border-[#23262f] text-white"
            />
          </FieldRow>
        </SectionCard>

        {/* Financeiro */}
        <SectionCard primary={config.primaryHex} title="Financeiro & Metas" icon={Target}>
          <FieldRow label="Cachê diário (R$)">
            <Input
              value={form.daily_rate}
              onChange={set('daily_rate')}
              type="number"
              min="0"
              placeholder="Ex: 800"
              className="bg-[#0e1018] border-[#23262f] text-white"
            />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Meta: Receita/mês (R$)">
              <Input
                value={form.monthly_goal_revenue}
                onChange={set('monthly_goal_revenue')}
                type="number"
                min="0"
                placeholder="Ex: 8000"
                className="bg-[#0e1018] border-[#23262f] text-white"
              />
            </FieldRow>
            <FieldRow label="Meta: Shows/mês">
              <Input
                value={form.monthly_goal_events}
                onChange={set('monthly_goal_events')}
                type="number"
                min="0"
                placeholder="Ex: 10"
                className="bg-[#0e1018] border-[#23262f] text-white"
              />
            </FieldRow>
          </div>
          <p className="text-[10px] text-[#5a6070] font-mono">Usado na barra de metas da Home e nos Badges.</p>
        </SectionCard>

        {/* Configurações */}
        <SectionCard primary={config.primaryHex} title="Configurações" icon={Star}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Ocultar valores financeiros</p>
              <p className="text-[10px] text-[#5a6070] font-mono mt-0.5">Substitui R$ por •••••• em todo o app</p>
            </div>
            <Switch
              checked={!financialVisible}
              onCheckedChange={(v) => setFinancialVisible(!v)}
            />
          </div>
        </SectionCard>

        {/* Botão salvar */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 text-sm font-bold rounded-xl border-0"
          style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`, color: '#050609' }}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Salvar Perfil
        </Button>

        {/* Integrações */}
        <GoogleCalendarSync />

        {/* Dados */}
        <BackupManager user={user} />

        {/* Sessão */}
        <div className="pt-2">
          {showLogout ? (
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
              <span className="text-sm text-red-300 flex-1">Sair do backstage?</span>
              <Button size="sm" onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-xs">Sair</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLogout(false)} className="text-[#5a6070] text-xs">Cancelar</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[#5a6070] hover:text-red-400 hover:bg-red-900/10 transition-colors border border-transparent hover:border-red-800/30"
            >
              <span className="flex items-center gap-2 text-sm">
                <LogOut className="w-4 h-4" />
                Sair da conta
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </motion.div>
    </NeonPageShell>
  );
}
