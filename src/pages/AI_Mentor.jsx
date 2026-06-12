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
import { NeonPageShell } from '@/components/design/NeonPageShell';
import LiveClockBar from '@/components/home/LiveClockBar';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

const STORAGE_KEY = 'backstage_ai_conversations';
const MAX_HISTORY = 20;

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

function ConversationItem({ conv, isActive, onSelect, onDelete }) {
  const preview = conv.messages?.[0]?.content?.slice(0, 55) || 'Conversa vazia';
  const date = conv.createdAt ? format(parseISO(conv.createdAt), "d MMM", { locale: ptBR }) : '--';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`group w-full text-left p-3 rounded-xl transition-all flex items-start gap-2 cursor-pointer ${
        isActive
          ? 'bg-cyan-600/20 border border-cyan-500/40'
          : 'bg-slate-800/50 border border-transparent hover:border-slate-700'
      }`}
      onClick={() => onSelect(conv)}
    >
      <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{conv.name}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{preview}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-slate-600">{date}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-all"
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
  const today = new Date().toISOString().split('T')[0];
  const { events } = useEvents(user?.id, { from: today, limit: 10, ascending: true });
  const config = getCategoryConfig(profile?.category || 'lighting');
  const { formatCurrency } = useFinancialVisibility();
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
      cliente: e.clients?.name || 'Sem cliente',
      valor: getEventCacheAmount(e),
    })) ?? [],
    total_clientes: clients?.length ?? 0,
    categoria: profile?.category_label || profile?.category || 'técnico de eventos',
    meta_receita: profile?.monthly_goal_revenue || 0,
    meta_eventos: profile?.monthly_goal_events || 0,
    meta_diarias: profile?.monthly_goal_events || 0,
  }), [stats, events, clients, profile]);

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

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex}>
      <div className="flex flex-col h-[calc(100dvh-10rem)]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 pb-3 border-b border-[#23262f] flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${config.primaryHex}10, transparent)` }}
        >
          <div className="flex items-start justify-between max-w-2xl mx-auto">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Mentor financeiro</p>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: config.primaryHex }} />
                AI Mentor
              </h1>
            </div>
            <LiveClockBar primaryHex={config.primaryHex} />
          </div>
          {stats && (
            <div className="flex flex-wrap gap-2 mt-3 max-w-2xl mx-auto">
              {metaDiarias > 0 && (
                <span
                  className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
                  style={{ borderColor: `${config.accentHex}35`, color: config.accentHex, background: `${config.accentHex}10` }}
                >
                  📅 {diariasMes}/{metaDiarias} diárias
                </span>
              )}
              {metaReceita > 0 && (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/25 text-emerald-400 bg-emerald-500/10">
                  💰 {formatCurrency(stats.faturamento_pago)} / {formatCurrency(metaReceita)}
                </span>
              )}
              {(stats.a_receber ?? 0) > 0 && (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-amber-500/25 text-amber-400 bg-amber-500/10">
                  ⏳ {formatCurrency(stats.a_receber)} a receber
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#23262f] flex-shrink-0">
          <p className="text-xs text-[#5a6070] font-mono truncate max-w-[180px]">
            {currentConv ? currentConv.name : 'Nenhuma conversa ativa'}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={`w-8 h-8 ${isAudioEnabled ? 'text-cyan-400' : 'text-[#5a6070]'}`}
              title={isAudioEnabled ? 'Desativar áudio' : 'Ativar leitura em voz alta'}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              className="w-8 h-8 text-[#5a6070] hover:text-white relative"
              title="Histórico"
            >
              <History className="w-4 h-4" />
              {conversations.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                  style={{ background: config.primaryHex, color: '#050609' }}>
                  {Math.min(conversations.length, 9)}
                </span>
              )}
            </Button>
            <Button
              onClick={handleNewConv}
              size="sm"
              className="h-8 px-3 gap-1.5 text-xs"
              style={{ background: config.primaryHex, color: '#050609' }}
            >
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
              className="flex flex-col items-center justify-center min-h-[50vh] text-center"
            >
              <div className="relative mb-5">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-12 h-12" style={{ color: config.primaryHex }} />
                </motion.div>
                <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: config.primaryHex }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Olá, {firstName}!</h2>
              <p className="text-[#7c8494] text-sm mb-6 max-w-xs">
                Sou seu mentor financeiro. Pergunte sobre diárias, cachês, clientes, cobranças e metas do mês.
              </p>
              <SmartSuggestions userData={financialContext} onSuggestionClick={(s) => handleSend(s)} />
            </motion.div>
          ) : (
            <div className="space-y-2 max-w-2xl mx-auto">
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
              {loading && (
                <div className="flex items-center gap-2 px-4 py-2 text-[#5a6070] text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: config.primaryHex }} />
                  <span>Gerando resposta…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#23262f] px-4 py-3 flex-shrink-0 pb-safe">
          <div className="flex items-end gap-2 max-w-2xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre seus dados financeiros…"
              disabled={loading}
              rows={1}
              className="flex-1 bg-[#0e1018] border border-[#23262f] rounded-xl px-4 py-3 text-white text-base md:text-sm placeholder:text-[#4a5060] focus:outline-none resize-none min-h-[48px] max-h-[120px] overflow-y-auto transition-colors"
              style={{ borderColor: input ? `${config.primaryHex}40` : undefined }}
            />
            <Button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="h-12 w-12 flex-shrink-0 rounded-xl p-0"
              style={{ background: config.primaryHex, color: '#050609' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-[9px] text-[#3a4050] font-mono text-center mt-1.5">
            Enter para enviar · Shift+Enter para nova linha · contexto financeiro incluído automaticamente
          </p>
        </div>
      </div>

      {/* Sheet histórico */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="bg-[#0a0c14] border-[#23262f] w-72 flex flex-col p-0">
          <SheetHeader className="p-4 border-b border-[#23262f] flex-shrink-0">
            <SheetTitle className="text-white flex items-center gap-2 text-sm">
              <History className="w-4 h-4" style={{ color: config.primaryHex }} />
              Histórico de conversas
            </SheetTitle>
          </SheetHeader>
          <div className="p-3 flex-shrink-0">
            <Button
              onClick={handleNewConv}
              className="w-full gap-2 h-9 text-sm"
              style={{ background: config.primaryHex, color: '#050609' }}
            >
              <Plus className="w-4 h-4" /> Nova Conversa
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
            {conversations.length === 0 ? (
              <div className="text-center py-10 text-[#4a5060] text-sm">
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
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </NeonPageShell>
  );
}
