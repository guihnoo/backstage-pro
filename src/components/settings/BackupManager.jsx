
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Database, AlertTriangle, ShieldCheck, Download, Upload, Trash2 } from 'lucide-react';
import { SystemBackup } from '@/api/entities';
import { createBackup } from '@/api/functions';
import { restoreFromBackup } from '@/api/functions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BackupItem = ({ backup, onRestore, isRestoring, isLatest }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border ${isLatest ? 'bg-slate-700/50 border-cyan-400/50' : 'bg-slate-800/50 border-slate-700'}`}
        >
            <div className="flex items-center gap-4">
                <ShieldCheck className={`w-8 h-8 ${isLatest ? 'text-cyan-400' : 'text-green-500'}`} />
                <div>
                    <p className="font-semibold text-white">
                        Backup {backup.backup_type === 'manual' ? 'Manual' : 'Automático'}
                        {isLatest && <span className="text-xs text-cyan-300 ml-2">(Mais Recente)</span>}
                    </p>
                    <p className="text-sm text-slate-300">
                        {format(new Date(backup.created_date), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-slate-400">{backup.backup_size_mb} MB • {backup.entities_backed_up.length} tabelas</p>
                </div>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-400 border-amber-400/50 hover:bg-amber-500/20 hover:text-amber-300"
                    onClick={() => onRestore(backup.id)}
                    disabled={isRestoring}
                >
                    {isRestoring ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4 mr-2" />
                    )}
                    Restaurar
                </Button>
            </div>
        </motion.div>
    );
};

export default function BackupManager({ user }) {
    const [backups, setBackups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const fetchBackups = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const backupRecords = await SystemBackup.filter({ owner_id: user.id }, '-created_date', 10);
            setBackups(backupRecords);
        } catch (error) {
            toast.error('Não foi possível carregar o histórico de backups.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackup = async () => {
        setIsCreating(true);
        toast.info('Iniciando processo de backup...', { description: 'Isso pode levar alguns instantes.' });
        try {
            const { data } = await createBackup({ backup_type: 'manual' });
            if (data.success) {
                toast.success(data.message);
                fetchBackups(); // Refresh list
            } else {
                throw new Error(data.error || 'Falha ao criar backup.');
            }
        } catch (error) {
            toast.error('Erro ao criar backup.', { description: error.message });
        } finally {
            setIsCreating(false);
        }
    };

    const handleRestoreBackup = async (backupId) => {
        if (!window.confirm('ATENÇÃO: Esta ação substituirá TODOS os seus dados atuais pelos do backup selecionado. Um backup de segurança do estado atual será criado automaticamente. Deseja continuar?')) {
            return;
        }
        setIsRestoring(true);
        toast.info('Iniciando restauração...', { description: 'Não feche esta página. O processo pode levar alguns minutos.' });
        try {
            const { data } = await restoreFromBackup({ backup_id: backupId });
            if (data.success) {
                toast.success(data.message, {
                    description: 'O aplicativo será recarregado para aplicar as alterações.',
                    duration: 8000,
                });
                setTimeout(() => window.location.reload(), 3000);
            } else {
                throw new Error(data.error || 'Falha ao restaurar o backup.');
            }
        } catch (error) {
            toast.error('Erro ao restaurar backup.', { description: error.message });
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Card className="bg-slate-900/50 border-slate-800 text-white">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Database className="w-6 h-6 text-cyan-400" />
                    <div>
                        <CardTitle className="text-xl font-bold">Segurança e Backups</CardTitle>
                        <CardDescription className="text-slate-300">Crie e restaure backups dos seus dados para garantir a segurança.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-slate-200 flex-1">Crie um ponto de restauração seguro de todos os seus dados.</p>
                    <Button onClick={handleCreateBackup} disabled={isCreating || isRestoring}>
                        {isCreating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <ShieldCheck className="w-4 h-4 mr-2" />
                        )}
                        Criar Backup Agora
                    </Button>
                </div>

                <div className="mt-6">
                    <h4 className="font-semibold mb-4 text-slate-100">Histórico de Backups</h4>
                    {isLoading ? (
                        <div className="text-center p-8">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-400" />
                            <p className="mt-2 text-slate-400">Carregando backups...</p>
                        </div>
                    ) : backups.length > 0 ? (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {backups.map((backup, index) => (
                                    <BackupItem 
                                        key={backup.id} 
                                        backup={backup} 
                                        onRestore={handleRestoreBackup}
                                        isRestoring={isRestoring}
                                        isLatest={index === 0}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-lg">
                            <p className="text-slate-400">Nenhum backup encontrado.</p>
                            <p className="text-sm text-slate-500">Crie seu primeiro backup para começar.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
