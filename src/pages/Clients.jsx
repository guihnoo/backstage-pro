
import {
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useQueryAction } from '@/lib/useQueryAction';
import { useClients } from '@/lib/useClients';
import { useEvents } from '@/lib/useEvents';
import { useDailyWork } from '@/lib/useDailyWork';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Users,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventStatus, todayLocalISO } from '@/components/utils/dateUtils';
import { calculateEventReceivableAmount } from '@/lib/eventFinance';
import { getClientActivity } from '@/lib/clientActivity';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

// NeonPageShell e NeonGlass removidos na Entrega 5 All Access
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConnectivity } from '@/lib/offline/useConnectivity';

const InactiveClientsPanel = lazy(() => import('@/components/clients/InactiveClientsPanel'));
const ClientForm = lazy(() => import('@/components/clients/ClientForm'));
import EmptyState from '@/components/layout/EmptyState';
import ConfirmDialog from '@/components/layout/ConfirmDialog';

import appToast from '@/lib/appToast';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';

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
        <Card key={i} className="bg-[#161616]/50 border-[#2a2a2a]">
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
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const { offline } = useConnectivity();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [sortBy] = useState('nome');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

      const getEventRevenue = (event) => {
        const workForEvent = clientWork
          .filter(w => w.event_id === event.id);
        return calculateEventReceivableAmount(event, workForEvent);
      };

      const generatedRevenue = clientEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);

      const completedUnpaidEvents = clientEvents.filter(e =>
        getEventStatus(e) === 'completed' && e.payment_status === 'unpaid'
      );
      const pendingRevenue = completedUnpaidEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);

      const completedEvents = clientEvents.filter(e => getEventStatus(e) === 'completed');
      const completedPaid = completedEvents.filter(e => e.payment_status === 'paid').length;
      const paymentPct = completedEvents.length > 0 ? Math.round((completedPaid / completedEvents.length) * 100) : null;
      const paymentScore = paymentPct === null ? null : {
        pct: paymentPct,
        label: paymentPct >= 90 ? 'Excelente' : paymentPct >= 70 ? 'Bom' : paymentPct >= 40 ? 'Regular' : 'Atenção',
        colorClass: paymentPct >= 90 ? 'text-[#ffd400] border-[#ffd400]/30 bg-[#ffd400]/10'
          : paymentPct >= 70 ? 'text-[#ffd400] border-[#ffd400]/30 bg-[#ffd400]/10'
          : paymentPct >= 40 ? 'text-[#ffd400] border-[#ffd400]/30 bg-[#ffd400]/10'
          : 'text-[#ff2e88] border-[#ff2e88]/30 bg-[#ff2e88]/10',
      };

      const activity = getClientActivity(clientEvents);

      const todayStr = todayLocalISO();
      const nextEvent = clientEvents
        .filter(e => e.start_date >= todayStr && e.status !== 'cancelled')
        .sort((a, b) => (a.start_date > b.start_date ? 1 : -1))[0];

      return {
        ...client,
        stats: {
          totalEvents: clientEvents.length,
          generatedRevenue,
          pendingRevenue,
          ...activity,
          nextEventDate: nextEvent?.start_date,
          paymentScore,
          unpaidEvents: completedUnpaidEvents.map(e => ({
            id: e.id,
            title: e.title,
            start_date: e.start_date,
            amount: getEventRevenue(e),
          })),
        }
      };
    });
  }, [clients, events, dailyWork]);

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clientsWithStats;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        (client.name || '').toLowerCase().includes(term) ||
        (client.contact_person && client.contact_person.toLowerCase().includes(term)) ||
        (client.razao_social && client.razao_social.toLowerCase().includes(term)) ||
        (client.email && client.email.toLowerCase().includes(term)) ||
        (client.phone && client.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''))) ||
        (client.city && client.city.toLowerCase().includes(term))
      );
    }

    if (filterActive === 'draft') {
      filtered = filtered.filter((client) => client.profile_complete === false);
    } else if (filterActive === 'pessoa') {
      filtered = filtered.filter((client) => client.client_type === 'pessoa');
    } else if (filterActive === 'empresa') {
      filtered = filtered.filter((client) => !client.client_type || client.client_type === 'empresa');
    } else if (filterActive !== 'all') {
      filtered = filtered.filter(client =>
        filterActive === 'active' ? client.stats.isActive : !client.stats.isActive
      );
    }

    if (sortBy === 'nome') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'pendencia') filtered.sort((a, b) => b.stats.pendingRevenue - a.stats.pendingRevenue);
    else if (sortBy === 'eventos') filtered.sort((a, b) => b.stats.totalEvents - a.stats.totalEvents);
    else if (sortBy === 'recente') filtered.sort((a, b) => {
      const da = a.stats.lastEventDate ? new Date(a.stats.lastEventDate) : new Date(0);
      const db = b.stats.lastEventDate ? new Date(b.stats.lastEventDate) : new Date(0);
      return db - da;
    });

    return filtered;
  }, [clientsWithStats, searchTerm, filterActive, sortBy]);

  // Uma tela so de detalhe (celular e computador): o card abre a pagina do cliente.
  const handleClientClick = useCallback((client) => {
    hardNavigate(`/client-detail?id=${client.id}`);
  }, []);

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
    refetchClients({ silent: true });
  }, [refetchClients]);

  const refreshClientsList = useCallback(async () => {
    await refetchClients({ silent: true });
    appToast.success('Clientes atualizados');
  }, [refetchClients]);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(refreshClientsList);

  const handleDeleteClient = useCallback((clientId) => {
    setConfirmDeleteId(clientId);
  }, []);

  const handleConfirmDeleteClient = useCallback(async () => {
    try {
      await deleteClient(confirmDeleteId);
      appToast.success("Cliente excluído com sucesso.");
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      appToast.error("Não foi possível excluir o cliente.", {
        description: "Verifique se ele não possui eventos associados e tente novamente."
      });
    } finally {
      setConfirmDeleteId(null);
    }
  }, [deleteClient, confirmDeleteId]);

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

  const hasCachedClients = (clients?.length ?? 0) > 0;
  const showBlockingError = clientsError && !offline && !hasCachedClients;

  if (showBlockingError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <EmptyState
          icon={AlertCircle}
          title="Não deu para carregar os clientes"
          description="Confira a internet. Seus dados não foram perdidos."
          action={() => refetchClients()}
          actionLabel="Tentar de novo"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-x-clip bg-[#0a0a0a] text-white pb-24">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        primaryHex="#ffd400"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-4 md:p-6 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0"
      >
        <div className="flex justify-between items-end">
          <div>
            <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">
              QUEM TE CONTRATA
            </div>
            <h1 className="font-poster text-[38px] sm:text-[40px] text-white leading-none tracking-wide uppercase mt-0.5">
              CLIENTES
            </h1>
          </div>
          <Button
            onClick={handleNewClient}
            aria-label="Novo cliente"
            className="h-10 px-4 rounded-full border-0 bg-[#ffd400] text-[#0a0a0a] font-sans text-[13px] font-extrabold hover:bg-[#ffe033] transition-transform active:scale-95 shadow-sm"
          >
            + Novo
          </Button>
        </div>

        {clientsError && hasCachedClients && (
          <Alert className="border-[#ff2e88]/40 bg-[#ff2e88]/10">
            <AlertCircle className="w-4 h-4 text-[#ff2e88]" />
            <AlertDescription className="text-[#ff2e88] text-sm">
              <strong>Erro ao sincronizar:</strong> {clientsError} — exibindo clientes em cache.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2.5">
          <div className="h-11 rounded-full bg-[#161616] border border-[#333333] flex items-center px-4 gap-2.5 shadow-sm">
            <Search className="w-4 h-4 text-[#8a8a8a] flex-shrink-0" />
            <input
              placeholder="Buscar cliente ou contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 text-white text-sm placeholder-[#8a8a8a] focus:outline-none flex-1 min-w-0"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Ativos' },
              { id: 'inactive', label: 'Inativos' },
              { id: 'draft', label: 'Rascunhos' },
              { id: 'empresa', label: 'Empresas' },
              { id: 'pessoa', label: 'Pessoas' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterActive(filterActive === f.id && f.id !== 'all' ? 'all' : f.id)}
                aria-pressed={filterActive === f.id}
                className={`h-8 px-3.5 rounded-full font-sans text-xs font-extrabold transition-all border ${
                  filterActive === f.id
                    ? 'bg-[#ffd400] text-[#0a0a0a] border-[#ffd400] shadow-sm'
                    : 'bg-[#161616] border-[#2a2a2a] text-[#888888] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filterActive === 'all' && (
          <Suspense fallback={<Skeleton className="h-24 w-full rounded-xl" />}>
            <InactiveClientsPanel clientsWithStats={clientsWithStats} />
          </Suspense>
        )}

        {filteredAndSortedClients.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredAndSortedClients.map((client) => {
              const pending = client.stats?.pendingRevenue || 0;
              const revenue = client.stats?.totalRevenue || 0;
              return (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  className="rounded-2xl bg-[#161616] border border-[#222222] hover:border-[#383838] p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  {client.logo_url ? (
                    <div className="w-11 h-11 rounded-xl bg-white overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
                      <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#ffd400] text-[#0a0a0a] font-poster text-[18px] flex items-center justify-center flex-shrink-0">
                      {getInitials(client.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-extrabold text-white truncate">{client.name}</div>
                    <div className="text-xs text-[#a8a8a8] truncate mt-0.5">
                      {client.contact_person || 'Sem contato'} · {client.stats?.totalEvents || 0} shows
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-poster text-[18px] text-white">
                      {isVisible ? formatCurrency(revenue) : '•••••'}
                    </div>
                    <div
                      className={`font-tag text-[10px] font-bold uppercase ${
                        pending > 0 ? 'text-[#ff2e88]' : 'text-[#ffd400]'
                      }`}
                    >
                      {pending > 0 ? `${formatCurrency(pending)} pendente` : 'Paga em dia'}
                    </div>
                  </div>
                  {/* Menu ⋯: Editar e Excluir direto da lista (voltou; tinha sumido na reescrita) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Ações do cliente ${client.name}`}
                        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#a8a8a8] hover:text-white hover:bg-[#222222]"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-[14px] border border-[#2a2a2a] bg-[#161616] text-white"
                    >
                      <DropdownMenuItem onSelect={() => handleEditClient(client)} className="font-extrabold">
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDeleteClient(client.id)} className="font-extrabold text-[#ff2e88]">
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
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

      {showClientForm && (
        <Suspense fallback={null}>
          <ClientForm
            client={editingClient}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowClientForm(false)}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Excluir cliente?"
        description="Esta ação não pode ser desfeita. Verifique se o cliente não possui eventos associados."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDeleteClient}
      />
    </div>
  );
}
