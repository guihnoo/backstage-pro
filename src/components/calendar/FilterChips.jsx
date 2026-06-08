import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter, Users, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const STATUS_MAP = {
  'Agendado': 'scheduled',
  'Confirmado': 'confirmed', 
  'Em andamento': 'in_progress',
  'Pendente': 'pending',
  'Cancelado': 'cancelled',
  'Finalizado': 'completed'
};

export default function FilterChips({ 
  filters, 
  events = [], 
  clients = [], 
  onFilterChange 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Top 5 clientes com mais eventos
  const topClients = useMemo(() => {
    const clientCounts = {};
    events.forEach(event => {
      if (event?.client_id) {
        clientCounts[event.client_id] = (clientCounts[event.client_id] || 0) + 1;
      }
    });

    return clients
      .map(client => ({
        ...client,
        count: clientCounts[client.id] || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events, clients]);

  const toggleClientFilter = (clientId) => {
    const newClients = filters.clients?.includes(clientId)
      ? filters.clients.filter(id => id !== clientId)
      : [...(filters.clients || []), clientId];
    onFilterChange({ ...filters, clients: newClients });
  };

  const toggleStatusFilter = (statusKey) => {
    const newStatus = filters.status?.includes(statusKey)
      ? filters.status.filter(s => s !== statusKey)
      : [...(filters.status || []), statusKey];
    onFilterChange({ ...filters, status: newStatus });
  };

  const setPaidFilter = (paidValue) => {
    onFilterChange({ ...filters, paid: paidValue });
  };

  const clearAllFilters = () => {
    onFilterChange({ clients: [], status: [], paid: 'all' });
  };

  const hasActiveFilters = filters.clients?.length > 0 || 
                          filters.status?.length > 0 || 
                          filters.paid !== 'all';

  const activeFiltersCount = (filters.clients?.length || 0) + 
                            (filters.status?.length || 0) + 
                            (filters.paid !== 'all' ? 1 : 0);

  return (
    <div>
      {/* Botão Toggle Discreto */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
        {hasActiveFilters && (
          <Badge 
            variant="secondary" 
            className="ml-2 px-1.5 py-0.5 text-xs bg-cyan-500 text-white min-w-[1.2rem] h-5 flex items-center justify-center"
          >
            {activeFiltersCount}
          </Badge>
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </Button>

      {/* Painel de Filtros Expansível */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-3"
          >
            <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  
                  {/* Header com Clear All */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Filtrar por:</span>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Limpar tudo
                      </Button>
                    )}
                  </div>

                  {/* Grupo Cliente */}
                  {topClients.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-slate-400">Cliente</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {topClients.map(client => (
                          <motion.div key={client.id} whileHover={{ scale: 1.05 }}>
                            <Badge
                              variant={filters.clients?.includes(client.id) ? "default" : "outline"}
                              className={`cursor-pointer text-xs ${
                                filters.clients?.includes(client.id)
                                  ? 'bg-cyan-500 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                              onClick={() => toggleClientFilter(client.id)}
                            >
                              {client.name} ({client.count})
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grupo Status */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-slate-400">Status</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(STATUS_MAP).map(([label, statusKey]) => (
                        <motion.div key={statusKey} whileHover={{ scale: 1.05 }}>
                          <Badge
                            variant={filters.status?.includes(statusKey) ? "default" : "outline"}
                            className={`cursor-pointer text-xs ${
                              filters.status?.includes(statusKey)
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                            onClick={() => toggleStatusFilter(statusKey)}
                          >
                            {label}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Grupo Pagamento */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-400">Pagamento</span>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { value: 'all', label: 'Todos' },
                        { value: 'pending', label: 'Pendentes' },
                        { value: 'paid', label: 'Pagos' }
                      ].map(option => (
                        <motion.div key={option.value} whileHover={{ scale: 1.05 }}>
                          <Badge
                            variant={filters.paid === option.value ? "default" : "outline"}
                            className={`cursor-pointer text-xs ${
                              filters.paid === option.value
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                            onClick={() => setPaidFilter(option.value)}
                          >
                            {option.label}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}