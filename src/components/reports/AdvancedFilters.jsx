
import {
  useState
} from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Filter,
  Calendar as CalendarIcon,
  RotateCcw,
  Users,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventStatusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'scheduled', label: 'Agendados' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Finalizados' },
  { value: 'archived', label: 'Arquivados' }
];

const paymentStatusOptions = [
  { value: 'all', label: 'Todos os Pagamentos' },
  { value: 'paid', label: 'Pagos' },
  { value: 'unpaid', label: 'Pendentes' },
  { value: 'overdue', label: 'Atrasados' }
];

const expenseCategoryOptions = [
  { value: 'all', label: 'Todas as Categorias' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'outros', label: 'Outros' }
];

export default function AdvancedFilters({ 
  onApplyFilters,
  onResetFilters,
  clients = [],
  loading
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [internalFilters, setInternalFilters] = useState({
    dateRange: { from: null, to: null },
    client_id: 'all',
    event_status: 'all',
    payment_status: 'all',
    expense_category: 'all',
    min_value: '',
    max_value: '',
    has_expenses: 'all',
    has_overtime: 'all'
  });

  const updateFilter = (key, value) => {
    setInternalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(internalFilters);
  };
  
  const handleReset = () => {
    const defaultValues = {
      dateRange: { from: null, to: null },
      client_id: 'all',
      event_status: 'all',
      payment_status: 'all',
      expense_category: 'all',
      min_value: '',
      max_value: '',
      has_expenses: 'all',
      has_overtime: 'all'
    };
    setInternalFilters(defaultValues);
    onApplyFilters(defaultValues); // Also apply the reset state to the parent
    if (onResetFilters) onResetFilters(); // Call original reset if exists
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (internalFilters.dateRange?.from && internalFilters.dateRange?.to) count++;
    if (internalFilters.client_id !== 'all') count++;
    if (internalFilters.event_status !== 'all') count++;
    if (internalFilters.payment_status !== 'all') count++;
    if (internalFilters.expense_category !== 'all') count++;
    if (internalFilters.min_value) count++;
    if (internalFilters.max_value) count++;
    if (internalFilters.has_expenses !== 'all') count++;
    if (internalFilters.has_overtime !== 'all') count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-400" />
            Filtros Avançados
            {activeCount > 0 && (
              <Badge className="bg-cyan-400/20 text-cyan-300 border-cyan-400/50 ml-2">
                {activeCount} ativo{activeCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleReset} className="text-slate-300">
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleApply}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-300"
            >
              {isExpanded ? 'Minimizar' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros Básicos - Sempre Visíveis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Período do Evento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-slate-800 border-slate-700 hover:bg-slate-700">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {internalFilters.dateRange?.from ? (
                    internalFilters.dateRange.to ? (
                      <>
                        {format(internalFilters.dateRange.from, "dd MMM", { locale: ptBR })} -{" "}
                        {format(internalFilters.dateRange.to, "dd MMM", { locale: ptBR })}
                      </>
                    ) : (
                      format(internalFilters.dateRange.from, "dd MMM yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecione um período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={internalFilters.dateRange?.from}
                  selected={internalFilters.dateRange}
                  onSelect={(range) => updateFilter('dateRange', range)}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Cliente
            </Label>
            <Select value={internalFilters.client_id} onValueChange={(value) => updateFilter('client_id', value)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status do Evento */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Status do Evento
            </Label>
            <Select value={internalFilters.event_status} onValueChange={(value) => updateFilter('event_status', value)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Status do evento" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {eventStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Avançados - Expansíveis */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status de Pagamento */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Status de Pagamento</Label>
                <Select value={internalFilters.payment_status} onValueChange={(value) => updateFilter('payment_status', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {paymentStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria de Despesa */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Categoria de Despesa</Label>
                <Select value={internalFilters.expense_category} onValueChange={(value) => updateFilter('expense_category', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {expenseCategoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Com Despesas */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Com Despesas</Label>
                <Select value={internalFilters.has_expenses} onValueChange={(value) => updateFilter('has_expenses', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Apenas com despesas</SelectItem>
                    <SelectItem value="no">Apenas sem despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Com Horas Extras */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Com Horas Extras</Label>
                <Select value={internalFilters.has_overtime} onValueChange={(value) => updateFilter('has_overtime', value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Apenas com horas extras</SelectItem>
                    <SelectItem value="no">Apenas sem horas extras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros de Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={internalFilters.min_value}
                  onChange={(e) => updateFilter('min_value', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="∞"
                  value={internalFilters.max_value}
                  onChange={(e) => updateFilter('max_value', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
