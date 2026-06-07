
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryAction } from '@/lib/useQueryAction';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Camera, AlertCircle, Search } from 'lucide-react';
import { useExpenses } from '@/lib/useExpenses';
import { useEvents } from '@/lib/useEvents';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';

import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseListItem from '@/components/expenses/ExpenseListItem';
import ReceiptAnalyzer from '@/components/expenses/ReceiptAnalyzer';
import EmptyState from '@/components/layout/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

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
    const { expenses, loading: expensesLoading, error: expensesError, refetch: refetchExpenses, delete: deleteExpenseById } = useExpenses();
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

    const handleDelete = async (expenseId) => {
        if (window.confirm("Tem certeza que deseja excluir esta despesa?")) {
            try {
                await deleteExpenseById(expenseId);
                toast.success("Despesa excluída com sucesso!");
            } catch (err) {
                toast.error("Erro ao excluir despesa.");
                console.error(err);
            }
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

    const filteredExpenses = useMemo(() => {
        return allExpenses
            .filter(exp => {
                const searchMatch = searchTerm ? exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || exp.notes?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
                const categoryMatch = categoryFilter === 'all' ? true : exp.category === categoryFilter;
                const statusMatch = statusFilter === 'all' ? true :
                                    statusFilter === 'reimbursable' ? exp.is_reimbursable && !exp.reimbursed :
                                    statusFilter === 'reimbursed' ? exp.reimbursed : false;
                return searchMatch && categoryMatch && statusMatch;
            })
            .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
    }, [allExpenses, searchTerm, categoryFilter, statusFilter]);

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

                    <NeonGlass primary={config.primaryHex} className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por título ou notas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-[#080a10]/80 border-[#23262f] pl-10 font-mono text-sm"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[200px] bg-[#080a10]/80 border-[#23262f]">
                                <SelectValue placeholder="Filtrar por categoria" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                {expenseCategories.map(cat => (
                                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    </NeonGlass>

                    <div className="space-y-3">
                        {filteredExpenses.length > 0 ? (
                            filteredExpenses.map(expense => (
                                <ExpenseListItem
                                    key={expense.id}
                                    expense={expense}
                                    event={events.find(e => e.id === expense.event_id)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
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
        </>
    );
}
