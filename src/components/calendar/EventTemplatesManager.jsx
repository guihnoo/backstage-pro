import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventTemplate } from '@/api/entities';
import { useAuth } from '@/lib/authContext';
import { Loader2, Trash2, BookmarkPlus, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import appToast from '@/lib/appToast';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

const PAYMENT_MODEL_LABELS = {
  HORAS_EXTRAS: 'Horas Extras',
  MEIO_CACHE_E_DOBRA: 'Meio Cache e Dobra',
};

export default function EventTemplatesManager({ primaryHex }) {
  const { user } = useAuth();
  const { isVisible } = useFinancialVisibility();
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

      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] overflow-hidden">
        {/* Header toggle */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1f1f1f] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#1f1f1f]">
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Modelos de trabalho</p>
              <p className="text-[11px] text-[#888888]">
                {open && !loading
                  ? templates.length === 0
                    ? 'Nenhum salvo ainda'
                    : `${templates.length} modelo${templates.length > 1 ? 's' : ''} salvo${templates.length > 1 ? 's' : ''}`
                  : 'Usados no “Novo trabalho” para preencher mais rápido'}
              </p>
            </div>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-[#888888]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#888888]" />
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[#2a2a2a]"
            >
              <div className="p-4 space-y-2">
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[#888888]" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <BookmarkPlus className="w-8 h-8 text-[#555555] mx-auto" />
                    <p className="text-sm text-[#888888]">Nenhum template salvo</p>
                    <p className="text-xs text-[#666666] max-w-xs mx-auto">
                      Ao criar um evento na Agenda, clique em{' '}
                      <span className="text-[#a8a8a8] font-medium">&quot;Salvar como template&quot;</span>{' '}
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
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#1f1f1f] border border-[#2a2a2a] group"
                      >
                        {/* Color dot */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-[#2a2a2a]"
                          style={{ backgroundColor: tpl.color || accentColor }}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{tpl.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {tpl.title && (
                              <span className="text-xs text-[#a8a8a8] truncate">{tpl.title}</span>
                            )}
                            {tpl.daily_cache_value > 0 && (
                              <span className="text-xs font-tag text-[#ffd400]">
                                {isVisible ? `R$ ${Number(tpl.daily_cache_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
                              </span>
                            )}
                            {tpl.payment_model && (
                              <span className="text-[10px] text-[#888888]">
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[#888888] hover:text-[#ff2e88] hover:bg-[#ff2e88]/10 disabled:opacity-50"
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
                  <p className="text-[10px] text-[#666666] text-center pt-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Para criar novos templates, use &quot;Salvar como template&quot; na Agenda
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
