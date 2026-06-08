import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  X,
  Bell,
  LogOut,
  Eye,
  EyeOff,
  User as UserIcon
} from 'lucide-react';
import Logo from './Logo';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { Notification } from '@/api/entities';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AppLayoutContent({ user, currentPageName, navItems, children }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isVisible, toggleVisibility } = useFinancialVisibility();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    const pageTitles = {
      'Dashboard': 'Backstage Pro – Dashboard',
      'Calendar': 'Backstage Pro – Agenda',
      'Clients': 'Backstage Pro – Clientes',
      'Expenses': 'Backstage Pro – Despesas',
      'reports': 'Backstage Pro – Relatórios',
      'AI_Mentor': 'Backstage Pro – AI Mentor',
      'Profile': 'Backstage Pro – Perfil'
    };

    document.title = pageTitles[currentPageName] || 'Backstage Pro';
  }, [currentPageName]);

  const loadNotifications = useCallback(async () => {
    try {
      const allNotifications = await Notification.filter({ owner_id: user.id });
      const sortedNotifications = (allNotifications || []).sort((a, b) => {
        const dateA = new Date(a.created_date || 0);
        const dateB = new Date(b.created_date || 0);
        return dateB - dateA;
      });

      setNotifications(sortedNotifications);
      const unread = sortedNotifications.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }, [user.id]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unreadNotifications.map((n) => Notification.update(n.id, { is_read: true }))
      );
      loadNotifications();
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActivePage = (itemPage) => {
    return currentPageName === itemPage;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800 pt-safe">
        <div className="flex items-center justify-between p-4">
          <Logo size="small" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)} className="bg-gray-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-gray-700 hover:text-white relative h-10 w-10"

              data-notification-trigger>

              <Bell className="w-5 h-5" />
              {unreadCount > 0 &&
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              }
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)} className="bg-slate-800 text-slate-50 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10">


              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900 border-r border-gray-800">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800">
            <Logo size="normal" />
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePage(item.page);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                      active ?
                      "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20" :
                      "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}>

                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      active ? "text-white" : "text-gray-500 group-hover:text-cyan-400"
                    )} />
                    <span className="font-medium">{item.label}</span>
                  </Link>);

              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-gray-800 space-y-2">
            <Button
              variant="ghost"
              onClick={toggleVisibility}
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800">

              {isVisible ? <Eye className="w-5 h-5 mr-3" /> : <EyeOff className="w-5 h-5 mr-3" />}
              {isVisible ? 'Ocultar Valores' : 'Mostrar Valores'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowNotifications(true)}
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800 relative"
              data-notification-trigger>

              <Bell className="w-5 h-5 mr-3" />
              Notificações
              {unreadCount > 0 &&
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              }
            </Button>

            <Link to="/profile">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800">

                <UserIcon className="w-5 h-5 mr-3" />
                Perfil
              </Button>
            </Link>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20">

              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>

            <div className="pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500 px-4">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen &&
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden" />

            
            <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-900 border-r border-gray-800 z-50 lg:hidden flex flex-col">

              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <Logo size="normal" />
                <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-10 w-10">

                  <X className="w-6 h-6" />
                </Button>
              </div>

              <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePage(item.page);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        active ?
                        "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20" :
                        "text-gray-400 active:bg-gray-800 active:text-white"
                      )}>

                        <Icon className={cn("w-5 h-5", active && "text-white")} />
                        <span className="font-medium">{item.label}</span>
                      </Link>);

                })}
                </nav>
              </ScrollArea>

              <div className="p-4 border-t border-gray-800 space-y-2 pb-safe">
                <Button
                variant="ghost"
                onClick={() => {
                  toggleVisibility();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start text-gray-400 h-12">

                  {isVisible ? <Eye className="w-5 h-5 mr-3" /> : <EyeOff className="w-5 h-5 mr-3" />}
                  {isVisible ? 'Ocultar Valores' : 'Mostrar Valores'}
                </Button>

                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-400 h-12">

                    <UserIcon className="w-5 h-5 mr-3" />
                    Perfil
                  </Button>
                </Link>

                <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 h-12">

                  <LogOut className="w-5 h-5 mr-3" />
                  Sair
                </Button>

                <div className="pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 px-4 truncate">{user?.email}</p>
                </div>
              </div>
            </motion.aside>
          </>
        }
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead} />

    </div>);

}