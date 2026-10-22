import { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, AlertTriangle, Save } from 'lucide-react';
import appToast from '@/lib/appToast';
import { normalizeItems, addItem, removeItem, togglePacked, toggleReturned, addKit, equipmentSummary, kitFromItems } from '@/lib/equipment';

// Checklist de equipamento por show (ideia #113): Ida (o que levar) e Volta (o que voltou).
// Mostra a mudança na hora e desfaz se a gravação falhar.
export default function EquipmentChecklist({ items, onChange, kit = [], onSaveKit, done = false }) {
  const [list, setList] = useState(() => normalizeItems(items));
  const [tab, setTab] = useState(done ? 'volta' : 'ida');
  const [collapsed, setCollapsed] = useState(false);
  const [text, setText] = useState('');

  // Compara pelo conteúdo: quem chama costuma passar `x ?? []` (lista nova a cada render).
  const itemsKey = JSON.stringify(items || []);
  useEffect(() => { setList(normalizeItems(items)); }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (next) => {
    const before = list;
    setList(next);
    try {
      await onChange(next);
    } catch (err) {
      setList(before);
      appToast.error('Não deu para salvar o equipamento.', { description: err?.message });
    }
  };

  const s = equipmentSummary(list);
  const visible = tab === 'volta' ? list.filter((i) => i.packed) : list;

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1f1f1f] overflow-hidden" data-testid="equipment-checklist">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors"
      >
        <Briefcase className="w-4 h-4 shrink-0 text-[#ffd400]" />
        <span className="font-tag text-[11px] tracking-[2px] uppercase text-[#a8a8a8] flex-1 text-left">Equipamento</span>
        {s.total > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#2a2a2a] text-[#c8c8c8]">
            {s.packed}/{s.total} na mala{s.packed > 0 ? ` · ${s.returned}/${s.packed} voltou` : ''}
          </span>
        )}
        {collapsed ? <ChevronDown className="w-4 h-4 text-[#a8a8a8]" /> : <ChevronUp className="w-4 h-4 text-[#a8a8a8]" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {done && s.missingReturn.length > 0 && (
            <div className="flex gap-2 p-2.5 rounded-lg bg-[#ff2e88]/10 border border-[#ff2e88]/30" role="alert">
              <AlertTriangle className="w-4 h-4 text-[#ff2e88] shrink-0 mt-0.5" />
              <p className="text-xs text-[#ffc2dc]">
                <strong>Falta voltar:</strong> {s.missingReturn.map((i) => i.text).join(', ')}
              </p>
            </div>
          )}

          <div role="tablist" className="grid grid-cols-2 gap-1 bg-[#161616] rounded-full p-1">
            {[
              { id: 'ida', label: 'Ida · levar' },
              { id: 'volta', label: 'Volta · voltou' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`h-8 rounded-full text-xs font-extrabold ${tab === t.id ? 'bg-[#ffd400] text-[#0a0a0a]' : 'text-[#a8a8a8]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-xs text-[#888888]">
              {tab === 'volta' ? 'Marque na Ida o que foi na mala.' : 'Nada na lista ainda. Use o seu kit ou adicione item.'}
            </p>
          ) : (
            <ul className="space-y-1">
              {visible.map((i) => {
                const checked = tab === 'volta' ? i.returned : i.packed;
                const Icon = checked ? CheckSquare : Square;
                return (
                  <li key={i.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => save(tab === 'volta' ? toggleReturned(list, i.id) : togglePacked(list, i.id))}
                      className="flex-1 min-w-0 flex items-center gap-2.5 py-1.5 text-left"
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${checked ? 'text-[#ffd400]' : 'text-[#666666]'}`} />
                      <span className={`text-sm truncate ${checked ? 'text-[#888888] line-through' : 'text-white'}`}>{i.text}</span>
                    </button>
                    {tab === 'ida' && (
                      <button
                        type="button"
                        aria-label={`Tirar ${i.text} da lista`}
                        onClick={() => save(removeItem(list, i.id))}
                        className="p-1.5 text-[#666666] hover:text-[#ff2e88]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {tab === 'ida' && (
            <>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const next = addItem(list, text);
                  if (next !== list) save(next);
                  setText('');
                }}
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Novo item (ex.: Cabo XLR 10m)"
                  aria-label="Novo item de equipamento"
                  className="flex-1 min-w-0 h-9 rounded-lg bg-[#161616] border border-[#333333] px-3 text-sm text-white placeholder:text-[#666666]"
                />
                <button type="submit" disabled={!text.trim()} aria-label="Adicionar equipamento" className="h-9 w-9 rounded-lg border border-[#333333] text-white flex items-center justify-center disabled:opacity-40">
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {kit.length > 0 && (
                  <button
                    type="button"
                    onClick={() => save(addKit(list, kit))}
                    className="h-8 px-3 rounded-full bg-[#ffd400] text-[#0a0a0a] text-xs font-extrabold"
                  >
                    Usar meu kit ({kit.length})
                  </button>
                )}
                {onSaveKit && list.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await onSaveKit(kitFromItems(list));
                        appToast.success('Kit salvo', { description: `${list.length} itens; aparece em "Usar meu kit" nos próximos shows.` });
                      } catch (err) {
                        appToast.error('Não deu para salvar o kit.', { description: err?.message });
                      }
                    }}
                    className="h-8 px-3 rounded-full border border-[#333333] text-[#c8c8c8] text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar como meu kit
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
