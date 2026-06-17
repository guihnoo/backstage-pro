import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const TEMPLATES = {
  audio: {
    label: 'Áudio',
    items: ['Mesa de som', 'Cabos XLR', 'Microfones', 'Pedestais', 'Amplificadores', 'DI Box', 'In-ears / monitores', 'Power conditioner'],
  },
  lighting: {
    label: 'Iluminação',
    items: ['Mesa DMX', 'Cabos DMX', 'Moving heads', 'PAR LED', 'Strobo', 'Rack de dimmer', 'Extensões', 'Truss / suportes'],
  },
  dj: {
    label: 'DJ',
    items: ['Controladora DJ', 'Laptop', 'Interface de áudio', 'Fones de ouvido', 'Cabos RCA/XLR', 'Mesa de som', 'Pen drives backup', 'Carregador notebook'],
  },
  photo: {
    label: 'Foto/Vídeo',
    items: ['Câmera principal', 'Câmera backup', 'Lentes', 'Cartões de memória', 'Baterias carregadas', 'Tripé', 'Flash / softbox', 'HD externo'],
  },
  general: {
    label: 'Geral',
    items: ['RG / Documentos', 'Carregador celular', 'Água e lanche', 'Ferramentas básicas', 'Cabos extensão', 'Fita isolante', 'Lanterna', 'Contrato impresso'],
  },
};

export function EventChecklist({ items = [], onChange, readOnly = false }) {
  const { primaryHex } = useCategoryTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [newText, setNewText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const checked = items.filter(i => i.checked).length;
  const total = items.length;

  const addItem = (text) => {
    if (!text.trim()) return;
    const next = [...items, { id: crypto.randomUUID(), text: text.trim(), checked: false }];
    onChange(next);
    setNewText('');
  };

  const toggleItem = (id) => {
    onChange(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const deleteItem = (id) => {
    onChange(items.filter(i => i.id !== id));
  };

  const applyTemplate = (key) => {
    const existing = new Set(items.map(i => i.text.toLowerCase()));
    const toAdd = TEMPLATES[key].items
      .filter(t => !existing.has(t.toLowerCase()))
      .map(text => ({ id: crypto.randomUUID(), text, checked: false }));
    onChange([...items, ...toAdd]);
    setShowTemplates(false);
  };

  const clearChecked = () => {
    onChange(items.filter(i => !i.checked));
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors"
      >
        <ClipboardList className="w-4 h-4 shrink-0" style={{ color: primaryHex }} />
        <span className="text-sm font-medium text-white flex-1 text-left">Checklist</span>
        {total > 0 && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            checked === total ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
          }`}>
            {checked}/{total}
          </span>
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
              {/* Progress bar */}
              {total > 0 && (
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${total > 0 ? (checked / total) * 100 : 0}%` }}
                  />
                </div>
              )}

              {/* Items */}
              {items.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  Nenhum item. Adicione abaixo ou use um template.
                </p>
              )}
              <ul className="space-y-1.5">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex items-center gap-2 group"
                    >
                      <button
                        type="button"
                        onClick={() => !readOnly && toggleItem(item.id)}
                        className="shrink-0"
                        disabled={readOnly}
                        aria-label={`${item.checked ? 'Desmarcar' : 'Marcar'}: ${item.text}`}
                      >
                        {item.checked
                          ? <CheckSquare className="w-4 h-4 text-emerald-400" />
                          : <Square className="w-4 h-4 text-slate-500" />
                        }
                      </button>
                      <span className={`text-sm flex-1 ${item.checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.text}
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-500 hover:text-red-400"
                          aria-label={`Remover: ${item.text}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {!readOnly && (
                <>
                  {/* Add item */}
                  <div className="flex gap-2">
                    <Input
                      value={newText}
                      onChange={e => setNewText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(newText); } }}
                      placeholder="Novo item…"
                      className="h-8 text-sm bg-slate-900/50 border-slate-600"
                      aria-label="Novo item do checklist"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addItem(newText)}
                      className="h-8 px-2 border-slate-600"
                      aria-label="Adicionar item"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(v => !v)}
                      className="text-xs underline underline-offset-2 bp-hover-primary transition-colors"
                      style={{ color: primaryHex }}
                    >
                      {showTemplates ? 'Fechar templates' : '+ Template rápido'}
                    </button>
                    {checked > 0 && (
                      <button
                        type="button"
                        onClick={clearChecked}
                        className="text-xs text-slate-500 hover:text-red-400 underline underline-offset-2 ml-auto"
                      >
                        Limpar marcados ({checked})
                      </button>
                    )}
                  </div>

                  {/* Templates */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex flex-wrap gap-1.5"
                      >
                        {Object.entries(TEMPLATES).map(([key, tpl]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => applyTemplate(key)}
                            className="text-xs px-2.5 py-1 rounded-full border transition-colors hover:opacity-90"
                            style={{
                              borderColor: `${primaryHex}66`,
                              color: primaryHex,
                              backgroundColor: `${primaryHex}14`,
                            }}
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
