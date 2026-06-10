import { useState, useMemo, useCallback } from 'react';
import { useQueryAction } from '@/lib/useQueryAction';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Camera, AlertCircle, Search, Calendar, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useExpenses } from '@/lib/useExpenses';
import { useEvents } from '@/lib/useEvents';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';

const CATEGORY_LABELS = {
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  equipamento: 'Equipamento',
  hospedagem: 'Hospedagem',
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  outros: 'Outros',
};
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseListItem from '@/components/expenses/ExpenseListItem';
import ReceiptAnalyzer from '@/components/expenses/ReceiptAnalyzer';
import EmptyState from '@/components/layout/EmptyState';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';

function MonthGroup({ monthKey, expenses, events, onEdit, onDelete, onMarkReimbursed, formatCurrency, primaryHex }) {
    const [open, setOpen] = useState(true);
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const reimbursable = expenses.filter(e => e.is_reimbursable && !e.reimbursed).reduce((s, e) => s + (e.amount || 0), 0);

    let label = monthKey;
    if (monthKey !== 'sem-data') {
        try {
            label = format(parseISO(monthKey + '-01'), "MMMM 'de' yyyy", { locale: ptBR });
            label = label.charAt(0).toUpperCase() + label.slice(1);
        } catch { /* mantém original */ }
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-1 py-2 group"
            >
                <div className="flex items-center gap-2">
                    {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    <span className="text-sm font-bold text-slate-300">{label}</span>
                    <span className="text-[11px] text-slate-600 font-mono">({expenses.length})</span>
                </div>
                <div className="flex items-center gap-3">
                    {reimbursable > 0 && (
                        <span className="text-[11px] font-mono text-amber-400">{formatCurrency(reimbursable)} a reimb.</span>
                    )}
                    <span className="text-sm font-bold text-red-300">{formatCurrency(total)}</span>
                </div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        {expenses.map(expense => (
                            <ExpenseListItem
                                key={expense.id}
                                expense={expense}
                                event={events.find(e => e.id === expense.event_id)}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onMarkReimbursed={onMarkReimbursed}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ExpensesSkeleton = () => (
    <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
        </div>
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
    </div>
);

const StatCard = ({ title, value, onClick, active, primaryHex, accentHex }) => (
    <motion.div whileTap={{ scale: 0.98 }} onClick={onClick} className="cursor-pointer">
        <NeonGlass primary={primaryHex} accent={accentHex} glow={active} className={`p-4 transition-transform duration-300 ${active ? 'scale-[1.02]' : ''}`}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7c8494] mb-2">{title}</p>
            <p className="text-2xl font-extrabold text-white" style={active ? { color: accentHex, textShadow: `0 0 16px ${primaryHex}55` } : undefined}>{value}</p>
        </NeonGlass>
    </motion.div>
);

export default function ExpensesPage() {
    const { expenses, loading: expensesLoading, error: expensesError, refetch: refetchExpenses, update: updateExpense, delete: deleteExpenseById } = useExpenses();
    const { events } = useEvents();
    const { profile } = useAuth();
    const config = getCategoryConfig(profile?.category || 'lighting');
    const { isVisible, formatCurrency } = useFinancialVisibility();

    const [showForm, setShowForm] = useState(false);
    const [showAnalyzer, setShowAnalyzer] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [prefillFromScan, setPrefillFromScan] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [eventFilter, setEventFilter] = useState("all");
    const [confirmDelete, setConfirmDelete] = useState(null);

    useQueryAction('new', useCallback(() => {
        setShowForm(true);
        setEditingExpense(null);
    }, []));

    const handleFormSuccess = useCallback(() => {
        setShowForm(false);
        setEditingExpense(null);
        toast.success(editingExpense ? "Despesa atualizada!" : "Despesa criada!");
        refetchExpenses();
    }, [editingExpense, refetchExpenses]);

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setShowForm(true);
    };

    const handleMarkReimbursed = async (expense) => {
        try {
            await updateExpense(expense.id, { reimbursed: true });
            toast.success(`"${expense.title}" marcado como reembolsado!`);
        } catch (err) {
            toast.error('Erro ao atualizar despesa.');
            console.error(err);
        }
    };

    const handleDelete = (expenseId) => {
        setConfirmDelete(expenseId);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteExpenseById(confirmDelete);
            toast.success("Despesa excluída com sucesso!");
        } catch (err) {
            toast.error("Erro ao excluir despesa.");
            console.error(err);
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleScan = () => {
        setShowAnalyzer(true);
    };

    const handleAnalyzerExtract = (extractedData) => {
        setPrefillFromScan(extractedData);
        setShowAnalyzer(false);
        setShowForm(true);
    };

    const allExpenses = useMemo(() => Array.isArray(expenses) ? expenses : [], [expenses]);

    // Eventos que têm pelo menos uma despesa
    const eventsWithExpenses = useMemo(() => {
        const ids = new Set(allExpenses.map(e => e.event_id).filter(Boolean));
        return events.filter(e => ids.has(e.id));
    }, [allExpenses, events]);

    const filteredExpenses = useMemo(() => {
        return allExpenses
            .filter(exp => {
                const searchMatch = searchTerm ? (
                    exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    exp.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
                ) : true;
                const categoryMatch = categoryFilter === 'all' ? true : exp.category === categoryFilter;
                const statusMatch = statusFilter === 'all' ? true :
                                    statusFilter === 'reimbursable' ? exp.is_reimbursable && !exp.reimbursed :
                                    statusFilter === 'reimbursed' ? exp.reimbursed : false;
                const eventMatch = eventFilter === 'all' ? true :
                                   eventFilter === 'no-event' ? !exp.event_id :
                                   exp.event_id === eventFilter;
                return searchMatch && categoryMatch && statusMatch && eventMatch;
            })
            .sort((a, b) => new Date(b.expense_date || b.date) - new Date(a.expense_date || a.date));
    }, [allExpenses, searchTerm, categoryFilter, statusFilter, eventFilter]);

    // Agrupa despesas filtradas por mês
    const groupedByMonth = useMemo(() => {
        const groups = {};
        for (const exp of filteredExpenses) {
            const dateStr = exp.expense_date || exp.date;
            const key = dateStr ? dateStr.substring(0, 7) : 'sem-data'; // YYYY-MM
            if (!groups[key]) groups[key] = [];
            groups[key].push(exp);
        }
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [filteredExpenses]);

    const expenseStats = useMemo(() => {
        const total = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const reimbursable = allExpenses.filter(exp => exp.is_reimbursable && !exp.reimbursed).reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const reimbursed = allExpenses.filter(exp => exp.reimbursed).reduce((sum, exp) => sum + (exp.amount || 0), 0);
        return { total, reimbursable, reimbursed };
    }, [allExpenses]);

    const expenseCategories = useMemo(() => {
        const categories = new Set(allExpenses.map(exp => exp.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [allExpenses]);

    if (expensesLoading && !allExpenses.length) {
        return (
            <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full">
                <ExpensesSkeleton />
            </NeonPageShell>
        );
    }

    if (expensesError) {
        return (
            <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full flex items-center justify-center p-4">
                <EmptyState
                    icon={AlertCircle}
                    title="Erro ao carregar despesas"
                    description="Não foi possível buscar as informações de despesas. Tente novamente mais tarde."
                />
            </NeonPageShell>
        );
    }

    return (
        <>
            <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-24">
                <div className="p-4 md:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Gerenciador de Despesas</h1>
                            <p className="text-[#8a91a1] text-sm font-mono mt-1">Controle gastos e reembolsos do backstage.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="bg-[#161923]/80 border-[#23262f] hover:bg-[#1a1d27] text-[#cfd4de]" onClick={handleScan}>
                                <Camera className="w-4 h-4 mr-2" />
                                Digitalizar Recibo
                            </Button>
                            <Button
                                className="border-0 text-[#06070a] font-bold"
                                style={{ background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`, boxShadow: `0 0 20px ${config.primaryHex}44` }}
                                onClick={() => { setEditingExpense(null); setPrefillFromScan(null); setShowForm(true); }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Despesa
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard primaryHex={config.primaryHex} accentHex={config.accentHex} title="Gasto Total" value={isVisible ? formatCurrency(expenseStats.total) : '•••••'} onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
                        <StatCard primaryHex={config.primaryHex} accentHex={config.accentHex} title="A Reembolsar" value={isVisible ? formatCurrency(expenseStats.reimbursable) : '•••••'} onClick={() => setStatusFilter('reimbursable')} active={statusFilter === 'reimbursable'} />
                        <StatCard primaryHex={config.primaryHex} accentHex={config.accentHex} title="Reembolsado" value={isVisible ? formatCurrency(expenseStats.reimbursed) : '•••••'} onClick={() => setStatusFilter('reimbursed')} active={statusFilter === 'reimbursed'} />
                    </div>

                    <NeonGlass primary={config.primaryHex} className="p-4 space-y-3">
                      {/* Busca */}
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                              placeholder="Buscar por título, descrição ou notas..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="bg-[#080a10]/80 border-[#23262f] pl-10 font-mono text-sm"
                          />
                      </div>

                      {/* Filtro por evento */}
                      {eventsWithExpenses.length > 0 && (
                          <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <Select value={eventFilter} onValueChange={setEventFilter}>
                                  <SelectTrigger className="h-8 text-xs bg-[#080a10]/80 border-[#23262f] text-slate-300 flex-1">
                                      <SelectValue placeholder="Filtrar por evento…" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                      <SelectItem value="all">Todos os eventos</SelectItem>
                                      <SelectItem value="no-event">Sem evento vinculado</SelectItem>
                                      {eventsWithExpenses.map(ev => (
                                          <SelectItem key={ev.id} value={ev.id}>
                                              {ev.title}
                                              {ev.start_date ? ` · ${format(parseISO(ev.start_date), 'dd/MM/yy', { locale: ptBR })}` : ''}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                      )}

                      {/* Filtro por categoria */}
                      {expenseCategories.length > 0 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                              <Tag className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <button
                                  type="button"
                                  onClick={() => setCategoryFilter('all')}
                                  className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${categoryFilter === 'all' ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700/50 bg-slate-800/40 text-slate-500 hover:text-slate-300'}`}
                              >
                                  Todas
                              </button>
                              {expenseCategories.map(cat => (
                                  <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
                                      className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${categoryFilter === cat ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700/50 bg-slate-800/40 text-slate-500 hover:text-slate-300'}`}
                                  >
                                      {CATEGORY_LABELS[cat] || cat}
                                  </button>
                              ))}
                          </div>
                      )}
                    </NeonGlass>

                    {/* Resumo do filtro */}
                    {filteredExpenses.length > 0 && (
                        <div className="flex items-center justify-between px-1 py-0.5">
                            <span className="text-[11px] font-mono text-slate-500">
                                {filteredExpenses.length} despesa{filteredExpenses.length !== 1 ? 's' : ''}
                                {categoryFilter !== 'all' && <span className="text-slate-600"> · {CATEGORY_LABELS[categoryFilter] || categoryFilter}</span>}
                            </span>
                            <span className="text-[11px] font-mono font-bold" style={{ color: config.accentHex }}>
                                {isVisible ? formatCurrency(filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0)) : '•••••'}
                            </span>
                        </div>
                    )}

                    <div className="space-y-5">
                        {groupedByMonth.length > 0 ? (
                            groupedByMonth.map(([monthKey, monthExpenses]) => (
                                <MonthGroup
                                    key={monthKey}
                                    monthKey={monthKey}
                                    expenses={monthExpenses}
                                    events={events}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onMarkReimbursed={handleMarkReimbursed}
                                    formatCurrency={formatCurrency}
                                    primaryHex={config.primaryHex}
                                />
                            ))
                        ) : (
                            <EmptyState
                                icon={Search}
                                title="Nenhuma despesa encontrada"
                                description="Tente ajustar seus filtros ou adicione uma nova despesa."
                            />
                        )}
                    </div>
                </div>
            </NeonPageShell>

            {showForm && (
                <ExpenseForm
                    open={showForm}
                    onOpenChange={setShowForm}
                    expense={editingExpense}
                    events={events}
                    onSuccess={handleFormSuccess}
                    prefillData={prefillFromScan}
                />
            )}

            <ReceiptAnalyzer
                open={showAnalyzer}
                onOpenChange={setShowAnalyzer}
                onExtract={handleAnalyzerExtract}
            />

            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={(open) => !open && setConfirmDelete(null)}
                title="Excluir despesa?"
                description="Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                destructive
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}
