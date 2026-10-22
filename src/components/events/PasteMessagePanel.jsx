import { useState } from 'react';
import { ClipboardPaste, MessageCircle, Undo2, Loader2, Sparkles } from 'lucide-react';

// "Colar mensagem do WhatsApp" no Novo trabalho (ideia #106).
// onApply(texto) devolve { found, clientName } do leitor; onUndo volta o formulário como estava.
// onReadWithAI (opcional, ideia #108) lê a mesma mensagem com a IA.
export default function PasteMessagePanel({ onApply, onUndo, onReadWithAI }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const canPaste = typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.readText);

  const apply = (value) => {
    const r = onApply(value);
    if (r?.found?.length) {
      setResult(r);
      setOpen(false);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const value = await navigator.clipboard.readText();
      if (value) {
        setText(value);
        apply(value);
      }
    } catch {
      // Sem permissão para ler a área de transferência: o técnico cola no campo.
    }
  };

  const readWithAI = async () => {
    if (!onReadWithAI || !text.trim()) return;
    setAiLoading(true);
    try {
      const r = await onReadWithAI(text);
      if (r?.found?.length) {
        setResult(r);
        setOpen(false);
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (result && !open) {
    return (
      <div className="rounded-2xl border border-[#ffd400]/40 bg-[#ffd400]/10 p-3" role="status" data-testid="paste-result">
        <p className="text-[13px] font-extrabold text-[#ffd400]">Preenchido pela mensagem: {result.found.join(', ')}</p>
        {result.clientName && result.found.includes('cliente (novo)') && (
          <p className="text-xs text-[#e0e0e0] mt-1">Cliente na mensagem: <strong>{result.clientName}</strong> — não está na sua lista; escolha ou crie abaixo.</p>
        )}
        <p className="text-xs text-[#c8c8c8] mt-1">Confira antes de salvar. A mensagem inteira ficou em Observações.</p>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => { onUndo?.(); setResult(null); }}
            className="h-8 px-3 rounded-full border border-[#ffd400]/50 text-[#ffd400] text-xs font-extrabold flex items-center gap-1.5"
          >
            <Undo2 className="w-3.5 h-3.5" /> Desfazer
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-8 px-3 rounded-full border border-[#333333] text-[#c8c8c8] text-xs font-extrabold"
          >
            Colar outra
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-[#444444] bg-[#0a0a0a] px-3.5 py-3 text-left flex items-center gap-3 active:scale-[0.99]"
      >
        <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0" />
        <span className="min-w-0">
          <span className="block text-[14px] font-extrabold text-white">Colar mensagem do WhatsApp</span>
          <span className="block text-[11px] text-[#888888]">O app preenche data, horário, local, cliente e cachê</span>
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[#333333] bg-[#0a0a0a] p-3 space-y-2" data-testid="paste-panel">
      <label htmlFor="paste-message" className="font-tag text-[11px] tracking-[0.14em] text-[#a8a8a8] block">MENSAGEM DO WHATSAPP</label>
      <textarea
        id="paste-message"
        autoFocus
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Cole aqui a mensagem da produtora.\nEx.: Show dia 25/10, chegada 16h, das 21h às 23h, Allianz Parque - São Paulo/SP, cachê R$ 900'}
        className="w-full rounded-xl bg-[#161616] border border-[#333333] p-3 text-sm text-white placeholder:text-[#666666] resize-none"
      />
      <div className="flex flex-wrap gap-2">
        {canPaste && (
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="h-10 px-3 rounded-full border border-[#333333] text-white text-xs font-extrabold flex items-center gap-1.5"
          >
            <ClipboardPaste className="w-4 h-4" /> Colar
          </button>
        )}
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => apply(text)}
          className="h-10 px-4 rounded-full bg-[#ffd400] text-[#0a0a0a] text-xs font-extrabold disabled:opacity-40"
        >
          Preencher
        </button>
        {onReadWithAI && (
          <button
            type="button"
            disabled={!text.trim() || aiLoading}
            onClick={readWithAI}
            className="h-10 px-3 rounded-full border border-[#ffd400]/50 text-[#ffd400] text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Ler com IA
          </button>
        )}
        <button
          type="button"
          onClick={() => { setOpen(false); setText(''); }}
          className="h-10 px-3 rounded-full text-[#a8a8a8] text-xs font-extrabold ml-auto"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
