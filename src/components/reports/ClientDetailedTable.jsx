import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  ExternalLink,
  Star,
} from 'lucide-react';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getEventStatus } from '../utils/dateUtils';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

export default function ClientDetailedTable({ data, onClientClick }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('generatedRevenue');
  const [sortDirection, setSortDirection] = useState('desc');

  const clientData = useMemo(() => {
    const { events = [], work = [], clients = [], expenses = [] } = data;

    if (!clients.length) return [];
    
    // Agrega dados por cliente
    const clientStats = clients.map(client => {
        const clientEvents = events.filter(e => e.client_id === client.id);
        const clientEventIds = new Set(clientEvents.map(e => e.id));
        
        const clientWork = work.filter(w => clientEventIds.has(w.event_id));
        const clientExpenses = expenses.filter(e => clientEventIds.has(e.event_id));
        const paidEvents = clientEvents.filter(e => e.payment_status === 'paid' && e.paid_amount);

        // Usar getEventStatus para calcular os eventos corretos
        const completedEvents = clientEvents.filter(e => getEventStatus(e) === 'completed');
        const scheduledEvents = clientEvents.filter(e => getEventStatus(e) === 'scheduled');
        const inProgressEvents = clientEvents.filter(e => getEventStatus(e) === 'in_progress');

        const getEventRevenue = (event) => {
          const fromWork = clientWork
            .filter(w => w.event_id === event.id)
            .reduce((sum, w) => sum + (w.daily_cache || 0), 0);
          return fromWork > 0 ? fromWork : getEventCacheAmount(event);
        };

        const generatedRevenue = clientEvents.reduce((sum, e) => sum + getEventRevenue(e), 0);
        const receivedRevenue = paidEvents.reduce((sum, e) => sum + (e.paid_amount || getEventRevenue(e)), 0);
        const pendingRevenue = completedEvents
            .filter(e => e.payment_status === 'unpaid')
            .reduce((sum, e) => sum + getEventRevenue(e), 0);
        
        const totalHours = clientWork.reduce((sum, w) => sum + (w.total_hours || 0), 0);
        const totalExpenses = clientExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const revenuePerHour = totalHours > 0 ? generatedRevenue / totalHours : 0;
        const profitMargin = generatedRevenue > 0 ? ((generatedRevenue - totalExpenses) / generatedRevenue) * 100 : 0;

        // Último evento (mais recente)
        const lastEvent = clientEvents.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];

        // Avaliação média
        const ratedEvents = clientEvents.filter(e => e.client_rating != null);
        const avgRating = ratedEvents.length > 0
          ? ratedEvents.reduce((s, e) => s + e.client_rating, 0) / ratedEvents.length
          : null;

        return {
            id: client.id,
            name: client.name,
            contact_person: client.contact_person || '-',
            email: client.email || '-',
            phone: client.phone || '-',
            logo_url: client.logo_url,
            eventCount: clientEvents.length,
            completedEventsCount: completedEvents.length,
            scheduledEventsCount: scheduledEvents.length,
            inProgressEventsCount: inProgressEvents.length,
            generatedRevenue,
            receivedRevenue,
            pendingRevenue,
            totalHours,
            totalExpenses,
            revenuePerHour,
            profitMargin,
            avgRating,
            lastEventDate: lastEvent?.start_date || null,
            lastEventTitle: lastEvent?.title || 'Nenhum evento'
        };
    }).filter(client => {
      // Filtro de busca aprimorado
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          client.name.toLowerCase().includes(term) ||
          client.contact_person.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.lastEventTitle.toLowerCase().includes(term)
        );
      }
      return true;
    });

    // Ordenação
    clientStats.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return clientStats;
  }, [data, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1" style={{ color: primaryHex }} />
      : <ArrowDown className="w-4 h-4 ml-1" style={{ color: primaryHex }} />;
  };

  const getPerformanceColor = (value, type) => {
    if (type === 'profitMargin') {
      if (value >= 70) return 'text-green-400';
      if (value >= 50) return 'text-yellow-400';
      return 'text-red-400';
    }
    return 'text-white';
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-blue-300 font-display flex items-center gap-2">
            <Users className="w-5 h-5" />
            Análise Detalhada de Clientes ({clientData.length})
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar cliente, contato, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-300 w-64">Cliente</th>
                  <th className="text-center p-3 font-medium text-slate-300">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('eventCount')} className="text-slate-300 hover:text-white p-1 h-auto font-medium flex items-center">
                      Eventos <SortIcon field="eventCount" />
                    </Button>
                  </th>
                  <th className="text-right p-3 font-medium text-slate-300">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('generatedRevenue')} className="text-slate-300 hover:text-white p-1 h-auto font-medium flex items-center">
                      Faturado <SortIcon field="generatedRevenue" />
                    </Button>
                  </th>
                  <th className="text-right p-3 font-medium text-slate-300">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('receivedRevenue')} className="text-slate-300 hover:text-white p-1 h-auto font-medium flex items-center">
                      Recebido <SortIcon field="receivedRevenue" />
                    </Button>
                  </th>
                  <th className="text-center p-3 font-medium text-slate-300">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('totalHours')} className="text-slate-300 hover:text-white p-1 h-auto font-medium flex items-center">
                      Horas <SortIcon field="totalHours" />
                    </Button>
                  </th>
                  <th className="text-right p-3 font-medium text-slate-300">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('profitMargin')} className="text-slate-300 hover:text-white p-1 h-auto font-medium flex items-center">
                      Margem <SortIcon field="profitMargin" />
                    </Button>
                  </th>
                  <th className="text-center p-3 font-medium text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientData.map((client) => (
                  <tr 
                    key={client.id} 
                    className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-slate-700">
                          <AvatarImage src={client.logo_url} />
                          <AvatarFallback className="bg-slate-800 text-slate-200">
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onClientClick && onClientClick(client.id)}
                            className="font-medium text-white truncate transition-colors flex items-center gap-1 group text-left bp-hover-primary"
                          >
                            {client.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          </button>
                          <p className="text-sm text-slate-400 truncate">{client.contact_person}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {client.completedEventsCount > 0 && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-400/50 text-xs px-1 py-0">
                                {client.completedEventsCount} concluídos
                              </Badge>
                            )}
                            {client.scheduledEventsCount > 0 && (
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs px-1 py-0">
                                {client.scheduledEventsCount} agendados
                              </Badge>
                            )}
                            {client.avgRating != null && (
                              <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-medium">
                                <Star className="w-3 h-3" fill="#fbbf24" stroke="#fbbf24" />
                                {client.avgRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bp-chip-badge-active px-3 py-1 rounded-full text-xs font-medium">
                        {client.eventCount}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <p className="font-bold" style={{ color: primaryHex }}>{isVisible ? formatCurrency(client.generatedRevenue) : '•••••'}</p>
                      {client.pendingRevenue > 0 && (
                        <p className="text-xs text-yellow-400">+{isVisible ? formatCurrency(client.pendingRevenue) : '•••'} pendente</p>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <p className="font-bold text-green-300">{isVisible ? formatCurrency(client.receivedRevenue) : '•••••'}</p>
                      <p className="text-xs text-slate-500">
                        {client.receivedRevenue > 0 && client.generatedRevenue > 0 
                          ? `${((client.receivedRevenue / client.generatedRevenue) * 100).toFixed(0)}% recebido`
                          : 'Sem recebimentos'
                        }
                      </p>
                    </td>
                    <td className="p-3 text-center">
                      <p className="text-white font-medium">{client.totalHours.toFixed(1)}h</p>
                      <p className="text-xs text-slate-400">
                        {isVisible ? formatCurrency(client.revenuePerHour) : '•••'}/h
                      </p>
                    </td>
                    <td className="p-3 text-right">
                      <p className={`font-medium ${getPerformanceColor(client.profitMargin, 'profitMargin')}`}>
                        {client.profitMargin.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">lucro</p>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onClientClick && onClientClick(client.id)}
                          className="bp-hover-primary h-8 px-2"
                          style={{ color: primaryHex }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clientData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-lg font-medium text-slate-300 mb-2">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente no período'}
                </p>
                <p className="text-slate-400">
                  {searchTerm ? 'Tente ajustar os termos de busca' : 'Não há clientes com eventos no período selecionado'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}