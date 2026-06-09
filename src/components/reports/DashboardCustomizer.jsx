import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useUserSettings } from '@/lib/useUserSettings';
import { Settings, Eye, EyeOff, Move, Save, RotateCcw } from 'lucide-react';
import { DndContext, closestCenter } from '@hello-pangea/dnd';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

const DEFAULT_WIDGETS = [
  { id: 'financial-summary', name: 'Resumo Financeiro', description: 'Total de receitas, despesas e lucro' },
  { id: 'ai-assistant', name: 'Assistente IA', description: 'Dicas e insights personalizados' },
  { id: 'monthly-chart', name: 'Gráfico Mensal', description: 'Visualização de receitas e horas' },
  { id: 'forecast-summary', name: 'Previsões', description: 'Eventos e receitas futuras' },
  { id: 'upcoming-events', name: 'Próximos Eventos', description: 'Eventos agendados para os próximos dias' },
  { id: 'payment-alerts', name: 'Alertas de Pagamento', description: 'Lembretes de pagamentos pendentes' },
];

const DEFAULT_SETTINGS = {
  widget_order: DEFAULT_WIDGETS.map(w => w.id),
  hidden_widgets: [],
  notification_preferences: {
    payment_reminders: true,
    event_reminders: true,
    work_hour_reminders: true,
  },
};

export default function DashboardCustomizer({ isOpen, onClose, onSettingsChange }) {
  const { settings: userSettings, loading, upsert } = useUserSettings();
  const [localSettings, setLocalSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && userSettings) {
      setLocalSettings({
        widget_order: userSettings.widget_order || DEFAULT_SETTINGS.widget_order,
        hidden_widgets: userSettings.hidden_widgets || [],
        notification_preferences: userSettings.notification_preferences || DEFAULT_SETTINGS.notification_preferences,
      });
    }
  }, [loading, userSettings, isOpen]);

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await upsert({
        widget_order: localSettings.widget_order,
        hidden_widgets: localSettings.hidden_widgets,
        notification_preferences: localSettings.notification_preferences,
      });
      onSettingsChange?.(localSettings);
      toast.success('Configurações salvas!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => setLocalSettings(DEFAULT_SETTINGS);

  const toggleWidgetVisibility = (widgetId) => {
    setLocalSettings(prev => ({
      ...prev,
      hidden_widgets: prev.hidden_widgets.includes(widgetId)
        ? prev.hidden_widgets.filter(id => id !== widgetId)
        : [...prev.hidden_widgets, widgetId],
    }));
  };

  const updateNotificationPreference = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      notification_preferences: { ...prev.notification_preferences, [key]: value },
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(localSettings.widget_order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setLocalSettings(prev => ({ ...prev, widget_order: newOrder }));
  };

  if (loading) {
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
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-y-auto bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-cyan-400" />
            Personalizar Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {localSettings.widget_order.map((widgetId, index) => {
                        const widget = DEFAULT_WIDGETS.find(w => w.id === widgetId);
                        if (!widget) return null;
                        const isHidden = localSettings.hidden_widgets.includes(widgetId);
                        return (
                          <Draggable key={widgetId} draggableId={widgetId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  snapshot.isDragging
                                    ? 'bg-slate-700 border-cyan-400'
                                    : 'bg-slate-800/50 border-slate-700'
                                } ${isHidden ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps} className="cursor-grab hover:cursor-grabbing p-1 text-slate-400 hover:text-white">
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

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-purple-300">Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'payment_reminders', label: 'Lembretes de Pagamento', desc: 'Receber alertas sobre pagamentos pendentes' },
                { key: 'event_reminders', label: 'Lembretes de Eventos', desc: 'Notificações sobre eventos próximos' },
                { key: 'work_hour_reminders', label: 'Lembretes de Horas', desc: 'Lembrar de registrar horas trabalhadas' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{label}</h4>
                    <p className="text-sm text-slate-400">{desc}</p>
                  </div>
                  <Switch
                    checked={localSettings.notification_preferences?.[key] ?? true}
                    onCheckedChange={(checked) => updateNotificationPreference(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={resetToDefault} className="bg-slate-800 border-slate-700 hover:bg-slate-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrão
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={saveSettings} disabled={isSaving} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
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
