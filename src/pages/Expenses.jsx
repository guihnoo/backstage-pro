import { useState, useCallback, lazy, Suspense } from 'react';
import { useQueryAction } from '@/lib/useQueryAction';
import { AlertCircle } from 'lucide-react';
import { useExpenses } from '@/lib/useExpenses';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import appToast from '@/lib/appToast';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useConnectivity } from '@/lib/offline/useConnectivity';
import EmptyState from '@/components/layout/EmptyState';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import AllAccessDespesas from '@/components/expenses/AllAccessDespesas';

const ExpenseForm = lazy(() => import('@/components/expenses/ExpenseForm'));
const ReceiptAnalyzer = lazy(() => import('@/components/expenses/ReceiptAnalyzer'));

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

export default function ExpensesPage() {
    const { expenses, loading: expensesLoading, error: expensesError, refetch: refetchExpenses, delete: deleteExpenseById } = useExpenses();
    const { events } = useEvents();
    const { clients } = useClients();
    const { offline } = useConnectivity();
    const { isVisible, formatCurrency } = useFinancialVisibility();

    const [showForm, setShowForm] = useState(false);
    const [showAnalyzer, setShowAnalyzer] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [prefillFromScan, setPrefillFromScan] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    useQueryAction('new', useCallback(() => {
        setShowForm(true);
        setEditingExpense(null);
    }, []));

    // O aviso de "salvo" já vem da própria janela da despesa
    const handleFormSuccess = useCallback(() => {
        setShowForm(false);
        setEditingExpense(null);
        refetchExpenses({ silent: true });
    }, [refetchExpenses]);

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setPrefillFromScan(null);
        setShowForm(true);
    };

    // Excluir sai da janela de edição: fecha a janela e pede confirmação
    const handleDeleteRequest = (expense) => {
        setShowForm(false);
        setEditingExpense(null);
        setConfirmDelete(expense.id);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteExpenseById(confirmDelete);
            appToast.success('Despesa excluída.');
        } catch (err) {
            appToast.error('Erro ao excluir despesa.');
            console.error(err);
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleAnalyzerExtract = (extractedData) => {
        setPrefillFromScan(extractedData);
        setShowAnalyzer(false);
        setEditingExpense(null);
        setShowForm(true);
    };

    const refreshExpenses = useCallback(async () => {
        await refetchExpenses({ silent: true });
        appToast.success('Despesas atualizadas');
    }, [refetchExpenses]);

    const { pullDistance, isRefreshing, threshold } = usePullToRefresh(refreshExpenses);

    const allExpenses = Array.isArray(expenses) ? expenses : [];

    if (expensesLoading && !allExpenses.length) {
        return (
            <div className="min-h-full bg-[#0a0a0a] text-white">
                <ExpensesSkeleton />
            </div>
        );
    }

    if (expensesError && !allExpenses.length) {
        return (
            <div className="min-h-full bg-[#0a0a0a] text-white flex items-center justify-center p-4">
                <EmptyState
                    icon={AlertCircle}
                    title="Não deu para carregar as despesas"
                    description={offline ? 'Você está sem internet e este aparelho ainda não guardou esses dados. Eles aparecem quando a conexão voltar.' : 'Confira a internet. Seus dados não foram perdidos.'}
                    action={() => refetchExpenses()}
                    actionLabel="Tentar de novo"
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
                        onScanReceipt={() => setShowAnalyzer(true)}
                        onNewExpense={() => {
                            setEditingExpense(null);
                            setPrefillFromScan(null);
                            setShowForm(true);
                        }}
                        onEditExpense={handleEdit}
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
                        onDelete={handleDeleteRequest}
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
