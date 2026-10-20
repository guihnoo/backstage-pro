import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useQueryAction } from '@/lib/useQueryAction';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Camera, AlertCircle, Search, Calendar, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useExpenses } from '@/lib/useExpenses';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import appToast from '@/lib/appToast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
// NeonPageShell removido na Entrega 6 All Access
import LiveClockBar from '@/components/home/LiveClockBar';
// NeonGlass removido na Entrega 6 All Access
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConnectivity } from '@/lib/offline/useConnectivity';
import EmptyState from '@/components/layout/EmptyState';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import { Ellipsis } from '@/components/ui/overflowText';
import ExpenseListItem from '@/components/expenses/ExpenseListItem';
import AllAccessDespesas from '@/components/expenses/AllAccessDespesas';

const ExpenseForm = lazy(() => import('@/components/expenses/ExpenseForm'));
const ReceiptAnalyzer = lazy(() => import('@/components/expenses/ReceiptAnalyzer'));

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { todayLocalISO } from '@/components/utils/dateUtils';

const CATEGORY_LABELS = {
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  equipamento: 'Equipamento',
  hospedagem: 'Hospedagem',
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  outros: 'Outros',
};

function MonthGroup({ monthKey, expenses, events, clients, onEdit, onDelete, onMarkReimbursed, formatCurrency, primaryHex: _primaryHex, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    const { isVisible } = useFinancialVisibility();
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
                className="w-full flex items-center justify-between px-1 py-2 group gap-2 min-w-0"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {open ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                    <span className="text-sm font-bold text-slate-300 truncate" title={label}>{label}</span>
                    <span className="text-[11px] text-slate-600 font-mono flex-shrink-0">({expenses.length})</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {reimbursable > 0 && (
                        <span className="text-[11px] font-mono text-amber-400 truncate max-w-[8rem] sm:max-w-none" title={isVisible ? `${formatCurrency(reimbursable)} a reembolsar` : '•••• a reembolsar'}>{isVisible ? formatCurrency(reimbursable) : '••••'} a reimb.</span>
                    )}
                    <span className="text-sm font-bold text-red-300 truncate max-w-[6rem] sm:max-w-none" title={isVisible ? formatCurrency(total) : '••••'}>{isVisible ? formatCurrency(total) : '••••'}</span>
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
                        {expenses.map((expense, idx) => {
                            const ev = events.find(e => e.id === expense.event_id);
                            const client = ev ? (clients || []).find(c => c.id === ev.client_id) : undefined;
                            return (
                            <ExpenseListItem
                                key={expense.id}
                                expense={expense}
                                event={ev}
                                client={client}
                                index={idx}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onMarkReimbursed={onMarkReimbursed}
                            />
                            );
                        })}
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
    <motion.div whileTap={{ scale: 0.98 }} onClick={onClick} className="cursor-pointer min-w-0">
        <div className={`p-4 rounded-xl border transition-all duration-200 min-w-0 overflow-hidden ${active ? 'border-[#ffd400] bg-[#ffd400]/10 shadow-sm' : 'border-[#222222] bg-[#121212] hover:border-[#333333]'}`}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#888888] mb-1.5 truncate">{title}</p>
            <p className={`text-xl font-bold font-mono truncate ${active ? 'text-[#ffd400]' : 'text-white'}`} title={typeof value === 'string' ? value : undefined}>{value}</p>
        </div>
    </motion.div>
);

export default function ExpensesPage() {
    const { expenses, loading: expensesLoading, error: expensesError, refetch: refetchExpenses, update: updateExpense, delete: deleteExpenseById } = useExpenses();
    const { events } = useEvents();
    const { clients } = useClients();
    const { profile } = useAuth();
    const { offline } = useConnectivity();
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
        appToast.success(editingExpense ? "Despesa atualizada!" : "Despesa criada!");
        refetchExpenses({ silent: true });
    }, [editingExpense, refetchExpenses]);

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setShowForm(true);
    };

    const handleMarkReimbursed = async (expense) => {
        try {
            await updateExpense(expense.id, { reimbursed: true });
            appToast.success(`"${expense.title}" marcado como reembolsado!`);
        } catch (err) {
            appToast.error('Erro ao atualizar despesa.');
            console.error(err);
        }
    };

    const handleDelete = (expenseId) => {
        setConfirmDelete(expenseId);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteExpenseById(confirmDelete);
            appToast.success("Despesa excluída com sucesso!");
        } catch (err) {
            appToast.error("Erro ao excluir despesa.");
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

    const refreshExpenses = useCallback(async () => {
        await refetchExpenses({ silent: true });
        appToast.success('Despesas atualizadas');
    }, [refetchExpenses]);

    const { pullDistance, isRefreshing, threshold } = usePullToRefresh(refreshExpenses);

    const allExpenses = useMemo(() => Array.isArray(expenses) ? expenses : [], [expenses]);
    const currentMonthKey = todayLocalISO().slice(0, 7);

    // Eventos que têm pelo menos uma despesa
    const eventsWithExpenses = useMemo(() => {
        const ids = new Set(allExpenses.map(e => e.event_id).filter(Boolean));
        return events.filter(e => ids.has(e.id));
    }, [allExpenses, events]);

    const filteredExpenses = useMemo(() => {
        return allExpenses
            .filter(exp => {
                const searchMatch = searchTerm ? (
                    (exp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    exp.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
                ) : true;
                const categoryMatch = categoryFilter === 'all' ? true : exp.category === categoryFilter;
                const statusMatch = statusFilter === 'all' ? true :
                                    statusFilter === 'this_month' ? (exp.expense_date || exp.date || '').startsWith(currentMonthKey) :
                                    statusFilter === 'reimbursable' ? exp.is_reimbursable && !exp.reimbursed :
                                    statusFilter === 'reimbursed' ? exp.reimbursed : false;
                const eventMatch = eventFilter === 'all' ? true :
                                   eventFilter === 'no-event' ? !exp.event_id :
                                   exp.event_id === eventFilter;
                return searchMatch && categoryMatch && statusMatch && eventMatch;
            })
            .sort((a, b) => new Date(b.expense_date || b.date) - new Date(a.expense_date || a.date));
    }, [allExpenses, searchTerm, categoryFilter, statusFilter, eventFilter, currentMonthKey]);

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
        const thisMonth = allExpenses
            .filter(exp => (exp.expense_date || exp.date || '').startsWith(currentMonthKey))
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        return { total, reimbursable, reimbursed, thisMonth };
    }, [allExpenses, currentMonthKey]);

    const expenseCategories = useMemo(() => {
        const categories = new Set(allExpenses.map(exp => exp.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [allExpenses]);

    const categoryTotals = useMemo(() => {
        const map = {};
        for (const exp of allExpenses) {
            if (!exp.category) continue;
            map[exp.category] = (map[exp.category] || 0) + (exp.amount || 0);
        }
        return map;
    }, [allExpenses]);

    if (expensesLoading && !allExpenses.length) {
        return (
            <div className="min-h-full bg-[#0a0a0a] text-white">
                <ExpensesSkeleton />
            </div>
        );
    }

    const hasCachedExpenses = allExpenses.length > 0;
    const showBlockingError = expensesError && !offline && !hasCachedExpenses;

    if (showBlockingError) {
        return (
            <div className="min-h-full bg-[#0a0a0a] text-white flex items-center justify-center p-4">
                <EmptyState
                    icon={AlertCircle}
                    title="Erro ao carregar despesas"
                    description="Não foi possível buscar as informações de despesas. Tente novamente mais tarde."
                    action={refetchExpenses}
                    actionLabel="Tentar Novamente"
                />
            </div>
        );
    }

    return (
        <>
            <div className="relative min-h-full overflow-x-clip bg-[#0a0a0a] text-white pb-24">
                <PullToRefreshIndicator
                    pullDistance={pullDistance}
                    isRefreshing={isRefreshing}
                    threshold={threshold}
                    primaryHex="#ffd400"
                />
                <div className="p-4 md:p-6 space-y-6 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0">
                    <AllAccessDespesas
                        expenses={allExpenses}
                        events={events}
                        clients={clients}
                        formatCurrency={formatCurrency}
                        isVisible={isVisible}
                        onScanReceipt={handleScan}
                        onNewExpense={() => {
                            setEditingExpense(null);
                            setPrefillFromScan(null);
                            setShowForm(true);
                        }}
                        onEditExpense={(exp) => handleEdit(exp)}
                        onDeleteExpense={(id) => handleDelete(id)}
                    />
                </div>
            </div>

            {showForm && (
                <Suspense fallback={null}>
                    <ExpenseForm
                        open={showForm}
                        onOpenChange={setShowForm}
                        expense={editingExpense}
                        events={events}
                        onSuccess={handleFormSuccess}
                        prefillData={prefillFromScan}
                    />
                </Suspense>
            )}

            <Suspense fallback={null}>
                <ReceiptAnalyzer
                    open={showAnalyzer}
                    onOpenChange={setShowAnalyzer}
                    onExtract={handleAnalyzerExtract}
                />
            </Suspense>

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
