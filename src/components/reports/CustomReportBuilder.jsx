import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Filter, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { useAppData } from '@/components/context/AppDataContext';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { generateAdvancedStats } from '@/api/functions';
import EmptyState from '@/components/layout/EmptyState';

const metricOptions = [
    { value: 'totalRevenue', label: 'Receita Bruta' },
    { value: 'netProfit', label: 'Lucro Líquido' },
    { value: 'totalExpenses', label: 'Despesas Totais' },
    { value: 'totalEvents', label: 'Nº de Eventos' },
    { value: 'totalHours', label: 'Horas Trabalhadas' },
];

const groupByOptions = [
    { value: 'client', label: 'Cliente' },
    { value: 'month', label: 'Mês' },
    { value: 'event_status', label: 'Status do Evento' },
];

export default function CustomReportBuilder() {
    const { data: { clients } } = useAppData();
    const { formatCurrency } = useFinancialVisibility();
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const [config, setConfig] = useState({
        dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
        metrics: ['totalRevenue', 'netProfit', 'totalEvents'],
        groupBy: 'client',
        filters: {
            client_id: 'all',
            payment_status: 'all',
        },
    });

    const handleConfigChange = (part, key, value) => {
        if (part === 'main') {
            setConfig(prev => ({ ...prev, [key]: value }));
        } else {
            setConfig(prev => ({ ...prev, filters: { ...prev.filters, [key]: value } }));
        }
    };
    
    const handleGenerateReport = async () => {
        if (config.metrics.length === 0) {
            toast.warning('Selecione pelo menos uma métrica para gerar o relatório.');
            return;
        }

        setIsLoading(true);
        setReportData(null);
        try {
            const { data } = await generateAdvancedStats(config);
            if(data.success) {
                setReportData(data.data);
            } else {
                throw new Error(data.error || 'Falha ao gerar relatório.');
            }
        } catch (error) {
            console.error("Erro no CustomReportBuilder:", error);
            toast.error('Ocorreu um erro ao gerar o relatório.', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const tableHeaders = useMemo(() => {
        if (!reportData) return [];
        const headers = [{ key: 'groupLabel', label: groupByOptions.find(o => o.value === config.groupBy)?.label || 'Grupo' }];
        config.metrics.forEach(metricKey => {
            headers.push({ key: metricKey, label: metricOptions.find(o => o.value === metricKey)?.label || metricKey });
        });
        return headers;
    }, [reportData, config.groupBy, config.metrics]);

    const formatCell = (item, headerKey) => {
        const value = item[headerKey];
        if (typeof value === 'undefined') return '-';
        if (['totalRevenue', 'netProfit', 'totalExpenses'].includes(headerKey)) {
            return formatCurrency(value);
        }
        if (headerKey === 'totalHours') {
            return `${value.toFixed(1)}h`;
        }
        return value;
    };

    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-white font-display flex items-center gap-3">
                    <BarChart className="w-6 h-6 text-cyan-400"/>
                    Construtor de Relatórios
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Configuração */}
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Período */}
                            <div className="space-y-2">
                                <Label>Período</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start bg-slate-700 border-slate-600 hover:bg-slate-600">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {config.dateRange?.from ? format(config.dateRange.from, "dd/MM/yy") + ' - ' + format(config.dateRange.to, "dd/MM/yy") : "Selecione"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={config.dateRange?.from}
                                            selected={config.dateRange}
                                            onSelect={(range) => handleConfigChange('main', 'dateRange', range)}
                                            locale={ptBR}
                                            className="text-white"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                             {/* Agrupar por */}
                            <div className="space-y-2">
                                <Label>Agrupar por</Label>
                                <Select value={config.groupBy} onValueChange={(v) => handleConfigChange('main', 'groupBy', v)}>
                                    <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {groupByOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Métricas */}
                             <div className="space-y-2 lg:col-span-2">
                                <Label>Métricas (Colunas)</Label>
                                 <Select value={config.metrics.join(',')} onValueChange={(v) => handleConfigChange('main', 'metrics', v.split(','))}>
                                     <SelectTrigger className="bg-slate-700 border-slate-600">
                                         <SelectValue placeholder="Selecione as métricas" />
                                     </SelectTrigger>
                                     <SelectContent className="bg-slate-800 border-slate-700">
                                         {/* Note: This is a simplified multi-select. A true multi-select component would be better. */}
                                         {metricOptions.map(opt => (
                                             <SelectItem key={opt.value} value={config.metrics.includes(opt.value) ? config.metrics.filter(m => m !== opt.value).join(',') : [...config.metrics, opt.value].join(',')}>
                                                 <div className="flex items-center">
                                                     <div className={`w-4 h-4 mr-2 border rounded ${config.metrics.includes(opt.value) ? 'bg-cyan-400' : 'bg-transparent'}`} />
                                                     {opt.label}
                                                 </div>
                                             </SelectItem>
                                         ))}
                                     </SelectContent>
                                 </Select>
                            </div>
                         </div>
                    </div>
                    
                    {/* Botão de Gerar */}
                    <div className="flex justify-end">
                        <Button onClick={handleGenerateReport} disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                            Gerar Relatório
                        </Button>
                    </div>

                    {/* Resultados */}
                    <div className="min-h-[200px]">
                        {isLoading && (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                            </div>
                        )}
                        {!isLoading && reportData && (
                            reportData.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-slate-800/50">
                                            {tableHeaders.map(header => <TableHead key={header.key} className="text-white">{header.label}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.map((item, index) => (
                                            <TableRow key={index} className="border-slate-800">
                                                {tableHeaders.map(header => (
                                                    <TableCell key={header.key}>{formatCell(item, header.key)}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState icon={BarChart} title="Nenhum dado encontrado" description="Nenhum dado corresponde aos filtros selecionados. Tente ajustar o período ou os filtros." />
                            )
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}