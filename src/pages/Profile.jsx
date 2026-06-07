
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useUserSettings } from '@/lib/useUserSettings';
import {
  Loader2,
  User as UserIcon,
  AlertTriangle,
  Save,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import BackupManager from '@/components/settings/BackupManager';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  const { settings, upsert } = useUserSettings();

  const [localProfile, setLocalProfile] = useState({ name: '', email: '', category: '' });
  const [localSettings, setLocalSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setLocalProfile({
        name: profile.name || '',
        email: user?.email || '',
        category: profile.category || ''
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (settings !== null) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name: localProfile.name, category: localProfile.category });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await upsert(localSettings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar. Tente novamente.');
    }
  };

  const handleDisconnectGoogle = async () => {
    const updated = { ...(localSettings || {}), google_calendar_connected: false };
    setLocalSettings(updated);
    try {
      await upsert(updated);
      toast.info('Sincronização com Google Calendar desvinculada.');
    } catch (error) {
      console.error('Erro ao desvincular Google Calendar:', error);
      toast.error('Erro ao desvincular Google Calendar. Tente novamente.');
      setLocalSettings(localSettings);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="bg-slate-800/50 border-slate-700 text-white p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Usuário não encontrado</h2>
          <p className="text-slate-300 mt-2">Não foi possível carregar os dados do seu perfil.</p>
          <p className="text-slate-400 text-sm">Por favor, tente sair e entrar novamente.</p>
          <Button variant="destructive" onClick={handleLogout} className="mt-6">
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white font-display flex items-center justify-center gap-3">
          <UserIcon className="w-8 h-8 text-cyan-400" />
          Meu Perfil
        </h1>
        <p className="text-slate-400">Gerencie suas informações e configurações.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription className="text-slate-400">
                Atualize suas informações pessoais e profissionais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile(p => ({ ...p, name: e.target.value }))}
                  className="bg-slate-700/50 text-slate-300"
                />
                <p className="text-xs text-slate-500 mt-1">Seu nome de usuário.</p>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={localProfile.email} disabled className="bg-slate-700/50 text-slate-400" />
                <p className="text-xs text-slate-500 mt-1">
                  Este é o email da sua conta e não pode ser alterado aqui.
                </p>
              </div>
              <div>
                <Label htmlFor="category">Área de Atuação</Label>
                <Select
                  value={localProfile.category}
                  onValueChange={(value) => setLocalProfile(p => ({ ...p, category: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Selecione sua área de atuação..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="tecnico_iluminacao">Técnico de Iluminação</SelectItem>
                    <SelectItem value="tecnico_som">Técnico de Som</SelectItem>
                    <SelectItem value="operador_camera">Operador de Câmera</SelectItem>
                    <SelectItem value="editor_video">Editor de Vídeo</SelectItem>
                    <SelectItem value="fotografo">Fotógrafo</SelectItem>
                    <SelectItem value="videomaker">Videomaker</SelectItem>
                    <SelectItem value="produtor_audiovisual">Produtor Audiovisual</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="assistente_producao">Assistente de Produção</SelectItem>
                    <SelectItem value="freelancer_audiovisual">Freelancer Audiovisual</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Sua área de especialização profissional.</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-cyan-600 hover:bg-cyan-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Perfil
              </Button>
            </CardContent>
          </Card>

          <GoogleCalendarSync
            settings={localSettings}
            onSave={handleSaveSettings}
            onDisconnect={handleDisconnectGoogle}
            isSaving={isSaving}
          />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription className="text-slate-400">
                Ajuste as configurações gerais do aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="financialVisibility" className="flex-1 text-base">
                  Visibilidade Financeira
                  <p className="text-xs text-slate-400 font-normal">Exibir ou ocultar valores monetários em todo o app.</p>
                </Label>
                <Switch
                  id="financialVisibility"
                  checked={localSettings?.financial_visibility ?? true}
                  onCheckedChange={(checked) => setLocalSettings(s => ({ ...(s || {}), financial_visibility: checked }))}
                  disabled={isSaving}
                />
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-cyan-600 hover:bg-cyan-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          <BackupManager user={user} />
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 text-white mt-8">
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
          <CardDescription className="text-slate-400">Gerencie sua sessão atual.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
