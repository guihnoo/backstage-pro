
import React, { useState, useMemo, useCallback } from 'react';
import { useQueryAction } from '@/lib/useQueryAction';
import { useClients } from '@/lib/useClients';
import { useEvents } from '@/lib/useEvents';
import { useDailyWork } from '@/lib/useDailyWork';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Plus,
  Users,
  AlertCircle,
  Mail,
  Phone,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventStatus } from '@/components/utils/dateUtils';
import { useMediaQuery } from '@/components/hooks/useMediaQuery';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';

// Components
import ClientForm from '@/components/clients/ClientForm';
import ClientDetailModal from '@/components/clients/ClientDetailModal';
import EmptyState from '@/components/layout/EmptyState';
import ClientActionSheet from '@/components/mobile/ClientActionSheet';
import ClientInsightsModal from '@/components/clients/ClientInsightsModal';

import { toast } from 'sonner';

const ClientsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default function ClientsPage() {
  const { clients, loading: clientsLoading, error: clientsError, refetch: refetchClients, delete: deleteClient } = useClients();
  const { events } = useEvents();
  const { dailyWork } = useDailyWork();
  const { formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [actionSheetClient, setActionSheetClient] = useState(null);
  const [insightsClient, setInsightsClient] = useState(null);

  useQueryAction('new-client', useCallback(() => {
    setShowClientForm(true);
    setEditingClient(null);
  }, []));

  const clientsWithStats = useMemo(() => {
    const work = dailyWork;

    return clients.map(client => {
      const clientEvents = events.filter(e => e.client_id === client.id);
      const clientEventIds = new Set(clientEvents.map(e => e.id));
      const clientWork = work.filter(w => clientEventIds.has(w.event_id));

      const generatedRevenue = clientWork.reduce((sum, w) => sum + (w.daily_cache || 0), 0);
      
      const completedUnpaidEvents = clientEvents.filter(e => 
        getEventStatus(e) === 'completed' && e.payment_status === 'unpaid'
      );
      const pendingRevenue = completedUnpaidEvents.reduce((sum, e) => {
        const eventWork = clientWork.filter(w => w.event_id === e.id);
        const eventRevenue = eventWork.reduce((workSum, w) => workSum + (w.daily_cache || 0), 0);
        return sum + (eventRevenue > 0 ? eventRevenue : (e.daily_cache_value || 0));
      }, 0);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentEvents = clientEvents.filter(e => {
        try {
          const eventDate = parseISO(e.start_date);
          return isValid(eventDate) && eventDate >= sixMonthsAgo;
        } catch {
          return false;
        }
      });
      const isActive = recentEvents.length > 0;

      const sortedEvents = clientEvents
        .filter(e => e.start_date)
        .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      const lastEvent = sortedEvents[0];

      return {
        ...client,
        stats: {
          totalEvents: clientEvents.length,
          generatedRevenue,
          pendingRevenue,
          isActive,
          lastEventDate: lastEvent?.start_date,
        }
      };
    });
  }, [clients, events, dailyWork]);

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clientsWithStats;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(term) ||
        (client.contact_person && client.contact_person.toLowerCase().includes(term))
      );
    }

    if (filterActive !== 'all') {
      filtered = filtered.filter(client => 
        filterActive === 'active' ? client.stats.isActive : !client.stats.isActive
      );
    }

    // Ordenação Padrão: por nome
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [clientsWithStats, searchTerm, filterActive]);

  const handleClientClick = useCallback((client) => {
    if (isMobile) {
      setActionSheetClient(client);
    } else {
      setSelectedClient(client);
    }
  }, [isMobile]);

  const handleOpenInsights = (e, client) => {
    e.stopPropagation(); // Impede que o clique no botão de insights também abra o modal de detalhes
    setInsightsClient(client);
  };

  const handleNewClient = useCallback(() => {
    setEditingClient(null);
    setShowClientForm(true);
  }, []);

  const handleEditClient = useCallback((client) => {
    setEditingClient(client);
    setShowClientForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowClientForm(false);
    setEditingClient(null);
    refetchClients();
  }, [refetchClients]);

  const handleDeleteClient = useCallback(async (clientId) => {
    if (!window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      await deleteClient(clientId);
      toast.success("Cliente excluído com sucesso.");
      setSelectedClient(null);
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      toast.error("Não foi possível excluir o cliente.", {
        description: "Verifique se ele não possui eventos associados e tente novamente."
      });
    }
  }, [deleteClient]);

  const handleActionSheetViewDetails = useCallback((client) => {
    setActionSheetClient(null);
    setSelectedClient(client);
  }, []);

  const handleActionSheetContact = useCallback((client, type) => {
    switch (type) {
      case 'phone':
        if (client.phone) window.open(`tel:${client.phone}`, '_blank');
        break;
      case 'email':
        if (client.email) window.open(`mailto:${client.email}`, '_blank');
        break;
      case 'whatsapp':
        if (client.phone) {
          const cleanPhone = client.phone.replace(/\D/g, '');
          const whatsappNumber = cleanPhone.length > 11 ? cleanPhone : `55${cleanPhone}`;
          window.open(`https://wa.me/${whatsappNumber}`, '_blank');
        }
        break;
    }
  }, []);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  if (clientsLoading && !clients.length) {
    return (
      <div className="p-4 md:p-6">
        <ClientsSkeleton />
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao Carregar Clientes"
          description="Não foi possível buscar sua lista de clientes. Por favor, verifique sua conexão e tente novamente."
          action={refetchClients}
          actionLabel="Tentar Novamente"
        />
      </div>
    );
  }

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-4 md:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Clientes</h1>
            <p className="text-[#8a91a1] text-sm font-mono mt-1">Base de clientes e relacionamento.</p>
          </div>
          <Button
            onClick={handleNewClient}
            className="border-0 text-[#06070a] font-bold"
            style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})` }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        <NeonGlass primary={config.primaryHex} className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterActive === 'all' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('all')}
                  className="bg-slate-800 border-slate-700 data-[state=active]:bg-slate-700"
                >
                  Todos
                </Button>
                <Button
                  variant={filterActive === 'active' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('active')}
                   className="bg-slate-800 border-slate-700 data-[state=active]:bg-slate-700"
                >
                  Ativos
                </Button>
                <Button
                  variant={filterActive === 'inactive' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('inactive')}
                   className="bg-slate-800 border-slate-700 data-[state=active]:bg-slate-700"
                >
                  Inativos
                </Button>
              </div>
            </div>
        </NeonGlass>

        {filteredAndSortedClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedClients.map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="bg-[#161923]/60 border-[#23262f] cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col h-full"
                  style={{ ['--hover-border']: config.primaryHex }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${config.primaryHex}66`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
                  onClick={() => handleClientClick(client)}
                >
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-slate-700">
                      <AvatarImage src={client.logo_url} alt={client.name} />
                      <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{client.name}</h3>
                      {client.contact_person && (
                        <p className="text-sm text-slate-400 truncate">{client.contact_person}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full h-8 w-8 flex-shrink-0"
                      onClick={(e) => handleOpenInsights(e, client)}
                      aria-label="Mais detalhes"
                    >
                        <MoreHorizontal className="w-4 h-4"/>
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-0 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                          <Badge
                            variant={client.stats.isActive ? 'default' : 'secondary'}
                            className={client.stats.isActive ? 'bg-green-600/80 text-white' : 'bg-slate-700 text-slate-300'}
                          >
                            {client.stats.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {client.policy_default_payment_model && (
                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                              {client.policy_default_payment_model === 'HORAS_EXTRAS' ? 'H.E.' : 'M&D'}
                            </Badge>
                          )}
                        </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Eventos</p>
                          <p className="font-bold text-white text-lg">{client.stats.totalEvents}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">A Receber</p>
                          <p className="font-bold text-amber-400 text-lg">{formatCurrency(client.stats.pendingRevenue)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {!isMobile && (client.email || client.phone) && (
                      <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-800">
                        {client.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); window.open(`mailto:${client.email}`, '_blank'); }}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 h-9 px-2 group"
                            aria-label="Enviar email"
                          >
                            <Mail className="w-4 h-4 transition-colors group-hover:opacity-100 opacity-70" style={{ color: config.primaryHex }} />
                          </Button>
                        )}
                        {client.phone && (
                          <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); window.open(`tel:${client.phone}`, '_blank'); }}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 h-9 px-2 group"
                            aria-label="Ligar"
                          >
                            <Phone className="w-4 h-4 transition-colors group-hover:opacity-100 opacity-70" style={{ color: config.primaryHex }} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleActionSheetContact(client, 'whatsapp'); }}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 h-9 px-2 group"
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 group-hover:text-green-400 transition-colors" />
                          </Button>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={searchTerm || filterActive !== 'all' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            description={
              searchTerm || filterActive !== 'all'
                ? 'Tente ajustar os filtros ou limpar a busca para encontrar clientes.'
                : 'Adicione seu primeiro cliente para começar a organizar seus projetos e finanças.'
            }
            action={!searchTerm && filterActive === 'all' ? handleNewClient : null}
            actionLabel="Adicionar Primeiro Cliente"
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showClientForm && (
          <ClientForm
            client={editingClient}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowClientForm(false)}
          />
        )}

        {selectedClient && (
          <ClientDetailModal
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />
        )}

        <ClientActionSheet
          client={actionSheetClient}
          stats={actionSheetClient?.stats}
          isOpen={!!actionSheetClient}
          onClose={() => setActionSheetClient(null)}
          onViewDetails={handleActionSheetViewDetails}
          onContact={handleActionSheetContact}
        />

        {insightsClient && (
            <ClientInsightsModal
                client={insightsClient}
                isOpen={!!insightsClient}
                onClose={() => setInsightsClient(null)}
            />
        )}
      </AnimatePresence>
    </NeonPageShell>
  );
}
