
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Building2,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MessageCircle,
  CalendarPlus,
  User // Ícone adicionado que estava faltando
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { format } from 'date-fns';

const ClientCard = ({ client, onCardClick, onEdit, onDelete, onNewEvent, formatCurrency, searchTerm, primaryHex = '#A64AFF', accentHex = '#FFB700' }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const highlight = (text) => {
    if (!searchTerm || !text) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="bg-yellow-300 text-black px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    onDelete && onDelete(client.id);
    setShowConfirm(false); // Reset confirmation state
  };

  const handleQuickAction = (action, e) => {
    e.stopPropagation(); // Impede que o clique no botão abra o modal de detalhes
    switch (action) {
      case 'call':
        if (client.phone) window.open(`tel:${client.phone}`, '_blank');
        break;
      case 'email':
        if (client.email) window.open(`mailto:${client.email}`, '_blank');
        break;
      case 'whatsapp':
        if (client.phone) {
          const cleanPhone = client.phone.replace(/\D/g, '');
          // Adiciona o código do país (55 para Brasil) se não estiver presente
          const whatsappNumber = cleanPhone.length > 11 ? cleanPhone : `55${cleanPhone}`;
          window.open(`https://wa.me/${whatsappNumber}`, '_blank');
        }
        break;
      case 'newEvent':
        onNewEvent && onNewEvent(client);
        break;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <Card 
        className="bg-[#161923]/60 border-[#23262f] transition-all duration-300 cursor-pointer h-full flex flex-col"
        style={{ borderColor: undefined }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${primaryHex}44`; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
        onClick={() => onCardClick(client)}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-12 w-12 border-2 border-slate-700">
                <AvatarImage src={client.logo_url} alt={client.name} />
                <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-lg truncate">
                  {highlight(client.name || 'Cliente sem nome')}
                </h3>
                {client.default_daily_cache > 0 && (
                  <Badge className="mt-1 text-xs font-medium px-2 py-0.5 font-mono" style={{ background: `${primaryHex}22`, color: accentHex, border: `1px solid ${primaryHex}44` }}>
                    {formatCurrency(client.default_daily_cache)}/dia
                  </Badge>
                )}
              </div>
            </div>
            
            <DropdownMenu onOpenChange={setShowConfirm}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-slate-800"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                onClick={(e) => e.stopPropagation()} 
                className="bg-slate-800 border-slate-700 text-white w-48"
              >
                <DropdownMenuItem 
                  onClick={() => onCardClick(client)}
                  className="hover:bg-slate-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleQuickAction('newEvent', e)}
                  className="hover:bg-slate-700"
                >
                  <CalendarPlus className="w-4 h-4 mr-2" style={{ color: primaryHex }} />
                  Novo Evento
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem 
                  onClick={() => {
                    onEdit(client);
                  }}
                  className="hover:bg-slate-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Cliente
                </DropdownMenuItem>
                {client.email && (
                  <DropdownMenuItem 
                    onClick={(e) => handleQuickAction('email', e)}
                    className="hover:bg-slate-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </DropdownMenuItem>
                )}
                {client.phone && (
                  <>
                    <DropdownMenuItem 
                      onClick={(e) => handleQuickAction('call', e)}
                      className="hover:bg-slate-700"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleQuickAction('whatsapp', e)}
                      className="hover:bg-slate-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2 text-green-400" />
                      WhatsApp
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-slate-700" />
                {showConfirm ? (
                  <div className="p-2 text-center">
                    <p className="text-sm mb-2">Confirmar exclusão?</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={confirmDelete} 
                        className="flex-1"
                      >
                        Sim
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }} 
                        className="flex-1 bg-slate-700 hover:bg-slate-600"
                      >
                        Não
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Cliente
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-2 mb-4 text-sm">
            {client.contact_person && (
              <p className="text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                {highlight(client.contact_person)}
              </p>
            )}
            {client.email && (
              <p className="text-slate-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {highlight(client.email)}
              </p>
            )}
            {client.phone && (
              <p className="text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {highlight(client.phone)}
              </p>
            )}
          </div>

          {/* Métricas */}
          <div className="mt-auto pt-4 border-t border-slate-700/50 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Faturamento Real</span>
              <span className="font-bold text-green-400">{formatCurrency(client.totalRevenue)}</span>
            </div>
            {client.nextEvent ? (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Próximo Evento</span>
                <Badge variant="outline" className="font-mono" style={{ color: accentHex, borderColor: `${primaryHex}44` }}>
                  {format(new Date(client.nextEvent.start_date + 'T00:00:00'), 'dd/MM/yy')}
                </Badge>
              </div>
            ) : (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Próximo Evento</span>
                <span className="text-slate-500">Nenhum</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default function ClientList({ 
  clients = [], 
  onClientClick: onCardClick, // Renamed prop
  onEditClient: onEdit,       // Renamed prop
  onDeleteClient: onDelete,   // Renamed prop
  onNewEvent,
  searchTerm 
}) {
  const { formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-400 mb-2">
          {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </h3>
        <p className="text-slate-500 mb-6">
          {searchTerm 
            ? 'Tente ajustar os filtros ou termo de busca.' 
            : 'Comece adicionando seu primeiro cliente.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {clients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <ClientCard
              client={client}
              onCardClick={onCardClick}
              onEdit={onEdit}
              onDelete={onDelete}
              onNewEvent={onNewEvent}
              formatCurrency={formatCurrency}
              searchTerm={searchTerm}
              primaryHex={config.primaryHex}
              accentHex={config.accentHex}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
