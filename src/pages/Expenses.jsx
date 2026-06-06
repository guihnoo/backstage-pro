
import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Camera, AlertCircle, Search } from 'lucide-react';
import { useExpenses } from '@/lib/useExpenses';
import { useEvents } from '@/lib/useEvents';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

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

const StatCard = ({ title, value, onClick, active }) => (
    <Card
        className={`cursor-pointer transition-all duration-300 ${active ? 'bg-slate-700/80 border-cyan-400/50 scale-105' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50'}`}
        onClick={onClick}
    >
        <CardContent className="p-4">
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${active ? 'text-cyan-300' : 'text-white'}`}>{value}</p>
        </CardContent>
    </Card>
);

export default function ExpensesPage() {
    const { expenses, loading: expensesLoading, error: expensesError, refetch: refetchExpenses, delete: deleteExpenseById } = useExpenses();
    const { events } = useEvents();
    const { isVisible, formatCurrency } = useFinancialVisibility();

    const [showForm, setShowForm] = useState(false);
    const [showAnalyzer, setShowAnalyzer] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [prefillFromScan, setPrefillFromScan] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

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
        return <ExpensesSkeleton />;
    }

    if (expensesError) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <EmptyState
                    icon={AlertCircle}
                    title="Erro ao carregar despesas"
                    description="Não foi possível buscar as informações de despesas. Tente novamente mais tarde."
                />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="p-4 md:p-6 space-y-6 flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white font-display">Gerenciador de Despesas</h1>
                            <p className="text-slate-400">Controle todos os seus gastos e reembolsos.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700" onClick={handleScan}>
                                <Camera className="w-4 h-4 mr-2" />
                                Digitalizar Recibo
                            </Button>
                            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={() => { setEditingExpense(null); setPrefillFromScan(null); setShowForm(true); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Despesa
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Gasto Total" value={isVisible ? formatCurrency(expenseStats.total) : '•••••'} onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
                        <StatCard title="A Reembolsar" value={isVisible ? formatCurrency(expenseStats.reimbursable) : '•••••'} onClick={() => setStatusFilter('reimbursable')} active={statusFilter === 'reimbursable'} />
                        <StatCard title="Reembolsado" value={isVisible ? formatCurrency(expenseStats.reimbursed) : '•••••'} onClick={() => setStatusFilter('reimbursed')} active={statusFilter === 'reimbursed'} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por título ou notas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border-slate-700 pl-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[200px] bg-slate-800 border-slate-700">
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
            </div>

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
