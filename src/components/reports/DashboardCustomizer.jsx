import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { UserDashboardSettings, User } from '@/api/entities';
import { Settings, Eye, EyeOff, Move, Save, RotateCcw } from 'lucide-react';
import { DndContext, closestCenter } from '@hello-pangea/dnd';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const DEFAULT_WIDGETS = [
  { id: 'financial-summary', name: 'Resumo Financeiro', description: 'Total de receitas, despesas e lucro' },
  { id: 'ai-assistant', name: 'Assistente IA', description: 'Dicas e insights personalizados' },
  { id: 'monthly-chart', name: 'Gráfico Mensal', description: 'Visualização de receitas e horas' },
  { id: 'forecast-summary', name: 'Previsões', description: 'Eventos e receitas futuras' },
  { id: 'upcoming-events', name: 'Próximos Eventos', description: 'Eventos agendados para os próximos dias' },
  { id: 'payment-alerts', name: 'Alertas de Pagamento', description: 'Lembretes de pagamentos pendentes' }
];

export default function DashboardCustomizer({ isOpen, onClose, onSettingsChange }) {
  const [settings, setSettings] = useState({
    widget_order: DEFAULT_WIDGETS.map(w => w.id),
    hidden_widgets: [],
    notification_preferences: {
      payment_reminders: true,
      event_reminders: true,
      work_hour_reminders: true
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // SEGURANÇA: Obter usuário atual
      const currentUser = await User.me();
      if (!currentUser) return;

      // SEGURANÇA: Buscar configurações APENAS do usuário atual
      const userSettings = await UserDashboardSettings.filter({ 
        created_by: currentUser.email 
      });

      if (userSettings && userSettings.length > 0) {
        // SEGURANÇA: Verificar propriedade dos dados
        const userSetting = userSettings.find(s => s.created_by === currentUser.email);
        if (userSetting) {
          setSettings({
            widget_order: userSetting.widget_order || DEFAULT_WIDGETS.map(w => w.id),
            hidden_widgets: userSetting.hidden_widgets || [],
            notification_preferences: userSetting.notification_preferences || {
              payment_reminders: true,
              event_reminders: true,
              work_hour_reminders: true
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // SEGURANÇA: Obter usuário atual
      const currentUser = await User.me();
      if (!currentUser) return;

      // SEGURANÇA: Buscar configuração existente do usuário
      const existingSettings = await UserDashboardSettings.filter({ 
        created_by: currentUser.email 
      });

      const settingsData = {
        ...settings,
        created_by: currentUser.email // SEGURANÇA: Sempre definir o criador
      };

      if (existingSettings && existingSettings.length > 0) {
        // SEGURANÇA: Verificar propriedade antes de atualizar
        const userSetting = existingSettings.find(s => s.created_by === currentUser.email);
        if (userSetting) {
          await UserDashboardSettings.update(userSetting.id, settingsData);
        }
      } else {
        await UserDashboardSettings.create(settingsData);
      }

      if (onSettingsChange) {
        onSettingsChange(settings);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    setSettings({
      widget_order: DEFAULT_WIDGETS.map(w => w.id),
      hidden_widgets: [],
      notification_preferences: {
        payment_reminders: true,
        event_reminders: true,
        work_hour_reminders: true
      }
    });
  };

  const toggleWidgetVisibility = (widgetId) => {
    setSettings(prev => {
      const isHidden = prev.hidden_widgets.includes(widgetId);
      return {
        ...prev,
        hidden_widgets: isHidden
          ? prev.hidden_widgets.filter(id => id !== widgetId)
          : [...prev.hidden_widgets, widgetId]
      };
    });
  };

  const updateNotificationPreference = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value
      }
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newWidgetOrder = Array.from(settings.widget_order);
    const [reorderedItem] = newWidgetOrder.splice(result.source.index, 1);
    newWidgetOrder.splice(result.destination.index, 0, reorderedItem);

    setSettings(prev => ({
      ...prev,
      widget_order: newWidgetOrder
    }));
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-cyan-400" />
            Personalizar Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Organizar Widgets */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <Move className="w-5 h-5" />
                Organizar Widgets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Arraste os widgets para reorganizar a ordem no dashboard
              </p>
              
              <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <Droppable droppableId="widgets">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {settings.widget_order.map((widgetId, index) => {
                        const widget = DEFAULT_WIDGETS.find(w => w.id === widgetId);
                        if (!widget) return null;
                        
                        const isHidden = settings.hidden_widgets.includes(widgetId);
                        
                        return (
                          <Draggable key={widgetId} draggableId={widgetId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  flex items-center justify-between p-3 rounded-lg border
                                  ${snapshot.isDragging 
                                    ? 'bg-slate-700 border-cyan-400' 
                                    : 'bg-slate-800/50 border-slate-700'
                                  }
                                  ${isHidden ? 'opacity-50' : ''}
                                `}
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="cursor-grab hover:cursor-grabbing p-1 text-slate-400 hover:text-white"
                                  >
                                    <Move className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-white">{widget.name}</h4>
                                    <p className="text-xs text-slate-400">{widget.description}</p>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleWidgetVisibility(widgetId)}
                                  className={isHidden ? 'text-slate-500' : 'text-cyan-400'}
                                >
                                  {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DndContext>
            </CardContent>
          </Card>

          {/* Preferências de Notificação */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-purple-300">Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Lembretes de Pagamento</h4>
                  <p className="text-sm text-slate-400">Receber alertas sobre pagamentos pendentes</p>
                </div>
                <Switch
                  checked={settings.notification_preferences?.payment_reminders ?? true}
                  onCheckedChange={(checked) => updateNotificationPreference('payment_reminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Lembretes de Eventos</h4>
                  <p className="text-sm text-slate-400">Notificações sobre eventos próximos</p>
                </div>
                <Switch
                  checked={settings.notification_preferences?.event_reminders ?? true}
                  onCheckedChange={(checked) => updateNotificationPreference('event_reminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Lembretes de Horas</h4>
                  <p className="text-sm text-slate-400">Lembrar de registrar horas trabalhadas</p>
                </div>
                <Switch
                  checked={settings.notification_preferences?.work_hour_reminders ?? true}
                  onCheckedChange={(checked) => updateNotificationPreference('work_hour_reminders', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrão
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}