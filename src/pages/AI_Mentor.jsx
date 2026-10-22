import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sparkles, Loader2, Send, Volume2, VolumeX, History, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useEvents, useStats } from '@/lib/useBackstageData';
import { useClients } from '@/lib/useClients';
import { supabase } from '@/lib/supabase';
import appToast from '@/lib/appToast';
import MessageBubble from '@/components/ai/MessageBubble';
import SmartSuggestions from '@/components/ai/SmartSuggestions';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { todayLocalISO } from '@/components/utils/dateUtils';

const STORAGE_KEY = 'backstage_ai_conversations';
const MAX_HISTORY = 20;

const CATEGORY_HINTS = {
  audio:      'Pergunte sobre cachês PA/FOH, diárias, contratos pendentes e metas.',
  lighting:   'Pergunte sobre cachês de rig, diárias, clientes e metas do mês.',
  photo:      'Pergunte sobre cachês de sessão, cobranças, clientes e receita.',
  video:      'Pergunte sobre cachês de produção, projetos, clientes e metas.',
  dj:         'Pergunte sobre fechamentos de gig, cachês, agenda e cobranças.',
  production: 'Pergunte sobre projetos, orçamentos, clientes e metas.',
  stage:      'Pergunte sobre diárias, cachês, palcos e clientes.',
  security:   'Pergunte sobre diárias, cachês, eventos e cobranças.',
  catering:   'Pergunte sobre contratos, cachês, clientes e metas.',
  other:      'Pergunte sobre diárias, cachês, clientes e metas do mês.',
};
const DEFAULT_HINT = 'Pergunte sobre diárias, cachês, clientes, cobranças e metas do mês.';

