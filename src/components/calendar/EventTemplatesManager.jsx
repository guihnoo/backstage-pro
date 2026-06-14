import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventTemplate } from '@/api/entities';
import { useAuth } from '@/lib/authContext';
import { Loader2, Trash2, BookmarkPlus, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import appToast from '@/lib/appToast';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/layout/ConfirmDialog';

const PAYMENT_MODEL_LABELS = {
  HORAS_EXTRAS: 'Horas Extras',
  MEIO_CACHE_E_DOBRA: 'Meio Cache e Dobra',
};

export default function EventTemplatesManager({ primaryHex }) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await EventTemplate.filter({ user_id: user.id });
      setTemplates(
        [...(data || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (open) fetch();
  }, [open, fetch]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await EventTemplate.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      appToast.success('Template removido');
    } catch (err) {
      appToast.error('Erro ao remover template', { description: err.message });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const accentColor = primaryHex || '#6366f1';

  return (
    <>
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title="Remover template?"
        description={`O template "${confirmDelete?.name}" será excluído permanentemente.`}
        confirmLabel="Remover"
        confirmVariant="destructive"
        onConfirm={() => handleDelete(confirmDelete?.id)}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        {/* Header toggle */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800">
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Templates de Evento</p>
              <p className="text-[11px] text-slate-500">
                {open && !loading
                  ? templates.length === 0
                    ? 'Nenhum salvo ainda'
                    : `${templates.length} template${templates.length > 1 ? 's' : ''} salvo${templates.length > 1 ? 's' : ''}`
                  : 'Gerencie seus modelos de evento'}
              </p>
            </div>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-800"
            >
              <div className="p-4 space-y-2">
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <BookmarkPlus className="w-8 h-8 text-slate-700 mx-auto" />
                    <p className="text-sm text-slate-500">Nenhum template salvo</p>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      Ao criar um evento na Agenda, clique em{' '}
                      <span className="text-slate-400 font-medium">"Salvar como template"</span>{' '}
                      para reutilizá-lo rapidamente no futuro.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {templates.map((tpl, i) => (
                      <motion.div
                        key={tpl.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 group"
                      >
                        {/* Color dot */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-slate-700"
                          style={{ backgroundColor: tpl.color || accentColor }}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{tpl.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {tpl.title && (
                              <span className="text-xs text-slate-400 truncate">{tpl.title}</span>
                            )}
                            {tpl.daily_cache_value > 0 && (
                              <span className="text-xs font-mono text-emerald-400">
                                R$ {Number(tpl.daily_cache_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            {tpl.payment_model && (
                              <span className="text-[10px] text-slate-500">
                                {PAYMENT_MODEL_LABELS[tpl.payment_model] || tpl.payment_model}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(tpl)}
                          disabled={deletingId === tpl.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          aria-label="Remover template"
                        >
                          {deletingId === tpl.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* Hint */}
                {templates.length > 0 && (
                  <p className="text-[10px] text-slate-600 text-center pt-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Para criar novos templates, use "Salvar como template" na Agenda
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
