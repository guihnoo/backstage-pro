import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import appToast from '@/lib/appToast';
import { normalizeKit, addItem, removeItem } from '@/lib/equipment';

// "Meu kit de equipamento" no Perfil (ideia #113): vira o "Usar meu kit" de cada show.
// Grava na hora (sem passar pela barra SALVAR) e desfaz se falhar.
export default function KitEditor({ kit, onSave }) {
  const [list, setList] = useState(() => normalizeKit(kit));
  const [text, setText] = useState('');

  const kitKey = JSON.stringify(kit || []);
  useEffect(() => { setList(normalizeKit(kit)); }, [kitKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (next) => {
    const before = list;
    const clean = normalizeKit(next);
    setList(clean);
    try {
      await onSave(clean);
    } catch (err) {
      setList(before);
      appToast.error('Não deu para salvar o kit.', { description: err?.message });
    }
  };

  return (
    <section className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3" data-testid="meu-kit">
      <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Meu kit de equipamento</h2>
      {list.length === 0 ? (
        <p className="text-xs text-[#888888]">O que você leva sempre (ex.: mesa, cabos, ferramentas). Em cada show, um toque em Usar meu kit monta a lista do que levar.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {list.map((i) => (
            <span key={i.id} className="h-8 pl-3 pr-1 rounded-full bg-[#0a0a0a] border border-[#333333] text-xs font-bold text-white flex items-center gap-1">
              {i.text}
              <button
                type="button"
                aria-label={`Tirar ${i.text} do kit`}
                onClick={() => save(removeItem(list, i.id))}
                className="w-6 h-6 rounded-full text-[#888888] hover:text-[#ff2e88] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const next = addItem(list.map((k) => ({ ...k, packed: false, returned: false })), text);
          if (next.length !== list.length) save(next);
          setText('');
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar ao kit"
          aria-label="Novo item do kit"
          className="flex-1 min-w-0 h-10 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] px-3 text-sm text-white placeholder:text-[#666666]"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Adicionar ao kit" className="h-10 w-10 rounded-xl bg-[#ffd400] text-[#0a0a0a] flex items-center justify-center disabled:opacity-40">
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}
