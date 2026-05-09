
import React, { useState, useEffect } from 'react';
import { useAppData } from '@/components/context/AppDataContext';
import { User } from '@/api/entities';
import { UserSettings } from '@/api/entities';
import {
  Loader2,
  User as UserIcon,
  Palette,
  Bell,
  Shield,
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Save,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import BackupManager from '@/components/settings/BackupManager';
import { motion } from 'framer-motion';


export default function ProfilePage() {
  const { data, loading, refreshData } = useAppData();
  
  const user = data.user; // Get user from context for easier access

  // State for user profile information
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    area_of_expertise: ''
  });

  // State for user settings
  const [settings, setSettings] = useState(null);

  // State for saving/loading indicators
  const [isSaving, setIsSaving] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true); // Renamed to avoid conflict

  // useEffect to load user and settings
  useEffect(() => {
    const loadUserDataAndSettings = async () => {
      if (!user?.id) return; // Exit if no user from context is valid
      
      setIsPageLoading(true);
      try {
          setProfile({
            full_name: user.full_name || '',
            email: user.email || '',
            area_of_expertise: user.area_of_expertise || ''
          });

          // CORREÇÃO: Usar 'filter' em vez de 'getMySettings'
          const userSettingsRecords = await UserSettings.filter({ owner_id: user.id });
          if (userSettingsRecords && userSettingsRecords.length > 0) {
            setSettings(userSettingsRecords[0]);
          } else {
            // Se não houver configurações, inicializa um objeto vazio para evitar erros
            setSettings({}); 
          }
      } catch (error) {
        console.error("Failed to load user settings:", error);
        toast.error("Erro ao carregar as configurações do usuário.");
      } finally {
        setIsPageLoading(false);
      }
    };

    if (user && !loading.user) { // Trigger when user data becomes available and loading is done
        loadUserDataAndSettings();
    } else if (!user && !loading.user) { // Handle case where loading is done but no user
        setIsPageLoading(false);
        console.warn("No user data found after loading.");
    }
  }, [user, loading.user]); // Depend on user object and loading status from context

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData({
        full_name: profile.full_name,
        area_of_expertise: profile.area_of_expertise
      });

      toast.success('Perfil atualizado com sucesso!');
      await refreshData(); // Refresh AppDataContext data to reflect changes
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings || !data.user) return;

    setIsSaving(true);
    try {
      // CORREÇÃO: Lógica para criar ou atualizar as configurações
      const existingSettings = await UserSettings.filter({ owner_id: data.user.id });
      if (existingSettings && existingSettings.length > 0) {
        await UserSettings.update(existingSettings[0].id, settings);
      } else {
        await UserSettings.create({ ...settings, owner_id: data.user.id });
      }
      toast.success('Configurações salvas com sucesso!');
      await refreshData();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Assuming User.logout() handles clearing session/tokens
      await User.logout(); // This method needs to be implemented in your User entity or auth service
      toast.success('Você foi desconectado com sucesso.');
      window.location.reload(); // Recarrega a página para o AuthGuard assumir
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar. Tente novamente.');
    }
  };

  const handleDisconnectGoogle = async () => {
    // This function is called by GoogleCalendarSync component after it successfully disconnects on its end.
    // Now, update the parent's settings state and persist it to the database.
    const updatedSettings = {
      ...settings,
      google_calendar_connected: false // Assuming this flag exists in UserSettings
    };
    setSettings(updatedSettings); // Optimistically update UI
    try {
       // CORREÇÃO: Lógica para atualizar as configurações existentes
       const existingSettings = await UserSettings.filter({ owner_id: data.user.id });
       if (existingSettings && existingSettings.length > 0) {
         await UserSettings.update(existingSettings[0].id, updatedSettings); // Persist the change
       } else {
         // Se não existia, cria um novo registro (pouco provável neste fluxo, mas seguro)
         await UserSettings.create({ ...updatedSettings, owner_id: data.user.id });
       }
      toast.info('Sincronização com Google Calendar desvinculada.');
      await refreshData(); // If Google Calendar connection status is part of AppDataContext user data
    } catch (error) {
      console.error('Erro ao desvincular Google Calendar:', error);
      toast.error('Erro ao desvincular Google Calendar. Tente novamente.');
      // Revert state if save fails
      if (settings) { // Check if settings was loaded
        setSettings(settings);
      }
    }
  };


  if (isPageLoading || loading.user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Add this check for when there's no user after loading
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
      )
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
        {/* Coluna da Esquerda: Perfil e Google Sync */}
        <div className="lg:col-span-1 space-y-8">
          {/* Card do Perfil */}
          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription className="text-slate-400">
                Atualize suas informações pessoais e profissionais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="bg-slate-700/50 text-slate-300"
                />
                 <p className="text-xs text-slate-500 mt-1">
                  Seu nome de usuário.
                 </p>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled className="bg-slate-700/50 text-slate-400" />
                <p className="text-xs text-slate-500 mt-1">
                  Este é o email da sua conta Google e não pode ser alterado aqui.
                </p>
              </div>
              <div>
                <Label htmlFor="area_of_expertise">Área de Atuação</Label>
                <Select
                  value={profile.area_of_expertise}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, area_of_expertise: value }))}
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
                <p className="text-xs text-slate-500 mt-1">
                  Sua área de especialização profissional.
                </p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-cyan-600 hover:bg-cyan-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Card do Google Calendar Sync */}
          <GoogleCalendarSync
            settings={settings}
            onSave={handleSaveSettings}
            onDisconnect={handleDisconnectGoogle}
            isSaving={isSaving}
          />
        </div>

        {/* Coluna da Direita: Configurações e Backups */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card de Configurações Gerais */}
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
                  checked={settings?.financial_visibility ?? true}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, financial_visibility: checked }))}
                  disabled={isSaving}
                />
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-cyan-600 hover:bg-cyan-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* NOVO COMPONENTE DE BACKUP */}
          <BackupManager user={user} />
        </div>
      </div>

      {/* Card de Logout */}
      <Card className="bg-slate-800/50 border-slate-700 text-white mt-8">
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
          <CardDescription className="text-slate-400">
            Gerencie sua sessão atual.
          </CardDescription>
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
