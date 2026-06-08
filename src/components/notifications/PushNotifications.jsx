import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';

export default function PushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Notification de teste
        new Notification('Backstage Pro', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/icon-192x192.png',
          badge: '/icons/icon-72.png'
        });
        
        // Agendar lembretes (exemplo)
        scheduleWorkReminders();
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
    }
  };

  const scheduleWorkReminders = () => {
    // Lembrete de entrada (06:00)
    scheduleNotification('work-start', {
      title: 'Hora de trabalhar! 🎬',
      body: 'Não esqueça de registrar sua entrada no Backstage Pro',
      hour: 6,
      minute: 0
    });

    // Lembrete de saída (após 12h de trabalho)
    scheduleNotification('work-end', {
      title: 'Registrar saída ⏰',
      body: 'Lembre-se de registrar suas horas trabalhadas',
      // Dinamicamente baseado no horário de entrada
    });

    // Lembrete de fechar o dia (22:00)
    scheduleNotification('day-close', {
      title: 'Feche seu dia 📋',
      body: 'Revise seus registros e finalize o dia no Backstage Pro',
      hour: 22,
      minute: 0
    });
  };

  const scheduleNotification = (id, options) => {
    // Implementação básica com setTimeout
    // Em produção, usar IndexedDB + SW para persistir
    const now = new Date();
    const target = new Date();
    target.setHours(options.hour || 12, options.minute || 0, 0, 0);
    
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    const delay = target.getTime() - now.getTime();
    
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: '/icon-192x192.png',
          badge: '/icons/icon-72.png',
          tag: id, // Evita duplicatas
          requireInteraction: true
        });
      }
    }, delay);
  };

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      {permission === 'granted' ? (
        <div className="flex items-center gap-2 text-green-400">
          <Bell className="w-4 h-4" />
          <span className="text-sm">Notificações ativas</span>
        </div>
      ) : (
        <Button
          onClick={requestPermission}
          variant="outline"
          size="sm"
          className="bg-amber-400/20 text-amber-300 border-amber-400/30 hover:bg-amber-400/30"
        >
          <BellOff className="w-4 h-4 mr-2" />
          Ativar Lembretes
        </Button>
      )}
    </div>
  );
}