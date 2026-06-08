import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Bell, Clock, Calendar, CheckCircle2, X } from 'lucide-react';
import { Notification } from '@/api/entities';
import { useAuth } from '@/lib/authContext';
import {
  format,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onMarkAsRead, onNavigate }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 border-red-400/20 bg-red-400/5';
      case 'high': return 'text-orange-400 border-orange-400/20 bg-orange-400/5';
      case 'medium': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
      default: return 'text-slate-400 border-slate-600/20 bg-slate-800/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'work_reminder': return <Clock className="w-4 h-4" />;
      case 'event_reminder': return <Calendar className="w-4 h-4" />;
      case 'payment_reminder': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const handleAction = () => {
    if (notification.action_url) {
      onNavigate(notification.action_url);
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div className={`p-3 border rounded-lg transition-all duration-200 hover:bg-slate-700/30 ${getPriorityColor(notification.priority)}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {notification.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {notification.created_date ? format(parseISO(notification.created_date), 'dd/MM HH:mm', { locale: ptBR }) : 'Agora'}
            </span>
            <div className="flex items-center gap-1">
              {notification.action_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAction}
                  className="h-6 px-2 text-xs bg-cyan-600 hover:bg-cyan-700 border-cyan-500 text-white"
                >
                  Ver
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkAsRead(notification.id)}
                className="h-6 w-6 p-0 hover:bg-slate-600"
              >
                <X className="w-3 h-3 text-slate-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const unreadNotifications = await Notification.filter({
        is_read: false,
        user_id: user.id,
      });
      setNotifications(Array.isArray(unreadNotifications) ? unreadNotifications : []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação marcada como lida');
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      toast.error('Erro ao atualizar notificação');
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const updatePromises = notifications.map(notification => 
        Notification.update(notification.id, { is_read: true })
      );
      await Promise.all(updatePromises);
      setNotifications([]);
      toast.success('Todas as notificações foram marcadas como lidas');
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao atualizar notificações');
    }
  }, [notifications]);

  const handleNavigateFromNotification = useCallback((actionUrl) => {
    // Navegação segura que evita o problema do roteamento
    if (actionUrl) {
      let targetPath = '';
      
      // Mapeia explicitamente as URLs conhecidas para evitar problemas
      if (actionUrl.toLowerCase().includes('calendar')) {
        targetPath = '/Calendar';
        if (actionUrl.includes('?')) {
          const queryPart = actionUrl.split('?')[1];
          targetPath += `?${queryPart}`;
        }
      } else if (actionUrl.toLowerCase().includes('reports')) {
        targetPath = '/Reports';
        if (actionUrl.includes('?')) {
          const queryPart = actionUrl.split('?')[1];
          targetPath += `?${queryPart}`;
        }
      } else {
        // Fallback genérico
        const parts = actionUrl.split('?');
        const pageName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        targetPath = `/${pageName}`;
        if (parts[1]) {
          targetPath += `?${parts[1]}`;
        }
      }
      
      navigate(targetPath);
      setIsOpen(false);
    }
  }, [navigate]);

  const unreadCount = notifications.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-slate-800 text-slate-400 hover:text-white"
          data-notification-trigger
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 text-xs bg-red-500 hover:bg-red-500 text-white border-slate-900"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96 bg-slate-900 border-slate-700 text-white mr-4 mt-2" align="end">
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                Marcar todas como lida
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Nenhuma notificação'}
          </p>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-2">
            {loading ? (
              <div className="text-center p-4 text-slate-400">Carregando...</div>
            ) : unreadCount > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onNavigate={handleNavigateFromNotification}
                />
              ))
            ) : (
              <div className="text-center p-8 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Sem notificações no momento</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}