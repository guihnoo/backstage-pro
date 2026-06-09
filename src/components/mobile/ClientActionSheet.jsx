import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Eye,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

export default function ClientActionSheet({ 
  client, 
  stats,
  isOpen, 
  onClose, 
  onViewDetails,
  onContact
}) {
  const { formatCurrency } = useFinancialVisibility();

  if (!client) return null;

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t-2 border-cyan-400 rounded-t-3xl shadow-2xl pb-safe max-h-[85dvh] flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-4 mb-3">
                <Avatar className="h-16 w-16 border-2 border-slate-700 flex-shrink-0">
                  <AvatarImage src={client.logo_url} alt={client.name} />
                  <AvatarFallback className="bg-slate-800 text-slate-200 font-bold text-lg">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white truncate mb-1">
                    {client.name}
                  </h2>
                  {client.contact_person && (
                    <p className="text-sm text-slate-400 truncate">
                      {client.contact_person}
                    </p>
                  )}
                  <Badge
                    variant={stats?.isActive ? 'default' : 'secondary'}
                    className={`mt-2 ${stats?.isActive ? 'bg-green-600/80 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {stats?.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="flex-shrink-0 h-10 w-10 min-w-[44px] min-h-[44px]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-700/30">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>Eventos</span>
                      </div>
                      <p className="text-white text-lg font-bold">
                        {stats.totalEvents || 0}
                      </p>
                    </div>
                    <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-700/30">
                      <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>A Receber</span>
                      </div>
                      <p className="text-white text-lg font-bold">
                        {formatCurrency(stats.pendingRevenue || 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {(client.email || client.phone) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Contato
                    </p>
                    {client.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-800 space-y-2 bg-slate-900/50">
              <Button
                onClick={() => onViewDetails(client)}
                className="w-full h-12 min-h-[44px] bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-base"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes Completos
              </Button>

              {(client.email || client.phone) && (
                <>
                  <Separator className="bg-slate-800" />
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Entrar em Contato
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {client.email && (
                      <Button
                        variant="outline"
                        onClick={() => onContact(client, 'email')}
                        className="h-12 min-h-[44px] bg-slate-800 border-slate-700 hover:bg-slate-700 text-white flex-col gap-1"
                      >
                        <Mail className="w-5 h-5" />
                        <span className="text-xs">Email</span>
                      </Button>
                    )}
                    {client.phone && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => onContact(client, 'phone')}
                          className="h-12 min-h-[44px] bg-slate-800 border-slate-700 hover:bg-slate-700 text-white flex-col gap-1"
                        >
                          <Phone className="w-5 h-5" />
                          <span className="text-xs">Ligar</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => onContact(client, 'whatsapp')}
                          className="h-12 min-h-[44px] bg-green-900/20 border-green-700/50 hover:bg-green-900/30 text-green-400 flex-col gap-1"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-xs">WhatsApp</span>
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}