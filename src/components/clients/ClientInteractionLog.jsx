import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Phone, Mail, Users, MoreHorizontal, Plus, Trash2, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClientInteractions, INTERACTION_TYPES } from '@/lib/useClientInteractions';
import appToast from '@/lib/appToast';

const TYPE_ICONS = {
  whatsapp: MessageCircle,
  call: Phone,
  email: Mail,
  meeting: Users,
  other: MoreHorizontal,
};

const EMPTY_FORM = { type: 'whatsapp', notes: '', follow_up_date: '' };

export function ClientInteractionLog({ clientId }) {
  const { interactions, loading, create, remove } = useClientInteractions(clientId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSave = async () => {
    if (!form.notes.trim()) {
      appToast.error('Adicione uma anotação.');
      return;
    }
    setSaving(true);
    try {
      await create({
        type: form.type,
        notes: form.notes.trim(),
        follow_up_date: form.follow_up_date || null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      appToast.success('Interação registrada!');
    } catch (e) {
      appToast.error('Erro ao salvar', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
    } catch (e) {
      appToast.error('Erro ao remover', { description: e.message });
    }
  };

  const count = interactions.length;
  const pendingFollowUps = interactions.filter(i =>
    i.follow_up_date && (isToday(parseISO(i.follow_up_date)) || isPast(parseISO(i.follow_up_date)))
  ).length;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-sm font-medium text-white flex-1 text-left">Histórico de Contatos</span>
        {pendingFollowUps > 0 && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Bell className="w-3 h-3" />
            {pendingFollowUps} follow-up{pendingFollowUps > 1 ? 's' : ''}
          </span>
        )}
        {count > 0 && pendingFollowUps === 0 && (
          <span className="text-xs text-slate-500">{count} registro{count !== 1 ? 's' : ''}</span>
        )}
        {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Botão adicionar */}
              {!showForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  className="w-full h-8 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Registrar contato
                </Button>
              )}

              {/* Formulário inline */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-slate-600/50 bg-slate-900/50 p-3 space-y-3"
                  >
                    {/* Tipo */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(INTERACTION_TYPES).map(([key, cfg]) => {
                        const Icon = TYPE_ICONS[key];
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setForm(f => ({ ...f, type: key }))}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              form.type === key
                                ? `${cfg.bg} ${cfg.color} border-current`
                                : 'border-slate-700 text-slate-500 hover:border-slate-500'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Notas */}
                    <Textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="O que foi combinado?"
                      className="text-sm bg-slate-900/50 border-slate-600 resize-none"
                      rows={2}
                    />

                    {/* Follow-up */}
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <Input
                        type="date"
                        value={form.follow_up_date}
                        onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
                        className="h-7 text-xs bg-slate-900/50 border-slate-600 flex-1"
                        placeholder="Data de follow-up (opcional)"
                      />
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                        className="flex-1 h-7 text-xs border-slate-600"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        {saving ? 'Salvando…' : 'Salvar'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista */}
              {loading && <p className="text-xs text-slate-500 text-center py-2">Carregando…</p>}

              {!loading && interactions.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-2">
                  Nenhum contato registrado ainda.
                </p>
              )}

              <ul className="space-y-2">
                <AnimatePresence>
                  {interactions.map(item => {
                    const cfg = INTERACTION_TYPES[item.type] || INTERACTION_TYPES.other;
                    const Icon = TYPE_ICONS[item.type] || MoreHorizontal;
                    const followUp = item.follow_up_date ? parseISO(item.follow_up_date) : null;
                    const followUpOverdue = followUp && isPast(followUp) && !isToday(followUp);
                    const followUpToday = followUp && isToday(followUp);

                    return (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="group flex gap-2.5"
                      >
                        {/* Ícone */}
                        <div className={`mt-0.5 p-1.5 rounded-lg border shrink-0 ${cfg.bg}`}>
                          <Icon className={`w-3 h-3 ${cfg.color}`} />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-medium uppercase tracking-wide ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-600">
                                {format(parseISO(item.created_at), "dd/MM/yy", { locale: ptBR })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-200 break-words">{item.notes}</p>
                          {followUp && (
                            <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                              followUpOverdue ? 'text-red-400' : followUpToday ? 'text-amber-400' : 'text-slate-500'
                            }`}>
                              <Bell className="w-3 h-3" />
                              Follow-up: {format(followUp, "dd/MM/yyyy", { locale: ptBR })}
                              {followUpOverdue && ' · Vencido'}
                              {followUpToday && ' · Hoje!'}
                            </p>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