function TypingDots({ color }) {
  return (
    <div className="flex items-start gap-2 px-4 py-1 max-w-2xl xl:max-w-6xl mx-auto w-full">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${color}20` }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex items-center gap-1.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-2xl rounded-tl-sm px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  );
}

function loadConversations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveConversations(convs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, MAX_HISTORY)));
}

function newConversation() {
  return {
    id: `conv_${Date.now()}`,
    name: `Conversa — ${new Date().toLocaleDateString('pt-BR')}`,
    createdAt: new Date().toISOString(),
    messages: [],
  };
}

function ConversationItem({ conv, isActive, onSelect, onDelete, primaryHex }) {
  const preview = conv.messages?.[0]?.content?.slice(0, 55) || 'Conversa vazia';
  const date = conv.createdAt ? format(parseISO(conv.createdAt), "d MMM", { locale: ptBR }) : '--';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`group w-full text-left p-3 rounded-xl transition-all flex items-start gap-2 cursor-pointer border ${
        isActive
          ? ''
          : 'bg-[#1f1f1f] border-transparent hover:border-[#2a2a2a]'
      }`}
      style={isActive ? { background: `${primaryHex}22`, borderColor: `${primaryHex}55` } : undefined}
      onClick={() => onSelect(conv)}
    >
      <MessageSquare
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        style={{ color: isActive ? primaryHex : '#888888' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{conv.name}</p>
        <p className="text-xs text-[#888888] truncate mt-0.5">{preview}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-[#666666]">{date}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 min-w-[28px] min-h-[28px] text-[#888888] hover:text-[#ff2e88] transition-all"
          title="Excluir conversa"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default function AIMentorPage() {
  const { user, profile } = useAuth();
  const { stats } = useStats(user?.id);
  const { clients } = useClients();
  const today = todayLocalISO();
  const { events } = useEvents(user?.id, { from: today, limit: 10, ascending: true });
  // Visual All Access: amarelo no lugar da cor da categoria.
  const config = { ...getCategoryConfig(profile?.category || 'lighting'), primaryHex: '#ffd400', accentHex: '#ff2e88' };
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const metaDiarias = Number(profile?.monthly_goal_events) || 0;
  const metaReceita = Number(profile?.monthly_goal_revenue) || 0;

  const [conversations, setConversations] = useState(() => loadConversations());
  const [currentConv, setCurrentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // TTS nas respostas do assistente
  useEffect(() => {
    if (!isAudioEnabled || !messages.length || !window.speechSynthesis) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(last.content);
      utt.lang = 'pt-BR';
      const ptVoice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('pt'));
      if (ptVoice) utt.voice = ptVoice;
      window.speechSynthesis.speak(utt);
    }
  }, [messages, isAudioEnabled]);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      if (prev && window.speechSynthesis) window.speechSynthesis.cancel();
      appToast.success(!prev ? 'Áudio ativado' : 'Áudio desativado');
      return !prev;
    });
  }, []);

  const clientMap = useMemo(() => new Map((clients || []).map(c => [c.id, c])), [clients]);

  // Contexto financeiro enviado ao Claude
  const financialContext = useMemo(() => ({
    faturamento_mes: stats?.faturamento_pago ?? 0,
    a_receber: stats?.a_receber ?? 0,
    eventos_mes: stats?.eventos_count ?? 0,
    diarias_mes: stats?.diarias_count ?? 0,
    clientes_ativos: stats?.clientes_ativos ?? 0,
    proximos_eventos: events?.slice(0, 5).map(e => ({
      titulo: e.title,
      data: e.start_date,
      cliente: clientMap.get(e.client_id)?.name || 'Sem cliente',
      valor: getEventCacheAmount(e),
    })) ?? [],
    total_clientes: clients?.length ?? 0,
    categoria: profile?.category_label || profile?.category || 'técnico de eventos',
    meta_receita: profile?.monthly_goal_revenue || 0,
    meta_eventos: profile?.monthly_goal_events || 0,
    meta_diarias: profile?.monthly_goal_events || 0,
  }), [stats, events, clientMap, clients, profile]);

  const persistConversations = useCallback((convs) => {
    setConversations(convs);
    saveConversations(convs);
  }, []);

  const handleSelectConv = useCallback((conv) => {
    setCurrentConv(conv);
    setMessages(conv.messages || []);
    setHistoryOpen(false);
  }, []);

  const handleNewConv = useCallback(() => {
    const conv = newConversation();
    persistConversations([conv, ...conversations]);
    setCurrentConv(conv);
    setMessages([]);
    setHistoryOpen(false);
    appToast.success('Nova conversa iniciada');
  }, [conversations, persistConversations]);

  const handleDeleteConv = useCallback((id) => {
    const updated = conversations.filter(c => c.id !== id);
    persistConversations(updated);
    if (currentConv?.id === id) {
      setCurrentConv(null);
      setMessages([]);
    }
    appToast.success('Conversa excluída');
  }, [conversations, currentConv, persistConversations]);

  const handleSend = useCallback(async (overrideMsg) => {
    const text = (overrideMsg ?? input).trim();
    if (!text || loading) return;

    let conv = currentConv;
    if (!conv) {
      conv = newConversation();
      conv.name = text.slice(0, 40) + (text.length > 40 ? '…' : '');
      persistConversations([conv, ...conversations]);
      setCurrentConv(conv);
    }

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // Persist user message immediately
    const updatedConv = { ...conv, messages: updatedMessages };
    persistConversations(conversations.map(c => c.id === conv.id ? updatedConv : c).concat(
      conversations.find(c => c.id === conv.id) ? [] : [updatedConv]
    ));

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: financialContext,
        },
      });

      if (error) {
        const ctx = error.context;
        let detail = error.message || 'Erro na edge function';
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          } catch { /* ignore */ }
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);

      const assistantMsg = { role: 'assistant', content: data.answer };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      const finalConv = { ...updatedConv, messages: finalMessages };
      persistConversations(conversations.map(c => c.id === conv.id ? finalConv : c).concat(
        conversations.find(c => c.id === conv.id) ? [] : [finalConv]
      ));
      setCurrentConv(finalConv);
    } catch (err) {
      appToast.error('Erro ao enviar mensagem', { description: err.message });
      setMessages(updatedMessages.slice(0, -1)); // revert user message on error
    } finally {
      setLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = '';
        textareaRef.current.focus();
      }
    }
  }, [input, loading, currentConv, conversations, messages, financialContext, persistConversations]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profissional';
  const diariasMes = stats?.diarias_count ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="relative min-h-full bg-[#0a0a0a] text-white">
      <div className="flex flex-col h-[calc(100dvh-10rem)]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 pb-3 border-b border-[#222222] flex-shrink-0"
        >
          <div className="flex items-center gap-3 max-w-2xl xl:max-w-6xl mx-auto w-full">
            <div className="w-12 h-12 rounded-[12px] bg-[#ffd400] text-[#0a0a0a] flex items-center justify-center font-poster text-[26px] shrink-0">M</div>
            <div className="min-w-0">
              <h1 className="font-poster text-[34px] leading-none uppercase tracking-wide">Mentor</h1>
              <p className="font-tag text-[10px] text-[#a8a8a8] truncate">seu parceiro de estrada · olha seus números todo dia</p>
            </div>
          </div>
          <p className="font-tag text-[11px] tracking-[1px] text-[#ffd400] uppercase mt-3 max-w-2xl xl:max-w-6xl mx-auto w-full">
            {greeting}, {firstName} · {format(new Date(), "EEEE, d MMM", { locale: ptBR })}
          </p>
          {stats && (
            <div className="flex flex-wrap gap-1.5 mt-2 max-w-2xl xl:max-w-6xl mx-auto w-full">
              {metaDiarias > 0 && (
                <span className="font-tag text-[10px] h-7 px-2.5 rounded-full border border-[#333333] bg-[#161616] text-white flex items-center">
                  {diariasMes}/{metaDiarias} diárias
                </span>
              )}
              {metaReceita > 0 && (
                <span className="font-tag text-[10px] h-7 px-2.5 rounded-full border border-[#333333] bg-[#161616] text-white flex items-center">
                  {isVisible ? `${formatCurrency(stats.faturamento_pago)} de ${formatCurrency(metaReceita)}` : '•••• de ••••'}
                </span>
              )}
              {(stats.a_receber ?? 0) > 0 && (
                <span className="font-tag text-[10px] h-7 px-2.5 rounded-full border border-[#ff2e88]/40 bg-[#ff2e88]/10 text-[#ff2e88] flex items-center">
                  {isVisible ? `${formatCurrency(stats.a_receber)} a receber` : '•••• a receber'}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#222222] flex-shrink-0">
          <p className="font-tag text-[10px] text-[#888888] truncate max-w-[180px]">
            {currentConv ? currentConv.name : 'Conversa nova'}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={`w-9 h-9 ${isAudioEnabled ? 'text-[#ffd400]' : 'text-[#888888]'}`}
              title={isAudioEnabled ? 'Desativar áudio' : 'Ativar leitura em voz alta'}
              aria-label={isAudioEnabled ? 'Desativar áudio' : 'Ativar leitura em voz alta'}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              className="w-9 h-9 text-[#888888] hover:text-white relative"
              title="Histórico"
              aria-label="Histórico de conversas"
            >
              <History className="w-4 h-4" />
              {conversations.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center bg-[#ffd400] text-[#0a0a0a]">
                  {Math.min(conversations.length, 9)}
                </span>
              )}
            </Button>
            <Button onClick={handleNewConv} size="sm" className="h-9 px-3.5 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Nova
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl xl:max-w-6xl mx-auto w-full space-y-3"
            >
              <div className="rounded-[14px] bg-[#161616] border border-[#222222] p-4">
                <p className="text-[15px] font-bold text-white leading-snug">Olá, {firstName}!</p>
                <p className="text-[13px] text-[#c8c8c8] mt-1 leading-snug">
                  {CATEGORY_HINTS[profile?.category] ?? DEFAULT_HINT}
                </p>
              </div>
              <p className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Pergunte ao mentor</p>
              <SmartSuggestions userData={financialContext} onSuggestionClick={(s) => handleSend(s)} />
            </motion.div>
          ) : (
            <div className="space-y-2 max-w-2xl xl:max-w-6xl mx-auto w-full">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MessageBubble message={msg} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && <TypingDots color={config.primaryHex} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#222222] px-4 py-3 flex-shrink-0 pb-safe">
          <div className="flex items-end gap-2 max-w-2xl xl:max-w-6xl mx-auto w-full">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa…"
              disabled={loading}
              rows={1}
              className="flex-1 bg-[#161616] border border-[#333333] rounded-[24px] px-4 py-3 text-white text-base placeholder:text-[#666666] focus:outline-none focus:border-[#ffd400] resize-none min-h-[48px] max-h-[120px] overflow-y-auto transition-colors"
            />
            <Button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Enviar pergunta"
              className="h-12 w-12 flex-shrink-0 p-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          {/* Atalho de teclado só faz sentido no computador */}
          <p className="text-[9px] text-[#555555] font-tag text-center mt-1.5">
            <span className="hidden sm:inline">Enter para enviar · Shift+Enter para nova linha · </span>
            Seus números do mês vão junto na pergunta
          </p>
        </div>
      </div>

      {/* Sheet histórico */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="bg-[#121212] border-[#2a2a2a] w-72 flex flex-col p-0 bp-focus-scope">
          <SheetHeader className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
            <SheetTitle className="flex items-center gap-2 text-[22px]">
              <History className="w-5 h-5 text-[#ffd400]" />
              Histórico de conversas
            </SheetTitle>
          </SheetHeader>
          <div className="p-3 flex-shrink-0">
            <Button
              onClick={handleNewConv}
              className="w-full gap-2 h-10 text-sm"
            >
              <Plus className="w-4 h-4" /> Nova Conversa
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
            {conversations.length === 0 ? (
              <div className="text-center py-10 text-[#888888] text-sm">
                <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-30" />
                Nenhuma conversa ainda
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={currentConv?.id === conv.id}
                  onSelect={handleSelectConv}
                  onDelete={handleDeleteConv}
                  primaryHex={config.primaryHex}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
